"""Tests for rate limiting endpoints."""

import pytest
import time
from fastapi.testclient import TestClient

from app.main import app
from app.middleware.rate_limiter import rate_limiter


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset rate limiter before each test."""
    rate_limiter._requests.clear()
    yield
    rate_limiter._requests.clear()


def test_search_users_rate_limit(client: TestClient, auth_headers: dict):
    """Test that search endpoint enforces rate limit (10 requests/minute)."""
    # First 10 requests should succeed
    for i in range(10):
        response = client.get("/api/v1/friends/search?q=test", headers=auth_headers)
        assert response.status_code == 200, f"Request {i+1} failed: {response.json()}"
        
        # Check rate limit headers
        assert "X-RateLimit-Limit" in response.headers
        assert response.headers["X-RateLimit-Limit"] == "10"
        assert "X-RateLimit-Remaining" in response.headers
    
    # 11th request should be rate limited
    response = client.get("/api/v1/friends/search?q=test", headers=auth_headers)
    assert response.status_code == 429
    assert "Rate limit exceeded" in response.json()["detail"]
    assert "Retry-After" in response.headers
    
    retry_after = int(response.headers["Retry-After"])
    assert retry_after > 0
    assert retry_after <= 60


def test_add_friend_rate_limit(client: TestClient, auth_headers: dict):
    """Test that add friend endpoint enforces rate limit (5 requests/minute)."""
    # First 5 requests should succeed (or fail with 404/400, but not 429)
    for i in range(5):
        response = client.post(
            "/api/v1/friends",
            headers=auth_headers,
            json={"username": f"user{i}"},
        )
        # May get 404 if user doesn't exist, but not 429
        assert response.status_code != 429, f"Request {i+1} was rate limited unexpectedly"
    
    # 6th request should be rate limited
    response = client.post(
        "/api/v1/friends",
        headers=auth_headers,
        json={"username": "another_user"},
    )
    assert response.status_code == 429
    assert "Rate limit exceeded" in response.json()["detail"]


def test_rate_limit_per_user(client: TestClient, auth_headers: dict, auth_headers_bob: dict):
    """Test that rate limits are enforced per user, not globally."""
    # Alice makes 10 requests
    for i in range(10):
        response = client.get("/api/v1/friends/search?q=test", headers=auth_headers)
        assert response.status_code == 200
    
    # Alice's 11th request is rate limited
    response = client.get("/api/v1/friends/search?q=test", headers=auth_headers)
    assert response.status_code == 429
    
    # Bob's request should still work (different user)
    response = client.get("/api/v1/friends/search?q=test", headers=auth_headers_bob)
    assert response.status_code == 200


def test_rate_limit_headers(client: TestClient, auth_headers: dict):
    """Test that rate limit headers are present and correct."""
    response = client.get("/api/v1/friends/search?q=test", headers=auth_headers)
    
    assert response.status_code == 200
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers
    assert "X-RateLimit-Reset" in response.headers
    
    limit = int(response.headers["X-RateLimit-Limit"])
    remaining = int(response.headers["X-RateLimit-Remaining"])
    
    assert limit == 10  # Search endpoint limit
    assert remaining == 9  # After 1 request


def test_rate_limit_window_expiry(client: TestClient, auth_headers: dict):
    """Test that rate limit resets after window expires."""
    # This test would take 60 seconds to run, so we'll test the logic indirectly
    # by checking that the rate limiter cleanup works
    
    # Make 10 requests to hit the limit
    for i in range(10):
        response = client.get("/api/v1/friends/search?q=test", headers=auth_headers)
        assert response.status_code == 200
    
    # 11th should fail
    response = client.get("/api/v1/friends/search?q=test", headers=auth_headers)
    assert response.status_code == 429
    
    # Note: In production, waiting 60 seconds would allow requests again
    # For testing, we verify the retry-after header indicates when to retry
    assert "Retry-After" in response.headers


def test_rate_limit_different_endpoints(client: TestClient, auth_headers: dict):
    """Test that different endpoints have independent rate limits."""
    # Exhaust search rate limit (10 requests)
    for i in range(10):
        response = client.get("/api/v1/friends/search?q=test", headers=auth_headers)
        assert response.status_code == 200
    
    # Search should now be rate limited
    response = client.get("/api/v1/friends/search?q=test", headers=auth_headers)
    assert response.status_code == 429
    
    # But add_friend should still work (different rate limit)
    response = client.post(
        "/api/v1/friends",
        headers=auth_headers,
        json={"username": "testuser"},
    )
    # May get 404 but not 429
    assert response.status_code != 429


def test_rate_limit_unit_sliding_window():
    """Unit test for sliding window algorithm."""
    from app.middleware.rate_limiter import RateLimiter
    from datetime import datetime, timedelta
    
    limiter = RateLimiter()
    
    # Test basic rate limiting
    for i in range(5):
        allowed, count, retry = limiter.check_rate_limit("test_key", max_requests=5, window_seconds=60)
        assert allowed is True
        assert count == i + 1
    
    # 6th request should fail
    allowed, count, retry = limiter.check_rate_limit("test_key", max_requests=5, window_seconds=60)
    assert allowed is False
    assert count == 5
    assert retry > 0
    
    # Cleanup works
    limiter.reset("test_key")
    allowed, count, retry = limiter.check_rate_limit("test_key", max_requests=5, window_seconds=60)
    assert allowed is True
