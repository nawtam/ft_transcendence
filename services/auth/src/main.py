"""Point d'entrée FastAPI du service auth.

Au démarrage (lifespan) :
  1. login AppRole auprès de Vault ;
  2. lecture de la paire de clés RS256 (secret/auth/jwt) ;
  3. génération d'un premier credential Postgres + engine SQLAlchemy ;
  4. lancement de la tâche de fond de renouvellement/rotation.
À l'arrêt : arrêt de la tâche, fermeture des engines, révocation du token
Vault (ce qui supprime aussi l'utilisateur Postgres temporaire).
"""

import asyncio
import logging
import time
from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from typing import Any, TypeVar

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from src.config import Settings, get_settings
from src.db.session import DatabaseManager
from src.routers import auth
from src.security import configure_jwt
from src.vault_client import CredentialRotator, VaultClient

logger = logging.getLogger("src")

T = TypeVar("T")


def _with_retries(settings: Settings, what: str, fn: Callable[[], T]) -> T:
    """Vault ou Postgres peuvent ne pas être prêts quand le conteneur démarre."""
    for attempt in range(1, settings.startup_max_attempts + 1):
        try:
            return fn()
        except Exception as exc:
            if attempt == settings.startup_max_attempts:
                raise
            logger.warning(
                "%s : échec (tentative %d/%d) : %s",
                what,
                attempt,
                settings.startup_max_attempts,
                exc,
            )
            time.sleep(settings.startup_retry_delay_seconds)
    raise AssertionError("unreachable")


def _startup(settings: Settings) -> tuple[VaultClient, DatabaseManager, CredentialRotator]:
    vault = VaultClient(settings)
    _with_retries(settings, "Connexion à Vault", vault.login)

    keys = _with_retries(settings, "Lecture de la clé JWT", vault.read_jwt_keys)
    configure_jwt(keys.private_key, keys.public_key, settings)
    logger.info("Clés JWT RS256 chargées")

    db = DatabaseManager(settings)
    rotator = CredentialRotator(vault, db, settings)
    _with_retries(settings, "Connexion à Postgres", rotator.start)
    return vault, db, rotator


def _shutdown(vault: VaultClient, db: DatabaseManager, rotator: CredentialRotator) -> None:
    rotator.stop()
    db.dispose()
    vault.revoke_self()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    vault, db, rotator = await asyncio.to_thread(_startup, settings)
    app.state.db = db
    app.state.rotator = rotator
    try:
        yield
    finally:
        await asyncio.to_thread(_shutdown, vault, db, rotator)


def create_app(lifespan: Any = lifespan) -> FastAPI:
    app = FastAPI(title="auth-service", lifespan=lifespan)
    app.include_router(auth.router)

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        """Liveness : le processus répond."""
        return {"status": "ok"}

    @app.get("/health/ready", tags=["health"])
    def ready(request: Request) -> JSONResponse:
        """Readiness : Postgres répond et le credential Vault est sain."""
        rotator = getattr(request.app.state, "rotator", None)
        try:
            request.app.state.db.ping()
        except Exception as exc:
            return JSONResponse(
                {"status": "unavailable", "database": str(exc)},
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if rotator is not None and not rotator.healthy:
            # La base répond encore, mais la maintenance du credential échoue :
            # on le signale sans couper le trafic.
            return JSONResponse({"status": "degraded", "vault": rotator.last_error})
        return JSONResponse({"status": "ok"})

    return app


logging.basicConfig(
    level=get_settings().log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

app = create_app()
