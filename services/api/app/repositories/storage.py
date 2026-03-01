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
    def seed_prompts(self, prompts: list[dict[str, Any]]) -> None:
        raise NotImplementedError


class MemoryDataStore(DataStore):
    users_by_username: dict[str, dict[str, Any]] = {}
    users_by_id: dict[str, dict[str, Any]] = {}
    prompts_by_id: dict[str, dict[str, Any]] = {}
    completions_by_user: dict[str, list[dict[str, Any]]] = {}

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

    def seed_prompts(self, prompts: list[dict[str, Any]]) -> None:
        for prompt in prompts:
            self.prompts_by_id[prompt["id"]] = prompt


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
