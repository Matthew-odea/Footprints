from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.repositories.storage_base import DataStore, utc_now_iso


class MemoryDataStore(DataStore):
    users_by_username: dict[str, dict[str, Any]] = {}
    users_by_id: dict[str, dict[str, Any]] = {}
    prompts_by_id: dict[str, dict[str, Any]] = {}
    completions_by_user: dict[str, list[dict[str, Any]]] = {}
    friendships: dict[str, list[dict[str, Any]]] = {}

    def get_or_create_user(self, username: str) -> dict[str, Any]:
        existing = self.users_by_username.get(username)
        if existing:
            return existing

        user_id = str(uuid4())
        user = {
            "user_id": user_id,
            "username": username,
            "display_name": username,
            "settings": {
                "share_by_default": True,
            },
            "completed_count": 0,
        }
        self.users_by_username[username] = user
        self.users_by_id[user_id] = user
        self.completions_by_user.setdefault(user_id, [])
        return user

    def get_user(self, user_id: str) -> dict[str, Any] | None:
        return self.users_by_id.get(user_id)

    def update_user_settings(self, user_id: str, share_by_default: bool) -> dict[str, Any]:
        user = self.users_by_id[user_id]
        user["settings"] = {"share_by_default": share_by_default}
        return user

    def list_active_prompts(self) -> list[dict[str, Any]]:
        return [prompt for prompt in self.prompts_by_id.values() if prompt.get("active", False)]

    def get_prompt(self, prompt_id: str) -> dict[str, Any] | None:
        return self.prompts_by_id.get(prompt_id)

    def create_completion(
        self,
        user_id: str,
        payload: dict[str, Any],
        prompt_title: str,
        prompt_category: str | None = None,
    ) -> dict[str, Any]:
        completion = {
            "completion_id": str(uuid4()),
            "prompt_id": payload["prompt_id"],
            "prompt_title": prompt_title,
            "category": prompt_category,
            "note": payload["note"],
            "date": payload["date"],
            "location": payload["location"],
            "photo_url": payload.get("photo_url", ""),
            "share_with_friends": payload.get("share_with_friends", True),
            "created_at": utc_now_iso(),
        }
        self.completions_by_user.setdefault(user_id, []).append(completion)
        user = self.users_by_id[user_id]
        user["completed_count"] = user.get("completed_count", 0) + 1
        return completion

    def list_history(self, user_id: str) -> list[dict[str, Any]]:
        items = self.completions_by_user.get(user_id, [])
        return list(reversed(items))

    def get_completions_by_date_range(
        self,
        user_id: str,
        start_date: str,
        end_date: str,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get completions within a date range with pagination."""
        items = self.completions_by_user.get(user_id, [])
        
        # Filter by date range (inclusive)
        filtered = [
            item for item in items
            if start_date <= item.get("date", "") <= end_date
        ]
        
        # Sort by date descending (most recent first)
        sorted_items = sorted(filtered, key=lambda x: x.get("date", ""), reverse=True)
        
        # Apply pagination
        start_idx = offset
        end_idx = offset + limit
        paginated = sorted_items[start_idx:end_idx]
        
        return paginated

    def get_feed(
        self,
        user_id: str,
        limit: int = 20,
        cursor: str | None = None,
        scope: str = "all",
    ) -> tuple[list[dict[str, Any]], str | None, int]:
        """Return public completions with optional friends-only filtering."""
        friend_ids = {
            item["friend_id"]
            for item in self.friendships.get(user_id, [])
            if item.get("status") == "accepted"
        }

        all_completions = []
        for uid, completions in self.completions_by_user.items():
            if scope == "friends" and uid not in friend_ids:
                continue
            for completion in completions:
                if completion.get("share_with_friends", True):
                    all_completions.append({
                        **completion,
                        "user_id": uid,
                        "user_username": self.users_by_id.get(uid, {}).get("username", "Unknown"),
                        "user_display_name": self.users_by_id.get(uid, {}).get("display_name", "Unknown"),
                    })
        
        # Sort by created_at descending
        all_completions.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Simple pagination
        start = int(cursor) if cursor else 0
        items = all_completions[start:start + limit]
        next_cursor = str(start + limit) if start + limit < len(all_completions) else None
        total = len(all_completions)
        
        return items, next_cursor, total

    def seed_prompts(self, prompts: list[dict[str, Any]]) -> None:
        for prompt in prompts:
            self.prompts_by_id[prompt["id"]] = prompt

    def seed_friends(self, friendships: list[tuple[str, str]]) -> None:
        """Seed sample friend relationships."""
        for user_id, friend_id in friendships:
            self._add_friendship(user_id, friend_id, "accepted")

    def add_friend(self, user_id: str, friend_username: str) -> dict[str, Any]:
        """Send a friend request (creates pending friendship)."""
        friend = self.users_by_username.get(friend_username)
        if not friend:
            raise ValueError(f"User {friend_username} not found")

        friend_id = friend["user_id"]

        existing = self._get_friendship(user_id, friend_id)
        if existing:
            return existing

        request_id = str(uuid4())
        created_at = utc_now_iso()
        friendship = {
            "request_id": request_id,
            "friend_id": friend_id,
            "username": friend["username"],
            "display_name": friend["display_name"],
            "status": "pending",
            "requested_by": user_id,
            "created_at": created_at,
        }
        self.friendships.setdefault(user_id, []).append(friendship)

        incoming_friendship = {
            "request_id": request_id,
            "friend_id": user_id,
            "username": self.users_by_id[user_id]["username"],
            "display_name": self.users_by_id[user_id]["display_name"],
            "status": "pending",
            "requested_by": user_id,
            "created_at": created_at,
        }
        self.friendships.setdefault(friend_id, []).append(incoming_friendship)

        return friendship

    def remove_friend(self, user_id: str, friend_id: str) -> bool:
        """Remove a friend."""
        friends = self.friendships.get(user_id, [])
        self.friendships[user_id] = [f for f in friends if f["friend_id"] != friend_id]
        return True

    def get_friends(self, user_id: str) -> list[dict[str, Any]]:
        """Get list of accepted friends for a user."""
        all_friendships = self.friendships.get(user_id, [])
        return [f for f in all_friendships if f.get("status") == "accepted"]

    def get_friend_status(self, user_id: str, friend_id: str) -> dict[str, Any] | None:
        """Get friendship status between two users."""
        return self._get_friendship(user_id, friend_id)

    def search_users(self, query: str, exclude_user_id: str | None = None) -> list[dict[str, Any]]:
        """Search for users by username or display name."""
        results = []
        query_lower = query.lower()

        for user in self.users_by_id.values():
            if exclude_user_id and user["user_id"] == exclude_user_id:
                continue

            if (
                query_lower in user["username"].lower()
                or query_lower in user["display_name"].lower()
            ):
                results.append({
                    "user_id": user["user_id"],
                    "username": user["username"],
                    "display_name": user["display_name"],
                })

        return results

    def get_incoming_requests(self, user_id: str) -> list[dict[str, Any]]:
        """Get list of incoming friend requests for a user."""
        all_friendships = self.friendships.get(user_id, [])
        return [
            f for f in all_friendships
            if f.get("status") == "pending" and f.get("requested_by") != user_id
        ]

    def get_outgoing_requests(self, user_id: str) -> list[dict[str, Any]]:
        """Get list of outgoing friend requests from a user."""
        all_friendships = self.friendships.get(user_id, [])
        return [
            f for f in all_friendships
            if f.get("status") == "pending" and f.get("requested_by") == user_id
        ]

    def accept_friend_request(self, user_id: str, request_id: str) -> dict[str, Any]:
        """Accept an incoming friend request."""
        all_friendships = self.friendships.get(user_id, [])
        request = next((f for f in all_friendships if f.get("request_id") == request_id), None)
        
        if not request:
            raise ValueError(f"Friend request {request_id} not found")
        
        if request.get("requested_by") == user_id:
            raise ValueError("Cannot accept your own friend request")
        
        if request.get("status") != "pending":
            raise ValueError(f"Friend request is not pending")
        
        # Update status to accepted
        request["status"] = "accepted"
        request["accepted_at"] = utc_now_iso()
        
        # Update in requester's list too
        requester_id = request["requested_by"]
        requester_friendships = self.friendships.get(requester_id, [])
        requester_request = next((f for f in requester_friendships if f.get("request_id") == request_id), None)
        if requester_request:
            requester_request["status"] = "accepted"
            requester_request["accepted_at"] = utc_now_iso()
        
        return request

    def reject_friend_request(self, user_id: str, request_id: str) -> None:
        """Reject an incoming friend request."""
        all_friendships = self.friendships.get(user_id, [])
        request = next((f for f in all_friendships if f.get("request_id") == request_id), None)
        
        if not request:
            raise ValueError(f"Friend request {request_id} not found")
        
        if request.get("requested_by") == user_id:
            raise ValueError("Cannot reject your own friend request")
        
        if request.get("status") != "pending":
            raise ValueError(f"Friend request is not pending")
        
        # Remove from both users' lists
        self.friendships[user_id] = [f for f in all_friendships if f.get("request_id") != request_id]
        
        requester_id = request["requested_by"]
        if requester_id in self.friendships:
            requester_friendships = self.friendships[requester_id]
            self.friendships[requester_id] = [f for f in requester_friendships if f.get("request_id") != request_id]

    def _add_friendship(self, user_id: str, friend_id: str, status: str) -> None:
        """Internal helper to add friendship."""
        friend = self.users_by_id.get(friend_id)
        if not friend:
            return

        request_id = str(uuid4())
        friendship = {
            "request_id": request_id,
            "friend_id": friend_id,
            "username": friend["username"],
            "display_name": friend["display_name"],
            "status": status,
            "requested_by": user_id,
            "created_at": utc_now_iso(),
        }
        self.friendships.setdefault(user_id, []).append(friendship)

    def _get_friendship(self, user_id: str, friend_id: str) -> dict[str, Any] | None:
        """Internal helper to get friendship."""
        friends = self.friendships.get(user_id, [])
        return next((f for f in friends if f["friend_id"] == friend_id), None)
