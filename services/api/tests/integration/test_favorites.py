"""Integration tests for favorites endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_store
from app.repositories.memory_store import MemoryDataStore

TEST_STORE = MemoryDataStore()


@pytest.fixture()
def client():
    """Get a FastAPI test client with in-memory storage."""
    app.dependency_overrides[get_store] = lambda: TEST_STORE
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def setup_data(client: TestClient):
    """Register users and create completions for testing."""
    # Register and login alice
    client.post("/api/v1/auth/register", json={
        "username": "alice_fav",
        "password": "test123",
        "display_name": "Alice Favorite"
    })
    alice_response = client.post("/api/v1/auth/login", json={
        "username": "alice_fav",
        "password": "test123"
    })
    alice_token = alice_response.json()["access_token"]
    alice_headers = {"Authorization": f"Bearer {alice_token}"}

    # Get a prompt
    prompts_response = client.get("/api/v1/prompts/active", headers=alice_headers)
    prompt_id = prompts_response.json()["items"][0]["id"]

    # Create two completions
    completion1 = client.post("/api/v1/completions", json={
        "prompt_id": prompt_id,
        "note": "First completion",
        "date": "2026-03-01",
        "location": "Park",
        "photo_url": "https://example.com/photo1.jpg",
        "share_with_friends": True,
    }, headers=alice_headers).json()["item"]["completion_id"]

    completion2 = client.post("/api/v1/completions", json={
        "prompt_id": prompt_id,
        "note": "Second completion",
        "date": "2026-03-02",
        "location": "Beach",
        "photo_url": "https://example.com/photo2.jpg",
        "share_with_friends": True,
    }, headers=alice_headers).json()["item"]["completion_id"]

    return {
        "client": client,
        "alice_headers": alice_headers,
        "completion1_id": completion1,
        "completion2_id": completion2,
    }


class TestFavorites:
    def test_add_favorite(self, setup_data):
        """Test adding a favorite."""
        client = setup_data["client"]
        headers = setup_data["alice_headers"]
        completion_id = setup_data["completion1_id"]

        response = client.post(
            f"/api/v1/completions/{completion_id}/favorite",
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "favorited"
        assert data["favorite_id"]

    def test_add_duplicate_favorite(self, setup_data):
        """Test that adding the same favorite twice fails."""
        client = setup_data["client"]
        headers = setup_data["alice_headers"]
        completion_id = setup_data["completion1_id"]

        # Add first time
        client.post(f"/api/v1/completions/{completion_id}/favorite", headers=headers)

        # Try to add again
        response = client.post(
            f"/api/v1/completions/{completion_id}/favorite",
            headers=headers,
        )

        assert response.status_code == 409  # Conflict

    def test_remove_favorite(self, setup_data):
        """Test removing a favorite."""
        client = setup_data["client"]
        headers = setup_data["alice_headers"]
        completion_id = setup_data["completion1_id"]

        # Add favorite
        client.post(f"/api/v1/completions/{completion_id}/favorite", headers=headers)

        # Remove favorite
        response = client.delete(
            f"/api/v1/completions/{completion_id}/favorite",
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "unfavorited"

    def test_remove_nonexistent_favorite(self, setup_data):
        """Test removing a favorite that doesn't exist."""
        client = setup_data["client"]
        headers = setup_data["alice_headers"]
        completion_id = setup_data["completion1_id"]

        response = client.delete(
            f"/api/v1/completions/{completion_id}/favorite",
            headers=headers,
        )

        assert response.status_code == 404

    def test_get_favorite_completions(self, setup_data):
        """Test getting all favorite completions."""
        client = setup_data["client"]
        headers = setup_data["alice_headers"]
        completion1_id = setup_data["completion1_id"]
        completion2_id = setup_data["completion2_id"]

        # Add two favorites
        client.post(f"/api/v1/completions/{completion1_id}/favorite", headers=headers)
        client.post(f"/api/v1/completions/{completion2_id}/favorite", headers=headers)

        # Get favorites
        response = client.get("/api/v1/favorites", headers=headers)

        assert response.status_code == 200
        favorites = response.json()
        assert len(favorites) == 2
        assert any(f["completion_id"] == completion1_id for f in favorites)
        assert any(f["completion_id"] == completion2_id for f in favorites)

    def test_get_favorites_empty(self, setup_data):
        """Test getting favorites when none exist."""
        client = setup_data["client"]
        headers = setup_data["alice_headers"]

        response = client.get("/api/v1/favorites", headers=headers)

        assert response.status_code == 200
        favorites = response.json()
        assert len(favorites) == 0
