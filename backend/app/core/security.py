from datetime import datetime, timedelta, timezone
import base64
import hashlib
from typing import Any, Dict, Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def _password_bytes(password: str) -> bytes:
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        _password_bytes(password),
        bcrypt.gensalt(),
    ).decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    if not hashed_password:
        return False

    return bcrypt.checkpw(
        _password_bytes(plain_password),
        hashed_password.encode("utf-8"),
    )


def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
) -> str:

    expire = datetime.now(timezone.utc) + (
        expires_delta
        or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    payload = {
        "sub": subject,
        "exp": expire,
        "type": "access",
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_token(token: str) -> Dict[str, Any]:

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        return payload

    except JWTError:
        raise ValueError("Invalid or expired token")
