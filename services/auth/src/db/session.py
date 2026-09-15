# src/db/session.py
"""Porte l'engine SQLAlchemy courant et permet de le remplacer à chaud.

C'est le seul endroit du service qui connaît l'engine "actif". init_engine
est appelé une fois au démarrage ; replace_engine est appelé par la boucle
de renouvellement Vault (vault_client.py) chaque fois qu'un nouveau
credential Postgres remplace l'ancien, sans jamais couper le service.
"""

import threading
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine, URL
from sqlalchemy.orm import Session, sessionmaker

_lock = threading.Lock()
_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def init_engine(database_url: str | URL) -> None:
    """Premier appel, fait au démarrage du service (lifespan de main.py)."""
    global _engine, _session_factory
    engine = create_engine(database_url, pool_pre_ping=True)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    with _lock:
        _engine = engine
        _session_factory = factory


def replace_engine(database_url: str | URL) -> None:
    """Bascule à chaud vers un nouvel engine (nouveau credential Vault).

    create_engine() ne se connecte pas immédiatement (il est paresseux), donc
    le construire hors du verrou ne bloque personne longtemps : seul
    l'échange de référence est protégé. dispose() sur l'ancien engine ferme
    les connexions inactives du pool mais n'interrompt jamais une connexion
    déjà empruntée par une requête en cours.
    """
    global _engine, _session_factory
    new_engine = create_engine(database_url, pool_pre_ping=True)
    new_factory = sessionmaker(bind=new_engine, autoflush=False, autocommit=False)

    with _lock:
        old_engine = _engine
        _engine = new_engine
        _session_factory = new_factory

    if old_engine is not None:
        old_engine.dispose()


def dispose_engine() -> None:
    """Appelé au shutdown du service."""
    global _engine, _session_factory
    with _lock:
        engine = _engine
        _engine = None
        _session_factory = None
    if engine is not None:
        engine.dispose()


def get_session() -> Generator[Session, None, None]:
    """Dépendance FastAPI : ouvre une session sur l'engine courant."""
    if _session_factory is None:
        raise RuntimeError("db.session.init_engine() n'a pas été appelé au démarrage")
    session = _session_factory()
    try:
        yield session
    finally:
        session.close()


def current_engine() -> Engine | None:
    """Utilitaire de lecture (tests, diagnostics)."""
    return _engine