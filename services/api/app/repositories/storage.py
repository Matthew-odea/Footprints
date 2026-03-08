from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import boto3
from boto3.dynamodb.conditions import Attr, Key

from app.core.config import Settings


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
    def get_feed(self, user_id: str, limit: int = 20, cursor: str | None = None) -> tuple[list[dict[str, Any]], str | None]:
        """Get feed items (completions from friends or all public completions for MVP)."""
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

    def create_completion(self, user_id: str, payload: dict[str, Any], prompt_title: str) -> dict[str, Any]:
        completion = {
            "completion_id": str(uuid4()),
            "prompt_id": payload["prompt_id"],
            "prompt_title": prompt_title,
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

    def get_feed(self, user_id: str, limit: int = 20, cursor: str | None = None) -> tuple[list[dict[str, Any]], str | None]:
        """Return all public completions (MVP version without friend filtering)."""
        all_completions = []
        for uid, completions in self.completions_by_user.items():
            for completion in completions:
                if completion.get("share_with_friends", True):
                    all_completions.append({
                        **completion,
                        "user_id": uid,
                        "user_display_name": self.users_by_id.get(uid, {}).get("display_name", "Unknown"),
                    })
        
        # Sort by created_at descending
        all_completions.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Simple pagination
        start = int(cursor) if cursor else 0
        items = all_completions[start:start + limit]
        next_cursor = str(start + limit) if start + limit < len(all_completions) else None
        
        return items, next_cursor

    def seed_prompts(self, prompts: list[dict[str, Any]]) -> None:
        for prompt in prompts:
            self.prompts_by_id[prompt["id"]] = prompt

    def seed_friends(self, friendships: list[tuple[str, str]]) -> None:
        """Seed sample friend relationships."""
        for user_id, friend_id in friendships:
            self._add_friendship(user_id, friend_id, "accepted")

    def add_friend(self, user_id: str, friend_username: str) -> dict[str, Any]:
        """Add a friend by username."""
        # Find friend by username
        friend = self.users_by_username.get(friend_username)
        if not friend:
            raise ValueError(f"User {friend_username} not found")

        friend_id = friend["user_id"]

        # Check if already friends
        existing = self._get_friendship(user_id, friend_id)
        if existing:
            return existing

        # Create new friendship
        friendship = {
            "friend_id": friend_id,
            "username": friend["username"],
            "display_name": friend["display_name"],
            "status": "accepted",
            "created_at": utc_now_iso(),
        }

        self.friendships.setdefault(user_id, []).append(friendship)

        return friendship

    def remove_friend(self, user_id: str, friend_id: str) -> bool:
        """Remove a friend."""
        friends = self.friendships.get(user_id, [])
        self.friendships[user_id] = [f for f in friends if f["friend_id"] != friend_id]
        return True

    def get_friends(self, user_id: str) -> list[dict[str, Any]]:
        """Get list of friends for a user."""
        return self.friendships.get(user_id, [])

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

    def _add_friendship(self, user_id: str, friend_id: str, status: str) -> None:
        """Internal helper to add friendship."""
        friend = self.users_by_id.get(friend_id)
        if not friend:
            return

        friendship = {
            "friend_id": friend_id,
            "username": friend["username"],
            "display_name": friend["display_name"],
            "status": status,
            "created_at": utc_now_iso(),
        }
        self.friendships.setdefault(user_id, []).append(friendship)

    def _get_friendship(self, user_id: str, friend_id: str) -> dict[str, Any] | None:
        """Internal helper to get friendship."""
        friends = self.friendships.get(user_id, [])
        return next((f for f in friends if f["friend_id"] == friend_id), None)


class DynamoDataStore(DataStore):
    def __init__(self, settings: Settings):
        self.settings = settings
        resource = boto3.resource("dynamodb", region_name=settings.aws_region)
        self.table = resource.Table(settings.api_dynamodb_table_core)

    def get_or_create_user(self, username: str) -> dict[str, Any]:
        lookup = self.table.get_item(
            Key={
                "PK": f"USERNAME#{username}",
                "SK": "LOOKUP",
            }
        ).get("Item")

        if lookup:
            return self.get_user(lookup["userId"]) or {}

        user_id = str(uuid4())
        now = utc_now_iso()

        profile = {
            "PK": f"USER#{user_id}",
            "SK": "PROFILE",
            "entityType": "USER_PROFILE",
            "userId": user_id,
            "username": username,
            "displayName": username,
            "createdAt": now,
            "updatedAt": now,
        }
        settings_item = {
            "PK": f"USER#{user_id}",
            "SK": "SETTINGS",
            "entityType": "USER_SETTINGS",
            "shareByDefault": True,
            "updatedAt": now,
        }
        stats_item = {
            "PK": f"USER#{user_id}",
            "SK": "STATS",
            "entityType": "USER_STATS",
            "completedCount": 0,
            "updatedAt": now,
        }
        lookup_item = {
            "PK": f"USERNAME#{username}",
            "SK": "LOOKUP",
            "entityType": "USERNAME_LOOKUP",
            "userId": user_id,
        }

        with self.table.batch_writer() as batch:
            batch.put_item(Item=profile)
            batch.put_item(Item=settings_item)
            batch.put_item(Item=stats_item)
            batch.put_item(Item=lookup_item)

        return {
            "user_id": user_id,
            "username": username,
            "display_name": username,
            "settings": {"share_by_default": True},
            "completed_count": 0,
        }

    def get_user(self, user_id: str) -> dict[str, Any] | None:
        profile = self.table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "PROFILE",
            }
        ).get("Item")
        if not profile:
            return None

        settings_item = self.table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "SETTINGS",
            }
        ).get("Item", {})
        stats_item = self.table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "STATS",
            }
        ).get("Item", {})

        return {
            "user_id": profile["userId"],
            "username": profile["username"],
            "display_name": profile.get("displayName", profile["username"]),
            "settings": {
                "share_by_default": settings_item.get("shareByDefault", True),
            },
            "completed_count": stats_item.get("completedCount", 0),
        }

    def update_user_settings(self, user_id: str, share_by_default: bool) -> dict[str, Any]:
        self.table.put_item(
            Item={
                "PK": f"USER#{user_id}",
                "SK": "SETTINGS",
                "entityType": "USER_SETTINGS",
                "shareByDefault": share_by_default,
                "updatedAt": utc_now_iso(),
            }
        )
        return self.get_user(user_id) or {}

    def list_active_prompts(self) -> list[dict[str, Any]]:
        response = self.table.scan(
            FilterExpression=Attr("entityType").eq("PROMPT") & Attr("active").eq(True)
        )
        items = response.get("Items", [])
        return [self._prompt_from_item(item) for item in items]

    def get_prompt(self, prompt_id: str) -> dict[str, Any] | None:
        item = self.table.get_item(
            Key={
                "PK": f"PROMPT#{prompt_id}",
                "SK": "META",
            }
        ).get("Item")
        if not item:
            return None
        return self._prompt_from_item(item)

    def create_completion(self, user_id: str, payload: dict[str, Any], prompt_title: str) -> dict[str, Any]:
        completion_id = str(uuid4())
        created_at = utc_now_iso()
        item = {
            "PK": f"USER#{user_id}",
            "SK": f"COMP#{created_at}#{completion_id}",
            "entityType": "COMPLETION",
            "completionId": completion_id,
            "promptId": payload["prompt_id"],
            "promptTitle": prompt_title,
            "note": payload["note"],
            "date": payload["date"],
            "location": payload["location"],
            "photoUrl": payload.get("photo_url", ""),
            "shareWithFriends": payload.get("share_with_friends", True),
            "createdAt": created_at,
            "GSI2PK": f"PROMPT#{payload['prompt_id']}",
            "GSI2SK": f"COMP#{created_at}#USER#{user_id}",
            "GSI3PK": f"COMPLETION#{completion_id}",
            "GSI3SK": "META",
        }
        self.table.put_item(Item=item)

        stats = self.table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "STATS",
            }
        ).get("Item", {"completedCount": 0})
        self.table.put_item(
            Item={
                "PK": f"USER#{user_id}",
                "SK": "STATS",
                "entityType": "USER_STATS",
                "completedCount": int(stats.get("completedCount", 0)) + 1,
                "updatedAt": utc_now_iso(),
            }
        )

        return {
            "completion_id": completion_id,
            "prompt_id": payload["prompt_id"],
            "prompt_title": prompt_title,
            "note": payload["note"],
            "date": payload["date"],
            "location": payload["location"],
            "photo_url": payload.get("photo_url", ""),
            "share_with_friends": payload.get("share_with_friends", True),
        }

    def list_history(self, user_id: str) -> list[dict[str, Any]]:
        response = self.table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("COMP#"),
            ScanIndexForward=False,
        )
        items = response.get("Items", [])
        return [
            {
                "completion_id": item["completionId"],
                "prompt_id": item["promptId"],
                "prompt_title": item["promptTitle"],
                "note": item["note"],
                "date": item["date"],
                "location": item["location"],
                "photo_url": item.get("photoUrl", ""),
                "share_with_friends": item.get("shareWithFriends", True),
            }
            for item in items
        ]

    def seed_prompts(self, prompts: list[dict[str, Any]]) -> None:
        with self.table.batch_writer() as batch:
            for prompt in prompts:
                batch.put_item(
                    Item={
                        "PK": f"PROMPT#{prompt['id']}",
                        "SK": "META",
                        "entityType": "PROMPT",
                        "id": prompt["id"],
                        "title": prompt["title"],
                        "description": prompt["description"],
                        "category": prompt["category"],
                        "guidance": prompt["guidance"],
                        "active": prompt["active"],
                        "GSI1PK": "PROMPTS#ACTIVE" if prompt["active"] else "PROMPTS#INACTIVE",
                        "GSI1SK": f"CAT#{prompt['category']}#PRI#050#PROMPT#{prompt['id']}",
                    }
                )

    def get_feed(self, user_id: str, limit: int = 20, cursor: str | None = None) -> tuple[list[dict[str, Any]], str | None]:
        """
        Get recent public completions for feed (MVP: all public completions).
        In production, would filter by friend relationships.
        """
        # Query all completions with share_with_friends=true, sorted by created_at
        response = self.table.scan(
            FilterExpression=Attr("entityType").eq("COMPLETION") & Attr("shareWithFriends").eq(True),
        )
        
        items = response.get("Items", [])
        
        # Convert items to feed format
        feed_items = [
            {
                "completion_id": item.get("completionId", ""),
                "user_id": item.get("userId", ""),
                "user_display_name": self._get_user_display_name(item.get("userId", "")),
                "prompt_id": item.get("promptId", ""),
                "prompt_title": item.get("promptTitle", ""),
                "photo_url": item.get("photoUrl", ""),
                "note": item.get("note", ""),
                "location": item.get("location", ""),
                "date": item.get("date", ""),
                "created_at": item.get("createdAt", ""),
            }
            for item in items
        ]
        
        # Sort by created_at descending
        feed_items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Pagination
        start = int(cursor) if cursor else 0
        paginated = feed_items[start:start + limit]
        next_cursor = str(start + limit) if start + limit < len(feed_items) else None
        
        return paginated, next_cursor

    def seed_friends(self, friendships: list[tuple[str, str]]) -> None:
        """Seed sample friend relationships for testing."""
        with self.table.batch_writer() as batch:
            for user_id, friend_id in friendships:
                batch.put_item(
                    Item={
                        "PK": f"USER#{user_id}",
                        "SK": f"FRIEND#{friend_id}",
                        "entityType": "FRIENDSHIP",
                        "status": "accepted",
                        "createdAt": utc_now_iso(),
                    }
                )

    def add_friend(self, user_id: str, friend_username: str) -> dict[str, Any]:
        """Add a friend by username."""
        # Look up user by username
        lookup_response = self.table.get_item(
            Key={"PK": f"USERNAME#{friend_username}", "SK": "LOOKUP"}
        )
        if "Item" not in lookup_response:
            raise ValueError(f"User {friend_username} not found")

        friend_id = lookup_response["Item"]["userId"]

        # Check if already friends
        existing = self.table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": f"FRIEND#{friend_id}"}
        )
        if "Item" in existing:
            return self._friendship_from_item(existing["Item"])

        # Get friend profile for display
        friend_response = self.table.get_item(
            Key={"PK": f"USER#{friend_id}", "SK": "PROFILE"}
        )
        friend_item = friend_response.get("Item", {})

        # Create new friendship
        friendship_item = {
            "PK": f"USER#{user_id}",
            "SK": f"FRIEND#{friend_id}",
            "entityType": "FRIENDSHIP",
            "status": "accepted",
            "createdAt": utc_now_iso(),
        }
        self.table.put_item(Item=friendship_item)

        return {
            "friend_id": friend_id,
            "username": friend_item.get("username", friend_username),
            "display_name": friend_item.get("displayName", friend_username),
            "status": "accepted",
            "created_at": utc_now_iso(),
        }

    def remove_friend(self, user_id: str, friend_id: str) -> bool:
        """Remove a friend."""
        self.table.delete_item(
            Key={"PK": f"USER#{user_id}", "SK": f"FRIEND#{friend_id}"}
        )
        return True

    def get_friends(self, user_id: str) -> list[dict[str, Any]]:
        """Get list of friends for a user."""
        response = self.table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("FRIEND#"),
            FilterExpression=Attr("entityType").eq("FRIENDSHIP"),
        )
        return [self._friendship_from_item(item) for item in response.get("Items", [])]

    def get_friend_status(self, user_id: str, friend_id: str) -> dict[str, Any] | None:
        """Get friendship status between two users."""
        response = self.table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": f"FRIEND#{friend_id}"}
        )
        if "Item" not in response:
            return None
        return self._friendship_from_item(response["Item"])

    def search_users(self, query: str, exclude_user_id: str | None = None) -> list[dict[str, Any]]:
        """Search for users by username or display name."""
        # For MVP, do a full table scan on PROFILE items
        # In production, would use a GSI for username prefix search
        response = self.table.scan(
            FilterExpression=Attr("entityType").eq("USER_PROFILE")
        )
        
        results = []
        query_lower = query.lower()

        for item in response.get("Items", []):
            user_id = item.get("userId")
            if exclude_user_id and user_id == exclude_user_id:
                continue

            username = item.get("username", "").lower()
            display_name = item.get("displayName", "").lower()

            if query_lower in username or query_lower in display_name:
                results.append({
                    "user_id": user_id,
                    "username": item.get("username"),
                    "display_name": item.get("displayName"),
                })

        return results

    def _friendship_from_item(self, item: dict[str, Any]) -> dict[str, Any]:
        """Convert DynamoDB item to friendship dict."""
        friend_id = item["SK"].replace("FRIEND#", "")
        friend = self.get_user(friend_id)
        return {
            "friend_id": friend_id,
            "username": friend.get("username", "") if friend else "",
            "display_name": friend.get("display_name", "") if friend else "",
            "status": item.get("status", "accepted"),
            "created_at": item.get("createdAt", ""),
        }

    def _get_user_display_name(self, user_id: str) -> str:
        """Helper to get user display name."""
        if not user_id:
            return "Unknown"
        user = self.get_user(user_id)
        return user.get("display_name", "Unknown") if user else "Unknown"

    @staticmethod
    def _prompt_from_item(item: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": item["id"],
            "title": item["title"],
            "description": item["description"],
            "category": item["category"],
            "guidance": item.get("guidance", []),
            "active": item.get("active", False),
        }
