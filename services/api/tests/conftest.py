import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_store
from app.main import app
from app.middleware.rate_limiter import rate_limiter
from app.repositories.storage import MemoryDataStore


TEST_STORE = MemoryDataStore()


@pytest.fixture(autouse=True)
def reset_memory_store() -> None:
    """Reset MemoryDataStore before each test to prevent data contamination."""
    MemoryDataStore.users_by_username.clear()
    MemoryDataStore.users_by_id.clear()
    MemoryDataStore.completions_by_user.clear()
    MemoryDataStore.friendships.clear()
    rate_limiter._requests.clear()
    MemoryDataStore.prompts_by_id["test-prompt-1"] = {
        "id": "test-prompt-1",
        "title": "Test Prompt",
        "description": "A prompt for integration tests",
        "category": "daily",
        "guidance": [],
        "active": True,
    }
    yield
    # Cleanup after test as well
    MemoryDataStore.users_by_username.clear()
    MemoryDataStore.users_by_id.clear()
    MemoryDataStore.completions_by_user.clear()
    MemoryDataStore.friendships.clear()
    rate_limiter._requests.clear()


@pytest.fixture()
def client() -> TestClient:
    app.dependency_overrides[get_store] = lambda: TEST_STORE
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client: TestClient) -> dict:
    """Get authentication headers for Alice."""
    # Register and login alice
    client.post("/api/v1/auth/register", json={
        "username": "alice",
        "password": "test123",
        "display_name": "Alice Wonder"
    })
    
    response = client.post("/api/v1/auth/login", json={
        "username": "alice",
        "password": "test123"
    })
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def auth_headers_bob(client: TestClient) -> dict:
    """Get authentication headers for Bob."""
    # Register and login bob
    client.post("/api/v1/auth/register", json={
        "username": "bob",
        "password": "test123",
        "display_name": "Bob Smith"
    })
    
    response = client.post("/api/v1/auth/login", json={
        "username": "bob",
        "password": "test123"
    })
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
