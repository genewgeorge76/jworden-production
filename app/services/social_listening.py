"""
social_listening.py — Watch X for signals that mean work, using Grok.

Why this does not go through llm_client
───────────────────────────────────────
The router's xAI lane speaks the OpenAI-compatible `/v1/chat/completions`
shape. xAI's server-side search tools — `x_search`, `web_search` — are
documented only on `/v1/responses`, which takes `input` rather than
`messages` and returns an `output` array rather than `choices`. Routing
listening through the chat lane would send a tool block to an endpoint that
does not accept one. So this module holds its own client, and the
`social_signal` lane in `_ROUTES` stays what it is: plain Grok chat.

What counts as a finding
────────────────────────
A citation, and nothing else. The Responses API returns the model's prose in
`output[].content[].text` and the sources it actually consulted in
`annotations` (url + title + the character span they support) and in a flat
`citations` array. This module emits one signal per annotation and treats the
prose as unusable on its own.

That is the whole design. A summarising model asked "what are people saying
about potholes in Richmond" will produce a fluent, specific, entirely
plausible paragraph whether or not the search returned anything — complete
with invented complaints from invented accounts. If the response carries no
annotations, the correct output is zero signals and a stated reason, not a
paragraph. A signal here is a real post someone can click through to and
read, or it does not exist.

Nothing is scored, ranked or converted to a lead automatically. Discovery
proposes; a person decides — the same rule supplier discovery follows, for
the same reason.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Any, Optional

from app.services import runtime_config as _cfg

logger = logging.getLogger(__name__)

RESPONSES_URL = "https://api.x.ai/v1/responses"
DEFAULT_MODEL = "grok-4.6"

# x_search caps handle lists at 20, and allowed/excluded are mutually exclusive.
MAX_HANDLES = 20

# What a paving contractor is actually watching for. Each kind is a prompt
# frame, not a canned answer — the model still has to find real posts.
SIGNAL_KINDS: dict[str, str] = {
    "road_complaints":
        "complaints about potholes, broken pavement, crumbling roads, damaged "
        "parking lots or failing driveways",
    "storm_damage":
        "flooding, washouts, storm damage or freeze-thaw damage affecting "
        "roads, lots or driveways",
    "municipal_projects":
        "announcements of road paving, resurfacing, repaving projects, road "
        "closures for paving work, or paving contracts and bids being let",
    "competitor_activity":
        "posts by or about asphalt paving contractors — new work, complaints, "
        "hiring, expansion",
    "brand_mentions":
        "mentions of the company by name, including complaints and praise",
    "development":
        "new commercial construction, shopping centre, warehouse or subdivision "
        "development that will need paving",
}


class ListeningUnavailable(Exception):
    """No key, or the API refused. Carries the reason; never a fake result."""


@dataclass
class Signal:
    url: str
    title: str
    excerpt: str
    kind: str
    query: str

    def as_dict(self) -> dict:
        return {
            "url": self.url, "title": self.title, "excerpt": self.excerpt,
            "kind": self.kind, "query": self.query,
        }


@dataclass
class ListenResult:
    signals: list[Signal] = field(default_factory=list)
    narrative: str = ""
    uncited_sources: list[str] = field(default_factory=list)
    reason: str = ""
    model: str = ""
    raw: Optional[dict] = None

    def as_dict(self) -> dict:
        return {
            "count":           len(self.signals),
            "signals":         [s.as_dict() for s in self.signals],
            "narrative":       self.narrative,
            "uncited_sources": self.uncited_sources,
            "reason":          self.reason,
            "model":           self.model,
        }


def configured() -> bool:
    return bool(_cfg.get("XAI_API_KEY"))


def _model() -> str:
    return (_cfg.get("XAI_LISTEN_MODEL") or "").strip() or DEFAULT_MODEL


def build_prompt(kind: str, *, place: str, extra: str = "") -> str:
    frame = SIGNAL_KINDS.get(kind)
    if not frame:
        raise ValueError(f"unknown signal kind {kind!r}. Known: {sorted(SIGNAL_KINDS)}")

    parts = [
        f"Search X for recent posts about {frame}",
        f"in or near {place}." if place else ".",
        "List each relevant post you find with a one-line summary of what it says.",
        "Only report posts you actually found in the search results.",
        "If the search returned nothing relevant, say exactly that and list nothing.",
    ]
    if extra:
        parts.append(extra.strip())
    return " ".join(p for p in parts if p)


def build_payload(
    kind: str,
    *,
    place: str,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    allowed_handles: Optional[list[str]] = None,
    excluded_handles: Optional[list[str]] = None,
    extra: str = "",
) -> dict[str, Any]:
    """
    Build the /v1/responses body.

    allowed_x_handles and excluded_x_handles cannot both be set, and each is
    capped at 20 — enforced here so a bad combination fails locally with a
    clear message rather than as a 400 from the platform.
    """
    if allowed_handles and excluded_handles:
        raise ValueError(
            "allowed_handles and excluded_handles cannot both be set — "
            "x_search rejects the combination"
        )
    for name, handles in (("allowed_handles", allowed_handles),
                          ("excluded_handles", excluded_handles)):
        if handles and len(handles) > MAX_HANDLES:
            raise ValueError(f"{name}: {len(handles)} given, x_search allows {MAX_HANDLES}")

    tool: dict[str, Any] = {"type": "x_search"}
    if allowed_handles:
        tool["allowed_x_handles"] = [h.lstrip("@") for h in allowed_handles]
    if excluded_handles:
        tool["excluded_x_handles"] = [h.lstrip("@") for h in excluded_handles]
    if from_date:
        tool["from_date"] = from_date.isoformat()
    if to_date:
        tool["to_date"] = to_date.isoformat()

    return {
        "model": _model(),
        "input": [{"role": "user",
                   "content": build_prompt(kind, place=place, extra=extra)}],
        "tools": [tool],
    }


# ── Response parsing ─────────────────────────────────────────────────────────

def _text_and_annotations(body: dict) -> tuple[str, list[dict]]:
    """Flatten output[].content[] into one text blob and one annotation list."""
    chunks: list[str] = []
    annotations: list[dict] = []
    for item in (body.get("output") or []):
        for content in (item.get("content") or []):
            text = content.get("text")
            if isinstance(text, str):
                # Offsets in annotations are relative to this chunk, so a
                # signal's excerpt is sliced before the chunks are joined.
                for ann in (content.get("annotations") or []):
                    if ann.get("type") != "url_citation":
                        continue
                    url = ann.get("url")
                    if not url:
                        continue
                    start = ann.get("start_index")
                    end = ann.get("end_index")
                    excerpt = ""
                    if isinstance(start, int) and isinstance(end, int) and end > start:
                        excerpt = text[max(0, start):end].strip()
                    annotations.append({
                        "url": url,
                        "title": (ann.get("title") or "").strip(),
                        "excerpt": excerpt,
                    })
                chunks.append(text)
    return "\n".join(chunks).strip(), annotations


def parse(body: dict, *, kind: str, query: str) -> ListenResult:
    """
    Turn an API response into signals.

    A response with prose and no annotations yields zero signals. That is not
    a parsing failure — it is the guard. The prose is retained as `narrative`
    for a human to read, and is never promoted to a finding.
    """
    text, annotations = _text_and_annotations(body)
    flat = [c for c in (body.get("citations") or []) if isinstance(c, str)]

    seen: set[str] = set()
    signals: list[Signal] = []
    for ann in annotations:
        url = ann["url"]
        if url in seen:
            continue
        seen.add(url)
        signals.append(Signal(
            url=url,
            title=ann["title"],
            excerpt=ann["excerpt"],
            kind=kind,
            query=query,
        ))

    # URLs the search touched but that support no span of the answer. Kept
    # visible rather than folded in — they are leads to read, not findings.
    uncited = [c for c in flat if c not in seen]

    reason = ""
    if not signals:
        reason = (
            "no cited posts returned. The model's prose is kept as narrative "
            "but is not reported as findings — an uncited summary of social "
            "posts cannot be distinguished from an invented one."
        )

    return ListenResult(
        signals=signals,
        narrative=text,
        uncited_sources=uncited,
        reason=reason,
        model=str(body.get("model") or _model()),
        raw=body,
    )


# ── The call ─────────────────────────────────────────────────────────────────

async def listen(
    kind: str,
    *,
    place: str,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    allowed_handles: Optional[list[str]] = None,
    excluded_handles: Optional[list[str]] = None,
    extra: str = "",
    timeout: float = 90.0,
) -> ListenResult:
    key = _cfg.get("XAI_API_KEY")
    if not key:
        raise ListeningUnavailable(
            "XAI_API_KEY is not set. Set it via the admin integrations endpoint; "
            "no redeploy is needed."
        )

    payload = build_payload(
        kind, place=place, from_date=from_date, to_date=to_date,
        allowed_handles=allowed_handles, excluded_handles=excluded_handles,
        extra=extra,
    )

    import httpx

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                RESPONSES_URL,
                headers={"Authorization": f"Bearer {key}",
                         "Content-Type": "application/json"},
                json=payload,
            )
    except Exception as exc:  # noqa: BLE001
        raise ListeningUnavailable(f"xAI request failed: {exc}") from exc

    if resp.status_code >= 400:
        raise ListeningUnavailable(
            f"xAI returned HTTP {resp.status_code}: {resp.text[:400]}"
        )

    try:
        body = resp.json()
    except Exception as exc:  # noqa: BLE001
        raise ListeningUnavailable(f"xAI returned a non-JSON body: {exc}") from exc

    return parse(body, kind=kind,
                 query=payload["input"][0]["content"])


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
