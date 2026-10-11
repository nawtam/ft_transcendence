"""Intégration Vault : AppRole, clé JWT et credentials Postgres dynamiques.

Deux classes :

VaultClient
    Fine couche au-dessus de hvac : login AppRole (secret_id lu depuis un
    fichier), renouvellement du token Vault, lecture de la paire de clés
    RS256 (KV v2), génération et renouvellement des credentials Postgres.

CredentialRotator
    Tâche de fond (thread) qui maintient un credential Postgres valide :
      1. tant que c'est possible, renouvelle le bail courant avant qu'il
         n'expire (quand il reste moins d'1/3 de sa durée) ;
      2. si le renouvellement échoue ou est plafonné par le max_ttl, génère
         un nouveau credential, construit et teste un nouvel engine, puis
         bascule dessus (DatabaseManager.swap) ;
      3. ferme l'ancien engine après un délai de grâce, le temps que les
         requêtes en cours se terminent. L'ancien bail n'est pas révoqué :
         il expire tout seul côté Vault, bien après la fermeture de l'engine.
    Si le token Vault lui-même doit être recréé (max_ttl atteint), une
    rotation est forcée : les baux d'un token meurent avec lui.
"""

from __future__ import annotations

import logging
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING, Any

import hvac

if TYPE_CHECKING:
    from sqlalchemy import Engine

    from src.config import Settings
    from src.db.session import DatabaseManager

logger = logging.getLogger(__name__)

Clock = Callable[[], float]


class VaultError(RuntimeError):
    pass


@dataclass(frozen=True)
class JwtKeyPair:
    private_key: str = field(repr=False)
    public_key: str


@dataclass
class DbCredentials:
    username: str
    password: str = field(repr=False)
    lease_id: str
    lease_duration: int  # durée initiale du bail, en secondes
    renewable: bool
    expires_at: float  # horloge monotone


class VaultClient:
    def __init__(self, settings: Settings, clock: Clock = time.monotonic) -> None:
        self._s = settings
        self._clock = clock
        self._client = hvac.Client(url=settings.vault_addr, timeout=settings.vault_timeout_seconds)
        # hvac/requests n'est pas garanti thread-safe : un seul appel à la fois.
        self._lock = threading.RLock()
        self._token_ttl = 0
        self._token_expires_at: float | None = None
        self._token_renewable = False

    # --- Token Vault -------------------------------------------------------

    def _read_secret_id(self) -> str:
        path = Path(self._s.vault_secret_id_file)
        secret_id = path.read_text(encoding="utf-8").strip()
        if not secret_id:
            raise VaultError(f"Le fichier secret_id {path} est vide")
        return secret_id

    def _apply_token_lease(self, auth: dict[str, Any], initial: bool) -> None:
        duration = int(auth.get("lease_duration") or 0)
        self._token_renewable = bool(auth.get("renewable"))
        if initial:
            self._token_ttl = duration
        self._token_expires_at = self._clock() + duration if duration > 0 else None

    def login(self) -> None:
        with self._lock:
            resp = self._client.auth.approle.login(
                role_id=self._s.vault_role_id,
                secret_id=self._read_secret_id(),
                mount_point=self._s.vault_approle_mount,
            )
            self._apply_token_lease(resp["auth"], initial=True)
        logger.info("Authentifié auprès de Vault (AppRole, ttl=%ss)", self._token_ttl)

    def ensure_token(self) -> bool:
        """Renouvelle le token Vault si nécessaire.

        Renvoie True si une nouvelle connexion AppRole a eu lieu : les baux
        obtenus avec l'ancien token seront révoqués à son expiration, il faut
        donc régénérer les credentials qui en dépendent.
        """
        with self._lock:
            if self._token_expires_at is None:
                return False  # token sans expiration
            threshold = self._token_ttl / 3
            if self._token_expires_at - self._clock() > threshold:
                return False

            if self._token_renewable:
                try:
                    resp = self._client.auth.token.renew_self()
                    self._apply_token_lease(resp["auth"], initial=False)
                    if (
                        self._token_expires_at is None
                        or self._token_expires_at - self._clock() > threshold
                    ):
                        logger.debug("Token Vault renouvelé")
                        return False
                    logger.info("Token Vault plafonné par son max_ttl : reconnexion AppRole")
                except Exception:
                    logger.warning("Renouvellement du token Vault impossible", exc_info=True)

            self.login()
            return True

    def revoke_self(self) -> None:
        """Révoque le token (et donc tous ses baux : l'utilisateur Postgres
        temporaire est supprimé immédiatement). Best effort, à l'arrêt."""
        with self._lock:
            try:
                self._client.auth.token.revoke_self()
                logger.info("Token Vault révoqué")
            except Exception:
                logger.warning("Révocation du token Vault impossible", exc_info=True)

    # --- Secrets ---------------------------------------------------------

    def read_jwt_keys(self) -> JwtKeyPair:
        with self._lock:
            resp = self._client.secrets.kv.v2.read_secret_version(
                path=self._s.vault_jwt_secret_path,
                mount_point=self._s.vault_kv_mount,
                raise_on_deleted_version=True,
            )
        data = resp["data"]["data"]
        try:
            return JwtKeyPair(private_key=data["private_key"], public_key=data["public_key"])
        except KeyError as exc:
            location = f"{self._s.vault_kv_mount}/{self._s.vault_jwt_secret_path}"
            raise VaultError(f"Champ {exc} absent de {location}") from None

    def generate_db_credentials(self) -> DbCredentials:
        with self._lock:
            resp = self._client.secrets.database.generate_credentials(
                name=self._s.vault_db_role,
                mount_point=self._s.vault_db_mount,
            )
        duration = int(resp["lease_duration"])
        return DbCredentials(
            username=resp["data"]["username"],
            password=resp["data"]["password"],
            lease_id=resp["lease_id"],
            lease_duration=duration,
            renewable=bool(resp.get("renewable")),
            expires_at=self._clock() + duration,
        )

    def renew_lease(self, lease_id: str, increment: int) -> int:
        """Renouvelle un bail et renvoie sa nouvelle durée (secondes)."""
        with self._lock:
            resp = self._client.sys.renew_lease(lease_id=lease_id, increment=increment)
        return int(resp["lease_duration"])


class CredentialRotator:
    def __init__(
        self,
        vault: VaultClient,
        db: DatabaseManager,
        settings: Settings,
        clock: Clock = time.monotonic,
    ) -> None:
        self._vault = vault
        self._db = db
        self._interval = settings.vault_check_interval_seconds
        self._grace = settings.engine_retire_grace_seconds
        self._clock = clock
        self._creds: DbCredentials | None = None
        self._retiring: list[tuple[Engine, float]] = []
        self._last_error: str | None = None
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    # --- Cycle de vie ------------------------------------------------------

    def start(self) -> None:
        """Obtient le premier credential (bloquant, lève en cas d'échec) puis
        lance la tâche de fond."""
        self._rotate(reason="démarrage")
        self._thread = threading.Thread(target=self._run, name="vault-db-rotator", daemon=True)
        self._thread.start()

    def stop(self, timeout: float = 10) -> None:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout)
        for engine, _ in self._retiring:
            engine.dispose()
        self._retiring.clear()

    @property
    def healthy(self) -> bool:
        creds = self._creds
        return (
            self._last_error is None
            and creds is not None
            and creds.expires_at > self._clock()
        )

    @property
    def last_error(self) -> str | None:
        return self._last_error

    # --- Boucle --------------------------------------------------------------

    def _run(self) -> None:
        while not self._stop.wait(self._interval):
            self.run_once()

    def run_once(self) -> None:
        """Un cycle de maintenance. Ne lève jamais : une erreur est journalisée
        et retentée au cycle suivant, l'engine courant continue de servir."""
        try:
            if self._vault.ensure_token():
                self._rotate(reason="nouveau token Vault")
            else:
                self._renew_or_rotate()
            self._last_error = None
        except Exception as exc:
            self._last_error = f"{type(exc).__name__}: {exc}"
            logger.exception(
                "Maintenance des credentials Postgres en échec, nouvel essai dans %ss",
                self._interval,
            )
        finally:
            self._dispose_retired()

    def _renew_or_rotate(self) -> None:
        creds = self._creds
        if creds is None:
            self._rotate(reason="aucun credential")
            return

        threshold = creds.lease_duration / 3
        if creds.expires_at - self._clock() > threshold:
            return

        if creds.renewable:
            try:
                new_duration = self._vault.renew_lease(creds.lease_id, creds.lease_duration)
                creds.expires_at = self._clock() + new_duration
                if new_duration > threshold:
                    logger.info("Bail Postgres renouvelé (%ss)", new_duration)
                    return
                logger.info("Bail Postgres plafonné par le max_ttl (%ss restantes)", new_duration)
            except Exception:
                logger.warning("Renouvellement du bail Postgres impossible", exc_info=True)

        self._rotate(reason="bail non renouvelable")

    def _rotate(self, reason: str) -> None:
        new_creds = self._vault.generate_db_credentials()
        new_engine = self._db.build_engine(new_creds.username, new_creds.password)
        old_engine = self._db.swap(new_engine)
        self._creds = new_creds
        if old_engine is not None:
            self._retiring.append((old_engine, self._clock() + self._grace))
        logger.info(
            "Credential Postgres en place (user=%s, bail=%ss, raison: %s)",
            new_creds.username,
            new_creds.lease_duration,
            reason,
        )

    def _dispose_retired(self) -> None:
        now = self._clock()
        keep: list[tuple[Engine, float]] = []
        for engine, dispose_at in self._retiring:
            if dispose_at > now:
                keep.append((engine, dispose_at))
                continue
            try:
                engine.dispose()
            except Exception:
                logger.warning("Fermeture d'un ancien engine en échec", exc_info=True)
        self._retiring = keep
