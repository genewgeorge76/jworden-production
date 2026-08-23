"""
The AI Content Engine writes, or it refuses. It never fills.

The previous version f-strung one sentence and published it live on the
customer's domain. These tests pin the three properties that stop that from
coming back: it goes through llm_client, it refuses when the model fails, and
what it writes is a draft rather than a live page.
"""

import pytest

from app.services.llm_client import LLMResponse


SITE = "pinned.example"


@pytest.fixture()
def market_site(app_modules):
    _, dbmod = app_modules
    from app.models import MarketSite

    session = dbmod.SessionLocal()
    try:
        session.add(
            MarketSite(
                tenant_id="JWORDEN_HQ",
                hostname=SITE,
                city_target="Roanoke",
                state_target="VA",
                site_title="Roanoke Asphalt",
            )
        )
        session.commit()
    finally:
        session.close()


def _payload(topic="sealcoating timing"):
    return {"hostname": SITE, "topic": topic, "keywords": ["sealcoating", "roanoke"]}


@pytest.mark.anyio
async def test_a_real_article_is_saved_as_a_draft(
    client, auth_headers, market_site, app_modules, monkeypatch
):
    _, dbmod = app_modules
    from app.routers import factory

    monkeypatch.setattr(
        factory.llm_client,
        "chat",
        lambda **kwargs: LLMResponse(
            text=(
                '{"title": "When To Sealcoat In Roanoke", '
                '"excerpt": "Timing matters more than brand.", '
                '"body": "<h2>Timing</h2><p>Surface temperature drives cure.</p>", '
                '"meta_description": "Sealcoating timing for Roanoke lots."}'
            ),
            provider="anthropic",
            model="claude-sonnet-4-6",
        ),
    )

    response = await client.post(
        "/api/v1/factory/blog/generate", headers=auth_headers, json=_payload()
    )
    assert response.status_code == 200, response.text
    body = response.json()

    # A draft, not a live page. The old version published immediately, so the
    # first reader of a generated post was a search engine.
    assert body["status"] == "draft"
    assert body["generated_by"]["provider"] == "anthropic"

    from app.models import BlogPost

    session = dbmod.SessionLocal()
    try:
        post = session.query(BlogPost).filter(BlogPost.id == body["post_id"]).one()
        assert post.status == "draft"
        assert post.published_at is None
        assert post.title == "When To Sealcoat In Roanoke"
        assert "<h2>" in post.body
    finally:
        session.close()


@pytest.mark.anyio
async def test_it_refuses_and_saves_nothing_when_the_model_fails(
    client, auth_headers, market_site, app_modules, monkeypatch
):
    """
    No filler fallback. A fallback that writes something is precisely how the
    old version looked like it worked.
    """
    _, dbmod = app_modules
    from app.routers import factory
    from app.models import BlogPost

    monkeypatch.setattr(
        factory.llm_client,
        "chat",
        lambda **kwargs: LLMResponse(
            text="", provider="none", model="", error=True,
            error_detail="No providers enabled for task 'content'",
        ),
    )

    session = dbmod.SessionLocal()
    try:
        before = session.query(BlogPost).count()
    finally:
        session.close()

    response = await client.post(
        "/api/v1/factory/blog/generate", headers=auth_headers, json=_payload()
    )
    assert response.status_code == 502, response.text
    assert "nothing was saved" in response.json()["detail"].lower()

    session = dbmod.SessionLocal()
    try:
        assert session.query(BlogPost).count() == before
    finally:
        session.close()


@pytest.mark.anyio
async def test_an_unreadable_response_is_refused_not_salvaged(
    client, auth_headers, market_site, monkeypatch
):
    from app.routers import factory

    monkeypatch.setattr(
        factory.llm_client,
        "chat",
        lambda **kwargs: LLMResponse(
            text="Sure! Here's a great article about sealcoating.",
            provider="openai",
            model="gpt-4o",
        ),
    )

    response = await client.post(
        "/api/v1/factory/blog/generate", headers=auth_headers, json=_payload()
    )
    assert response.status_code == 502


@pytest.mark.anyio
async def test_a_fenced_json_response_is_still_read(
    client, auth_headers, market_site, monkeypatch
):
    """Models wrap JSON in ```json fences despite being told not to."""
    from app.routers import factory

    monkeypatch.setattr(
        factory.llm_client,
        "chat",
        lambda **kwargs: LLMResponse(
            text=(
                '```json\n{"title": "Crack Sealing In Winter", "excerpt": "x", '
                '"body": "<p>Cold pours fail.</p>"}\n```'
            ),
            provider="google",
            model="gemini-2.5-pro",
        ),
    )

    response = await client.post(
        "/api/v1/factory/blog/generate", headers=auth_headers, json=_payload()
    )
    assert response.status_code == 200, response.text
    assert response.json()["title"] == "Crack Sealing In Winter"


@pytest.mark.anyio
async def test_publishing_is_a_separate_deliberate_step(
    client, auth_headers, market_site, app_modules, monkeypatch
):
    _, dbmod = app_modules
    from app.routers import factory
    from app.models import BlogPost

    monkeypatch.setattr(
        factory.llm_client,
        "chat",
        lambda **kwargs: LLMResponse(
            text='{"title": "Overlay Or Mill", "excerpt": "x", "body": "<p>Depth decides.</p>"}',
            provider="anthropic", model="claude-sonnet-4-6",
        ),
    )

    generated = await client.post(
        "/api/v1/factory/blog/generate", headers=auth_headers, json=_payload()
    )
    post_id = generated.json()["post_id"]

    published = await client.post(
        f"/api/v1/factory/blog/{post_id}/publish", headers=auth_headers
    )
    assert published.status_code == 200, published.text
    assert published.json()["status"] == "published"

    session = dbmod.SessionLocal()
    try:
        post = session.query(BlogPost).filter(BlogPost.id == post_id).one()
        assert post.status == "published"
        assert post.published_at is not None
    finally:
        session.close()


def test_the_prompt_forbids_inventing_facts():
    """
    Standing instruction on this codebase: no fabricated data. A content
    generator is the easiest place in the system to violate that, so the
    prohibition is asserted rather than trusted to survive edits.
    """
    import inspect
    from app.routers import factory

    source = inspect.getsource(factory.generate_seo_blog)
    assert "Never invent a price" in source
    assert "Do not produce copy that" in source


# ── The endpoints the interface needs ───────────────────────────────────────
#
# POST /factory/sites and POST /factory/blog/generate both existed with no GET
# beside them, so a customer could create a site and generate a post and then
# had no way to see or review either. The review step was unusable, which is
# part of why generation published straight to the live domain.

@pytest.mark.anyio
async def test_a_tenant_can_list_the_sites_it_created(client, auth_headers, market_site):
    response = await client.get("/api/v1/factory/sites", headers=auth_headers)
    assert response.status_code == 200, response.text
    hostnames = [s["hostname"] for s in response.json()["sites"]]
    assert SITE in hostnames


@pytest.mark.anyio
async def test_drafts_can_be_listed_and_read_before_publishing(
    client, auth_headers, market_site, monkeypatch
):
    from app.routers import factory

    monkeypatch.setattr(
        factory.llm_client,
        "chat",
        lambda **kwargs: LLMResponse(
            text=(
                '{"title": "Base Failure Signs", "excerpt": "Alligator cracking.", '
                '"body": "<h2>Signs</h2><p>Alligator cracking means base failure.</p>"}'
            ),
            provider="anthropic", model="claude-sonnet-4-6",
        ),
    )

    generated = await client.post(
        "/api/v1/factory/blog/generate", headers=auth_headers, json=_payload()
    )
    post_id = generated.json()["post_id"]

    listing = await client.get(
        f"/api/v1/factory/blog?hostname={SITE}", headers=auth_headers
    )
    assert listing.status_code == 200, listing.text
    assert any(p["id"] == post_id and p["status"] == "draft" for p in listing.json()["posts"])

    full = await client.get(f"/api/v1/factory/blog/{post_id}", headers=auth_headers)
    assert full.status_code == 200, full.text
    # The body has to come back, or "review before publishing" is a button with
    # nothing behind it.
    assert "<h2>Signs</h2>" in full.json()["post"]["body"]


@pytest.mark.anyio
async def test_one_tenant_cannot_read_another_tenants_draft(
    client, auth_headers, market_site, app_modules, monkeypatch
):
    _, dbmod = app_modules
    from app.routers import factory

    monkeypatch.setattr(
        factory.llm_client,
        "chat",
        lambda **kwargs: LLMResponse(
            text='{"title": "Private", "excerpt": "x", "body": "<p>Mine.</p>"}',
            provider="anthropic", model="claude-sonnet-4-6",
        ),
    )
    generated = await client.post(
        "/api/v1/factory/blog/generate", headers=auth_headers, json=_payload()
    )
    post_id = generated.json()["post_id"]

    # A separate, paid tenant.
    from app.models import Tenant
    from app.services import entitlements

    registration = await client.post(
        "/api/v1/auth/register",
        json={
            "companyName": "Other Paving",
            "email": "other@blueridgesealcoating.example",
            "password": "another-real-password",
            "plan": "pro",
            "industry": "Asphalt Paving",
            "state": "VA",
            "city": "Roanoke",
        },
    )
    other_token = registration.json()["access_token"]

    session = dbmod.SessionLocal()
    try:
        tenant = (
            session.query(Tenant)
            .filter(Tenant.tenant_id == registration.json()["tenant_id"])
            .one()
        )
        entitlements.apply_paid_tier(tenant, "pro")
        session.commit()
    finally:
        session.close()

    # Entitled to the feature, not to this row.
    stolen = await client.get(
        f"/api/v1/factory/blog/{post_id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert stolen.status_code == 404

    published = await client.post(
        f"/api/v1/factory/blog/{post_id}/publish",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert published.status_code == 404
