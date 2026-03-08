"""Favorites API routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.schemas.favorites import FavoriteResponse, UnfavoriteResponse
from app.schemas.completions import CompletionItem
from app.services.favorite_service import FavoriteService
from app.dependencies import get_favorite_service, get_current_user_id

router = APIRouter()


@router.post("/completions/{completion_id}/favorite", response_model=FavoriteResponse)
async def add_favorite(
    completion_id: str,
    favorite_service: FavoriteService = Depends(get_favorite_service),
    user_id: str = Depends(get_current_user_id),
):
    """Mark a completion as favorite."""
    favorite = await favorite_service.add_favorite(completion_id, user_id)
    return FavoriteResponse(status="favorited", favorite_id=favorite["favorite_id"])


@router.delete("/completions/{completion_id}/favorite", response_model=UnfavoriteResponse)
async def remove_favorite(
    completion_id: str,
    favorite_service: FavoriteService = Depends(get_favorite_service),
    user_id: str = Depends(get_current_user_id),
):
    """Remove a completion from favorites."""
    await favorite_service.remove_favorite(completion_id, user_id)
    return UnfavoriteResponse(status="unfavorited")


@router.get("/favorites", response_model=list[CompletionItem])
async def get_favorite_completions(
    favorite_service: FavoriteService = Depends(get_favorite_service),
    user_id: str = Depends(get_current_user_id),
    limit: int = 50,
    offset: int = 0,
):
    """Get all favorite completions for the current user."""
    completions = await favorite_service.get_favorite_completions(user_id, limit, offset)
    return completions
