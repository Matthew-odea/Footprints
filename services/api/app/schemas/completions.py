from pydantic import BaseModel, Field


class CompletionCreateRequest(BaseModel):
    prompt_id: str
    note: str = Field(min_length=1, max_length=500)
    date: str
    location: str = Field(min_length=1, max_length=120)
    photo_url: str = ""
    share_with_friends: bool = True


class CompletionItem(BaseModel):
    completion_id: str
    prompt_id: str
    prompt_title: str
    note: str
    date: str
    location: str
    photo_url: str
    share_with_friends: bool


class CompletionCreateResponse(BaseModel):
    item: CompletionItem


class HistoryResponse(BaseModel):
    items: list[CompletionItem]
