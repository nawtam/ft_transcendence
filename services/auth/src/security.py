"""Primitives de sécurité : mots de passe, JWT RS256, refresh tokens, cookies."""

from __future__ import annotations

import hashlib
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Any

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey, RSAPublicKey
from passlib.context import CryptContext

if TYPE_CHECKING:
    from fastapi import Response

    from src.config import Settings

ACCESS_COOKIE_NAME = "access_token"
REFRESH_COOKIE_NAME = "refresh_token"
JWT_ALGORITHM = "RS256"


def utcnow() -> datetime:
    return datetime.now(UTC)


# --- Mots de passe (Argon2) ---------------------------------------------------

_pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
_dummy_hash: str | None = None


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _pwd_context.verify(password, password_hash)
    except (ValueError, TypeError):
        return False


def password_needs_rehash(password_hash: str) -> bool:
    """True si les paramètres Argon2 ont évolué depuis le hachage."""
    return _pwd_context.needs_update(password_hash)


def burn_password_check(password: str) -> None:
    """Fait un vrai calcul Argon2 pour un pseudo inexistant, afin que le temps
    de réponse ne révèle pas si le compte existe."""
    global _dummy_hash
    if _dummy_hash is None:
        _dummy_hash = _pwd_context.hash(secrets.token_urlsafe(16))
    _pwd_context.verify(password, _dummy_hash)


# --- JWT RS256 ------------------------------------------------------------


@dataclass(frozen=True)
class _JwtConfig:
    private_key: RSAPrivateKey
    public_key: RSAPublicKey
    issuer: str
    audience: str
    access_ttl: timedelta


_jwt_config: _JwtConfig | None = None


def configure_jwt(private_pem: str, public_pem: str, settings: Settings) -> None:
    """Charge la paire de clés (lue depuis Vault au démarrage) et vérifie
    qu'elle est cohérente."""
    global _jwt_config
    private_key = serialization.load_pem_private_key(private_pem.encode(), password=None)
    public_key = serialization.load_pem_public_key(public_pem.encode())
    if not isinstance(private_key, RSAPrivateKey) or not isinstance(public_key, RSAPublicKey):
        raise ValueError("La paire de clés JWT doit être de type RSA")
    if private_key.public_key().public_numbers() != public_key.public_numbers():
        raise ValueError("public_key ne correspond pas à private_key")
    _jwt_config = _JwtConfig(
        private_key=private_key,
        public_key=public_key,
        issuer=settings.jwt_issuer,
        audience=settings.jwt_audience,
        access_ttl=timedelta(minutes=settings.access_token_ttl_minutes),
    )


def _config() -> _JwtConfig:
    if _jwt_config is None:
        raise RuntimeError("Clés JWT non chargées (configure_jwt n'a pas été appelé)")
    return _jwt_config


def create_access_token(user_id: int, username: str) -> str:
    cfg = _config()
    now = utcnow()
    claims = {
        "sub": str(user_id),
        "username": username,
        "iss": cfg.issuer,
        "aud": cfg.audience,
        "iat": now,
        "exp": now + cfg.access_ttl,
        "jti": uuid.uuid4().hex,
        "type": "access",
    }
    return jwt.encode(claims, cfg.private_key, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Vérifie signature, expiration, émetteur et audience. Lève
    jwt.PyJWTError si le token est invalide."""
    cfg = _config()
    claims = jwt.decode(
        token,
        cfg.public_key,
        algorithms=[JWT_ALGORITHM],
        audience=cfg.audience,
        issuer=cfg.issuer,
        options={"require": ["exp", "iat", "sub", "iss", "aud"]},
    )
    if claims.get("type") != "access":
        raise jwt.InvalidTokenError("Type de token inattendu")
    return claims


# --- Refresh tokens (opaques) -------------------------------------------------


def generate_refresh_token() -> tuple[str, str]:
    """Renvoie (token brut pour le cookie, hash à stocker en base).

    Le token a 384 bits d'entropie : un SHA-256 suffit (pas besoin d'un hash
    lent comme pour un mot de passe) et permet la recherche directe en base.
    """
    raw = secrets.token_urlsafe(48)
    return raw, hash_refresh_token(raw)


def hash_refresh_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


# --- Cookies ------------------------------------------------------------------


def set_auth_cookies(
    response: Response, access_token: str, refresh_token: str, settings: Settings
) -> None:
    response.set_cookie(
        ACCESS_COOKIE_NAME,
        access_token,
        max_age=settings.access_token_ttl_minutes * 60,
        path="/",
        secure=settings.cookie_secure,
        httponly=True,
        samesite="lax",
    )
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=settings.refresh_token_ttl_days * 24 * 3600,
        path=settings.refresh_cookie_path,
        secure=settings.cookie_secure,
        httponly=True,
        samesite="lax",
    )


def clear_auth_cookies(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        ACCESS_COOKIE_NAME, path="/", secure=settings.cookie_secure, httponly=True, samesite="lax"
    )
    response.delete_cookie(
        REFRESH_COOKIE_NAME,
        path=settings.refresh_cookie_path,
        secure=settings.cookie_secure,
        httponly=True,
        samesite="lax",
    )
