"""Integration tests for friend request approval workflow."""

import pytest
from fastapi.testclient import TestClient


def test_send_friend_request_creates_pending(client: TestClient, auth_headers: dict, auth_headers_bob: dict) -> None:
    """Test that sending a friend request creates pending status."""
    # Alice sends request to Bob
    response = client.post(
        "/api/v1/friends",
        headers=auth_headers,
        json={"username": "bob"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert data["username"] == "bob"
    assert "request_id" in data
    
    # Verify Alice sees it in outgoing requests
    response = client.get("/api/v1/friends/requests/outgoing", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["username"] == "bob"
    assert data["items"][0]["direction"] == "outgoing"
    
    # Verify Bob sees it in incoming requests
    response = client.get("/api/v1/friends/requests/incoming", headers=auth_headers_bob)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["username"] == "alice"
    assert data["items"][0]["direction"] == "incoming"


def test_accept_friend_request_updates_status(client: TestClient, auth_headers: dict, auth_headers_bob: dict) -> None:
    """Test accepting a friend request changes status to accepted."""
    # Alice sends request to Bob
    response = client.post(
        "/api/v1/friends",
        headers=auth_headers,
        json={"username": "bob"},
    )
    assert response.status_code == 201
    request_id = response.json()["request_id"]
    
    # Bob accepts the request
    response = client.post(
        f"/api/v1/friends/requests/{request_id}/accept",
        headers=auth_headers_bob,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "accepted"
    assert "accepted_at" in data
    assert data["accepted_at"] != ""
    
    # Verify no more pending requests
    response = client.get("/api/v1/friends/requests/incoming", headers=auth_headers_bob)
    assert response.json()["total"] == 0
    
    response = client.get("/api/v1/friends/requests/outgoing", headers=auth_headers)
    assert response.json()["total"] == 0
    
    # Verify both users now see each other as friends
    response = client.get("/api/v1/friends", headers=auth_headers)
    assert response.status_code == 200
    friends = response.json()["items"]
    assert len(friends) == 1
    assert friends[0]["username"] == "bob"
    assert friends[0]["status"] == "accepted"
    
    response = client.get("/api/v1/friends", headers=auth_headers_bob)
    assert response.status_code == 200
    friends = response.json()["items"]
    assert len(friends) == 1
    assert friends[0]["username"] == "alice"
    assert friends[0]["status"] == "accepted"


def test_reject_friend_request_removes_request(client: TestClient, auth_headers: dict, auth_headers_bob: dict) -> None:
    """Test rejecting a friend request removes it."""
    # Alice sends request to Bob
    response = client.post(
        "/api/v1/friends",
        headers=auth_headers,
        json={"username": "bob"},
    )
    assert response.status_code == 201
    request_id = response.json()["request_id"]
    
    # Bob rejects the request
    response = client.post(
        f"/api/v1/friends/requests/{request_id}/reject",
        headers=auth_headers_bob,
    )
    assert response.status_code == 204
    
    # Verify no pending requests
    response = client.get("/api/v1/friends/requests/incoming", headers=auth_headers_bob)
    assert response.json()["total"] == 0
    
    response = client.get("/api/v1/friends/requests/outgoing", headers=auth_headers)
    assert response.json()["total"] == 0
    
    # Verify neither user sees the other as a friend
    response = client.get("/api/v1/friends", headers=auth_headers)
    assert response.json()["total"] == 0
    
    response = client.get("/api/v1/friends", headers=auth_headers_bob)
    assert response.json()["total"] == 0


def test_cannot_accept_own_request(client: TestClient, auth_headers: dict, auth_headers_bob: dict) -> None:
    """Test that users cannot accept their own friend requests."""
    # Alice sends request to Bob
    response = client.post(
        "/api/v1/friends",
        headers=auth_headers,
        json={"username": "bob"},
    )
    assert response.status_code == 201
    request_id = response.json()["request_id"]
    
    # Alice tries to accept her own request (should fail)
    response = client.post(
        f"/api/v1/friends/requests/{request_id}/accept",
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "Cannot accept your own" in response.json()["detail"]


def test_cannot_reject_own_request(client: TestClient, auth_headers: dict, auth_headers_bob: dict) -> None:
    """Test that users cannot reject their own friend requests."""
    # Alice sends request to Bob
    response = client.post(
        "/api/v1/friends",
        headers=auth_headers,
        json={"username": "bob"},
    )
    assert response.status_code == 201
    request_id = response.json()["request_id"]
    
    # Alice tries to reject her own request (should fail)
    response = client.post(
        f"/api/v1/friends/requests/{request_id}/reject",
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "Cannot reject your own" in response.json()["detail"]


def test_duplicate_friend_request_returns_existing(
    client: TestClient,
    auth_headers: dict,
    auth_headers_bob: dict,
) -> None:
    """Test that duplicate friend requests return the existing request."""
    # Ensure Bob exists
    _ = auth_headers_bob

    # Alice sends request to Bob
    response1 = client.post(
        "/api/v1/friends",
        headers=auth_headers,
        json={"username": "bob"},
    )
    assert response1.status_code == 201
    request_id_1 = response1.json()["request_id"]
    
    # Alice sends same request again
    response2 = client.post(
        "/api/v1/friends",
        headers=auth_headers,
        json={"username": "bob"},
    )
    assert response2.status_code == 201
    request_id_2 = response2.json()["request_id"]
    
    # Should return the same request
    assert request_id_1 == request_id_2
    
    # Verify only one outgoing request
    response = client.get("/api/v1/friends/requests/outgoing", headers=auth_headers)
    assert response.json()["total"] == 1


def test_friends_list_only_shows_accepted(client: TestClient, auth_headers: dict, auth_headers_bob: dict) -> None:
    """Test that get_friends only returns accepted friendships."""
    # Alice sends request to Bob (pending)
    response = client.post(
        "/api/v1/friends",
        headers=auth_headers,
        json={"username": "bob"},
    )
    assert response.status_code == 201
    
    # Alice should not see Bob in friends list yet
    response = client.get("/api/v1/friends", headers=auth_headers)
    assert response.json()["total"] == 0
    
    # Bob should not see Alice in friends list yet
    response = client.get("/api/v1/friends", headers=auth_headers_bob)
    assert response.json()["total"] == 0


def test_accept_nonexistent_request(client: TestClient, auth_headers: dict) -> None:
    """Test accepting a request that doesn't exist."""
    response = client.post(
        "/api/v1/friends/requests/nonexistent-id/accept",
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "not found" in response.json()["detail"].lower()


def test_reject_nonexistent_request(client: TestClient, auth_headers: dict) -> None:
    """Test rejecting a request that doesn't exist."""
    response = client.post(
        "/api/v1/friends/requests/nonexistent-id/reject",
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "not found" in response.json()["detail"].lower()


def test_multiple_pending_requests(client: TestClient, auth_headers: dict, auth_headers_bob: dict) -> None:
    """Test handling multiple pending requests from different users."""
    # Create a third user (Charlie)
    client.post("/api/v1/auth/register", json={"username": "charlie", "password": "password123"})
    login_response = client.post("/api/v1/auth/login", json={"username": "charlie", "password": "password123"})
    auth_headers_charlie = {"Authorization": f"Bearer {login_response.json()['access_token']}"}
    
    # Alice and Charlie both send requests to Bob
    response1 = client.post(
        "/api/v1/friends",
        headers=auth_headers,
        json={"username": "bob"},
    )
    assert response1.status_code == 201
    
    response2 = client.post(
        "/api/v1/friends",
        headers=auth_headers_charlie,
        json={"username": "bob"},
    )
    assert response2.status_code == 201
    
    # Bob should see 2 incoming requests
    response = client.get("/api/v1/friends/requests/incoming", headers=auth_headers_bob)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    usernames = {item["username"] for item in data["items"]}
    assert usernames == {"alice", "charlie"}
    
    # Accept one, reject the other
    alice_request = next(item for item in data["items"] if item["username"] == "alice")
    charlie_request = next(item for item in data["items"] if item["username"] == "charlie")
    
    response = client.post(
        f"/api/v1/friends/requests/{alice_request['request_id']}/accept",
        headers=auth_headers_bob,
    )
    assert response.status_code == 200
    
    response = client.post(
        f"/api/v1/friends/requests/{charlie_request['request_id']}/reject",
        headers=auth_headers_bob,
    )
    assert response.status_code == 204
    
    # Bob should have 1 friend
    response = client.get("/api/v1/friends", headers=auth_headers_bob)
    friends = response.json()["items"]
    assert len(friends) == 1
    assert friends[0]["username"] == "alice"
    
    # No more incoming requests
    response = client.get("/api/v1/friends/requests/incoming", headers=auth_headers_bob)
    assert response.json()["total"] == 0


def test_feed_only_includes_accepted_friends(client: TestClient, auth_headers: dict, auth_headers_bob: dict) -> None:
    """Test that feed filtering only includes completions from accepted friends."""
    # Alice sends friend request to Bob (pending)
    response = client.post(
        "/api/v1/friends",
        headers=auth_headers,
        json={"username": "bob"},
    )
    assert response.status_code == 201
    request_id = response.json()["request_id"]
    
    # Bob completes a prompt
    prompts_response = client.get("/api/v1/prompts/active", headers=auth_headers_bob)
    prompt_id = prompts_response.json()["items"][0]["id"]

    bob_completion = {
        "prompt_id": prompt_id,
        "note": "Bob's completion",
        "date": "2026-03-08",
        "location": "Bob's Place",
        "photo_url": "https://example.com/bob-photo.jpg",
        "share_with_friends": True,
    }
    client.post("/api/v1/completions", headers=auth_headers_bob, json=bob_completion)
    
    # Alice checks friends feed - should be empty (Bob not accepted yet)
    response = client.get("/api/v1/feed?scope=friends", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["total"] == 0
    
    # Bob accepts the request
    client.post(f"/api/v1/friends/requests/{request_id}/accept", headers=auth_headers_bob)
    
    # Now Alice should see Bob's completion in friends feed
    response = client.get("/api/v1/feed?scope=friends", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["user_username"] == "bob"
    assert data["items"][0]["note"] == "Bob's completion"
