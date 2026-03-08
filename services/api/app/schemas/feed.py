"""Feed and friend-related Pydantic schemas."""

from pydantic import BaseModel


class FeedItem(BaseModel):
    """A single feed item (completion from a friend or public)."""
    completion_id: str
    user_id: str
    user_display_name: str
    prompt_id: str
    prompt_title: str
    photo_url: str
    note: str
    location: str
    date: str
    created_at: str


class FeedResponse(BaseModel):
    """Response for feed endpoint."""
    items: list[FeedItem]
    next_cursor: str | None = None
