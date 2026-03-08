from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any


def utc_now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


class DataStore(ABC):
    @abstractmethod
    def get_or_create_user(self, username: str) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def get_user(self, user_id: str) -> dict[str, Any] | None:
        raise NotImplementedError

    @abstractmethod
    def update_user_settings(self, user_id: str, share_by_default: bool) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def list_active_prompts(self) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def get_prompt(self, prompt_id: str) -> dict[str, Any] | None:
        raise NotImplementedError

    @abstractmethod
    def create_completion(self, user_id: str, payload: dict[str, Any], prompt_title: str) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def list_history(self, user_id: str) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def get_feed(
        self,
        user_id: str,
        limit: int = 20,
        cursor: str | None = None,
        scope: str = "all",
    ) -> tuple[list[dict[str, Any]], str | None, int]:
        """Get feed items (completions from friends or all public completions for MVP). Returns (items, next_cursor, total_count)."""
        raise NotImplementedError

    @abstractmethod
    def seed_prompts(self, prompts: list[dict[str, Any]]) -> None:
        raise NotImplementedError

    @abstractmethod
    def seed_friends(self, friendships: list[tuple[str, str]]) -> None:
        """Seed sample friend relationships for testing."""
        raise NotImplementedError

    @abstractmethod
    def add_friend(self, user_id: str, friend_username: str) -> dict[str, Any]:
        """Add a friend (creates friendship with pending/accepted status)."""
        raise NotImplementedError

    @abstractmethod
    def remove_friend(self, user_id: str, friend_id: str) -> bool:
        """Remove a friend (soft delete or mark as removed)."""
        raise NotImplementedError

    @abstractmethod
    def get_friends(self, user_id: str) -> list[dict[str, Any]]:
        """Get list of friends for a user."""
        raise NotImplementedError

    @abstractmethod
    def get_friend_status(self, user_id: str, friend_id: str) -> dict[str, Any] | None:
        """Get friendship status between two users."""
        raise NotImplementedError

    @abstractmethod
    def search_users(self, query: str, exclude_user_id: str | None = None) -> list[dict[str, Any]]:
        """Search for users by username or display name."""
        raise NotImplementedError


    @abstractmethod
    def get_incoming_requests(self, user_id: str) -> list[dict[str, Any]]:
        """Get list of incoming friend requests for a user."""
        raise NotImplementedError

    @abstractmethod
    def get_outgoing_requests(self, user_id: str) -> list[dict[str, Any]]:
        """Get list of outgoing friend requests from a user."""
        raise NotImplementedError

    @abstractmethod
    def accept_friend_request(self, user_id: str, request_id: str) -> dict[str, Any]:
        """Accept an incoming friend request."""
        raise NotImplementedError

    @abstractmethod
    def reject_friend_request(self, user_id: str, request_id: str) -> None:
        """Reject an incoming friend request."""
        raise NotImplementedError
