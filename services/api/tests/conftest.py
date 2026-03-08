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
    MemoryDataStore.friendships.clear()
    yield
    # Cleanup after test as well
    MemoryDataStore.users_by_username.clear()
    MemoryDataStore.users_by_id.clear()
    MemoryDataStore.prompts_by_id.clear()
    MemoryDataStore.completions_by_user.clear()
    MemoryDataStore.friendships.clear()


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


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
