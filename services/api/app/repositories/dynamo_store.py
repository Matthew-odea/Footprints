from __future__ import annotations

from typing import Any
from uuid import uuid4

import boto3
from boto3.dynamodb.conditions import Attr, Key

from app.core.config import Settings
from app.repositories.storage_base import DataStore, utc_now_iso


class DynamoDataStore(DataStore):
    def __init__(self, settings: Settings):
        self.settings = settings
        self._table = None
        self._resource = None

    @property
    def table(self):
        """Lazy load DynamoDB table on first access."""
        if self._table is None:
            try:
                self._resource = boto3.resource("dynamodb", region_name=self.settings.aws_region)
                self._table = self._resource.Table(self.settings.api_dynamodb_table_core)
            except Exception as e:
                raise RuntimeError(
                    f"Failed to connect to DynamoDB table '{self.settings.api_dynamodb_table_core}'. "
                    f"Ensure DynamoDB is running and AWS credentials are configured. "
                    f"For development, use STORAGE_BACKEND=memory in .env. Error: {e}"
                ) from e
        return self._table

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

    def create_completion(
        self,
        user_id: str,
        payload: dict[str, Any],
        prompt_title: str,
        prompt_category: str | None = None,
    ) -> dict[str, Any]:
        completion_id = str(uuid4())
        created_at = utc_now_iso()
        item = {
            "PK": f"USER#{user_id}",
            "SK": f"COMP#{created_at}#{completion_id}",
            "entityType": "COMPLETION",
            "userId": user_id,
            "completionId": completion_id,
            "promptId": payload["prompt_id"],
            "promptTitle": prompt_title,
            "category": prompt_category,
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
            "category": prompt_category,
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
                "category": item.get("category"),
                "note": item["note"],
                "date": item["date"],
                "location": item["location"],
                "photo_url": item.get("photoUrl", ""),
                "share_with_friends": item.get("shareWithFriends", True),
            }
            for item in items
        ]

    def get_completions_by_date_range(
        self,
        user_id: str,
        start_date: str,
        end_date: str,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get completions within a date range with pagination."""
        # DynamoDB applies FilterExpression after reading, so we page until we have enough filtered records.
        target_count = offset + limit
        filtered_items: list[dict[str, Any]] = []
        last_evaluated_key = None

        while len(filtered_items) < target_count:
            query_params: dict[str, Any] = {
                "KeyConditionExpression": Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("COMP#"),
                "FilterExpression": Attr("date").between(start_date, end_date),
                "ScanIndexForward": False,
                "Limit": max(limit, 25),
            }
            if last_evaluated_key:
                query_params["ExclusiveStartKey"] = last_evaluated_key

            response = self.table.query(**query_params)
            filtered_items.extend(response.get("Items", []))
            last_evaluated_key = response.get("LastEvaluatedKey")
            if not last_evaluated_key:
                break

        transformed = [
            {
                "completion_id": item["completionId"],
                "prompt_id": item["promptId"],
                "prompt_title": item["promptTitle"],
                "category": item.get("category"),
                "note": item["note"],
                "date": item["date"],
                "location": item["location"],
                "photo_url": item.get("photoUrl", ""),
                "share_with_friends": item.get("shareWithFriends", True),
            }
            for item in filtered_items
        ]

        return transformed[offset : offset + limit]

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

    def get_feed(
        self,
        user_id: str,
        limit: int = 20,
        cursor: str | None = None,
        scope: str = "all",
    ) -> tuple[list[dict[str, Any]], str | None, int]:
        """
        Get recent public completions for feed (MVP: all public completions).
        In production, would filter by friend relationships.
        """
        # Query all completions with share_with_friends=true, sorted by created_at
        response = self.table.scan(
            FilterExpression=Attr("entityType").eq("COMPLETION") & Attr("shareWithFriends").eq(True),
        )
        
        items = response.get("Items", [])

        if scope == "friends":
            friends_response = self.table.query(
                KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("FRIEND#"),
                FilterExpression=Attr("entityType").eq("FRIENDSHIP") & Attr("status").eq("accepted"),
            )
            friend_ids = {
                item.get("SK", "").replace("FRIEND#", "")
                for item in friends_response.get("Items", [])
            }
            def completion_user_id(entry: dict[str, Any]) -> str:
                direct = entry.get("userId", "")
                if direct:
                    return str(direct)
                pk = str(entry.get("PK", ""))
                return pk.replace("USER#", "") if pk.startswith("USER#") else ""

            items = [item for item in items if completion_user_id(item) in friend_ids]
        
        # Convert items to feed format
        feed_items = []
        for item in items:
            user_id_for_item = item.get("userId", "")
            if not user_id_for_item:
                pk = str(item.get("PK", ""))
                if pk.startswith("USER#"):
                    user_id_for_item = pk.replace("USER#", "")

            user_obj = self.get_user(user_id_for_item)
            feed_items.append(
                {
                    "completion_id": item.get("completionId", ""),
                    "user_id": user_id_for_item,
                    "user_username": user_obj.get("username", "Unknown") if user_obj else "Unknown",
                    "user_display_name": user_obj.get("display_name", "Unknown") if user_obj else "Unknown",
                    "prompt_id": item.get("promptId", ""),
                    "prompt_title": item.get("promptTitle", ""),
                    "photo_url": item.get("photoUrl", ""),
                    "note": item.get("note", ""),
                    "location": item.get("location", ""),
                    "date": item.get("date", ""),
                    "created_at": item.get("createdAt", ""),
                }
            )
        
        # Sort by created_at descending
        feed_items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Pagination
        start = int(cursor) if cursor else 0
        paginated = feed_items[start:start + limit]
        next_cursor = str(start + limit) if start + limit < len(feed_items) else None
        total = len(feed_items)
        
        return paginated, next_cursor, total

    def seed_friends(self, friendships: list[tuple[str, str]]) -> None:
        """Seed sample friend relationships for testing."""
        with self.table.batch_writer() as batch:
            for user_id, friend_id in friendships:
                request_id = str(uuid4())
                created_at = utc_now_iso()
                batch.put_item(
                    Item={
                        "PK": f"USER#{user_id}",
                        "SK": f"FRIEND#{friend_id}",
                        "entityType": "FRIENDSHIP",
                        "requestId": request_id,
                        "requestedBy": user_id,
                        "status": "accepted",
                        "createdAt": created_at,
                    }
                )
                batch.put_item(
                    Item={
                        "PK": f"USER#{friend_id}",
                        "SK": f"FRIEND#{user_id}",
                        "entityType": "FRIENDSHIP",
                        "requestId": request_id,
                        "requestedBy": user_id,
                        "status": "accepted",
                        "createdAt": created_at,
                    }
                )

    def add_friend(self, user_id: str, friend_username: str) -> dict[str, Any]:
        """Send a friend request (creates pending friendship)."""
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

        # Create new pending friendship (both directions)
        request_id = str(uuid4())
        created_at = utc_now_iso()
        friendship_item = {
            "PK": f"USER#{user_id}",
            "SK": f"FRIEND#{friend_id}",
            "entityType": "FRIENDSHIP",
            "requestId": request_id,
            "requestedBy": user_id,
            "status": "pending",
            "createdAt": created_at,
        }
        self.table.put_item(Item=friendship_item)
        reverse_friendship_item = {
            "PK": f"USER#{friend_id}",
            "SK": f"FRIEND#{user_id}",
            "entityType": "FRIENDSHIP",
            "requestId": request_id,
            "requestedBy": user_id,
            "status": "pending",
            "createdAt": created_at,
        }
        self.table.put_item(Item=reverse_friendship_item)
        return {
            "request_id": request_id,
            "friend_id": friend_id,
            "username": friend_item.get("username", friend_username),
            "display_name": friend_item.get("displayName", friend_username),
            "status": "pending",
            "requested_by": user_id,
            "created_at": created_at,
        }

    def remove_friend(self, user_id: str, friend_id: str) -> bool:
        """Remove a friend."""
        self.table.delete_item(
            Key={"PK": f"USER#{user_id}", "SK": f"FRIEND#{friend_id}"}
        )
        self.table.delete_item(
            Key={"PK": f"USER#{friend_id}", "SK": f"FRIEND#{user_id}"}
        )
        return True

    def get_friends(self, user_id: str) -> list[dict[str, Any]]:
        """Get list of accepted friends for a user."""
        response = self.table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("FRIEND#"),
            FilterExpression=Attr("entityType").eq("FRIENDSHIP") & Attr("status").eq("accepted"),
        )
        return [self._friendship_from_item(item) for item in response.get("Items", [])]

    def get_incoming_requests(self, user_id: str) -> list[dict[str, Any]]:
        """Get list of incoming friend requests for a user."""
        response = self.table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("FRIEND#"),
            FilterExpression=Attr("entityType").eq("FRIENDSHIP")
            & Attr("status").eq("pending")
            & Attr("requestedBy").ne(user_id),
        )
        return [self._friendship_from_item(item) for item in response.get("Items", [])]

    def get_outgoing_requests(self, user_id: str) -> list[dict[str, Any]]:
        """Get list of outgoing friend requests from a user."""
        response = self.table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("FRIEND#"),
            FilterExpression=Attr("entityType").eq("FRIENDSHIP")
            & Attr("status").eq("pending")
            & Attr("requestedBy").eq(user_id),
        )
        return [self._friendship_from_item(item) for item in response.get("Items", [])]

    def accept_friend_request(self, user_id: str, request_id: str) -> dict[str, Any]:
        """Accept an incoming friend request."""
        response = self.table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("FRIEND#"),
            FilterExpression=Attr("requestId").eq(request_id),
        )
        items = response.get("Items", [])
        if not items:
            raise ValueError(f"Friend request {request_id} not found")

        request_item = items[0]
        if request_item.get("requestedBy") == user_id:
            raise ValueError("Cannot accept your own friend request")
        if request_item.get("status") != "pending":
            raise ValueError("Friend request is not pending")

        friend_id = request_item["SK"].replace("FRIEND#", "")
        requester_id = request_item["requestedBy"]
        accepted_at = utc_now_iso()

        self.table.update_item(
            Key={"PK": f"USER#{user_id}", "SK": f"FRIEND#{friend_id}"},
            UpdateExpression="SET #status = :accepted, acceptedAt = :timestamp",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={":accepted": "accepted", ":timestamp": accepted_at},
        )
        self.table.update_item(
            Key={"PK": f"USER#{requester_id}", "SK": f"FRIEND#{user_id}"},
            UpdateExpression="SET #status = :accepted, acceptedAt = :timestamp",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={":accepted": "accepted", ":timestamp": accepted_at},
        )

        result = self._friendship_from_item(request_item)
        result["status"] = "accepted"
        result["accepted_at"] = accepted_at
        return result

    def reject_friend_request(self, user_id: str, request_id: str) -> None:
        """Reject an incoming friend request."""
        response = self.table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("FRIEND#"),
            FilterExpression=Attr("requestId").eq(request_id),
        )
        items = response.get("Items", [])
        if not items:
            raise ValueError(f"Friend request {request_id} not found")

        request_item = items[0]
        if request_item.get("requestedBy") == user_id:
            raise ValueError("Cannot reject your own friend request")
        if request_item.get("status") != "pending":
            raise ValueError("Friend request is not pending")

        friend_id = request_item["SK"].replace("FRIEND#", "")
        requester_id = request_item["requestedBy"]
        self.table.delete_item(Key={"PK": f"USER#{user_id}", "SK": f"FRIEND#{friend_id}"})
        self.table.delete_item(Key={"PK": f"USER#{requester_id}", "SK": f"FRIEND#{user_id}"})

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
            "request_id": item.get("requestId", ""),
            "friend_id": friend_id,
            "username": friend.get("username", "") if friend else "",
            "display_name": friend.get("display_name", "") if friend else "",
            "status": item.get("status", "accepted"),
            "requested_by": item.get("requestedBy", ""),
            "accepted_at": item.get("acceptedAt", ""),
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
