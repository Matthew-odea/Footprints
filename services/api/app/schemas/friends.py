"""Friend relationship schemas."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class FriendshipStatus(str, Enum):
    """Friendship status enum."""

    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    BLOCKED = "blocked"


class AddFriendRequest(BaseModel):
    """Request to add a friend."""

    username: str = Field(..., description="Username of friend to add")


class FriendItem(BaseModel):
    """Friend in friend list."""

    request_id: Optional[str] = Field(None, description="ID of the friend request")
    friend_id: str = Field(..., description="ID of friend user")
    username: str = Field(..., description="Username of friend")
    display_name: str = Field(..., description="Display name of friend")
    status: str = Field(..., description="Friendship status")
    created_at: str = Field(..., description="When friendship was created")
    requested_by: Optional[str] = Field(None, description="User ID who sent the request")


class FriendRequestItem(BaseModel):
    """Friend request (pending friendship)."""

    request_id: str = Field(..., description="ID of the friend request")
    user_id: str = Field(..., description="ID of the other user")
    username: str = Field(..., description="Username of the other user")
    display_name: str = Field(..., description="Display name of the other user")
    created_at: str = Field(..., description="When request was sent")
    direction: str = Field(..., description="incoming or outgoing")


class FriendRequestsListResponse(BaseModel):
    """Response with list of friend requests."""

    items: list[FriendRequestItem] = Field(default_factory=list)
    total: int = Field(default=0)


class FriendsListResponse(BaseModel):
    """Response with list of friends."""

    items: list[FriendItem] = Field(default_factory=list)
    total: int = Field(default=0)


class FriendStatusResponse(BaseModel):
    """Response with single friend details."""

    friend_id: str
    username: str
    display_name: str
    status: str
    created_at: str
    mutual_friends: int = Field(default=0, description="Number of mutual friends")


class AcceptFriendRequestResponse(BaseModel):
    """Response after accepting a friend request."""

    friend_id: str
    username: str
    display_name: str
    status: str = "accepted"
    accepted_at: str
