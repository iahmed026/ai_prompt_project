from fastapi import APIRouter
from fastapi import HTTPException

from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.schemas.auth import LoginRequest, TokenResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    if not settings.AUTH_USERNAME or not settings.AUTH_PASSWORD_HASH:
        raise HTTPException(
            status_code=503,
            detail="Password login is not configured",
        )

    valid_username = payload.username == settings.AUTH_USERNAME
    valid_password = verify_password(payload.password, settings.AUTH_PASSWORD_HASH)

    if not valid_username or not valid_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return TokenResponse(access_token=create_access_token(subject=payload.username))
