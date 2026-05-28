"""
plan_estimator.py — Plan-to-Estimate pipeline.

Accepts one or more plan files (PDF blueprint, civil drawing set, GC takeoff,
photo of hand sketch) and returns a priced estimate by:

  1. Parsing each file with the existing document_intelligence service
     (parse_blueprint for images, parse_contract for PDFs to capture scope).
  2. Extracting takeoff line-items (sqft of asphalt, LF of curb, count of
     ADA pads, etc.) from the parsed scope.
  3. Pricing each line-item against the existing cost catalog (falls back
     to industry-standard unit rates when a catalog match is missing).
  4. Returning a structured estimate: low / mid / high totals, line-by-line
     breakdown, and parsed scope summary.

Routes:
  POST /api/v1/plan-estimator/from-files     — upload N files, get one estimate
  POST /api/v1/plan-estimator/inbound-email  — webhook for SendGrid/Postmark
                                               inbound parse (auto-creates lead)

Max upload: 20 MB per file, 5 files per request.
"""

import logging
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field

from ..core.limiter import limiter
from ..services.document_intelligence import (
    parse_blueprint,
    parse_contract,
    parse_permit_pdf,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/plan-estimator", tags=["plan-estimator"])

_MAX_BYTES = 20 * 1024 * 1024  # 20 MB per file
_MAX_FILES = 8
_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_PDF_TYPES = {"application/pdf"}

# Industry-standard fallback unit rates (USD). Used only when the cost
# catalog has no matching SKU. These are intentionally conservative and
# feed the LOW end of the estimate range.
_FALLBACK_RATES: dict[str, dict[str, Any]] = {
    "asphalt_paving": {"unit": "sqft", "rate": 4.50, "label": "Asphalt paving (3\" lift)"},
    "asphalt_overlay": {"unit": "sqft", "rate": 2.80, "label": "Asphalt overlay (1.5\")"},
    "milling": {"unit": "sqft", "rate": 1.20, "label": "Milling (2\" depth)"},
    "concrete_flatwork": {"unit": "sqft", "rate": 9.00, "label": "Concrete flatwork (4\")"},
    "concrete_apron": {"unit": "sqft", "rate": 11.00, "label": "Concrete apron / approach"},
    "concrete_curb": {"unit": "lf", "rate": 28.00, "label": "Concrete curb & gutter"},
    "sealcoat": {"unit": "sqft", "rate": 0.22, "label": "Sealcoat (2 coats)"},
    "striping_stall": {"unit": "ea", "rate": 8.00, "label": "Parking stall stripe"},
    "striping_lf": {"unit": "lf", "rate": 0.85, "label": "4\" line striping"},
    "ada_pad": {"unit": "ea", "rate": 1850.00, "label": "ADA accessible stall + ramp"},
    "catch_basin": {"unit": "ea", "rate": 2400.00, "label": "Catch basin (set + grate)"},
    "pavers": {"unit": "sqft", "rate": 14.00, "label": "Paver hardscape"},
    "tar_chip": {"unit": "sqft", "rate": 2.50, "label": "Tar & chip surface"},
    "millings_surface": {"unit": "sqft", "rate": 1.80, "label": "Recycled millings surface"},
    "geotextile": {"unit": "sqft", "rate": 0.95, "label": "Geotextile fabric base"},
    "stone_base": {"unit": "sqft", "rate": 2.10, "label": "Crusher run stone base (6\")"},
}

# Maps free-text scope keywords (returned by GPT) → catalog SKU.
_KEYWORD_MAP = {
    "asphalt": "asphalt_paving",
    "paving": "asphalt_paving",
    "overlay": "asphalt_overlay",
    "mill": "milling",
    "milling": "milling",
    "concrete": "concrete_flatwork",
    "flatwork": "concrete_flatwork",
    "sidewalk": "concrete_flatwork",
    "apron": "concrete_apron",
    "curb": "concrete_curb",
    "gutter": "concrete_curb",
    "sealcoat": "sealcoat",
    "seal": "sealcoat",
    "stripe": "striping_stall",
    "striping": "striping_stall",
    "stall": "striping_stall",
    "ada": "ada_pad",
    "accessible": "ada_pad",
    "catch basin": "catch_basin",
    "drainage": "catch_basin",
    "paver": "pavers",
    "tar": "tar_chip",
    "chip": "tar_chip",
    "millings": "millings_surface",
    "geotextile": "geotextile",
    "fabric": "geotextile",
    "stone": "stone_base",
    "base": "stone_base",
}


class PlanEstimateLine(BaseModel):
    sku: str
    label: str
    unit: str
    quantity: float
    unit_price: float
    extended: float
    source_file: str | None = None


class PlanEstimateResponse(BaseModel):
    status: str = "ok"
    files_parsed: int
    estimated_total_sqft: float = 0.0
    scope_summary: str = ""
    line_items: list[PlanEstimateLine] = Field(default_factory=list)
    subtotal: float = 0.0
    low: float = 0.0
    mid: float = 0.0
    high: float = 0.0
    contingency_pct: float = 0.10
    parsed_documents: list[dict[str, Any]] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


def _file_kind(content_type: str | None) -> str:
    if not content_type:
        return "unknown"
    if content_type in _IMAGE_TYPES:
        return "image"
    if content_type in _PDF_TYPES:
        return "pdf"
    return "unknown"


def _parse_one(file_bytes: bytes, content_type: str, filename: str) -> dict[str, Any]:
    """Route to the right document_intelligence parser based on content type."""
    kind = _file_kind(content_type)
    try:
        if kind == "image":
            result = parse_blueprint(file_bytes)
            result["_kind"] = "blueprint"
        elif kind == "pdf":
            # PDFs may be permits, contracts, or multi-page plan sets — try
            # contract parser first since it returns the richest scope summary.
            result = parse_contract(file_bytes, content_type)
            result["_kind"] = "contract"
            # If contract parse returns very little scope, also attempt permit.
            scope_text = str(result.get("scope_of_work") or "")
            if len(scope_text) < 30:
                permit = parse_permit_pdf(file_bytes)
                if permit.get("scope") and not permit.get("error"):
                    result["scope_of_work"] = permit.get("scope")
                    result["_kind"] = "permit"
        else:
            return {"error": "unsupported file type", "filename": filename}
    except Exception as exc:  # noqa: BLE001
        logger.exception("plan_estimator parse failed for %s", filename)
        return {"error": str(exc), "filename": filename}

    result["filename"] = filename
    return result


def _quantities_from_parsed(parsed: dict[str, Any]) -> list[tuple[str, float]]:
    """
    Extract (sku, quantity) pairs from a parsed document.

    Strategy:
      - Use estimated_sqft as primary asphalt quantity
      - Mine service_keywords + scope_of_work text for additional line-items
      - Read structured dimensions[] when GPT returned a measurement table
    """
    pairs: list[tuple[str, float]] = []

    sqft = float(parsed.get("estimated_sqft") or 0)
    keywords = parsed.get("service_keywords") or []
    scope_text = " ".join(
        str(parsed.get(k) or "")
        for k in ("scope_of_work", "notes", "service_summary")
    ).lower()

    # Determine the primary surface SKU
    primary_sku = "asphalt_paving"
    for kw in keywords:
        sku = _KEYWORD_MAP.get(str(kw).lower())
        if sku:
            primary_sku = sku
            break
    else:
        for token, sku in _KEYWORD_MAP.items():
            if token in scope_text:
                primary_sku = sku
                break

    if sqft > 0:
        pairs.append((primary_sku, sqft))
        # Asphalt jobs almost always need stone base — add it automatically
        if primary_sku in {"asphalt_paving", "asphalt_overlay"}:
            pairs.append(("stone_base", sqft))

    # Look for additive line items mentioned in the scope text
    for token, sku in _KEYWORD_MAP.items():
        if sku == primary_sku:
            continue
        if token in scope_text and sku not in {p[0] for p in pairs}:
            # Heuristic quantities for additive scopes
            if sku == "concrete_curb":
                # Estimate ~1 LF of curb per 12 sqft of paving when present
                qty = max(50.0, sqft / 12) if sqft else 50.0
                pairs.append((sku, qty))
            elif sku == "ada_pad":
                pairs.append((sku, 1.0))
            elif sku == "catch_basin":
                pairs.append((sku, max(1.0, round(sqft / 5000)) if sqft else 1.0))
            elif sku == "striping_stall":
                # ~1 stall per 300 sqft
                pairs.append((sku, max(4.0, round(sqft / 300)) if sqft else 4.0))

    return pairs


def _price_lines(
    quantity_pairs: list[tuple[str, float]],
    catalog_overrides: dict[str, dict[str, Any]] | None,
    source_file: str | None,
) -> list[PlanEstimateLine]:
    """Convert (sku, qty) pairs into priced PlanEstimateLine objects."""
    lines: list[PlanEstimateLine] = []
    overrides = catalog_overrides or {}
    for sku, qty in quantity_pairs:
        rate_info = overrides.get(sku) or _FALLBACK_RATES.get(sku)
        if not rate_info:
            continue
        unit_price = float(rate_info["rate"])
        extended = round(unit_price * float(qty), 2)
        lines.append(
            PlanEstimateLine(
                sku=sku,
                label=str(rate_info.get("label", sku)),
                unit=str(rate_info.get("unit", "ea")),
                quantity=round(float(qty), 2),
                unit_price=unit_price,
                extended=extended,
                source_file=source_file,
            )
        )
    return lines


def _fold_lines(lines: list[PlanEstimateLine]) -> list[PlanEstimateLine]:
    """Combine lines that share the same SKU into a single roll-up line."""
    by_sku: dict[str, PlanEstimateLine] = {}
    for ln in lines:
        if ln.sku in by_sku:
            existing = by_sku[ln.sku]
            existing.quantity = round(existing.quantity + ln.quantity, 2)
            existing.extended = round(existing.unit_price * existing.quantity, 2)
        else:
            by_sku[ln.sku] = ln.copy()
    return list(by_sku.values())


def _build_estimate(
    parsed_docs: list[dict[str, Any]],
    catalog_overrides: dict[str, dict[str, Any]] | None = None,
) -> PlanEstimateResponse:
    """Aggregate parsed documents into a priced estimate."""
    total_sqft = 0.0
    all_lines: list[PlanEstimateLine] = []
    scope_pieces: list[str] = []
    notes: list[str] = []

    for doc in parsed_docs:
        if doc.get("error"):
            notes.append(f"{doc.get('filename', 'file')}: {doc['error']}")
            continue
        sqft = float(doc.get("estimated_sqft") or 0)
        total_sqft += sqft
        scope = doc.get("scope_of_work") or doc.get("notes")
        if scope:
            scope_pieces.append(str(scope))

        pairs = _quantities_from_parsed(doc)
        if not pairs:
            notes.append(f"{doc.get('filename', 'file')}: no measurable scope detected")
            continue
        all_lines.extend(_price_lines(pairs, catalog_overrides, doc.get("filename")))

    folded = _fold_lines(all_lines)
    subtotal = round(sum(l.extended for l in folded), 2)
    contingency = 0.10
    low = round(subtotal * 0.92, 2)
    mid = round(subtotal * (1 + contingency), 2)
    high = round(subtotal * 1.25, 2)

    return PlanEstimateResponse(
        files_parsed=len([d for d in parsed_docs if not d.get("error")]),
        estimated_total_sqft=round(total_sqft, 2),
        scope_summary=" | ".join(scope_pieces)[:1500],
        line_items=folded,
        subtotal=subtotal,
        low=low,
        mid=mid,
        high=high,
        contingency_pct=contingency,
        parsed_documents=parsed_docs,
        notes=notes,
    )


@router.post("/from-files", summary="Parse uploaded plans and return a priced estimate")
@limiter.limit("8/minute")
async def estimate_from_files(
    request: Request,
    files: list[UploadFile] = File(..., description="1–8 plan files (PDF or image)"),
    contact_email: str | None = Form(default=None),
    contact_name: str | None = Form(default=None),
    project_address: str | None = Form(default=None),
    notes: str | None = Form(default=None),
):
    """
    Upload one or more plan files (civil site plans, GC blueprints, permits,
    photos of sketches) and receive a single priced estimate covering the
    combined scope. No auth — public so customers can self-serve.

    Returns:
      PlanEstimateResponse with low/mid/high totals and line-by-line breakdown.
    """
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required.")
    if len(files) > _MAX_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {_MAX_FILES} files per request.",
        )

    parsed_docs: list[dict[str, Any]] = []
    for f in files:
        data = await f.read()
        if len(data) > _MAX_BYTES:
            parsed_docs.append({
                "filename": f.filename,
                "error": "file exceeds 20 MB limit",
            })
            continue
        if _file_kind(f.content_type) == "unknown":
            parsed_docs.append({
                "filename": f.filename,
                "error": f"unsupported content type: {f.content_type}",
            })
            continue
        parsed_docs.append(_parse_one(data, f.content_type or "", f.filename or "plan"))

    estimate = _build_estimate(parsed_docs)

    # Attach contact info so the consumer can route this to a Lead record.
    payload = estimate.dict()
    payload["contact"] = {
        "name": contact_name,
        "email": contact_email,
        "address": project_address,
        "notes": notes,
    }
    return payload


class InboundEmailPayload(BaseModel):
    """SendGrid Inbound Parse / Postmark Inbound webhook shape (subset)."""
    from_email: str | None = Field(default=None, alias="from")
    to: str | None = None
    subject: str | None = None
    text: str | None = None
    html: str | None = None
    attachments: list[dict[str, Any]] = Field(default_factory=list)


@router.post("/inbound-email", summary="Inbound email webhook (SendGrid / Postmark)")
@limiter.limit("60/minute")
async def inbound_email(request: Request):
    """
    Webhook endpoint for plans@ inbound email parsing.

    Accepts both SendGrid Inbound Parse (multipart/form-data) and
    Postmark Inbound (application/json) payloads. Extracts attachments,
    parses each as a plan, and returns the priced estimate.

    Configure your inbound provider to POST here. No auth (gated by
    your provider's signed webhook secret if you set
    INBOUND_EMAIL_SECRET in the environment — checked here when present).
    """
    import os

    provider_secret = os.environ.get("INBOUND_EMAIL_SECRET")
    if provider_secret:
        sent = request.headers.get("x-inbound-secret") or request.headers.get("authorization", "")
        if provider_secret not in sent:
            raise HTTPException(status_code=401, detail="invalid inbound secret")

    content_type = (request.headers.get("content-type") or "").lower()
    parsed_docs: list[dict[str, Any]] = []
    sender_email: str | None = None
    sender_name: str | None = None
    subject: str | None = None

    if "application/json" in content_type:
        body = await request.json()
        sender_email = body.get("FromFull", {}).get("Email") or body.get("From")
        sender_name = body.get("FromFull", {}).get("Name")
        subject = body.get("Subject")
        for att in body.get("Attachments", []) or []:
            import base64 as _b64
            try:
                content = _b64.b64decode(att.get("Content", ""))
            except Exception:  # noqa: BLE001
                continue
            parsed_docs.append(_parse_one(
                content,
                att.get("ContentType", ""),
                att.get("Name", "attachment"),
            ))
    else:
        form = await request.form()
        sender_email = form.get("from") or form.get("sender")
        subject = form.get("subject")
        for key, value in form.multi_items():
            if hasattr(value, "filename") and value.filename:
                try:
                    data = await value.read()
                except Exception:  # noqa: BLE001
                    continue
                if len(data) > _MAX_BYTES:
                    parsed_docs.append({
                        "filename": value.filename,
                        "error": "file exceeds 20 MB limit",
                    })
                    continue
                parsed_docs.append(_parse_one(
                    data,
                    getattr(value, "content_type", "") or "",
                    value.filename,
                ))

    if not parsed_docs:
        return {
            "status": "received",
            "message": "no plan attachments detected",
            "from": sender_email,
            "subject": subject,
        }

    estimate = _build_estimate(parsed_docs)
    payload = estimate.dict()
    payload["contact"] = {
        "name": sender_name,
        "email": sender_email,
        "subject": subject,
    }
    payload["status"] = "ok"
    return payload
