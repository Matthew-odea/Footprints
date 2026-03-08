from fastapi import APIRouter, Depends, HTTPException, Path

from app.dependencies import get_comment_service, get_current_user_id
from app.schemas.comments import (
    CommentCreateRequest,
    CommentCreateResponse,
    CommentItem,
    CommentsListResponse,
)
from app.services.comment_service import CommentService

router = APIRouter(prefix="/completions/{completion_id}/comments", tags=["comments"])


@router.get("", response_model=CommentsListResponse)
def list_comments(
    completion_id: str = Path(..., description="Completion ID"),
    user_id: str = Depends(get_current_user_id),
    service: CommentService = Depends(get_comment_service),
) -> CommentsListResponse:
    comments = service.list_comments(completion_id=completion_id)
    return CommentsListResponse(items=[CommentItem(**c) for c in comments], total=len(comments))


@router.post("", response_model=CommentCreateResponse)
def create_comment(
    completion_id: str = Path(..., description="Completion ID"),
    payload: CommentCreateRequest = None,
    user_id: str = Depends(get_current_user_id),
    service: CommentService = Depends(get_comment_service),
) -> CommentCreateResponse:
    item = service.create(
        completion_id=completion_id, user_id=user_id, payload=payload.model_dump()
    )
    return CommentCreateResponse(item=CommentItem(**item))


@router.delete("/{comment_id}")
def delete_comment(
    completion_id: str = Path(..., description="Completion ID"),
    comment_id: str = Path(..., description="Comment ID"),
    user_id: str = Depends(get_current_user_id),
    service: CommentService = Depends(get_comment_service),
) -> dict:
    success = service.delete(completion_id=completion_id, comment_id=comment_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found or not authorized")
    return {"status": "deleted"}
