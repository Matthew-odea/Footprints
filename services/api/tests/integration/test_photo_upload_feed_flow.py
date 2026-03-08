"""Integration tests for photo upload and feed endpoints."""

import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


def test_request_upload_url_endpoint(client: TestClient) -> None:
    """Test requesting a presigned S3 URL for photo upload."""
    # First, login
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "username": "demo_user",
            "password": "password123",
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Request upload URL
    with patch("app.core.aws.boto3") as mock_boto3:
        mock_s3_client = MagicMock()
        mock_boto3.client.return_value = mock_s3_client
        
        mock_s3_client.generate_presigned_post.return_value = {
            "url": "https://footprints-dev-completions.s3.amazonaws.com/",
            "fields": {
                "key": "completions/demo_user/abc-123.jpeg",
                "policy": "eyJleHBpcmF0aW9uIjogIjIwMjYtMDMtMDhUMTY6MjA6MDBaIn0=",
                "signature": "signature",
                "AWSAccessKeyId": "AKIA...",
            },
        }
        
        upload_response = client.post(
            "/api/v1/uploads",
            headers=headers,
            json={"file_type": "image/jpeg"},
        )
    
    assert upload_response.status_code == 200
    response_data = upload_response.json()
    assert "upload_url" in response_data
    assert "upload_fields" in response_data
    assert "s3_key" in response_data
    assert response_data["s3_key"].startswith("completions/")


def test_request_upload_url_invalid_file_type(client: TestClient) -> None:
    """Test that invalid file types are rejected."""
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "username": "demo_user",
            "password": "password123",
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Request with invalid file type
    upload_response = client.post(
        "/api/v1/uploads",
        headers=headers,
        json={"file_type": "video/mp4"},
    )
    
    # Should return 400 Bad Request
    assert upload_response.status_code == 400
    assert "Invalid file type" in upload_response.json()["detail"]


def test_request_upload_url_requires_auth(client: TestClient) -> None:
    """Test that upload endpoint requires authentication."""
    upload_response = client.post(
        "/api/v1/uploads",
        json={"file_type": "image/jpeg"},
    )
    
    # Missing auth results in 403
    assert upload_response.status_code in [403, 401]


def test_feed_endpoint_returns_public_completions(client: TestClient) -> None:
    """Test that feed endpoint returns public completions with pagination."""
    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "username": "demo_user",
            "password": "password123",
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get prompts
    prompts_response = client.get("/api/v1/prompts/active", headers=headers)
    assert prompts_response.status_code == 200
    prompt_id = prompts_response.json()["items"][0]["id"]

    # Create a completion with share_with_friends=true
    completion_response = client.post(
        "/api/v1/completions",
        headers=headers,
        json={
            "prompt_id": prompt_id,
            "note": "Great activity!",
            "date": "2026-03-08",
            "location": "Park",
            "photo_url": "s3://footprints-dev-completions/completions/demo_user/photo.jpeg",
            "share_with_friends": True,
        },
    )
    assert completion_response.status_code == 200
    completion_id = completion_response.json()["item"]["completion_id"]

    # Get feed
    feed_response = client.get("/api/v1/feed", headers=headers)
    
    assert feed_response.status_code == 200
    feed_data = feed_response.json()
    assert "items" in feed_data
    assert "next_cursor" in feed_data or feed_data.get("next_cursor") is None
    
    # Verify the completion appears in the feed
    items = feed_data["items"]
    assert len(items) > 0
    
    # Find our completion
    our_completion = next((item for item in items if item["completion_id"] == completion_id), None)
    assert our_completion is not None
    assert our_completion["note"] == "Great activity!"
    assert our_completion["location"] == "Park"
    assert our_completion["photo_url"].startswith("s3://")
    # User display name should exist
    assert "user_display_name" in our_completion


def test_feed_endpoint_pagination(client: TestClient) -> None:
    """Test that feed endpoint supports pagination with cursor."""
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "username": "demo_user",
            "password": "password123",
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get feed with limit=1
    feed_response = client.get(
        "/api/v1/feed?limit=1",
        headers=headers,
    )
    
    assert feed_response.status_code == 200
    feed_data = feed_response.json()
    assert "items" in feed_data
    assert "next_cursor" in feed_data


def test_feed_scope_friends_filters_non_friends(client: TestClient) -> None:
    """Test that friends scope only returns accepted friends' completions."""
    user1_login = client.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "password123"},
    )
    assert user1_login.status_code == 200
    token1 = user1_login.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    user2_login = client.post(
        "/api/v1/auth/login",
        json={"username": "bob", "password": "password123"},
    )
    assert user2_login.status_code == 200
    token2 = user2_login.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    user3_login = client.post(
        "/api/v1/auth/login",
        json={"username": "charlie", "password": "password123"},
    )
    assert user3_login.status_code == 200
    token3 = user3_login.json()["access_token"]
    headers3 = {"Authorization": f"Bearer {token3}"}

    prompts_response = client.get("/api/v1/prompts/active", headers=headers1)
    assert prompts_response.status_code == 200
    prompt_id = prompts_response.json()["items"][0]["id"]

    bob_completion = client.post(
        "/api/v1/completions",
        headers=headers2,
        json={
            "prompt_id": prompt_id,
            "note": "bob completion",
            "date": "2026-03-08",
            "location": "Park",
            "photo_url": "",
            "share_with_friends": True,
        },
    )
    assert bob_completion.status_code == 200

    charlie_completion = client.post(
        "/api/v1/completions",
        headers=headers3,
        json={
            "prompt_id": prompt_id,
            "note": "charlie completion",
            "date": "2026-03-08",
            "location": "Trail",
            "photo_url": "",
            "share_with_friends": True,
        },
    )
    assert charlie_completion.status_code == 200

    add_friend = client.post(
        "/api/v1/friends",
        headers=headers1,
        json={"username": "bob"},
    )
    assert add_friend.status_code == 201

    feed_response = client.get("/api/v1/feed?scope=friends", headers=headers1)
    assert feed_response.status_code == 200

    notes = [item["note"] for item in feed_response.json()["items"]]
    assert "bob completion" in notes
    assert "charlie completion" not in notes


def test_feed_endpoint_requires_auth(client: TestClient) -> None:
    """Test that feed endpoint requires authentication."""
    feed_response = client.get("/api/v1/feed")
    
    # Missing auth results in 403
    assert feed_response.status_code in [403, 401]


def test_full_photo_completion_flow(client: TestClient) -> None:
    """Test the complete flow: login -> request upload URL -> create completion with photo -> view in feed."""
    # Step 1: Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "username": "demo_user",
            "password": "password123",
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Step 2: Get active prompts
    prompts_response = client.get("/api/v1/prompts/active", headers=headers)
    assert prompts_response.status_code == 200
    prompt_id = prompts_response.json()["items"][0]["id"]
    prompt_title = prompts_response.json()["items"][0]["title"]

    # Step 3: Request upload URL (mock S3)
    with patch("app.core.aws.boto3") as mock_boto3:
        mock_s3_client = MagicMock()
        mock_boto3.client.return_value = mock_s3_client
        
        s3_key = "completions/demo_user/abc-123.jpeg"
        mock_s3_client.generate_presigned_post.return_value = {
            "url": "https://footprints-dev-completions.s3.amazonaws.com/",
            "fields": {
                "key": s3_key,
                "policy": "policy",
                "signature": "signature",
                "AWSAccessKeyId": "key",
            },
        }
        
        upload_response = client.post(
            "/api/v1/uploads",
            headers=headers,
            json={"file_type": "image/jpeg"},
        )
        
        assert upload_response.status_code == 200
        s3_upload_data = upload_response.json()

    # Step 4: Create completion with photo URL
    photo_url = f"s3://footprints-dev-completions/{s3_key}"
    completion_response = client.post(
        "/api/v1/completions",
        headers=headers,
        json={
            "prompt_id": prompt_id,
            "note": "Completed with photo",
            "date": "2026-03-08",
            "location": "Park",
            "photo_url": photo_url,
            "share_with_friends": True,
        },
    )
    
    assert completion_response.status_code == 200
    completion_data = completion_response.json()
    completion_id = completion_data["item"]["completion_id"]

    # Step 5: Verify completion appears in feed
    feed_response = client.get("/api/v1/feed", headers=headers)
    
    assert feed_response.status_code == 200
    feed_data = feed_response.json()
    items = feed_data["items"]
    
    # Find our completion
    our_completion = next((item for item in items if item["completion_id"] == completion_id), None)
    assert our_completion is not None
    assert our_completion["note"] == "Completed with photo"
    assert our_completion["location"] == "Park"
    assert our_completion["photo_url"] == photo_url
    assert our_completion["prompt_title"] == prompt_title
    # User display name should exist (may be "Demo User" or "Unknown" depending on user setup)
    assert "user_display_name" in our_completion
    assert len(our_completion["user_display_name"]) > 0
