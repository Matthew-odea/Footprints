"""Feed endpoints for browsing friend/community activity."""

from typing import Literal

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_current_user, get_store
from app.repositories.storage import DataStore
from app.schemas.feed import FeedResponse

router = APIRouter()


@router.get("", response_model=FeedResponse)
async def get_feed(
    limit: int = Query(20, ge=1, le=100),
    cursor: str | None = None,
    scope: Literal["all", "friends"] = Query("all"),
    current_user: dict = Depends(get_current_user),
    store: DataStore = Depends(get_store),
) -> FeedResponse:
    """
    Get feed of recent completions from friends (or all public for MVP).
    
    Supports pagination via cursor (opaque string).
    """
    user_id = current_user["user_id"]
    items, next_cursor = store.get_feed(user_id, limit=limit, cursor=cursor, scope=scope)
    
    return FeedResponse(
        items=items,
        next_cursor=next_cursor,
    )
