"""Integration tests for friend management endpoints."""

import pytest
from fastapi.testclient import TestClient


def test_add_friend_endpoint(client: TestClient) -> None:
    """Test adding a friend."""
    # Create two users
    user1_response = client.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "password123"},
    )
    assert user1_response.status_code == 200
    user1_token = user1_response.json()["access_token"]
    
    user2_response = client.post(
        "/api/v1/auth/login",
        json={"username": "bob", "password": "password123"},
    )
    assert user2_response.status_code == 200
    user2_token = user2_response.json()["access_token"]

    # Add friend
    add_response = client.post(
        "/api/v1/friends",
        headers={"Authorization": f"Bearer {user1_token}"},
        json={"username": "bob"},
    )

    assert add_response.status_code == 201
    friend_data = add_response.json()
    assert friend_data["username"] == "bob"
    assert friend_data["status"] == "accepted"
    friend_id = friend_data["friend_id"]

    # Verify friend is in list
    friends_response = client.get(
        "/api/v1/friends",
        headers={"Authorization": f"Bearer {user1_token}"},
    )
    assert friends_response.status_code == 200
    friends = friends_response.json()["items"]
    assert len(friends) == 1
    assert friends[0]["username"] == "bob"


def test_remove_friend_endpoint(client: TestClient) -> None:
    """Test removing a friend."""
    # Create two users and add friendship
    user1_response = client.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "password123"},
    )
    user1_token = user1_response.json()["access_token"]
    
    user2_response = client.post(
        "/api/v1/auth/login",
        json={"username": "bob", "password": "password123"},
    )
    user2_token = user2_response.json()["access_token"]
    user2_id = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {user2_token}"},
    ).json()["profile"]["user_id"]

    # Add friend
    add_response = client.post(
        "/api/v1/friends",
        headers={"Authorization": f"Bearer {user1_token}"},
        json={"username": "bob"},
    )
    friend_id = add_response.json()["friend_id"]

    # Remove friend
    remove_response = client.delete(
        f"/api/v1/friends/{friend_id}",
        headers={"Authorization": f"Bearer {user1_token}"},
    )
    assert remove_response.status_code == 204

    # Verify friend is removed
    friends_response = client.get(
        "/api/v1/friends",
        headers={"Authorization": f"Bearer {user1_token}"},
    )
    assert friends_response.status_code == 200
    friends = friends_response.json()["items"]
    assert len(friends) == 0


def test_list_friends_endpoint(client: TestClient) -> None:
    """Test listing friends."""
    # Create user
    user_response = client.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "password123"},
    )
    token = user_response.json()["access_token"]

    # Initially no friends
    friends_response = client.get(
        "/api/v1/friends",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert friends_response.status_code == 200
    assert friends_response.json()["items"] == []
    assert friends_response.json()["total"] == 0


def test_get_friend_status_endpoint(client: TestClient) -> None:
    """Test getting friendship status."""
    # Create two users
    user1_response = client.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "password123"},
    )
    user1_token = user1_response.json()["access_token"]
    
    user2_response = client.post(
        "/api/v1/auth/login",
        json={"username": "bob", "password": "password123"},
    )
    user2_token = user2_response.json()["access_token"]
    user2_data = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {user2_token}"},
    ).json()["profile"]
    user2_id = user2_data["user_id"]

    # Add friend
    client.post(
        "/api/v1/friends",
        headers={"Authorization": f"Bearer {user1_token}"},
        json={"username": "bob"},
    )

    # Get friendship status
    status_response = client.get(
        f"/api/v1/friends/{user2_id}",
        headers={"Authorization": f"Bearer {user1_token}"},
    )
    assert status_response.status_code == 200
    status = status_response.json()
    assert status["username"] == "bob"
    assert status["status"] == "accepted"


def test_search_users_endpoint(client: TestClient) -> None:
    """Test searching for users."""
    # Create some users
    user1_response = client.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "password123"},
    )
    token1 = user1_response.json()["access_token"]
    
    client.post(
        "/api/v1/auth/login",
        json={"username": "bob", "password": "password123"},
    )
    
    client.post(
        "/api/v1/auth/login",
        json={"username": "bobby", "password": "password123"},
    )

    # Search for "bob"
    search_response = client.get(
        "/api/v1/friends/search?q=bob",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert search_response.status_code == 200
    results = search_response.json()["items"]
    # Should find bob and bobby (but not alice)
    assert len(results) >= 2
    usernames = [r["username"] for r in results]
    assert "bob" in usernames
    assert "bobby" in usernames
    assert "alice" not in usernames


def test_add_friend_requires_auth(client: TestClient) -> None:
    """Test that adding a friend requires authentication."""
    response = client.post(
        "/api/v1/friends",
        json={"username": "bob"},
    )
    assert response.status_code == 401


def test_add_yourself_as_friend_fails(client: TestClient) -> None:
    """Test that you cannot add yourself as a friend."""
    user_response = client.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "password123"},
    )
    token = user_response.json()["access_token"]

    response = client.post(
        "/api/v1/friends",
        headers={"Authorization": f"Bearer {token}"},
        json={"username": "alice"},
    )
    assert response.status_code == 400


def test_add_nonexistent_user_fails(client: TestClient) -> None:
    """Test that adding a nonexistent user fails."""
    user_response = client.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "password123"},
    )
    token = user_response.json()["access_token"]

    response = client.post(
        "/api/v1/friends",
        headers={"Authorization": f"Bearer {token}"},
        json={"username": "nonexistent"},
    )
    assert response.status_code == 404
