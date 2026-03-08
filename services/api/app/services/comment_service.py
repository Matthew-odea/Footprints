from fastapi import HTTPException

from app.repositories.storage import DataStore


class CommentService:
    def __init__(self, store: DataStore):
        self.store = store

    def create(self, completion_id: str, user_id: str, payload: dict) -> dict:
        """Create a new comment on a completion."""
        user = self.store.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return self.store.create_comment(
            completion_id=completion_id,
            user_id=user_id,
            user_display_name=user.get("displayName", "Unknown"),
            payload=payload,
        )

    def list_comments(self, completion_id: str) -> list[dict]:
        """List all top-level comments for a completion."""
        return self.store.list_comments(completion_id=completion_id)

    def delete(self, completion_id: str, comment_id: str, user_id: str) -> bool:
        """Delete a comment (only owner can delete)."""
        return self.store.delete_comment(
            completion_id=completion_id, comment_id=comment_id, user_id=user_id
        )
