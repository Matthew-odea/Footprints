"""Upload endpoints for requesting presigned S3 URLs."""

from fastapi import APIRouter, Depends

from app.core.aws import get_s3_service, S3Service
from app.dependencies import get_current_user
from app.schemas.uploads import UploadUrlRequest, UploadUrlResponse

router = APIRouter()


@router.post("", response_model=UploadUrlResponse)
async def request_upload_url(
    request: UploadUrlRequest,
    current_user: dict = Depends(get_current_user),
    s3: S3Service = Depends(get_s3_service),
) -> UploadUrlResponse:
    """
    Request a presigned S3 POST URL for uploading a completion photo.
    
    Client receives upload_url and upload_fields to POST file directly to S3.
    Returns s3_key for use in completion submission.
    """
    # Validate file type
    valid_types = {"image/jpeg", "image/png", "image/webp"}
    if request.file_type not in valid_types:
        raise ValueError(f"Invalid file type. Allowed: {valid_types}")
    
    # Extract file extension
    ext_map = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }
    file_ext = ext_map[request.file_type]
    
    # Generate presigned URL
    user_id = current_user["user_id"]
    presigned = s3.generate_presigned_post_url(user_id, file_ext)
    
    return UploadUrlResponse(
        upload_url=presigned["upload_url"],
        upload_fields=presigned["upload_fields"],
        s3_key=presigned["s3_key"],
    )
