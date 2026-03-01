from pydantic import BaseModel


class UserProfile(BaseModel):
    user_id: str
    username: str
    display_name: str


class UserSettings(BaseModel):
    share_by_default: bool = True


class UserResponse(BaseModel):
    profile: UserProfile
    settings: UserSettings
    completed_count: int
