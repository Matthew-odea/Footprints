from fastapi import APIRouter, Depends

from app.dependencies import get_completion_service, get_current_user_id
from app.schemas.completions import CompletionItem, HistoryResponse
from app.services.completion_service import CompletionService

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=HistoryResponse)
def list_history(
    user_id: str = Depends(get_current_user_id),
    service: CompletionService = Depends(get_completion_service),
) -> HistoryResponse:
    items = service.list_history(user_id=user_id)
    return HistoryResponse(items=[CompletionItem(**item) for item in items])
