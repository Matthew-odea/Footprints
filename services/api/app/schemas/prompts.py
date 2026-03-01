from pydantic import BaseModel


class Prompt(BaseModel):
    id: str
    title: str
    description: str
    category: str
    guidance: list[str]
    active: bool


class ActivePromptsResponse(BaseModel):
    items: list[Prompt]
