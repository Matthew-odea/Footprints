import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_store
from app.repositories.memory_store import MemoryDataStore

TEST_STORE = MemoryDataStore()


@pytest.fixture()
def client():
    """Get a FastAPI test client with in-memory storage."""
    from app.dependencies import get_store
    app.dependency_overrides[get_store] = lambda: TEST_STORE
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def setup_data(client: TestClient):
    """Register alice, bob and create a completion for alice."""
    # Register and login alice
    client.post("/api/v1/auth/register", json={
        "username": "alice",
        "password": "test123",
        "display_name": "Alice Wonder"
    })
    alice_response = client.post("/api/v1/auth/login", json={
        "username": "alice",
        "password": "test123"
    })
    alice_token = alice_response.json()["access_token"]
    alice_headers = {"Authorization": f"Bearer {alice_token}"}

    # Register and login bob
    client.post("/api/v1/auth/register", json={
        "username": "bob",
        "password": "test123",
        "display_name": "Bob Smith"
    })
    bob_response = client.post("/api/v1/auth/login", json={
        "username": "bob",
        "password": "test123"
    })
    bob_token = bob_response.json()["access_token"]
    bob_headers = {"Authorization": f"Bearer {bob_token}"}

    # Get an existing prompt
    prompts_response = client.get("/api/v1/prompts/active", headers=alice_headers)
    prompt_id = prompts_response.json()["items"][0]["id"]

    # Create a completion as alice
    payload = {
        "prompt_id": prompt_id,
        "note": "Great activity!",
        "date": "2026-03-08",
        "location": "Central Park",
        "photo_url": "https://example.com/photo.jpg",
        "share_with_friends": True,
    }
    response = client.post("/api/v1/completions", json=payload, headers=alice_headers)
    completion_id = response.json()["item"]["completion_id"]

    return {
        "client": client,
        "alice_headers": alice_headers,
        "bob_headers": bob_headers,
        "completion_id": completion_id,
        "prompt_id": prompt_id,
    }


class TestEntryDetail:
    def test_get_completion_by_id(self, setup_data):
        """Test retrieving a single completion."""
        client = setup_data["client"]
        headers = setup_data["alice_headers"]
        completion_id = setup_data["completion_id"]

        response = client.get(f"/api/v1/archive/completions/{completion_id}", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["completion_id"] == completion_id
        assert data["note"] == "Great activity!"
        assert data["date"] == "2026-03-08"

    def test_get_nonexistent_completion(self, setup_data):
        """Test that getting a nonexistent completion returns 404."""
        client = setup_data["client"]
        headers = setup_data["alice_headers"]

        response = client.get("/api/v1/archive/completions/nonexistent", headers=headers)

        assert response.status_code == 404


class TestComments:
    def test_create_comment(self, setup_data):
        """Test creating a comment on a completion."""
        client = setup_data["client"]
        headers = setup_data["alice_headers"]
        completion_id = setup_data["completion_id"]
        payload = {"text": "Great job on this activity!"}

        response = client.post(
            f"/api/v1/completions/{completion_id}/comments",
            json=payload,
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()["item"]
        assert data["text"] == "Great job on this activity!"
        assert data["user_display_name"]  # Has a display name
        assert data["comment_id"]

    def test_list_comments(self, setup_data):
        """Test listing comments on a completion."""
        client = setup_data["client"]
        headers = setup_data["alice_headers"]
        completion_id = setup_data["completion_id"]

        # Create two comments
        for i in range(2):
            client.post(
                f"/api/v1/completions/{completion_id}/comments",
                json={"text": f"Comment {i+1}"},
                headers=headers,
            )

        # List comments
        response = client.get(
            f"/api/v1/completions/{completion_id}/comments",
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2
        # Comments should be sorted by created_at descending (most recent first)
        assert data["items"][0]["text"] == "Comment 2"

    def test_delete_comment(self, setup_data):
        """Test deleting a comment."""
        client = setup_data["client"]
        headers = setup_data["alice_headers"]
        completion_id = setup_data["completion_id"]

        # Create a comment
        response = client.post(
            f"/api/v1/completions/{completion_id}/comments",
            json={"text": "Comment to delete"},
            headers=headers,
        )
        comment_id = response.json()["item"]["comment_id"]

        # Delete it
        response = client.delete(
            f"/api/v1/completions/{completion_id}/comments/{comment_id}",
            headers=headers,
        )

        assert response.status_code == 200
        assert response.json()["status"] == "deleted"

        # Verify it's gone
        response = client.get(
            f"/api/v1/completions/{completion_id}/comments",
            headers=headers,
        )
        assert response.json()["total"] == 0

    def test_delete_comment_not_authorized(self, setup_data):
        """Test that users can only delete their own comments."""
        client = setup_data["client"]
        alice_headers = setup_data["alice_headers"]
        bob_headers = setup_data["bob_headers"]
        completion_id = setup_data["completion_id"]

        # Create a comment as alice
        response = client.post(
            f"/api/v1/completions/{completion_id}/comments",
            json={"text": "Comment by alice"},
            headers=alice_headers,
        )
        comment_id = response.json()["item"]["comment_id"]

        # Try to delete as bob (should fail)
        response = client.delete(
            f"/api/v1/completions/{completion_id}/comments/{comment_id}",
            headers=bob_headers,
        )

        assert response.status_code == 404  # "not found" / "not authorized"

    def test_delete_nonexistent_comment(self, setup_data):
        """Test deleting a comment that doesn't exist."""
        client = setup_data["client"]
        headers = setup_data["alice_headers"]
        completion_id = setup_data["completion_id"]

        response = client.delete(
            f"/api/v1/completions/{completion_id}/comments/nonexistent",
            headers=headers,
        )

        assert response.status_code == 404
