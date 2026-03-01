import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repositories.storage import MemoryDataStore


@pytest.fixture(autouse=True)
def reset_memory_store() -> None:
    MemoryDataStore.users_by_username = {}
    MemoryDataStore.users_by_id = {}
    MemoryDataStore.prompts_by_id = {}
    MemoryDataStore.completions_by_user = {}


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client
