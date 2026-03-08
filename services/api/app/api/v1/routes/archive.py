from fastapi import APIRouter, Depends, Query

from app.dependencies import get_completion_service, get_current_user_id
from app.schemas.completions import CompletionItem, HistoryResponse
from app.services.completion_service import CompletionService

router = APIRouter(prefix="/archive", tags=["archive"])


@router.get("/completions", response_model=HistoryResponse)
def get_completions_by_date_range(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    limit: int = Query(100, ge=1, le=500, description="Number of completions to return"),
    offset: int = Query(0, ge=0, description="Number of completions to skip"),
    user_id: str = Depends(get_current_user_id),
    service: CompletionService = Depends(get_completion_service),
) -> HistoryResponse:
    items = service.get_completions_by_date_range(
        user_id=user_id, start_date=start_date, end_date=end_date, limit=limit, offset=offset
    )
    return HistoryResponse(items=[CompletionItem(**item) for item in items])
