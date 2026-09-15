# src/main.py
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI

from src import security
from src.config import settings
from src.db import session as db_session
from src.vault_client import VaultClient, build_database_url, run_db_credential_renewal_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    vault = VaultClient(
        addr=settings.vault_addr,
        role_id=settings.vault_role_id,
        secret_id_file=settings.vault_secret_id_file,
    )

    # 1. Clé JWT (une fois pour toutes, ne changera plus jamais)
    private_key, public_key = vault.read_jwt_keypair()
    security.configure_keys(private_key, public_key)

    # 2. Premier credential Postgres + premier engine
    initial_credential = vault.get_db_credentials(settings.vault_db_role)
    database_url = build_database_url(
        settings.db_host, settings.db_port, settings.db_name, initial_credential
    )
    db_session.init_engine(database_url)

    # 3. Boucle de fond : renouvelle ou remplace le credential sans interruption
    stop_event = threading.Event()
    renewal_thread = threading.Thread(
        target=run_db_credential_renewal_loop,
        args=(
            vault,
            settings.vault_db_role,
            settings.db_host,
            settings.db_port,
            settings.db_name,
            initial_credential,
            stop_event,
        ),
        daemon=True,
        name="vault-db-credential-renewal",
    )
    renewal_thread.start()

    yield

    stop_event.set()
    renewal_thread.join(timeout=5)
    db_session.dispose_engine()


app = FastAPI(title="auth", lifespan=lifespan)

# Étape 4 : une fois routers/auth.py écrit.
# from src.routers import auth as auth_router
# app.include_router(auth_router.router, prefix="/auth", tags=["auth"])