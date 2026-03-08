from functools import lru_cache

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings
from app.core.security import AuthError, decode_access_token
from app.repositories.storage import DataStore, DynamoDataStore, MemoryDataStore
from app.services.auth_service import AuthService
from app.services.comment_service import CommentService
from app.services.completion_service import CompletionService
from app.services.favorite_service import FavoriteService
from app.services.friend_service import FriendService
from app.services.prompt_service import PromptService
from app.services.user_service import UserService

security_scheme = HTTPBearer(auto_error=False)


@lru_cache
def get_store() -> DataStore:
    settings = get_settings()
    if settings.storage_backend.lower() == "dynamodb":
        return DynamoDataStore(settings=settings)
    return MemoryDataStore()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return decode_access_token(credentials.credentials)
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


def get_current_user(
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Get current user as a dict with user_id."""
    return {"user_id": user_id}


def get_auth_service(store: DataStore = Depends(get_store)) -> AuthService:
    return AuthService(store=store)


def get_prompt_service(store: DataStore = Depends(get_store)) -> PromptService:
    return PromptService(store=store)


def get_completion_service(store: DataStore = Depends(get_store)) -> CompletionService:
    return CompletionService(store=store)


def get_user_service(store: DataStore = Depends(get_store)) -> UserService:
    return UserService(store=store)


def get_friend_service(store: DataStore = Depends(get_store)) -> FriendService:
    return FriendService(store=store)


def get_comment_service(store: DataStore = Depends(get_store)) -> CommentService:
    return CommentService(store=store)


def get_favorite_service(store: DataStore = Depends(get_store)) -> FavoriteService:
    return FavoriteService(store=store)
