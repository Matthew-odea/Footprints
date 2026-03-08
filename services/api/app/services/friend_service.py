"""Friend management service."""

from typing import Any

from fastapi import HTTPException

from app.repositories.storage import DataStore


class FriendService:
    """Service for managing friend relationships."""

    def __init__(self, store: DataStore):
        self.store = store

    def add_friend(self, user_id: str, friend_username: str) -> dict[str, Any]:
        """Add a friend by username."""
        if friend_username == self.store.get_user(user_id).get("username"):
            raise HTTPException(status_code=400, detail="Cannot add yourself as a friend")

        try:
            return self.store.add_friend(user_id, friend_username)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

    def remove_friend(self, user_id: str, friend_id: str) -> None:
        """Remove a friend."""
        self.store.remove_friend(user_id, friend_id)

    def get_friends(self, user_id: str) -> list[dict[str, Any]]:
        """Get list of friends for a user."""
        return self.store.get_friends(user_id)

    def get_friend_status(self, user_id: str, friend_id: str) -> dict[str, Any]:
        """Get friendship status between two users."""
        friendship = self.store.get_friend_status(user_id, friend_id)
        if not friendship:
            raise HTTPException(status_code=404, detail="Not friends with this user")
        return friendship

    def search_users(self, query: str, user_id: str) -> list[dict[str, Any]]:
        """Search for users to add as friends."""
        if not query or len(query) < 2:
            raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")

        return self.store.search_users(query, exclude_user_id=user_id)
