def test_get_completions_by_date_range_empty(client) -> None:
    """Test getting completions when none exist in the date range."""
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

    response = client.get(
        "/api/v1/archive/completions",
        params={
            "start_date": "2025-01-01",
            "end_date": "2025-12-31",
        },
        headers=headers,
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert items == []


def test_get_completions_by_date_range_single_date(client) -> None:
    """Test getting completions for a specific date."""
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "username": "demo_user_2",
            "password": "password123",
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    prompts_response = client.get("/api/v1/prompts/active", headers=headers)
    assert prompts_response.status_code == 200
    prompt_id = prompts_response.json()["items"][0]["id"]
    prompt_category = prompts_response.json()["items"][0]["category"]

    # Create a completion
    completion_response = client.post(
        "/api/v1/completions",
        headers=headers,
        json={
            "prompt_id": prompt_id,
            "note": "Walked in the park",
            "date": "2026-03-15",
            "location": "Central Park",
            "photo_url": "s3://footprints/completions/walk.jpg",
            "share_with_friends": True,
        },
    )
    assert completion_response.status_code == 200

    # Get completions for the date range that includes the creation date
    response = client.get(
        "/api/v1/archive/completions",
        params={
            "start_date": "2026-03-15",
            "end_date": "2026-03-15",
        },
        headers=headers,
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["note"] == "Walked in the park"
    assert items[0]["date"] == "2026-03-15"
    assert items[0]["category"] == prompt_category


def test_get_completions_by_date_range_multiple_dates(client) -> None:
    """Test getting completions across multiple dates."""
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "username": "demo_user_3",
            "password": "password123",
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    prompts_response = client.get("/api/v1/prompts/active", headers=headers)
    assert prompts_response.status_code == 200
    prompt_id = prompts_response.json()["items"][0]["id"]

    # Create completions on different dates
    dates = ["2026-03-10", "2026-03-15", "2026-03-20"]
    for i, date in enumerate(dates):
        completion_response = client.post(
            "/api/v1/completions",
            headers=headers,
            json={
                "prompt_id": prompt_id,
                "note": f"Activity {i + 1}",
                "date": date,
                "location": f"Location {i + 1}",
                "photo_url": f"s3://footprints/completions/{i}.jpg",
                "share_with_friends": True,
            },
        )
        assert completion_response.status_code == 200

    # Get completions for a range that includes all three dates
    response = client.get(
        "/api/v1/archive/completions",
        params={
            "start_date": "2026-03-10",
            "end_date": "2026-03-20",
        },
        headers=headers,
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 3
    # Items should be sorted by date descending (most recent first)
    assert items[0]["date"] == "2026-03-20"
    assert items[1]["date"] == "2026-03-15"
    assert items[2]["date"] == "2026-03-10"


def test_get_completions_by_date_range_with_pagination(client) -> None:
    """Test pagination with limit and offset."""
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "username": "demo_user_4",
            "password": "password123",
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    prompts_response = client.get("/api/v1/prompts/active", headers=headers)
    assert prompts_response.status_code == 200
    prompt_id = prompts_response.json()["items"][0]["id"]

    # Create 5 completions
    for i in range(5):
        completion_response = client.post(
            "/api/v1/completions",
            headers=headers,
            json={
                "prompt_id": prompt_id,
                "note": f"Activity {i + 1}",
                "date": f"2026-03-{10 + i:02d}",
                "location": f"Location {i + 1}",
                "photo_url": f"s3://footprints/completions/{i}.jpg",
                "share_with_friends": True,
            },
        )
        assert completion_response.status_code == 200

    # Get first 2 items
    response1 = client.get(
        "/api/v1/archive/completions",
        params={
            "start_date": "2026-03-10",
            "end_date": "2026-03-14",
            "limit": 2,
            "offset": 0,
        },
        headers=headers,
    )
    assert response1.status_code == 200
    items1 = response1.json()["items"]
    assert len(items1) == 2

    # Get next 2 items
    response2 = client.get(
        "/api/v1/archive/completions",
        params={
            "start_date": "2026-03-10",
            "end_date": "2026-03-14",
            "limit": 2,
            "offset": 2,
        },
        headers=headers,
    )
    assert response2.status_code == 200
    items2 = response2.json()["items"]
    assert len(items2) == 2

    # Get remaining items
    response3 = client.get(
        "/api/v1/archive/completions",
        params={
            "start_date": "2026-03-10",
            "end_date": "2026-03-14",
            "limit": 2,
            "offset": 4,
        },
        headers=headers,
    )
    assert response3.status_code == 200
    items3 = response3.json()["items"]
    assert len(items3) == 1

    # Verify all items are unique
    all_ids = [item["completion_id"] for item in items1 + items2 + items3]
    assert len(all_ids) == len(set(all_ids))


def test_get_completions_by_date_range_excludes_outside_range(client) -> None:
    """Test that completions outside the date range are excluded."""
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "username": "demo_user_5",
            "password": "password123",
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    prompts_response = client.get("/api/v1/prompts/active", headers=headers)
    assert prompts_response.status_code == 200
    prompt_id = prompts_response.json()["items"][0]["id"]

    # Create completions before, during, and after the range
    dates = ["2026-02-15", "2026-03-10", "2026-03-15", "2026-03-20", "2026-04-15"]
    for i, date in enumerate(dates):
        completion_response = client.post(
            "/api/v1/completions",
            headers=headers,
            json={
                "prompt_id": prompt_id,
                "note": f"Activity {i + 1}",
                "date": date,
                "location": f"Location {i + 1}",
                "photo_url": f"s3://footprints/completions/{i}.jpg",
                "share_with_friends": True,
            },
        )
        assert completion_response.status_code == 200

    # Get completions only for March
    response = client.get(
        "/api/v1/archive/completions",
        params={
            "start_date": "2026-03-01",
            "end_date": "2026-03-31",
        },
        headers=headers,
    )
    assert response.status_code == 200
    items = response.json()["items"]
    # Should only include the 3 March dates
    assert len(items) == 3
    for item in items:
        assert "2026-03" in item["date"]
