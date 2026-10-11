"""Endpoints /auth/* : register, login, refresh, logout, me."""

from datetime import timedelta

from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.config import Settings
from src.db.models import RefreshToken, User
from src.dependencies import CurrentUser, DbSession, SettingsDep
from src.schemas.auth import LoginRequest, RegisterRequest, UserOut
from src.security import (
    REFRESH_COOKIE_NAME,
    burn_password_check,
    clear_auth_cookies,
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    password_needs_rehash,
    set_auth_cookies,
    utcnow,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

INVALID_CREDENTIALS = "Pseudo ou mot de passe incorrect"


def _open_session(db: Session, user: User, response: Response, settings: Settings) -> None:
    """Crée un refresh token en base et pose les deux cookies.

    Ne commit pas : c'est à l'appelant de le faire.
    """
    raw_refresh, refresh_hash = generate_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=utcnow() + timedelta(days=settings.refresh_token_ttl_days),
        )
    )
    access = create_access_token(user_id=user.id, username=user.username)
    set_auth_cookies(response, access, raw_refresh, settings)


def _unauthorized_and_clear(settings: Settings, detail: str) -> Response:
    response = JSONResponse({"detail": detail}, status_code=status.HTTP_401_UNAUTHORIZED)
    clear_auth_cookies(response, settings)
    return response


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest, response: Response, db: DbSession, settings: SettingsDep
) -> UserOut:
    email = payload.email.lower()

    # Unicité du pseudo insensible à la casse ("Nawel" bloque "nawel").
    if db.scalar(select(User.id).where(func.lower(User.username) == payload.username.lower())):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Ce pseudo est déjà utilisé")
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Cet email est déjà utilisé")

    user = User(username=payload.username, email=email, password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.flush()
    except IntegrityError:
        # Course entre deux inscriptions simultanées : la contrainte UNIQUE tranche.
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="Ce pseudo ou cet email est déjà utilisé"
        ) from None

    # Compte actif immédiatement : on connecte directement l'utilisateur.
    _open_session(db, user, response, settings)
    db.commit()
    return UserOut.model_validate(user)


@router.post("/login", response_model=UserOut)
def login(
    payload: LoginRequest, response: Response, db: DbSession, settings: SettingsDep
) -> UserOut:
    user = db.scalar(select(User).where(User.username == payload.username))
    if user is None:
        burn_password_check(payload.password)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=INVALID_CREDENTIALS)
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=INVALID_CREDENTIALS)

    if password_needs_rehash(user.password_hash):
        user.password_hash = hash_password(payload.password)

    # Ménage : refresh tokens expirés ou révoqués de cet utilisateur.
    db.execute(
        delete(RefreshToken).where(
            RefreshToken.user_id == user.id,
            or_(RefreshToken.expires_at <= utcnow(), RefreshToken.revoked_at.is_not(None)),
        )
        .execution_options(synchronize_session=False)
    )
    _open_session(db, user, response, settings)
    db.commit()
    return UserOut.model_validate(user)


@router.post(
    "/refresh",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    responses={401: {"description": "Refresh token absent, invalide, expiré ou révoqué"}},
)
def refresh(request: Request, db: DbSession, settings: SettingsDep) -> Response:
    raw = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw:
        return _unauthorized_and_clear(settings, "Refresh token absent")

    now = utcnow()
    # FOR UPDATE : si deux refresh arrivent en même temps avec le même token,
    # le second attend le premier, puis ne trouve plus de token valide.
    token = db.scalar(
        select(RefreshToken)
        .where(
            RefreshToken.token_hash == hash_refresh_token(raw),
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > now,
        )
        .with_for_update()
    )
    user = db.get(User, token.user_id) if token is not None else None
    if token is None or user is None:
        db.rollback()
        return _unauthorized_and_clear(settings, "Refresh token invalide ou expiré")

    token.revoked_at = now  # rotation : l'ancien token ne resservira plus
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    _open_session(db, user, response, settings)
    db.commit()
    return response


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def logout(request: Request, db: DbSession, settings: SettingsDep) -> Response:
    raw = request.cookies.get(REFRESH_COOKIE_NAME)
    if raw:
        db.execute(
            update(RefreshToken)
            .where(
                RefreshToken.token_hash == hash_refresh_token(raw),
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=utcnow())
            .execution_options(synchronize_session=False)
        )
        db.commit()
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    clear_auth_cookies(response, settings)
    return response


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)
