from pydantic import BaseModel, Field


class CommentCreateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    parent_comment_id: str | None = None  # For replies


class CommentItem(BaseModel):
    comment_id: str
    completion_id: str
    user_id: str
    user_display_name: str
    text: str
    created_at: str
    updated_at: str
    parent_comment_id: str | None = None
    reply_count: int = 0


class CommentCreateResponse(BaseModel):
    item: CommentItem


class CommentsListResponse(BaseModel):
    items: list[CommentItem]
    total: int
