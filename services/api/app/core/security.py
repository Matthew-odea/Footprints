from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from jose import JWTError, jwt

from app.core.config import get_settings


class AuthError(Exception):
    pass


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expires_at = datetime.now(tz=timezone.utc) + timedelta(minutes=settings.jwt_exp_minutes)
    payload: Dict[str, Any] = {
        "sub": subject,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise AuthError("Invalid access token") from exc

    subject = payload.get("sub")
    if not subject:
        raise AuthError("Token subject missing")
    return str(subject)
