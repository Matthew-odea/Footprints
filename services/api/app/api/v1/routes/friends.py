"""Friend management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_current_user, get_friend_service
from app.schemas.friends import (
    AddFriendRequest,
    FriendItem,
    FriendsListResponse,
    FriendStatusResponse,
)
from app.services.friend_service import FriendService

router = APIRouter(prefix="/friends", tags=["friends"])


@router.post("", status_code=201)
async def add_friend(
    request: AddFriendRequest,
    current_user: dict = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service),
) -> FriendItem:
    """
    Add a friend by username.
    
    Returns the new friendship details.
    """
    result = service.add_friend(current_user["user_id"], request.username)
    return FriendItem(**result)


@router.delete("/{friend_id}", status_code=204)
async def remove_friend(
    friend_id: str,
    current_user: dict = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service),
) -> None:
    """
    Remove a friend by ID.
    
    Returns 204 No Content on success.
    """
    service.remove_friend(current_user["user_id"], friend_id)


@router.get("", response_model=FriendsListResponse)
async def list_friends(
    current_user: dict = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service),
) -> FriendsListResponse:
    """
    Get list of friends for current user.
    
    Returns all friends in accepted status.
    """
    friends = service.get_friends(current_user["user_id"])
    return FriendsListResponse(
        items=[FriendItem(**friend) for friend in friends],
        total=len(friends),
    )


@router.get("/search", response_model=FriendsListResponse)
async def search_users(
    q: str = Query(..., min_length=2, description="Search query"),
    current_user: dict = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service),
) -> FriendsListResponse:
    """
    Search for users to add as friends.
    
    Returns matching users by username or display name.
    """
    users = service.search_users(q, current_user["user_id"])
    return FriendsListResponse(
        items=[FriendItem(
            friend_id=user["user_id"],
            username=user["username"],
            display_name=user["display_name"],
            status="not_friend",
            created_at="",
        ) for user in users],
        total=len(users),

    )


@router.get("/{friend_id}", response_model=FriendStatusResponse)
async def get_friend(
    friend_id: str,
    current_user: dict = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service),
) -> FriendStatusResponse:
    """
    Get friendship status with a specific user.
    
    Returns friendship details including status.
    """
    friendship = service.get_friend_status(current_user["user_id"], friend_id)
    return FriendStatusResponse(
        friend_id=friendship["friend_id"],
        username=friendship["username"],
        display_name=friendship["display_name"],
        status=friendship["status"],
        created_at=friendship["created_at"],
        mutual_friends=0,  # TODO: Calculate mutual friends
    )
