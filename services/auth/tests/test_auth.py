from fastapi.testclient import TestClient

from src.security import ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, decode_access_token

USER = {"username": "Nawel", "email": "Nawel@Exemple.fr", "password": "motdepasse-solide"}


def register(client: TestClient, **overrides: str):
    return client.post("/auth/register", json={**USER, **overrides})


def test_register_logs_user_in(client: TestClient) -> None:
    r = register(client)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["username"] == "Nawel"
    assert body["email"] == "nawel@exemple.fr"
    assert "password" not in body and "password_hash" not in body

    set_cookie = r.headers.get_list("set-cookie")
    assert any(c.startswith(f"{ACCESS_COOKIE_NAME}=") and "HttpOnly" in c for c in set_cookie)
    assert any(
        c.startswith(f"{REFRESH_COOKIE_NAME}=") and "Path=/auth" in c for c in set_cookie
    )

    me = client.get("/auth/me")
    assert me.status_code == 200
    assert me.json()["username"] == "Nawel"


def test_register_conflicts(client: TestClient) -> None:
    assert register(client).status_code == 201
    assert register(client, username="nawel", email="autre@exemple.fr").status_code == 409
    assert register(client, username="Autre", email="NAWEL@exemple.fr").status_code == 409


def test_register_validation(client: TestClient) -> None:
    assert register(client, username="ab").status_code == 422
    assert register(client, username="pas d'espace").status_code == 422
    assert register(client, password="court").status_code == 422
    assert register(client, email="pas-un-email").status_code == 422


def test_login(client: TestClient) -> None:
    register(client)
    client.cookies.clear()
    assert client.get("/auth/me").status_code == 401

    bad = client.post("/auth/login", json={"username": "Nawel", "password": "mauvais"})
    assert bad.status_code == 401
    unknown = client.post("/auth/login", json={"username": "Inconnu", "password": "x"})
    assert unknown.status_code == 401
    assert bad.json() == unknown.json()  # même message : pas d'énumération

    ok = client.post("/auth/login", json={"username": "Nawel", "password": USER["password"]})
    assert ok.status_code == 200
    assert client.get("/auth/me").status_code == 200


def test_access_token_claims(client: TestClient) -> None:
    register(client)
    claims = decode_access_token(client.cookies[ACCESS_COOKIE_NAME])
    assert claims["username"] == "Nawel"
    assert claims["iss"] == "auth" and claims["aud"] == "rpg"
    assert claims["exp"] - claims["iat"] == 15 * 60


def test_refresh_rotates_tokens(client: TestClient) -> None:
    register(client)
    old_refresh = client.cookies[REFRESH_COOKIE_NAME]

    r = client.post("/auth/refresh")
    assert r.status_code == 204
    assert r.content == b""
    new_refresh = client.cookies[REFRESH_COOKIE_NAME]
    assert new_refresh != old_refresh
    assert client.get("/auth/me").status_code == 200

    # L'ancien refresh token est révoqué : le rejouer échoue.
    client.cookies.clear()
    client.cookies.set(REFRESH_COOKIE_NAME, old_refresh)
    replay = client.post("/auth/refresh")
    assert replay.status_code == 401


def test_refresh_without_cookie(client: TestClient) -> None:
    assert client.post("/auth/refresh").status_code == 401


def test_logout(client: TestClient) -> None:
    register(client)
    refresh_token = client.cookies[REFRESH_COOKIE_NAME]

    r = client.post("/auth/logout")
    assert r.status_code == 204
    assert ACCESS_COOKIE_NAME not in client.cookies
    assert client.get("/auth/me").status_code == 401

    # Le refresh token a été révoqué en base.
    client.cookies.set(REFRESH_COOKIE_NAME, refresh_token)
    assert client.post("/auth/refresh").status_code == 401

    # Idempotent, même sans cookie.
    client.cookies.clear()
    assert client.post("/auth/logout").status_code == 204


def test_me_rejects_garbage_token(client: TestClient) -> None:
    client.cookies.set(ACCESS_COOKIE_NAME, "pas.un.jwt")
    assert client.get("/auth/me").status_code == 401


def test_health(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/health/ready").json() == {"status": "ok"}
