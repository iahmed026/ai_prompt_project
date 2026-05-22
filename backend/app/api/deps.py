from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",
    auto_error=False,
)


def get_admin_subject_from_token(token: Optional[str]) -> str:
    if not settings.AUTH_USERNAME or not settings.AUTH_PASSWORD_HASH:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin login is not configured",
        )

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired admin session",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    subject = payload.get("sub")

    # This project currently has a single configured login identity, so that
    # identity is treated as the admin user for protected blog mutations.
    if subject != settings.AUTH_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return str(subject)


def require_admin_user(
    token: Optional[str] = Depends(oauth2_scheme),
) -> str:
    return get_admin_subject_from_token(token)


__all__ = [
    "get_admin_subject_from_token",
    "get_db",
    "oauth2_scheme",
    "require_admin_user",
]
