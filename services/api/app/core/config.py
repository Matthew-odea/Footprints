from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Footprints API"
    environment: str = "dev"
    api_prefix: str = "/api/v1"
    jwt_secret: str = "change-me"
    jwt_secret_name: str = ""
    jwt_algorithm: str = "HS256"
    jwt_exp_minutes: int = 60 * 24

    storage_backend: str = "memory"

    aws_region: str = "us-east-1"
    api_dynamodb_table_core: str = "footprints_core"
    api_s3_bucket: str = ""
    api_s3_completions_prefix: str = "completions/"


@lru_cache
def get_settings() -> Settings:
    return Settings()
