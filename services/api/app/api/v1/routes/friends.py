"""Friend management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.dependencies import get_current_user, get_friend_service
from app.middleware.rate_limiter import RATE_LIMITS, RateLimiter, get_rate_limiter
from app.schemas.friends import (
    AcceptFriendRequestResponse,
    AddFriendRequest,
    FriendItem,
    FriendRequestItem,
    FriendRequestsListResponse,
    FriendsListResponse,
    FriendStatusResponse,
)
from app.services.friend_service import FriendService

router = APIRouter(prefix="/friends", tags=["friends"])


@router.post("", status_code=201)
async def add_friend(
    request: AddFriendRequest,
    response: Response,
    current_user: dict = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service),
    limiter: RateLimiter = Depends(get_rate_limiter),
) -> FriendItem:
    """Add a friend by username (creates pending friend request)."""
    limit_config = RATE_LIMITS["add_friend"]
    allowed, current_count, retry_after = limiter.check_rate_limit(
        key=f"add_friend:{current_user['user_id']}",
        max_requests=limit_config["requests"],
        window_seconds=limit_config["window_seconds"],
    )

    response.headers["X-RateLimit-Limit"] = str(limit_config["requests"])
    response.headers["X-RateLimit-Remaining"] = str(
        max(0, limit_config["requests"] - current_count)
    )

    if not allowed:
        response.headers["Retry-After"] = str(retry_after)
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
        )

    result = service.add_friend(current_user["user_id"], request.username)
    return FriendItem(**result)


@router.delete("/{friend_id}", status_code=204)
async def remove_friend(
    friend_id: str,
    current_user: dict = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service),
) -> None:
    """Remove a friend by ID."""
    service.remove_friend(current_user["user_id"], friend_id)


@router.get("", response_model=FriendsListResponse)
async def list_friends(
    current_user: dict = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service),
) -> FriendsListResponse:
    """Get accepted friends for current user."""
    friends = service.get_friends(current_user["user_id"])
    return FriendsListResponse(
        items=[FriendItem(**friend) for friend in friends],
        total=len(friends),
    )


@router.get("/search", response_model=FriendsListResponse)
async def search_users(
    response: Response,
    q: str = Query(..., min_length=2, description="Search query"),
    current_user: dict = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service),
    limiter: RateLimiter = Depends(get_rate_limiter),
) -> FriendsListResponse:
    """Search for users by username or display name."""
    limit_config = RATE_LIMITS["search_users"]
    allowed, current_count, retry_after = limiter.check_rate_limit(
        key=f"search:{current_user['user_id']}",
        max_requests=limit_config["requests"],
        window_seconds=limit_config["window_seconds"],
    )

    response.headers["X-RateLimit-Limit"] = str(limit_config["requests"])
    response.headers["X-RateLimit-Remaining"] = str(
        max(0, limit_config["requests"] - current_count)
    )
    response.headers["X-RateLimit-Reset"] = str(retry_after)

    if not allowed:
        response.headers["Retry-After"] = str(retry_after)
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
        )

    users = service.search_users(q, current_user["user_id"])
    return FriendsListResponse(
        items=[
            FriendItem(
                friend_id=user["user_id"],
                username=user["username"],
                display_name=user["display_name"],
                status="not_friend",
                created_at="",
            )
            for user in users
        ],
        total=len(users),
    )


@router.get("/{friend_id}", response_model=FriendStatusResponse)
async def get_friend(
    friend_id: str,
    current_user: dict = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service),
) -> FriendStatusResponse:
    """Get friendship status with a specific user."""
    friendship = service.get_friend_status(current_user["user_id"], friend_id)
    return FriendStatusResponse(
        friend_id=friendship["friend_id"],
        username=friendship["username"],
        display_name=friendship["display_name"],
        status=friendship["status"],
        created_at=friendship["created_at"],
    )


@router.get("/requests/incoming", response_model=FriendRequestsListResponse)
async def get_incoming_requests(
    current_user: dict = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service),
) -> FriendRequestsListResponse:
    """Get incoming pending friend requests."""
    requests = service.get_incoming_requests(current_user["user_id"])
    return FriendRequestsListResponse(
        items=[
            FriendRequestItem(
                request_id=req["request_id"],
                user_id=req["friend_id"],
                username=req["username"],
                display_name=req["display_name"],
                created_at=req["created_at"],
                direction="incoming",
            )
            for req in requests
        ],
        total=len(requests),
    )


@router.get("/requests/outgoing", response_model=FriendRequestsListResponse)
async def get_outgoing_requests(
    current_user: dict = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service),
) -> FriendRequestsListResponse:
    """Get outgoing pending friend requests."""
    requests = service.get_outgoing_requests(current_user["user_id"])
    return FriendRequestsListResponse(
        items=[
            FriendRequestItem(
                request_id=req["request_id"],
                user_id=req["friend_id"],
                username=req["username"],
                display_name=req["display_name"],
                created_at=req["created_at"],
                direction="outgoing",
            )
            for req in requests
        ],
        total=len(requests),
    )


@router.post("/requests/{request_id}/accept", response_model=AcceptFriendRequestResponse)
async def accept_friend_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service),
) -> AcceptFriendRequestResponse:
    """Accept an incoming friend request."""
    friendship = service.accept_friend_request(current_user["user_id"], request_id)
    return AcceptFriendRequestResponse(
        friend_id=friendship["friend_id"],
        username=friendship["username"],
        display_name=friendship["display_name"],
        status=friendship["status"],
        accepted_at=friendship.get("accepted_at", ""),
    )


@router.post("/requests/{request_id}/reject", status_code=204)
async def reject_friend_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service),
) -> None:
    """Reject an incoming friend request."""
    service.reject_friend_request(current_user["user_id"], request_id)
