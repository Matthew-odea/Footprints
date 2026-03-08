"""Upload-related Pydantic schemas."""

from pydantic import BaseModel, Field


class UploadUrlRequest(BaseModel):
    """Request for presigned S3 upload URL."""
    file_type: str = Field(
        ...,
        description="MIME type: image/jpeg, image/png, or image/webp"
    )


class UploadUrlResponse(BaseModel):
    """Presigned S3 POST URL for client upload."""
    upload_url: str = Field(..., description="S3 endpoint for POST")
    upload_fields: dict[str, str] = Field(..., description="Form fields to include in POST")
    s3_key: str = Field(..., description="Final S3 key where photo will be stored")
