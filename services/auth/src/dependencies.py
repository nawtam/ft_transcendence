"""Dépendances FastAPI partagées."""

from collections.abc import Iterator
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from src.config import Settings, get_settings
from src.db.models import User
from src.security import ACCESS_COOKIE_NAME, decode_access_token


def get_db(request: Request) -> Iterator[Session]:
    """Session liée à l'engine courant au moment de la requête.

    Si l'engine est remplacé pendant la requête, celle-ci termine
    tranquillement sur l'ancien (fermé seulement après un délai de grâce).
    """
    session = request.app.state.db.session()
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


DbSession = Annotated[Session, Depends(get_db)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


def get_current_user(request: Request, db: DbSession) -> User:
    unauthorized = HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Non authentifié")
    token = request.cookies.get(ACCESS_COOKIE_NAME)
    if not token:
        raise unauthorized
    try:
        claims = decode_access_token(token)
        user_id = int(claims["sub"])
    except (jwt.PyJWTError, ValueError):
        raise unauthorized from None
    user = db.get(User, user_id)
    if user is None:
        raise unauthorized
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
