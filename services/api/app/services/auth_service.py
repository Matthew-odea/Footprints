from app.core.security import create_access_token
from app.repositories.storage import DataStore


class AuthService:
    def __init__(self, store: DataStore):
        self.store = store

    def login(self, username: str) -> str:
        user = self.store.get_or_create_user(username=username)
        return create_access_token(subject=user["user_id"])
