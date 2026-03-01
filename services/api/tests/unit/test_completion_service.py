from app.repositories.storage import MemoryDataStore
from app.services.completion_service import CompletionService


def test_create_completion_and_history_round_trip() -> None:
    store = MemoryDataStore()
    user = store.get_or_create_user("tester")
    store.seed_prompts(
        [
            {
                "id": "prompt-1",
                "title": "Plant tree",
                "description": "desc",
                "category": "environment",
                "guidance": [],
                "active": True,
            }
        ]
    )

    service = CompletionService(store=store)
    created = service.create(
        user_id=user["user_id"],
        payload={
            "prompt_id": "prompt-1",
            "note": "done",
            "date": "2026-03-01",
            "location": "Melbourne",
            "photo_url": "s3://bucket/completions/test.jpg",
            "share_with_friends": True,
        },
    )

    assert created["prompt_id"] == "prompt-1"

    history = service.list_history(user_id=user["user_id"])
    assert len(history) == 1
    assert history[0]["completion_id"] == created["completion_id"]
