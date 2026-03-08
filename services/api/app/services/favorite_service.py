"""Favorite service for managing favorited completions."""

from fastapi import HTTPException
from app.repositories.storage_base import DataStore


class FavoriteService:
    """Service for favorite operations."""

    def __init__(self, store: DataStore):
        self.store = store

    async def add_favorite(self, completion_id: str, user_id: str) -> dict:
        """Add a completion to user's favorites."""
        # Check if completion exists
        completion = self.store.get_completion_by_id(user_id, completion_id)
        if not completion:
            raise HTTPException(status_code=404, detail="Completion not found")
        
        # Check if already favorited
        is_favorited = self.store.is_favorited(completion_id, user_id)
        if is_favorited:
            raise HTTPException(status_code=409, detail="Completion already favorited")
        
        # Create favorite
        favorite = self.store.create_favorite(completion_id, user_id)
        return favorite

    async def remove_favorite(self, completion_id: str, user_id: str) -> None:
        """Remove a completion from user's favorites."""
        success = self.store.delete_favorite(completion_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Favorite not found")

    async def get_favorite_completions(
        self, user_id: str, limit: int = 50, offset: int = 0
    ) -> list[dict]:
        """Get all favorited completions for a user."""
        completions = self.store.get_favorite_completions(user_id, limit, offset)
        return completions
