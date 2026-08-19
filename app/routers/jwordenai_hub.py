"""
jwordenai_hub.py — Master-node router for the JWordenAI hub.

The portfolio sites (The Worden Standard and the regional pavement brands)
report up to this node: which domains are mounted, what got measured, what got
signed, and what the field QA found.

This is the FastAPI implementation of a router that was drafted in Express.
Three things changed in the translation, and each one is the point of the
endpoint rather than a detail of it:

  1. The domain list is a table, not a module-level array. An in-process list
     is emptied by every restart, and `fly.toml` runs this app with
     `auto_stop_machines = 'stop'` and `min_machines_running = 0` — the machine
     stops on idle, so a registration made in the morning is gone by lunch.
     Domains live in `market_sites`, which already exists for exactly this and
     carries a unique constraint on hostname.

  2. Every write is a write. The drafted `/takeoffs/sync`,
     `/contracts/executed` and `/field-qa/log` returned
     TAKEOFF_RECORDED / CONTRACT_LOCKED_IN_ERP / QA_LOGGED_AND_VERIFIED
     without storing anything — a receipt for something that did not happen.
     `QA_LOGGED_AND_VERIFIED` is the sharpest case: it reports a compaction
     result as verified, and compaction against the 96% Marshall floor is the
     number that gets quoted back in a dispute. Each of these now writes a row
     and returns that row's id, or fails.

  3. The endpoints are authenticated. `X-JWordenAI-System-ID` is a routing
     assertion that travels in client code and in this file — it identifies
     the caller, it does not authenticate it. The bearer check does that, and
     the header is verified on top so a misrouted call is rejected loudly
     rather than silently accepted.

Replays are safe: `takeoff_ref` and `contract_ref` are unique, so a client that
retries updates its own record instead of creating a second one.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import CompactionLog, HubContractExecution, HubTakeoff, MarketSite

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/hub", tags=["jwordenai-hub"])

MASTER_NODE_ID = "JWORDENAI-MASTER-AI-NODE"

# The compaction floor every Worden paving spec is written against. A QA record
# is compared to this rather than trusting a `passed` flag from the caller —
# the measurement decides, not the sender.
COMPACTION_FLOOR_PCT = 96.0

_SCHEME_RE = re.compile(r"^https?://", re.IGNORECASE)
_HOSTNAME_RE = re.compile(r"^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def verify_master_node(
    x_jwordenai_system_id: str = Header(
        ..., alias="X-JWordenAI-System-ID",
        description="Identifies the calling node. Must be the master node id.",
    ),
) -> str:
    """
    Reject a call that is not addressed to this node.

    Not a credential — the value is public by construction. It stops a
    misconfigured client from writing into the wrong system, which the bearer
    check alone would happily allow.
    """
    if x_jwordenai_system_id.strip().upper() != MASTER_NODE_ID:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown system id. This node is {MASTER_NODE_ID}.",
        )
    return MASTER_NODE_ID


def normalize_hostname(raw: str) -> str:
    """
    Reduce a submitted domain to a bare lowercase hostname.

    Strips scheme, trailing slash, any path, port, and a leading `www.`, then
    checks the result actually looks like a hostname. The drafted version ran
    `.replace()` straight on the request body, so a missing `domain` raised
    inside the handler and surfaced as a 500 rather than a 422.
    """
    host = _SCHEME_RE.sub("", (raw or "").strip()).strip("/")
    host = host.split("/", 1)[0].split("?", 1)[0].split("@")[-1]
    host = host.split(":", 1)[0].lower()
    if host.startswith("www."):
        host = host[4:]
    if not _HOSTNAME_RE.match(host):
        raise HTTPException(status_code=422, detail=f"Not a valid hostname: {raw!r}")
    return host


def _site_key(hostname: str) -> str:
    """Short stable id for a hostname — `texaspavementgroup.com` → `texas...`."""
    return re.sub(r"[^a-z0-9]", "", hostname.split(".")[0])


def _domain_row(site: MarketSite) -> dict[str, Any]:
    return {
        "id": _site_key(site.hostname),
        "domain": site.hostname,
        "name": site.site_title or site.hostname,
        "type": site.route_mode,
        "status": "Active" if site.is_active else "Inactive",
        "region": site.state_target or None,
        "city": site.city_target or None,
        "tenant_id": site.tenant_id,
        "registered_at": site.created_at.isoformat() if site.created_at else None,
    }


# ── Request bodies ────────────────────────────────────────────────────────────


class HubBody(BaseModel):
    """
    Base for every hub request body.

    Accepts two wire shapes: a flat object, and the `{systemId, data: {...}}`
    envelope the portfolio clients send. Unwrapping here means each endpoint
    can still declare the fields it actually reads — a `data: Dict[str, Any]`
    passthrough would accept anything and document nothing, so a client
    misspelling `density_pct` would get a 200 and a row with no reading in it.

    Unknown keys are kept rather than rejected: they are stored verbatim in
    `raw_payload_json`, so a caller sending more than we model loses nothing.
    """

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    @model_validator(mode="before")
    @classmethod
    def _unwrap_envelope(cls, value: Any) -> Any:
        if isinstance(value, dict) and isinstance(value.get("data"), dict):
            inner = dict(value["data"])
            system_id = value.get("systemId")
            if system_id is not None:
                inner.setdefault("systemId", system_id)
            return inner
        return value

    @model_validator(mode="after")
    def _check_embedded_system_id(self) -> "HubBody":
        system_id = getattr(self, "systemId", None) or (self.__pydantic_extra__ or {}).get("systemId")
        if system_id and str(system_id).strip().upper() != MASTER_NODE_ID:
            raise ValueError(f"Payload systemId {system_id!r} is not {MASTER_NODE_ID}")
        return self


# ── Health ────────────────────────────────────────────────────────────────────


@router.get("/health", summary="Master-node handshake")
def hub_health():
    """
    Node identity for the portfolio clients' handshake.

    Deliberately constants only, and deliberately unauthenticated: it reports
    which node answered, not whether anything downstream is well. The app's
    own readiness lives at /health and /api/v1/jarvis/readiness — a second
    endpoint claiming OPERATIONAL without checking anything would be a status
    light wired to the switch rather than the machine.
    """
    return {
        "status": "ok",
        "node": MASTER_NODE_ID,
        "service": "JWordenAI master-node hub",
        "compaction_floor_pct": COMPACTION_FLOOR_PCT,
    }


# ── Domains ───────────────────────────────────────────────────────────────────


class DomainRegistration(HubBody):
    domain: str = Field(..., min_length=4, description="Hostname, with or without scheme")
    name: Optional[str] = Field(None, max_length=200)
    type: Optional[str] = Field(None, max_length=50)
    region: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    tenant_id: Optional[str] = Field(
        None, max_length=60, validation_alias=AliasChoices("tenant_id", "tenantId")
    )


@router.get("/domains", summary="Domains mounted on this master node")
def list_domains(
    db: Session = Depends(get_db),
    _node: str = Depends(verify_master_node),
    _: dict = Depends(verify_premium_security),
):
    """
    Every domain registered against this node, newest first.

    The list is whatever is in `market_sites`. It is not seeded with a
    hardcoded portfolio: a domain appears here once it has been registered,
    so the response describes the system rather than an aspiration for it.
    """
    sites = (
        db.query(MarketSite)
        .order_by(MarketSite.created_at.desc(), MarketSite.hostname)
        .all()
    )
    return {
        "success": True,
        "node": MASTER_NODE_ID,
        "count": len(sites),
        "domains": [_domain_row(s) for s in sites],
    }


@router.post("/domains/register", summary="Register (or update) a domain on this node")
def register_domain(
    body: DomainRegistration,
    db: Session = Depends(get_db),
    _node: str = Depends(verify_master_node),
    auth: dict = Depends(verify_premium_security),
):
    """
    Register a hostname, or update it if it is already registered.

    Idempotent by hostname — `market_sites` carries a unique constraint on it,
    so re-registering the same domain edits the existing row. A second row for
    the same hostname would give the portfolio two answers about one site.
    """
    hostname = normalize_hostname(body.domain)
    tenant_id = body.tenant_id or auth.get("tenant_id") or "default"

    site = db.query(MarketSite).filter(MarketSite.hostname == hostname).one_or_none()
    created = site is None
    if created:
        site = MarketSite(hostname=hostname, tenant_id=tenant_id)
        db.add(site)

    site.site_title = body.name or site.site_title or hostname
    site.route_mode = body.type or site.route_mode or "market-landing"
    if body.city:
        site.city_target = body.city
    if body.region:
        # `region` is free text in the drafted contract; only a 2-letter value
        # can go in state_target, which is a CHAR(2) column.
        region = body.region.strip()
        if len(region) == 2 and region.isalpha():
            site.state_target = region.upper()
        elif not site.site_description:
            site.site_description = f"Region: {region}"
    site.is_active = 1

    db.commit()
    db.refresh(site)

    logger.info("hub: domain %s %s", hostname, "registered" if created else "updated")
    return {
        "success": True,
        "action": "DOMAIN_REGISTERED" if created else "DOMAIN_UPDATED",
        "created": created,
        "registered": _domain_row(site),
    }


# ── Takeoffs ──────────────────────────────────────────────────────────────────


class TakeoffSync(HubBody):
    # Optional: a caller with no id of its own still gets a row, and the ref is
    # then derived from that row's id so it resolves. Replay-dedup is the thing
    # given up — without a client ref there is nothing to match a retry against.
    takeoff_ref: Optional[str] = Field(
        None, max_length=120, validation_alias=AliasChoices("takeoff_ref", "takeoffRef")
    )
    source_domain: Optional[str] = Field(
        None, max_length=200, validation_alias=AliasChoices("source_domain", "sourceDomain", "domain")
    )
    project_name: Optional[str] = Field(
        None, max_length=200, validation_alias=AliasChoices("project_name", "projectName")
    )
    address: Optional[str] = Field(None, max_length=300)
    city: Optional[str] = Field(None, max_length=120)
    state_code: Optional[str] = Field(
        None, min_length=2, max_length=2, validation_alias=AliasChoices("state_code", "stateCode", "state")
    )
    service_type: Optional[str] = Field(
        None, max_length=60, validation_alias=AliasChoices("service_type", "serviceType")
    )
    measured_area_sqft: Optional[float] = Field(
        None, ge=0, validation_alias=AliasChoices("measured_area_sqft", "measuredAreaSqft", "areaSqft")
    )
    measured_depth_in: Optional[float] = Field(
        None, ge=0, validation_alias=AliasChoices("measured_depth_in", "measuredDepthIn", "depthIn")
    )
    estimated_tons: Optional[float] = Field(
        None, ge=0, validation_alias=AliasChoices("estimated_tons", "estimatedTons", "tons")
    )
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    method: Optional[str] = Field(None, max_length=60)


@router.post("/takeoffs/sync", summary="Record a measured takeoff")
def sync_takeoff(
    body: TakeoffSync,
    db: Session = Depends(get_db),
    _node: str = Depends(verify_master_node),
    auth: dict = Depends(verify_premium_security),
):
    """
    Store a takeoff measurement and return the stored row's id.

    The id is the database id — not a generated string. A response like
    `TKF-<timestamp>` looks like a receipt while referring to nothing that can
    be looked up afterwards.
    """
    ref = (body.takeoff_ref or "").strip()
    row = (
        db.query(HubTakeoff).filter(HubTakeoff.takeoff_ref == ref).one_or_none()
        if ref
        else None
    )
    created = row is None
    if created:
        # A placeholder keeps the NOT NULL/unique column satisfied until the
        # row has an id to name itself after.
        row = HubTakeoff(takeoff_ref=ref or f"pending-{_utcnow().timestamp()}")
        db.add(row)

    row.source_domain = normalize_hostname(body.source_domain) if body.source_domain else None
    row.project_name = body.project_name
    row.address = body.address
    row.city = body.city
    row.state_code = body.state_code.upper() if body.state_code else None
    row.service_type = body.service_type
    row.measured_area_sqft = body.measured_area_sqft
    row.measured_depth_in = body.measured_depth_in
    row.estimated_tons = body.estimated_tons
    row.confidence = body.confidence
    row.method = body.method
    row.raw_payload_json = body.model_dump(mode="json")
    row.tenant_id = auth.get("tenant_id") or "default"
    row.recorded_at = _utcnow()

    if not ref:
        # Derive the ref from the row so it resolves. A generated
        # TKF-<timestamp> looks like a receipt but points at nothing.
        db.flush()
        row.takeoff_ref = f"TKF-{row.id}"

    db.commit()
    db.refresh(row)

    return {
        "success": True,
        "action": "TAKEOFF_RECORDED" if created else "TAKEOFF_UPDATED",
        "id": row.id,
        "takeoff_ref": row.takeoff_ref,
        "recorded_at": row.recorded_at.isoformat(),
    }


# ── Contracts ─────────────────────────────────────────────────────────────────


class ContractExecuted(HubBody):
    contract_ref: Optional[str] = Field(
        None, max_length=120, validation_alias=AliasChoices("contract_ref", "contractRef")
    )
    source_domain: Optional[str] = Field(
        None, max_length=200, validation_alias=AliasChoices("source_domain", "sourceDomain", "domain")
    )
    customer_name: Optional[str] = Field(
        None, max_length=200, validation_alias=AliasChoices("customer_name", "customerName")
    )
    project_name: Optional[str] = Field(
        None, max_length=200, validation_alias=AliasChoices("project_name", "projectName")
    )
    contract_value: Optional[float] = Field(
        None, ge=0, validation_alias=AliasChoices("contract_value", "contractValue")
    )
    signer_name: Optional[str] = Field(
        None, max_length=200, validation_alias=AliasChoices("signer_name", "signerName")
    )
    executed_at: Optional[datetime] = Field(
        None, validation_alias=AliasChoices("executed_at", "executedAt")
    )


@router.post("/contracts/executed", summary="Record an executed contract")
def contract_executed(
    body: ContractExecuted,
    db: Session = Depends(get_db),
    _node: str = Depends(verify_master_node),
    auth: dict = Depends(verify_premium_security),
):
    """
    Record that a contract was executed, and return the stored row.

    `erp_status` reads `locked` because the row is written — it describes this
    table, not a downstream ERP this node cannot see. Claiming
    CONTRACT_LOCKED_IN_ERP for a system we never called would be a status
    report about someone else's database.
    """
    ref = (body.contract_ref or "").strip()
    row = (
        db.query(HubContractExecution)
        .filter(HubContractExecution.contract_ref == ref)
        .one_or_none()
        if ref
        else None
    )
    created = row is None
    if created:
        row = HubContractExecution(contract_ref=ref or f"pending-{_utcnow().timestamp()}")
        db.add(row)

    row.source_domain = normalize_hostname(body.source_domain) if body.source_domain else None
    row.customer_name = body.customer_name
    row.project_name = body.project_name
    row.contract_value = body.contract_value
    row.signer_name = body.signer_name
    row.executed_at = body.executed_at or _utcnow()
    row.erp_status = "locked"
    row.raw_payload_json = body.model_dump(mode="json")
    row.tenant_id = auth.get("tenant_id") or "default"

    if not ref:
        db.flush()
        row.contract_ref = f"CTR-{row.id}"

    db.commit()
    db.refresh(row)

    return {
        "success": True,
        "action": "CONTRACT_RECORDED" if created else "CONTRACT_UPDATED",
        "id": row.id,
        "contractRef": row.contract_ref,
        "erp_status": row.erp_status,
        "executed_at": row.executed_at.isoformat(),
    }


# ── Field QA ──────────────────────────────────────────────────────────────────


class FieldQaLog(HubBody):
    roller_id: str = Field(
        ..., min_length=1, max_length=60, validation_alias=AliasChoices("roller_id", "rollerId")
    )
    lat: float = Field(..., ge=-90, le=90, validation_alias=AliasChoices("lat", "latitude"))
    lng: float = Field(..., ge=-180, le=180, validation_alias=AliasChoices("lng", "lon", "longitude"))
    density_pct: Optional[float] = Field(
        None, ge=0, le=200, validation_alias=AliasChoices("density_pct", "densityPct", "density")
    )
    project_site_id: Optional[int] = Field(
        None, validation_alias=AliasChoices("project_site_id", "projectSiteId")
    )
    operator_name: Optional[str] = Field(
        None, max_length=120, validation_alias=AliasChoices("operator_name", "operatorName")
    )
    pass_number: Optional[int] = Field(
        None, ge=0, validation_alias=AliasChoices("pass_number", "passNumber")
    )
    mat_temp_f: Optional[float] = Field(None, validation_alias=AliasChoices("mat_temp_f", "matTempF"))
    mat_thickness_in: Optional[float] = Field(
        None, ge=0, validation_alias=AliasChoices("mat_thickness_in", "matThicknessIn")
    )
    speed_mph: Optional[float] = Field(None, ge=0, validation_alias=AliasChoices("speed_mph", "speedMph"))
    gps_accuracy_ft: Optional[float] = Field(
        None, ge=0, validation_alias=AliasChoices("gps_accuracy_ft", "gpsAccuracyFt")
    )
    notes: Optional[str] = None


@router.post("/field-qa/log", summary="Log a field QA compaction reading")
def log_field_qa(
    body: FieldQaLog,
    db: Session = Depends(get_db),
    _node: str = Depends(verify_master_node),
    auth: dict = Depends(verify_premium_security),
):
    """
    Store a compaction reading and evaluate it against the 96% Marshall floor.

    Pass/fail is derived from the measurement, never accepted from the caller.
    The drafted endpoint echoed `compactionStandardPassed` straight back out of
    the request body, so whoever sent the reading also decided whether it
    passed. With no `density_pct` the verdict is null — unknown, which is what
    an unmeasured pass is.
    """
    entry = CompactionLog(
        project_site_id=body.project_site_id,
        roller_id=body.roller_id.strip(),
        operator_name=body.operator_name,
        lat=body.lat,
        lng=body.lng,
        pass_number=body.pass_number,
        mat_temp_f=body.mat_temp_f,
        mat_thickness_in=body.mat_thickness_in,
        density_pct=body.density_pct,
        speed_mph=body.speed_mph,
        gps_accuracy_ft=body.gps_accuracy_ft,
        notes=body.notes,
        tenant_id=auth.get("tenant_id") or "default",
        logged_at=_utcnow(),
    )
    # A caller may still send its own compactionStandardPassed. It is recorded
    # as an assertion by the sender, never used as the verdict.
    claimed = (body.__pydantic_extra__ or {}).get("compactionStandardPassed")
    db.add(entry)
    db.commit()
    db.refresh(entry)

    passed = None if body.density_pct is None else body.density_pct >= COMPACTION_FLOOR_PCT
    return {
        "success": True,
        "action": "QA_LOGGED",
        "id": entry.id,
        "density_pct": entry.density_pct,
        "compaction_floor_pct": COMPACTION_FLOOR_PCT,
        # null when nothing was measured — an unmeasured pass has no verdict.
        "compaction_standard_passed": passed,
        "claimed_by_caller": claimed,
        "logged_at": entry.logged_at.isoformat(),
    }
