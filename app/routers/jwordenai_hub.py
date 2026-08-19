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
from ..services import pavement_technologies
from ..database import get_db
from ..models import CompactionLog, HubContractExecution, HubTakeoff, MarketSite

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/hub", tags=["jwordenai-hub"])

MASTER_NODE_ID = "JWORDENAI-MASTER-AI-NODE"

# Acceptance constants come from the verified technology suite, so the floor
# the QA path enforces and the floor Jarvis quotes cannot drift apart.
COMPACTION_FLOOR_PCT = pavement_technologies.COMPACTION_FLOOR_PCT

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
def hub_health(db: Session = Depends(get_db)):
    """
    Node identity and registered-domain count, for the clients' handshake.

    Unauthenticated, and deliberately not reporting OPERATIONAL. The app's own
    readiness lives at /health and /api/v1/jarvis/readiness — a second endpoint
    claiming health without checking anything is a status light wired to the
    switch rather than the machine. `connected_domains` is a count of rows, so
    it drops to 0 if the registry is empty instead of reporting the length of a
    hardcoded list.
    """
    try:
        registered = db.query(MarketSite).count()
    except Exception as exc:  # noqa: BLE001
        logger.warning("hub: domain count unavailable: %s", exc)
        registered = None
    return {
        "status": "ok",
        "node": MASTER_NODE_ID,
        "service": "JWordenAI master-node hub",
        "compaction_floor_pct": COMPACTION_FLOOR_PCT,
        "connected_domains": registered,
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


def _upsert_domain(db: Session, body: "DomainRegistration", auth: dict) -> dict[str, Any]:
    """
    Create or update one registry row. Flushes but does not commit, so a bulk
    call commits once and a single call keeps its own transaction boundary.
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
        # fits state_target, which is a CHAR(2) column. "Texas (DFW/HOU/ATX/SAT)"
        # is kept as description rather than truncated into something wrong.
        region = body.region.strip()
        if len(region) == 2 and region.isalpha():
            site.state_target = region.upper()
        else:
            site.site_description = f"Region: {region}"
    site.is_active = 1
    db.flush()
    return {"created": created, "site": site, "row": _domain_row(site)}


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
    result = _upsert_domain(db, body, auth)
    db.commit()
    site = result["site"]
    db.refresh(site)

    logger.info(
        "hub: domain %s %s", site.hostname, "registered" if result["created"] else "updated"
    )
    return {
        "success": True,
        "action": "DOMAIN_REGISTERED" if result["created"] else "DOMAIN_UPDATED",
        "created": result["created"],
        "registered": _domain_row(site),
    }


class BulkDomainRegistration(HubBody):
    domains: list[DomainRegistration] = Field(..., min_length=1, max_length=200)


@router.post("/domains/bulk-register", summary="Register several domains in one call")
def bulk_register_domains(
    body: BulkDomainRegistration,
    db: Session = Depends(get_db),
    _node: str = Depends(verify_master_node),
    auth: dict = Depends(verify_premium_security),
):
    """
    Seed or update the registry in one request.

    Each entry goes through the same path as a single registration, so a bad
    hostname in the middle of a batch fails that entry and is reported, rather
    than aborting the batch or being silently skipped. The response says which
    were created, which updated, and which were rejected and why.
    """
    created: list[dict[str, Any]] = []
    updated: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []

    for entry in body.domains:
        try:
            result = _upsert_domain(db, entry, auth)
        except HTTPException as exc:
            rejected.append({"domain": entry.domain, "reason": exc.detail})
            continue
        (created if result["created"] else updated).append(result["row"])

    db.commit()
    return {
        "success": True,
        "created": len(created),
        "updated": len(updated),
        "rejected": len(rejected),
        "domains": created + updated,
        "rejections": rejected,
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
    icmv: Optional[float] = Field(
        None, ge=0, validation_alias=AliasChoices("icmv", "ICMV", "stiffness")
    )
    thermal_differential_f: Optional[float] = Field(
        None, ge=0,
        validation_alias=AliasChoices("thermal_differential_f", "thermalDifferentialF"),
        description="Temperature spread across the mat — what Tex-244-F grades.",
    )
    density_method: Optional[str] = Field(
        None, max_length=40, validation_alias=AliasChoices("density_method", "densityMethod")
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
        icmv=body.icmv,
        thermal_differential_f=body.thermal_differential_f,
        density_method=body.density_method,
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
        "icmv": entry.icmv,
        "density_method": entry.density_method,
        "thermal_differential_f": entry.thermal_differential_f,
        # Tex-244-F grades on the differential: >25 F moderate, >50 F severe.
        "thermal_segregation": pavement_technologies.grade_thermal_segregation(
            body.thermal_differential_f
        ),
        "logged_at": entry.logged_at.isoformat(),
    }


# ── Read-back ─────────────────────────────────────────────────────────────────
#
# The drafted router kept INGESTED_TAKEOFFS / EXECUTED_CONTRACTS / PLANT_QA_LOGS
# as module arrays with nothing to read them. Pushing records into a store you
# cannot query is the same as not storing them — these are the endpoints that
# make the writes worth making.


def _page(limit: int, offset: int) -> tuple[int, int]:
    return max(1, min(limit, 500)), max(0, offset)


@router.get("/takeoffs", summary="Takeoffs recorded on this node")
def list_takeoffs(
    limit: int = 50,
    offset: int = 0,
    source_domain: Optional[str] = None,
    db: Session = Depends(get_db),
    _node: str = Depends(verify_master_node),
    _: dict = Depends(verify_premium_security),
):
    limit, offset = _page(limit, offset)
    q = db.query(HubTakeoff)
    if source_domain:
        q = q.filter(HubTakeoff.source_domain == normalize_hostname(source_domain))
    total = q.count()
    rows = q.order_by(HubTakeoff.recorded_at.desc(), HubTakeoff.id.desc()).limit(limit).offset(offset).all()
    return {
        "success": True,
        "total": total,
        "limit": limit,
        "offset": offset,
        "takeoffs": [
            {
                "id": r.id,
                "takeoff_ref": r.takeoff_ref,
                "source_domain": r.source_domain,
                "project_name": r.project_name,
                "city": r.city,
                "state_code": r.state_code,
                "service_type": r.service_type,
                "measured_area_sqft": r.measured_area_sqft,
                "measured_depth_in": r.measured_depth_in,
                "estimated_tons": r.estimated_tons,
                "confidence": r.confidence,
                "method": r.method,
                "recorded_at": r.recorded_at.isoformat() if r.recorded_at else None,
            }
            for r in rows
        ],
    }


@router.get("/contracts", summary="Executed contracts recorded on this node")
def list_contracts(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    _node: str = Depends(verify_master_node),
    _: dict = Depends(verify_premium_security),
):
    limit, offset = _page(limit, offset)
    q = db.query(HubContractExecution)
    total = q.count()
    rows = (
        q.order_by(HubContractExecution.executed_at.desc(), HubContractExecution.id.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    return {
        "success": True,
        "total": total,
        "limit": limit,
        "offset": offset,
        # Deliberately no "total contract value" roll-up: contract_value is
        # nullable, and summing a column with holes in it produces a portfolio
        # figure that reads as complete when it is not.
        "contracts": [
            {
                "id": r.id,
                "contract_ref": r.contract_ref,
                "source_domain": r.source_domain,
                "customer_name": r.customer_name,
                "project_name": r.project_name,
                "contract_value": r.contract_value,
                "signer_name": r.signer_name,
                "erp_status": r.erp_status,
                "executed_at": r.executed_at.isoformat() if r.executed_at else None,
            }
            for r in rows
        ],
    }


@router.get("/field-qa", summary="Field QA compaction readings recorded on this node")
def list_field_qa(
    limit: int = 50,
    offset: int = 0,
    project_site_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _node: str = Depends(verify_master_node),
    _: dict = Depends(verify_premium_security),
):
    """
    Readings newest first, each carrying its own pass/fail against the 96%
    floor. The verdict is recomputed here from the stored density rather than
    persisted alongside it, so changing the floor cannot leave old rows
    asserting a verdict the current standard disagrees with.
    """
    limit, offset = _page(limit, offset)
    q = db.query(CompactionLog)
    if project_site_id is not None:
        q = q.filter(CompactionLog.project_site_id == project_site_id)
    total = q.count()
    rows = q.order_by(CompactionLog.logged_at.desc(), CompactionLog.id.desc()).limit(limit).offset(offset).all()
    return {
        "success": True,
        "total": total,
        "limit": limit,
        "offset": offset,
        "compaction_floor_pct": COMPACTION_FLOOR_PCT,
        "readings": [
            {
                "id": r.id,
                "roller_id": r.roller_id,
                "operator_name": r.operator_name,
                "project_site_id": r.project_site_id,
                "lat": r.lat,
                "lng": r.lng,
                "pass_number": r.pass_number,
                "mat_temp_f": r.mat_temp_f,
                "mat_thickness_in": r.mat_thickness_in,
                "density_pct": r.density_pct,
                "density_method": r.density_method,
                "icmv": r.icmv,
                "thermal_differential_f": r.thermal_differential_f,
                "thermal_segregation": pavement_technologies.grade_thermal_segregation(
                    r.thermal_differential_f
                ),
                "compaction_standard_passed": (
                    None if r.density_pct is None else r.density_pct >= COMPACTION_FLOOR_PCT
                ),
                "logged_at": r.logged_at.isoformat() if r.logged_at else None,
            }
            for r in rows
        ],
    }


# ── Capabilities ──────────────────────────────────────────────────────────────


@router.get("/capabilities", summary="Verified civil technology suite with citations")
def capabilities(include_corrections: bool = True):
    """
    The six technologies with their verified standard designations, so every
    portfolio site renders the same spec text from one source instead of each
    keeping its own copy to drift.

    Unauthenticated: these are public standards and the spec pages that show
    them are public. Nothing here is operational data.

    `corrections` lists the claims from the source document that did not
    survive checking against the issuing body, with what each should be. They
    are published rather than silently fixed — anyone holding the earlier
    version needs to know it was wrong, and which part.
    """
    payload: dict[str, Any] = {
        "success": True,
        "node": MASTER_NODE_ID,
        "count": len(pavement_technologies.TECHNOLOGIES),
        "technologies": pavement_technologies.TECHNOLOGIES,
        "acceptance": {
            "compaction_floor_pct": pavement_technologies.COMPACTION_FLOOR_PCT,
            "thermal_differential_moderate_f": pavement_technologies.THERMAL_DIFFERENTIAL_MODERATE_F,
            "thermal_differential_severe_f": pavement_technologies.THERMAL_DIFFERENTIAL_SEVERE_F,
            "aramid_dose_oz_per_ton": pavement_technologies.ARAMID_DOSE_OZ_PER_TON,
            "leed_v4_sr_aged_min": pavement_technologies.LEED_V4_SR_AGED_MIN,
            "leed_v4_sr_initial_min": pavement_technologies.LEED_V4_SR_INITIAL_MIN,
        },
    }
    if include_corrections:
        payload["corrections"] = pavement_technologies.CORRECTIONS
    return payload


# ── Compatibility mount ───────────────────────────────────────────────────────
#
# The drafted routers use a bare `/api/v1` prefix, so a client written against
# them calls /api/v1/domains rather than /api/v1/hub/domains. Rather than ask
# every portfolio site to change its base path, the same handlers are mounted
# at both. None of the six paths collided with an existing route.
#
# Same functions, so the two mounts cannot drift: there is one implementation
# and two addresses for it. Auth is unchanged — the alias is a path alias, not
# a way in. The drafted routers had no authentication at all, which on
# /contracts/executed means anyone who finds the URL can write contract
# records, so a client moving to these paths still needs its bearer token.

compat_router = APIRouter(prefix="/api/v1", tags=["jwordenai-hub"])

_COMPAT_ROUTES: list[tuple[str, Any, list[str]]] = [
    ("/health", hub_health, ["GET"]),
    ("/capabilities", capabilities, ["GET"]),
    ("/domains", list_domains, ["GET"]),
    ("/domains/register", register_domain, ["POST"]),
    ("/domains/bulk-register", bulk_register_domains, ["POST"]),
    ("/takeoffs/sync", sync_takeoff, ["POST"]),
    ("/takeoffs", list_takeoffs, ["GET"]),
    ("/contracts/executed", contract_executed, ["POST"]),
    ("/contracts", list_contracts, ["GET"]),
    ("/field-qa/log", log_field_qa, ["POST"]),
    ("/field-qa", list_field_qa, ["GET"]),
]

for _path, _endpoint, _methods in _COMPAT_ROUTES:
    compat_router.add_api_route(
        _path,
        _endpoint,
        methods=_methods,
        # Hidden from the schema so the docs show one canonical address per
        # operation; a reader seeing each route twice cannot tell which is real.
        include_in_schema=False,
        operation_id=f"compat_{_endpoint.__name__}",
    )
