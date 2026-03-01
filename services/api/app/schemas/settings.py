from pydantic import BaseModel


class SettingsUpdateRequest(BaseModel):
    share_by_default: bool
