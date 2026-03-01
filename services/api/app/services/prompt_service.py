from app.repositories.storage import DataStore


class PromptService:
    def __init__(self, store: DataStore):
        self.store = store

    def list_active(self) -> list[dict]:
        return self.store.list_active_prompts()

    def get_by_id(self, prompt_id: str) -> dict | None:
        return self.store.get_prompt(prompt_id)
