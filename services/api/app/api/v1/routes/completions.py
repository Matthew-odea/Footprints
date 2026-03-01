from fastapi import APIRouter, Depends

from app.dependencies import get_completion_service, get_current_user_id
from app.schemas.completions import CompletionCreateRequest, CompletionCreateResponse, CompletionItem
from app.services.completion_service import CompletionService

router = APIRouter(prefix="/completions", tags=["completions"])


@router.post("", response_model=CompletionCreateResponse)
def create_completion(
    payload: CompletionCreateRequest,
    user_id: str = Depends(get_current_user_id),
    service: CompletionService = Depends(get_completion_service),
) -> CompletionCreateResponse:
    item = service.create(user_id=user_id, payload=payload.model_dump())
    return CompletionCreateResponse(item=CompletionItem(**item))
