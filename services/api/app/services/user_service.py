from fastapi import HTTPException

from app.repositories.storage import DataStore


class UserService:
    def __init__(self, store: DataStore):
        self.store = store

    def get_me(self, user_id: str) -> dict:
        user = self.store.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def update_settings(self, user_id: str, share_by_default: bool) -> dict:
        user = self.store.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return self.store.update_user_settings(user_id=user_id, share_by_default=share_by_default)
