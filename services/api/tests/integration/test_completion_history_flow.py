def test_login_to_completion_to_history_flow(client) -> None:
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

    prompts_response = client.get("/api/v1/prompts/active", headers=headers)
    assert prompts_response.status_code == 200
    prompt_id = prompts_response.json()["items"][0]["id"]

    completion_response = client.post(
        "/api/v1/completions",
        headers=headers,
        json={
            "prompt_id": prompt_id,
            "note": "Finished the activity",
            "date": "2026-03-01",
            "location": "Sydney",
            "photo_url": "s3://footprints/completions/demo.jpg",
            "share_with_friends": True,
        },
    )
    assert completion_response.status_code == 200

    history_response = client.get("/api/v1/history", headers=headers)
    assert history_response.status_code == 200
    items = history_response.json()["items"]
    assert len(items) == 1
    assert items[0]["prompt_id"] == prompt_id
