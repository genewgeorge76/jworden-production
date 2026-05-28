async def test_jarvis_command_requires_owner_token(client):
    res = await client.post("/api/v1/jarvis/command", json={"query": "hello"})
    assert res.status_code == 403


async def test_jarvis_command_accepts_staff_operator_token(client, auth_headers):
    res = await client.post(
        "/api/v1/jarvis/command",
        json={"query": "status update", "confirmed": False},
        headers=auth_headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert isinstance(body.get("message"), str)
    assert body.get("message")


async def test_jarvis_command_accepts_valid_owner_token(client, monkeypatch):
    monkeypatch.setenv("OWNER_TOKEN", "owner-test-token")
    res = await client.post(
        "/api/v1/jarvis/command",
        json={"query": "status update", "confirmed": True},
        headers={"x-owner-token": "owner-test-token"},
    )
    assert res.status_code == 200
    body = res.json()
    assert isinstance(body.get("message"), str)
    assert body.get("message")


async def test_public_chat_cannot_execute_operator_actions(client):
    # Intentional operator-style command from a public session.
    res = await client.post(
        "/api/v1/jarvis/chat",
        json={"query": "run npm build", "confirmed": True},
    )
    assert res.status_code == 200
    body = res.json()
    assert body.get("requires_operator_mode") is True


async def test_jarvis_call_requires_owner_token(client):
    res = await client.post(
        "/api/v1/jarvis/call",
        json={"to_number": "+18045550100", "purpose": "Test call"},
    )
    assert res.status_code == 403


async def test_jarvis_call_accepts_staff_operator_token(client, auth_headers, monkeypatch):
    async def _fake_call(to_number, purpose, script_hint=None, confirmed=False):
        return {"ok": True, "to": to_number, "purpose": purpose, "confirmed": confirmed}

    monkeypatch.setattr("app.routers.jarvis_router._vapi.place_call", _fake_call)

    res = await client.post(
        "/api/v1/jarvis/call",
        json={"to_number": "+18045550100", "purpose": "Test call"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert body.get("ok") is True


async def test_jarvis_email_requires_owner_token(client):
    res = await client.post(
        "/api/v1/jarvis/email",
        json={"subject": "Test", "body": "Test body"},
    )
    assert res.status_code == 403


async def test_jarvis_email_accepts_staff_operator_token(client, auth_headers, monkeypatch):
    def _fake_send_raw(**kwargs):
        return True

    monkeypatch.setattr("app.routers.jarvis_router._email.send_raw", _fake_send_raw)

    res = await client.post(
        "/api/v1/jarvis/email",
        json={"subject": "Test", "body": "Test body"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert body.get("ok") is True
