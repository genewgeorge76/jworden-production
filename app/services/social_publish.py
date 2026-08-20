"""
social_publish.py — Where a queued post actually goes out, or honestly doesn't.

Each platform is a driver that answers two questions: is it configured, and
can it publish. A driver that is not configured says so with the name of the
missing key. It does not pretend to succeed, and a post it cannot send stays
queued with the reason attached rather than being marked published and lost.

On the platforms that are not implemented here — Meta, LinkedIn, X, TikTok —
the honest status is `unavailable`, not a stub that posts nowhere. Every one
of them requires a developer app, business verification and in most cases a
platform review before a single API call will be accepted; X additionally
requires a paid tier to write. None of that can be arranged from inside this
codebase, and writing the HTTP call before the account exists produces code
whose request shape has never been checked against a live endpoint. Each
driver carries what it would actually take, so the work is visible instead of
looking done.

`export` is always available and needs no credentials at all. It hands back
the approved text and the media list for someone to paste into the app on
their phone. That is not a placeholder for the API drivers — it is how a
contractor with no Meta developer account posts today, and it is subject to
exactly the same claim guardrail as an automated send.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from app.services import runtime_config as _cfg


@dataclass
class DriverStatus:
    platform: str
    available: bool
    configured: bool
    missing_keys: list[str] = field(default_factory=list)
    requires: str = ""
    # False until a send has actually succeeded against a live account. A
    # configured driver is not a proven one, and the status readout should not
    # imply a test that has never run.
    verified_live: bool = False

    def as_dict(self) -> dict:
        return {
            "platform":      self.platform,
            "available":     self.available,
            "configured":    self.configured,
            "missing_keys":  self.missing_keys,
            "requires":      self.requires,
            "verified_live": self.verified_live,
        }


@dataclass
class PublishResult:
    ok: bool
    reason: str = ""
    external_post_id: Optional[str] = None
    external_url: Optional[str] = None
    payload: Optional[dict] = None


# ── Drivers ──────────────────────────────────────────────────────────────────
#
# Endpoints and field names below are taken from each platform's current
# documentation, checked 2026-08-20:
#   Facebook Pages   POST graph.facebook.com/v25.0/{page-id}/feed   (message)
#   Instagram        POST graph.instagram.com/{ver}/{ig-id}/media then /media_publish
#   LinkedIn         POST api.linkedin.com/rest/posts               (commentary)
#   X                POST api.x.com/2/tweets                        (text)
#
# None of them has been exercised against a live account from here, because
# none of the accounts exist yet. `verified_live` says so on every driver
# rather than letting a green status imply a test that never happened. The
# first real send is the verification; failures come back with the platform's
# own error text attached to the post, not swallowed.


def _first_public_image(post) -> Optional[str]:
    """
    A publicly reachable https image URL, or None.

    Instagram will only ingest an image it can fetch itself, so a local
    filename is not a candidate. Returning None lets the driver refuse with a
    precise reason instead of posting a broken container.
    """
    for item in (getattr(post, "media_json", None) or []):
        url = item if isinstance(item, str) else (item or {}).get("url")
        if isinstance(url, str) and url.startswith("https://"):
            return url
    return None


def _graph_version() -> str:
    return _cfg.get("GRAPH_API_VERSION") or "v25.0"


async def _post_json(url: str, *, headers: dict, json_body: Optional[dict] = None,
                     data: Optional[dict] = None, timeout: float = 20.0):
    import httpx
    async with httpx.AsyncClient(timeout=timeout) as c:
        return await c.post(url, headers=headers, json=json_body, data=data)


def _fail(resp) -> str:
    return f"HTTP {resp.status_code}: {resp.text[:400]}"


# ── export ───────────────────────────────────────────────────────────────────

def _export_status() -> DriverStatus:
    return DriverStatus(
        platform="export", available=True, configured=True, verified_live=True,
        requires="Nothing. Returns the approved text to post by hand.",
    )


async def _export_publish(post, account=None) -> PublishResult:  # noqa: ARG001
    """Hand the copy back. Nothing leaves the building."""
    return PublishResult(
        ok=True,
        payload={
            "body":  post.body,
            "media": post.media_json or [],
            "link":  post.link_url or _cfg.get("SOCIAL_CTA_URL") or None,
            "note":  "Copy this into the platform app. Nothing was transmitted.",
        },
    )


# ── Google Business Profile ──────────────────────────────────────────────────

_GBP_KEYS = ("GBP_OAUTH_TOKEN", "GBP_ACCOUNT_ID")


def _gbp_status() -> DriverStatus:
    missing = [k for k in _GBP_KEYS if not _cfg.get(k)]
    return DriverStatus(
        platform="gbp", available=True, configured=not missing,
        missing_keys=missing,
        requires="A Google Business Profile OAuth token and the numeric account id.",
    )


async def _gbp_publish(post, account=None) -> PublishResult:
    status = _gbp_status()
    if not status.configured:
        return PublishResult(ok=False, reason=f"not configured: {', '.join(status.missing_keys)} not set")

    location_id = getattr(account, "external_id", None) if account else None
    location_id = location_id or _cfg.get("GBP_LOCATION_ID")
    if not location_id:
        return PublishResult(
            ok=False,
            reason="no GBP location id — set it on the account row or as GBP_LOCATION_ID",
        )

    from app.services.gbp_automation import push_gbp_post

    result = await push_gbp_post(location_id, post.body)
    if not result.get("ok"):
        return PublishResult(ok=False, reason=str(result.get("reason"))[:400])
    data = result.get("data") or {}
    return PublishResult(ok=True, external_post_id=str(data.get("name") or "") or None,
                         external_url=str(data.get("searchUrl") or "") or None, payload=data)


# ── Facebook Page ────────────────────────────────────────────────────────────

_FB_KEYS = ("META_PAGE_ACCESS_TOKEN",)


def _facebook_status() -> DriverStatus:
    missing = [k for k in _FB_KEYS if not _cfg.get(k)]
    return DriverStatus(
        platform="facebook", available=True, configured=not missing,
        missing_keys=missing,
        requires="A Meta app with pages_manage_posts granted through App Review, "
                 "Business verification, and a Page access token. Set "
                 "META_PAGE_ACCESS_TOKEN; put the Page id on the account row "
                 "(external_id) or in META_PAGE_ID.",
    )


async def _facebook_publish(post, account=None) -> PublishResult:
    status = _facebook_status()
    if not status.configured:
        return PublishResult(ok=False, reason=f"not configured: {', '.join(status.missing_keys)} not set")

    page_id = (getattr(account, "external_id", None) if account else None) or _cfg.get("META_PAGE_ID")
    if not page_id:
        return PublishResult(ok=False, reason="no Facebook Page id — set the account's "
                                              "external_id or META_PAGE_ID")

    token = _cfg.get("META_PAGE_ACCESS_TOKEN")
    base = f"https://graph.facebook.com/{_graph_version()}/{page_id}"
    image = _first_public_image(post)

    # A photo post carries the caption itself; posting both would double it.
    if image:
        url, form = f"{base}/photos", {"url": image, "caption": post.body,
                                       "access_token": token}
    else:
        url, form = f"{base}/feed", {"message": post.body, "access_token": token}

    try:
        resp = await _post_json(url, headers={}, data=form)
    except Exception as exc:  # noqa: BLE001
        return PublishResult(ok=False, reason=str(exc)[:400])

    if resp.status_code >= 400:
        return PublishResult(ok=False, reason=_fail(resp))

    body = resp.json()
    post_id = body.get("post_id") or body.get("id")
    return PublishResult(
        ok=True, external_post_id=str(post_id) if post_id else None,
        external_url=f"https://www.facebook.com/{post_id}" if post_id else None,
        payload=body,
    )


# ── Instagram ────────────────────────────────────────────────────────────────

_IG_KEYS = ("IG_ACCESS_TOKEN",)


def _instagram_status() -> DriverStatus:
    missing = [k for k in _IG_KEYS if not _cfg.get(k)]
    return DriverStatus(
        platform="instagram", available=True, configured=not missing,
        missing_keys=missing,
        requires="A Meta app with instagram_content_publish granted through App "
                 "Review, an Instagram professional account, and a token. Every "
                 "post needs a publicly reachable JPEG URL — Instagram fetches "
                 "the image itself and cannot be handed a local file. Capped at "
                 "100 published posts per rolling 24 hours.",
    )


async def _instagram_publish(post, account=None) -> PublishResult:
    status = _instagram_status()
    if not status.configured:
        return PublishResult(ok=False, reason=f"not configured: {', '.join(status.missing_keys)} not set")

    ig_id = (getattr(account, "external_id", None) if account else None) or _cfg.get("IG_USER_ID")
    if not ig_id:
        return PublishResult(ok=False, reason="no Instagram user id — set the account's "
                                              "external_id or IG_USER_ID")

    image = _first_public_image(post)
    if not image:
        return PublishResult(
            ok=False,
            reason="Instagram requires an image. This post has no publicly "
                   "reachable https image URL, so there is nothing to publish.",
        )

    token = _cfg.get("IG_ACCESS_TOKEN")
    base = f"https://graph.instagram.com/{_graph_version()}/{ig_id}"

    try:
        created = await _post_json(f"{base}/media", headers={},
                                   data={"image_url": image, "caption": post.body,
                                         "access_token": token})
        if created.status_code >= 400:
            return PublishResult(ok=False, reason=f"container: {_fail(created)}")
        container_id = (created.json() or {}).get("id")
        if not container_id:
            return PublishResult(ok=False, reason="container: no id in response")

        published = await _post_json(f"{base}/media_publish", headers={},
                                     data={"creation_id": container_id,
                                           "access_token": token})
    except Exception as exc:  # noqa: BLE001
        return PublishResult(ok=False, reason=str(exc)[:400])

    if published.status_code >= 400:
        return PublishResult(ok=False, reason=f"publish: {_fail(published)}")

    body = published.json()
    media_id = body.get("id")
    return PublishResult(ok=True, external_post_id=str(media_id) if media_id else None,
                         payload=body)


# ── LinkedIn ─────────────────────────────────────────────────────────────────

_LI_KEYS = ("LINKEDIN_ACCESS_TOKEN",)


def _linkedin_status() -> DriverStatus:
    missing = [k for k in _LI_KEYS if not _cfg.get(k)]
    return DriverStatus(
        platform="linkedin", available=True, configured=not missing,
        missing_keys=missing,
        requires="A LinkedIn app with Community Management API access (granted by "
                 "application, not self-serve) and the w_organization_social "
                 "scope. Set LINKEDIN_ACCESS_TOKEN; the organization URN goes on "
                 "the account row or in LINKEDIN_ORG_URN.",
    )


async def _linkedin_publish(post, account=None) -> PublishResult:
    status = _linkedin_status()
    if not status.configured:
        return PublishResult(ok=False, reason=f"not configured: {', '.join(status.missing_keys)} not set")

    author = (getattr(account, "external_id", None) if account else None) or _cfg.get("LINKEDIN_ORG_URN")
    if not author:
        return PublishResult(ok=False, reason="no LinkedIn organization URN — set the "
                                              "account's external_id or LINKEDIN_ORG_URN")
    if not str(author).startswith("urn:li:"):
        return PublishResult(ok=False, reason=f"author must be a URN like "
                                              f"urn:li:organization:123, got {author!r}")

    # LinkedIn requires an explicit API version header in YYYYMM form and
    # sunsets old ones on a schedule, so it is configurable rather than frozen.
    version = _cfg.get("LINKEDIN_API_VERSION") or "202608"
    headers = {
        "Authorization":            f"Bearer {_cfg.get('LINKEDIN_ACCESS_TOKEN')}",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version":          version,
        "Content-Type":              "application/json",
    }
    payload = {
        "author": author,
        "commentary": post.body,
        "visibility": "PUBLIC",
        "distribution": {
            "feedDistribution": "MAIN_FEED",
            "targetEntities": [],
            "thirdPartyDistributionChannels": [],
        },
        "lifecycleState": "PUBLISHED",
        "isReshareDisabledByAuthor": False,
    }

    try:
        resp = await _post_json("https://api.linkedin.com/rest/posts",
                                headers=headers, json_body=payload)
    except Exception as exc:  # noqa: BLE001
        return PublishResult(ok=False, reason=str(exc)[:400])

    if resp.status_code >= 400:
        return PublishResult(ok=False, reason=_fail(resp))

    # The post URN comes back in a header, not the body.
    urn = resp.headers.get("x-restli-id") or resp.headers.get("X-RestLi-Id")
    return PublishResult(
        ok=True, external_post_id=urn,
        external_url=f"https://www.linkedin.com/feed/update/{urn}/" if urn else None,
        payload={"status_code": resp.status_code, "urn": urn},
    )


# ── X ────────────────────────────────────────────────────────────────────────

_X_KEYS = ("X_ACCESS_TOKEN",)


def _x_status() -> DriverStatus:
    missing = [k for k in _X_KEYS if not _cfg.get(k)]
    return DriverStatus(
        platform="x", available=True, configured=not missing,
        missing_keys=missing,
        requires="An X developer account on a paid tier — the free tier cannot "
                 "post — and an OAuth 2.0 user-context access token for the "
                 "posting account. X documents OAuth 1.0a as the primary method "
                 "for this endpoint; 2.0 user context is the supported "
                 "alternative and is what this sends.",
    )


async def _x_publish(post, account=None) -> PublishResult:  # noqa: ARG001
    status = _x_status()
    if not status.configured:
        return PublishResult(ok=False, reason=f"not configured: {', '.join(status.missing_keys)} not set")

    text = post.body or ""
    if len(text) > 280:
        return PublishResult(
            ok=False,
            reason=f"post is {len(text)} characters; X accepts 280. Compose for "
                   "platform 'x' so the limit applies at draft time.",
        )

    headers = {
        "Authorization": f"Bearer {_cfg.get('X_ACCESS_TOKEN')}",
        "Content-Type":  "application/json",
    }
    try:
        resp = await _post_json("https://api.x.com/2/tweets", headers=headers,
                                json_body={"text": text})
    except Exception as exc:  # noqa: BLE001
        return PublishResult(ok=False, reason=str(exc)[:400])

    if resp.status_code >= 400:
        return PublishResult(ok=False, reason=_fail(resp))

    data = (resp.json() or {}).get("data") or {}
    tweet_id = data.get("id")
    return PublishResult(
        ok=True, external_post_id=str(tweet_id) if tweet_id else None,
        external_url=f"https://x.com/i/status/{tweet_id}" if tweet_id else None,
        payload=data,
    )


# ── TikTok ───────────────────────────────────────────────────────────────────

def _tiktok_status() -> DriverStatus:
    return DriverStatus(
        platform="tiktok", available=False, configured=False,
        requires="TikTok's Content Posting API publishes video. There is no video "
                 "asset anywhere in this system to publish — job records carry "
                 "still photos. Wiring the call would produce an endpoint that "
                 "can only ever fail. This needs a video pipeline first, not a "
                 "credential.",
    )


async def _tiktok_publish(post, account=None) -> PublishResult:  # noqa: ARG001
    return PublishResult(ok=False, reason=_tiktok_status().requires)


DRIVERS = {
    "export":    (_export_status,    _export_publish),
    "gbp":       (_gbp_status,       _gbp_publish),
    "facebook":  (_facebook_status,  _facebook_publish),
    "instagram": (_instagram_status, _instagram_publish),
    "linkedin":  (_linkedin_status,  _linkedin_publish),
    "x":         (_x_status,         _x_publish),
    "tiktok":    (_tiktok_status,    _tiktok_publish),
}

PLATFORMS = tuple(DRIVERS)


def status_all() -> list[dict]:
    return [status().as_dict() for status, _ in DRIVERS.values()]


def status_for(platform: str) -> Optional[DriverStatus]:
    entry = DRIVERS.get((platform or "").lower())
    return entry[0]() if entry else None


async def publish(post, account=None) -> PublishResult:
    entry = DRIVERS.get((getattr(post, "platform", "") or "").lower())
    if not entry:
        return PublishResult(ok=False, reason=f"unknown platform {post.platform!r}")
    return await entry[1](post, account)
