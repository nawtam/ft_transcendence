"""Configuration du service, lue depuis les variables d'environnement.

Chaque champ est mappé sur la variable d'environnement de même nom en
MAJUSCULES (ex: vault_role_id <-> VAULT_ROLE_ID). Seul VAULT_ROLE_ID est
obligatoire ; tout le reste a une valeur par défaut cohérente avec le
docker-compose.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Vault : connexion et authentification AppRole -------------------
    vault_addr: str = "http://vault:8200"
    vault_role_id: str
    vault_secret_id_file: str = "/run/secrets/auth_vault_secret_id"
    vault_approle_mount: str = "approle"
    vault_timeout_seconds: int = 10

    # --- Vault : clé JWT (KV v2) ----------------------------------------
    vault_kv_mount: str = "secret"
    vault_jwt_secret_path: str = "auth/jwt"  # -> secret/data/auth/jwt

    # --- Vault : credentials Postgres dynamiques ------------------------
    vault_db_mount: str = "database"
    vault_db_role: str = "auth-db-role"  # -> database/creds/auth-db-role

    # Fréquence à laquelle la tâche de fond vérifie les baux.
    vault_check_interval_seconds: int = 30
    # Délai avant de fermer l'ancien engine après une bascule, pour laisser
    # les requêtes en cours se terminer proprement.
    engine_retire_grace_seconds: int = 60

    # --- Postgres (host/port/base fixes, identifiants via Vault) ---------
    db_host: str = "postgres"
    db_port: int = 5432
    db_name: str = "db_auth"
    db_pool_size: int = 5
    db_max_overflow: int = 10

    # Tentatives au démarrage (Vault/Postgres pas encore prêts).
    startup_max_attempts: int = 10
    startup_retry_delay_seconds: float = 3.0

    # --- JWT --------------------------------------------------------------
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 7
    jwt_issuer: str = "auth"
    jwt_audience: str = "rpg"

    # --- Cookies ----------------------------------------------------------
    # True en prod (HTTPS). Mettre COOKIE_SECURE=false uniquement pour du
    # dev en HTTP pur hors localhost.
    cookie_secure: bool = True
    # Le refresh token n'est envoyé par le navigateur que vers /auth/*.
    refresh_cookie_path: str = "/auth"

    log_level: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
