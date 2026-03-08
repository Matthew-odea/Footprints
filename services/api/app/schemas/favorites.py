"""Pydantic schemas for favorites."""

from pydantic import BaseModel, Field


class FavoriteItem(BaseModel):
    """A favorited completion."""
    favorite_id: str = Field(..., description="Unique favorite ID")
    completion_id: str = Field(..., description="Completion that was favorited")
    user_id: str = Field(..., description="User who favorited")
    created_at: str = Field(..., description="ISO timestamp when favorited")


class FavoriteResponse(BaseModel):
    """Response after adding a favorite."""
    status: str = Field(..., description="Status message")
    favorite_id: str = Field(..., description="Created favorite ID")


class UnfavoriteResponse(BaseModel):
    """Response after removing a favorite."""
    status: str = Field(..., description="Status message")
