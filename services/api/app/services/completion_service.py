from fastapi import HTTPException

from app.repositories.storage import DataStore


class CompletionService:
    def __init__(self, store: DataStore):
        self.store = store

    def create(self, user_id: str, payload: dict) -> dict:
        prompt = self.store.get_prompt(payload["prompt_id"])
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")

        return self.store.create_completion(
            user_id=user_id,
            payload=payload,
            prompt_title=prompt["title"],
            prompt_category=prompt.get("category"),
        )

    def list_history(self, user_id: str) -> list[dict]:
        return self.store.list_history(user_id)

    def get_completions_by_date_range(
        self, user_id: str, start_date: str, end_date: str, limit: int = 100, offset: int = 0
    ) -> list[dict]:
        return self.store.get_completions_by_date_range(
            user_id=user_id, start_date=start_date, end_date=end_date, limit=limit, offset=offset
        )

    def get_completion_by_id(self, user_id: str, completion_id: str) -> dict | None:
        """Get a single completion by ID."""
        return self.store.get_completion_by_id(user_id=user_id, completion_id=completion_id)
