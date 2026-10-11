from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base déclarative commune à tous les modèles.

    Le service ne crée ni ne migre aucune table : le schéma est géré par
    l'infra. Base.metadata n'est utilisé que par les tests (SQLite).
    """