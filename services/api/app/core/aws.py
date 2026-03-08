"""AWS service initialization and clients."""

from functools import lru_cache

import boto3

from . config import get_settings


class S3Service:
    """S3 client for managing completions photos."""

    def __init__(self, bucket_name: str, region: str = "us-east-1"):
        self.bucket_name = bucket_name
        self.region = region
        self.client = boto3.client("s3", region_name=region)

    def generate_presigned_post_url(
        self,
        user_id: str,
        file_extension: str,
        expiration: int = 900,  # 15 minutes
    ) -> dict:
        """
        Generate presigned POST URL for direct client uploads to S3.
        
        Returns dict with:
        - url: S3 endpoint
        - fields: Form fields for POST request
        - s3_key: Full S3 path where file will be stored
        """
        from uuid import uuid4
        
        s3_key = f"completions/{user_id}/{uuid4()}.{file_extension}"
        
        try:
            response = self.client.generate_presigned_post(
                Bucket=self.bucket_name,
                Key=s3_key,
                Fields={
                    "acl": "private",
                    "Content-Type": "image/*",
                },
                Conditions=[
                    ["content-length-range", 0, 5242880],  # 5MB max
                    {"acl": "private"},
                    {"Content-Type": ["image/jpeg", "image/png", "image/webp"]},
                ],
                ExpirationInSeconds=expiration,
            )
            
            return {
                "upload_url": response["url"],
                "upload_fields": response["fields"],
                "s3_key": s3_key,
            }
        except Exception as e:
            raise Exception(f"Failed to generate presigned URL: {str(e)}")

    def get_object_url(self, s3_key: str, expiration: int = 3600) -> str:
        """Generate presigned GET URL for reading photos."""
        try:
            url = self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": s3_key},
                ExpiresIn=expiration,
            )
            return url
        except Exception as e:
            raise Exception(f"Failed to generate read URL: {str(e)}")


@lru_cache
def get_s3_service() -> S3Service:
    """Get singleton S3 service."""
    settings = get_settings()
    if not settings.api_s3_bucket:
        raise ValueError("S3_BUCKET not configured")
    return S3Service(
        bucket_name=settings.api_s3_bucket,
        region=settings.aws_region,
    )
