from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    # Vault
    vault_addr: str
    vault_role_id: str
    vault_secret_id_file: str

    # Postgres (hôte/port/nom fixes ; user/password viennent toujours de Vault)
    db_host: str
    db_port: int = 5432
    db_name: str
    vault_db_role: str

    # JWT
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 7


settings = Settings()