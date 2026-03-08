"""Friend relationship schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FriendshipStatus:
    """Friendship status constants."""

    PENDING = "pending"
    ACCEPTED = "accepted"
    BLOCKED = "blocked"


class AddFriendRequest(BaseModel):
    """Request to add a friend."""

    username: str = Field(..., description="Username of friend to add")


class FriendItem(BaseModel):
    """Friend in friend list."""

    friend_id: str = Field(..., description="ID of friend user")
    username: str = Field(..., description="Username of friend")
    display_name: str = Field(..., description="Display name of friend")
    status: str = Field(default="accepted", description="Friendship status")
    created_at: str = Field(..., description="When friendship was created")


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
