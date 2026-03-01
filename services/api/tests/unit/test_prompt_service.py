from app.repositories.storage import MemoryDataStore
from app.services.prompt_service import PromptService


def test_list_active_prompts_filters_active_items() -> None:
    store = MemoryDataStore()
    store.seed_prompts(
        [
            {
                "id": "p1",
                "title": "A",
                "description": "A",
                "category": "c",
                "guidance": [],
                "active": True,
            },
            {
                "id": "p2",
                "title": "B",
                "description": "B",
                "category": "c",
                "guidance": [],
                "active": False,
            },
        ]
    )

    service = PromptService(store=store)
    items = service.list_active()

    assert len(items) == 1
    assert items[0]["id"] == "p1"
