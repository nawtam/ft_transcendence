"""Engine SQLAlchemy remplaçable à chaud.

Les identifiants Postgres changent au fil de l'eau (credentials dynamiques
Vault). DatabaseManager détient l'engine courant et permet de le remplacer
de façon atomique :

  - les nouvelles requêtes obtiennent une Session liée au nouvel engine dès
    que swap() a rendu la main ;
  - les requêtes déjà en cours gardent leur Session (et donc l'ancien
    engine) jusqu'à la fin ; l'ancien engine n'est fermé qu'après un délai
    de grâce (géré par le CredentialRotator dans src/vault_client.py).
"""

from __future__ import annotations

import logging
import threading
from typing import TYPE_CHECKING

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import Session, sessionmaker

if TYPE_CHECKING:
    from src.config import Settings

logger = logging.getLogger(__name__)


class DatabaseNotReadyError(RuntimeError):
    pass


class DatabaseManager:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._lock = threading.Lock()
        self._engine: Engine | None = None
        self._session_factory: sessionmaker[Session] | None = None

    # --- Construction ----------------------------------------------------

    def build_engine(self, username: str, password: str) -> Engine:
        """Crée un engine pour ces identifiants et vérifie qu'il fonctionne.

        Lève une exception si la connexion échoue : on ne bascule jamais
        vers un engine qui n'a pas prouvé qu'il marche.
        """
        url = URL.create(
            drivername="postgresql+psycopg",
            username=username,
            password=password,
            host=self._settings.db_host,
            port=self._settings.db_port,
            database=self._settings.db_name,
        )
        engine = create_engine(
            url,
            pool_size=self._settings.db_pool_size,
            max_overflow=self._settings.db_max_overflow,
            pool_pre_ping=True,
        )
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        except Exception:
            engine.dispose()
            raise
        return engine

    # --- Bascule -----------------------------------------------------------

    def swap(self, new_engine: Engine) -> Engine | None:
        """Installe new_engine comme engine courant et renvoie l'ancien.

        L'appelant est responsable de disposer l'ancien engine (après un
        délai de grâce).
        """
        factory = sessionmaker(bind=new_engine, expire_on_commit=False, autoflush=False)
        with self._lock:
            old = self._engine
            self._engine = new_engine
            self._session_factory = factory
        return old

    # --- Utilisation -------------------------------------------------------

    def session(self) -> Session:
        with self._lock:
            factory = self._session_factory
        if factory is None:
            raise DatabaseNotReadyError("Aucun engine Postgres disponible")
        return factory()

    def ping(self) -> None:
        with self.session() as s:
            s.execute(text("SELECT 1"))

    def dispose(self) -> None:
        with self._lock:
            engine = self._engine
            self._engine = None
            self._session_factory = None
        if engine is not None:
            engine.dispose()
