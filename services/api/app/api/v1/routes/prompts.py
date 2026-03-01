from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user_id, get_prompt_service
from app.schemas.prompts import ActivePromptsResponse, Prompt
from app.services.prompt_service import PromptService

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("/active", response_model=ActivePromptsResponse)
def list_active_prompts(
    _: str = Depends(get_current_user_id),
    service: PromptService = Depends(get_prompt_service),
) -> ActivePromptsResponse:
    prompts = service.list_active()
    return ActivePromptsResponse(items=[Prompt(**prompt) for prompt in prompts])


@router.get("/{prompt_id}", response_model=Prompt)
def get_prompt(
    prompt_id: str,
    _: str = Depends(get_current_user_id),
    service: PromptService = Depends(get_prompt_service),
) -> Prompt:
    prompt = service.get_by_id(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return Prompt(**prompt)
