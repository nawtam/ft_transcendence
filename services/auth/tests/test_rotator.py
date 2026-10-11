"""Tests de la logique de renouvellement/rotation, avec un faux Vault et une
fausse base (aucun réseau)."""

import itertools
from types import SimpleNamespace

import pytest

from src.vault_client import CredentialRotator, DbCredentials

LEASE = 3600


class FakeClock:
    def __init__(self) -> None:
        self.now = 1000.0

    def __call__(self) -> float:
        return self.now


class FakeEngine:
    def __init__(self, name: str) -> None:
        self.name = name
        self.disposed = False

    def dispose(self) -> None:
        self.disposed = True


class FakeDb:
    def __init__(self) -> None:
        self.current: FakeEngine | None = None
        self.fail_build = False

    def build_engine(self, username: str, password: str) -> FakeEngine:
        if self.fail_build:
            raise ConnectionError("postgres down")
        return FakeEngine(username)

    def swap(self, engine: FakeEngine) -> FakeEngine | None:
        old, self.current = self.current, engine
        return old


class FakeVault:
    def __init__(self, clock: FakeClock) -> None:
        self.clock = clock
        self.counter = itertools.count(1)
        self.renew_result: int | Exception = LEASE
        self.relogin = False
        self.renew_calls = 0

    def ensure_token(self) -> bool:
        relogged, self.relogin = self.relogin, False
        return relogged

    def generate_db_credentials(self) -> DbCredentials:
        n = next(self.counter)
        return DbCredentials(
            username=f"v-user-{n}",
            password="pw",
            lease_id=f"lease-{n}",
            lease_duration=LEASE,
            renewable=True,
            expires_at=self.clock() + LEASE,
        )

    def renew_lease(self, lease_id: str, increment: int) -> int:
        self.renew_calls += 1
        if isinstance(self.renew_result, Exception):
            raise self.renew_result
        return self.renew_result


@pytest.fixture
def env():
    clock = FakeClock()
    vault = FakeVault(clock)
    db = FakeDb()
    settings = SimpleNamespace(vault_check_interval_seconds=30, engine_retire_grace_seconds=60)
    rotator = CredentialRotator(vault, db, settings, clock=clock)  # type: ignore[arg-type]
    rotator._rotate("démarrage")  # équivalent de start() sans lancer le thread
    return SimpleNamespace(clock=clock, vault=vault, db=db, rotator=rotator)


def test_nothing_happens_while_lease_is_fresh(env) -> None:
    env.clock.now += LEASE / 2  # il reste 1/2 du bail (> 1/3)
    env.rotator.run_once()
    assert env.vault.renew_calls == 0
    assert env.db.current.name == "v-user-1"
    assert env.rotator.healthy


def test_renews_when_lease_gets_short(env) -> None:
    env.clock.now += LEASE * 0.7  # il reste 30 % du bail
    env.rotator.run_once()
    assert env.vault.renew_calls == 1
    assert env.db.current.name == "v-user-1"  # pas de bascule


def test_rotates_when_renew_fails_and_retires_old_engine(env) -> None:
    first = env.db.current
    env.vault.renew_result = RuntimeError("lease not found")
    env.clock.now += LEASE * 0.7
    env.rotator.run_once()

    assert env.db.current.name == "v-user-2"
    assert not first.disposed  # délai de grâce pour les requêtes en cours

    env.vault.renew_result = LEASE
    env.clock.now += 61
    env.rotator.run_once()
    assert first.disposed


def test_rotates_when_max_ttl_caps_renewal(env) -> None:
    env.vault.renew_result = 300  # Vault plafonne : plus que 5 min
    env.clock.now += LEASE * 0.7
    env.rotator.run_once()
    assert env.db.current.name == "v-user-2"


def test_rotates_after_vault_relogin(env) -> None:
    env.vault.relogin = True
    env.rotator.run_once()
    assert env.db.current.name == "v-user-2"


def test_failed_rotation_keeps_serving_and_retries(env) -> None:
    env.vault.renew_result = RuntimeError("nope")
    env.db.fail_build = True
    env.clock.now += LEASE * 0.7
    env.rotator.run_once()

    assert env.db.current.name == "v-user-1"  # l'ancien engine sert toujours
    assert not env.rotator.healthy
    assert "postgres down" in env.rotator.last_error

    env.db.fail_build = False
    env.rotator.run_once()
    assert env.db.current.name.startswith("v-user-")
    assert env.db.current.name != "v-user-1"
    assert env.rotator.healthy
