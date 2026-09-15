# src/dependencies.py
"""Dépendances FastAPI (Depends). get_current_user arrivera à l'étape 4,
une fois security.py capable de décoder un JWT et le modèle User défini.
"""

from collections.abc import Generator

from sqlalchemy.orm import Session

from src.db.session import get_session


def get_db() -> Generator[Session, None, None]:
    yield from get_session()