import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repositories.storage import MemoryDataStore


@pytest.fixture(autouse=True)
def reset_memory_store() -> None:
    """Reset MemoryDataStore before each test to prevent data contamination."""
    MemoryDataStore.users_by_username.clear()
    MemoryDataStore.users_by_id.clear()
    MemoryDataStore.prompts_by_id.clear()
    MemoryDataStore.completions_by_user.clear()
    yield
    # Cleanup after test as well
    MemoryDataStore.users_by_username.clear()
    MemoryDataStore.users_by_id.clear()
    MemoryDataStore.prompts_by_id.clear()
    MemoryDataStore.completions_by_user.clear()


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client
