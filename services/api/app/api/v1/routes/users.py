from fastapi import APIRouter, Depends

from app.dependencies import get_current_user_id, get_user_service
from app.schemas.settings import SettingsUpdateRequest
from app.schemas.users import UserProfile, UserResponse, UserSettings
from app.services.user_service import UserService

router = APIRouter(prefix="", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(
    user_id: str = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    user = service.get_me(user_id=user_id)
    return UserResponse(
        profile=UserProfile(
            user_id=user["user_id"],
            username=user["username"],
            display_name=user["display_name"],
        ),
        settings=UserSettings(**user["settings"]),
        completed_count=user["completed_count"],
    )


@router.patch("/me/settings", response_model=UserResponse)
def patch_me_settings(
    payload: SettingsUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    user = service.update_settings(user_id=user_id, share_by_default=payload.share_by_default)
    return UserResponse(
        profile=UserProfile(
            user_id=user["user_id"],
            username=user["username"],
            display_name=user["display_name"],
        ),
        settings=UserSettings(**user["settings"]),
        completed_count=user["completed_count"],
    )
