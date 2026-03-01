from fastapi import APIRouter, Depends

from app.dependencies import get_auth_service
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, service: AuthService = Depends(get_auth_service)) -> TokenResponse:
    token = service.login(username=payload.username)
    return TokenResponse(access_token=token)
