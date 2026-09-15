# src/vault_client.py
"""Tout ce qui parle à Vault : login AppRole, lecture de la clé JWT,
et cycle de vie complet du credential Postgres dynamique (obtention,
renouvellement, remplacement à chaud). Ce fichier ne connaît rien de
FastAPI ; main.py l'orchestre au démarrage et à l'arrêt.
"""

from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass

import hvac
from sqlalchemy.engine import URL

from src.db import session as db_session

logger = logging.getLogger(__name__)

# Vérification toutes les 60s ; on agit quand il reste moins de 10 min
# avant l'expiration du bail Postgres courant (confortable pour un bail d'1h).
_CHECK_INTERVAL_SECONDS = 60
_RENEWAL_BUFFER_SECONDS = 10 * 60

# Renouvelle le token Vault du service lui-même quand il reste moins de 60s.
_TOKEN_RENEWAL_BUFFER_SECONDS = 60


@dataclass
class DBCredential:
    username: str
    password: str
    lease_id: str
    lease_duration: int  # secondes


class VaultClient:
    """Parle à Vault. Ne connaît ni Postgres ni FastAPI."""

    def __init__(self, addr: str, role_id: str, secret_id_file: str) -> None:
        self._client = hvac.Client(url=addr)
        self._role_id = role_id
        self._secret_id_file = secret_id_file
        # 0 => jamais authentifié, force un login au premier appel.
        self._token_expires_at: float = 0.0

    def _read_secret_id(self) -> str:
        with open(self._secret_id_file, encoding="utf-8") as f:
            return f.read().strip()

    def _login(self) -> None:
        response = self._client.auth.approle.login(
            role_id=self._role_id,
            secret_id=self._read_secret_id(),
        )
        lease_duration = response["auth"]["lease_duration"]
        self._token_expires_at = time.monotonic() + lease_duration
        logger.info("Authentification AppRole réussie auprès de Vault")

    def _ensure_authenticated(self) -> None:
        if time.monotonic() >= self._token_expires_at - _TOKEN_RENEWAL_BUFFER_SECONDS:
            self._login()

    def read_jwt_keypair(self) -> tuple[str, str]:
        """Renvoie (private_key_pem, public_key_pem) depuis secret/data/auth/jwt."""
        self._ensure_authenticated()
        result = self._client.secrets.kv.v2.read_secret_version(path="auth/jwt")
        data = result["data"]["data"]
        return data["private_key"], data["public_key"]

    def get_db_credentials(self, role_name: str) -> DBCredential:
        self._ensure_authenticated()
        result = self._client.secrets.database.generate_credentials(name=role_name)
        return DBCredential(
            username=result["data"]["username"],
            password=result["data"]["password"],
            lease_id=result["lease_id"],
            lease_duration=result["lease_duration"],
        )

    def renew_db_lease(self, lease_id: str) -> int:
        """Prolonge un bail existant. Lève une exception si Vault refuse
        (bail au-delà de max_ttl, ou déjà révoqué) — c'est à l'appelant
        (la boucle de fond) de décider quoi faire dans ce cas.
        """
        self._ensure_authenticated()
        result = self._client.sys.renew_lease(lease_id=lease_id)
        return result["lease_duration"]


def build_database_url(host: str, port: int, dbname: str, credential: DBCredential) -> URL:
    """Construit l'URL de connexion via sqlalchemy.engine.URL plutôt qu'un
    f-string : un mot de passe généré par Vault peut contenir des caractères
    (@, /, +...) qui casseraient une concaténation manuelle. URL.create()
    échappe correctement chaque composant.
    """
    return URL.create(
        drivername="postgresql+psycopg",
        username=credential.username,
        password=credential.password,
        host=host,
        port=port,
        database=dbname,
    )


def run_db_credential_renewal_loop(
    vault: VaultClient,
    db_role: str,
    db_host: str,
    db_port: int,
    db_name: str,
    initial_credential: DBCredential,
    stop_event: threading.Event,
) -> None:
    """Boucle de fond, à lancer dans un threading.Thread(daemon=True).

    stop_event.wait(...) plutôt que time.sleep(...) : ça renvoie
    immédiatement dès que stop_event est déclenché, pour un arrêt réactif
    au shutdown au lieu d'attendre la fin du sommeil en cours.
    """
    lease_id = initial_credential.lease_id
    expires_at = time.monotonic() + initial_credential.lease_duration

    while not stop_event.wait(_CHECK_INTERVAL_SECONDS):
        remaining = expires_at - time.monotonic()
        if remaining > _RENEWAL_BUFFER_SECONDS:
            continue

        try:
            new_duration = vault.renew_db_lease(lease_id)
            expires_at = time.monotonic() + new_duration
            logger.info("Bail Postgres renouvelé, encore valide %ss", new_duration)
            continue
        except Exception:
            logger.warning(
                "Renew du bail Postgres refusé par Vault, demande d'un credential neuf",
                exc_info=True,
            )

        try:
            new_credential = vault.get_db_credentials(db_role)
            new_url = build_database_url(db_host, db_port, db_name, new_credential)
            db_session.replace_engine(new_url)
            lease_id = new_credential.lease_id
            expires_at = time.monotonic() + new_credential.lease_duration
            logger.info("Nouveau credential Postgres obtenu, engine remplacé à chaud")
        except Exception:
            logger.exception(
                "Impossible d'obtenir un nouveau credential Postgres — le service "
                "risque de perdre l'accès base à l'expiration du bail actuel"
            )