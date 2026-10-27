"""Fixtures de test : l'app tourne sans Vault ni Postgres.

- les clés JWT sont générées à la volée ;
- la base est une SQLite en mémoire, servie via le même chemin de code que
  la prod (app.state.db.session()).
"""

import os

os.environ.setdefault("VAULT_ROLE_ID", "test-role-id")
os.environ.setdefault("COOKIE_SECURE", "false")  # TestClient parle en HTTP

from collections.abc import Iterator  # noqa: E402

import pytest  # noqa: E402
from cryptography.hazmat.primitives import serialization  # noqa: E402
from cryptography.hazmat.primitives.asymmetric import rsa  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from src.config import get_settings  # noqa: E402
from src.db import models  # noqa: E402, F401  (enregistre les tables)
from src.db.base import Base  # noqa: E402
from src.main import create_app  # noqa: E402
from src.security import configure_jwt  # noqa: E402


@pytest.fixture(scope="session")
def rsa_pems() -> tuple[str, str]:
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ).decode()
    public_pem = (
        key.public_key()
        .public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
        .decode()
    )
    return private_pem, public_pem


class SqliteDb:
    def __init__(self) -> None:
        self.engine = create_engine(
            "sqlite+pysqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self._factory = sessionmaker(bind=self.engine, expire_on_commit=False, autoflush=False)

    def session(self) -> Session:
        return self._factory()

    def ping(self) -> None:
        with self.session() as s:
            s.execute(text("SELECT 1"))


@pytest.fixture
def db() -> SqliteDb:
    return SqliteDb()


@pytest.fixture
def client(rsa_pems: tuple[str, str], db: SqliteDb) -> Iterator[TestClient]:
    configure_jwt(*rsa_pems, get_settings())
    app = create_app(lifespan=None)
    app.state.db = db
    with TestClient(app) as c:
        yield c
