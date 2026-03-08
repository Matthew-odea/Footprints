from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any, Dict
import logging

from jose import JWTError, jwt

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class AuthError(Exception):
    pass


@lru_cache(maxsize=1)
def _get_jwt_secret() -> str:
    """Get JWT secret from AWS Secrets Manager or fallback to environment variable.
    
    Cached to avoid repeated Secrets Manager calls.
    """
    settings = get_settings()
    
    # If jwt_secret_name is configured, try to fetch from Secrets Manager
    if settings.jwt_secret_name:
        try:
            import boto3
            from botocore.exceptions import ClientError
            
            client = boto3.client('secretsmanager', region_name=settings.aws_region)
            response = client.get_secret_value(SecretId=settings.jwt_secret_name)
            secret = response['SecretString']
            logger.info(f"JWT secret loaded from Secrets Manager: {settings.jwt_secret_name}")
            return secret
        except ClientError as e:
            logger.warning(f"Failed to fetch secret from Secrets Manager: {e}. Falling back to JWT_SECRET env var.")
        except ImportError:
            logger.warning("boto3 not available. Falling back to JWT_SECRET env var.")
    
    # Fallback to environment variable
    if settings.jwt_secret == "change-me":
        logger.warning("Using default JWT secret 'change-me' - THIS IS INSECURE IN PRODUCTION!")
    
    return settings.jwt_secret


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expires_at = datetime.now(tz=timezone.utc) + timedelta(minutes=settings.jwt_exp_minutes)
    payload: Dict[str, Any] = {
        "sub": subject,
        "exp": expires_at,
    }
    jwt_secret = _get_jwt_secret()
    return jwt.encode(payload, jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str:
    settings = get_settings()
    jwt_secret = _get_jwt_secret()
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise AuthError("Invalid access token") from exc

    subject = payload.get("sub")
    if not subject:
        raise AuthError("Token subject missing")
    return str(subject)
