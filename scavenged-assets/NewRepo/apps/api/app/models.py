from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Lead(Base):
    __tablename__ = 'leads'

    id = Column(String(64), primary_key=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=True)
    phone = Column(String(30), nullable=True)
    address = Column(String(300), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    service = Column(String(100), nullable=True)
    service_type = Column(String(100), nullable=True)
    urgency = Column(String(30), nullable=True)
    description = Column(Text, nullable=True)
    estimated_value = Column(Float, nullable=True)
    tier = Column(String(10), nullable=True)
    score = Column(Integer, nullable=True)
    score_label = Column(String(10), nullable=True)
    status = Column(String(30), default='new')
    pipeline_stage = Column(String(30), default='new')
    source = Column(String(50), nullable=True)
    tenant_id = Column(String(64), default='default', nullable=True, index=True)
    contacted_at = Column(DateTime(timezone=True), nullable=True)
    proposal_sent_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    closed_reason = Column(String(300), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    jobs = relationship('Job', back_populates='lead')
    payment_transactions = relationship('PaymentTransaction', back_populates='lead')


class Job(Base):
    __tablename__ = 'jobs'

    id = Column(String(64), primary_key=True)
    trade = Column(String(100), nullable=False)
    city = Column(String(100), nullable=True)
    quantity = Column(Float, nullable=False)
    bid = Column(Float, nullable=False)
    status = Column(String(30), default='Estimated')
    is_large_job = Column(Boolean, default=False)
    lead_id = Column(String(64), ForeignKey('leads.id'), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    lead = relationship('Lead', back_populates='jobs')


class Crew(Base):
    __tablename__ = 'crew'

    id = Column(String(64), primary_key=True)
    name = Column(String(200), nullable=False)
    role = Column(String(100), nullable=False)
    status = Column(String(30), default='Available')
    phone = Column(String(30), nullable=True)
    license_expiry = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class Equipment(Base):
    __tablename__ = 'equipment'

    id = Column(String(64), primary_key=True)
    name = Column(String(200), nullable=False)
    type = Column(String(100), nullable=False)
    status = Column(String(30), default='Available')
    serial_number = Column(String(100), nullable=True)
    next_service = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class Estimate(Base):
    __tablename__ = 'estimates'

    id = Column(String(64), primary_key=True)
    trade_key = Column(String(50), nullable=False)
    trade_label = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=False)
    tonnage = Column(Float, nullable=True)
    material_cost = Column(Float, nullable=False)
    binder_cost = Column(Float, nullable=False)
    final_bid = Column(Float, nullable=False)
    margin = Column(Float, nullable=False)
    location = Column(String(100), nullable=True)
    is_large_job = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class BlogPost(Base):
    __tablename__ = 'blog_posts'
    __table_args__ = (UniqueConstraint('slug', name='uq_blog_posts_slug'),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(200), nullable=False, index=True)
    title = Column(String(300), nullable=False)
    excerpt = Column(Text, nullable=True)
    body = Column(Text, nullable=True)
    meta_description = Column(String(320), nullable=True)
    author = Column(String(120), default='J. Worden & Sons')
    status = Column(String(20), default='draft')
    read_time_minutes = Column(Integer, nullable=True)
    tags = Column(String(500), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class PaymentTransaction(Base):
    __tablename__ = 'payment_transactions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    lead_id = Column(String(64), ForeignKey('leads.id'), nullable=False, index=True)
    stripe_checkout_session_id = Column(String(200), nullable=True, index=True)
    stripe_payment_intent_id = Column(String(200), nullable=True)
    amount_cents = Column(Integer, nullable=True)
    status = Column(String(30), default='pending')
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    lead = relationship('Lead', back_populates='payment_transactions')


class LienCalendarEntry(Base):
    __tablename__ = 'lien_calendar_entries'

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_name = Column(String(120), nullable=False)
    project_address = Column(String(300), nullable=False)
    state_code = Column(String(2), nullable=False, index=True)
    project_start_date = Column(DateTime(timezone=True), nullable=True)
    last_furnishing_date = Column(DateTime(timezone=True), nullable=True)
    preliminary_notice_deadline = Column(DateTime(timezone=True), nullable=True)
    lien_filing_deadline = Column(DateTime(timezone=True), nullable=True, index=True)
    foreclosure_deadline = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    reminder_sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class Customer(Base):
    __tablename__ = 'customers'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    email = Column(String(254), nullable=True, index=True)
    phone = Column(String(30), nullable=True)
    company = Column(String(200), nullable=True)
    city = Column(String(100), nullable=True)
    state_code = Column(String(2), nullable=True)
    customer_type = Column(String(30), default='residential')
    is_franchise = Column(Boolean, default=False)
    brand = Column(String(100), nullable=True)
    total_jobs = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0)
    last_job_date = Column(DateTime(timezone=True), nullable=True)
    source = Column(String(60), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    history = relationship('ServiceHistory', back_populates='customer')


class ServiceHistory(Base):
    __tablename__ = 'service_history'

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=False, index=True)
    job_date = Column(DateTime(timezone=True), nullable=True)
    service_type = Column(String(60), nullable=True)
    address = Column(String(300), nullable=True)
    state_code = Column(String(2), nullable=True)
    revenue = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    customer = relationship('Customer', back_populates='history')


# ── Wave 2 Models ─────────────────────────────────────────────────────────────

class WorkOrder(Base):
    __tablename__ = 'work_orders'

    id = Column(String(64), primary_key=True)
    job_id = Column(String(64), ForeignKey('jobs.id'), nullable=True, index=True)
    lead_id = Column(String(64), ForeignKey('leads.id'), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(30), default='pending')  # pending, assigned, in_progress, complete
    crew_assigned = Column(String(300), nullable=True)    # comma-separated crew ids
    equipment_assigned = Column(String(300), nullable=True)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    site_address = Column(String(300), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class WorkforceMember(Base):
    __tablename__ = 'workforce_members'

    id = Column(String(64), primary_key=True)
    name = Column(String(200), nullable=False)
    role = Column(String(100), nullable=False)
    email = Column(String(200), nullable=True)
    phone = Column(String(30), nullable=True)
    status = Column(String(30), default='active')  # active, inactive, terminated
    skills = Column(Text, nullable=True)            # JSON array of skill strings
    certifications = Column(Text, nullable=True)    # JSON array of cert objects {name, expiry}
    license_number = Column(String(100), nullable=True)
    license_expiry = Column(DateTime(timezone=True), nullable=True)
    osha_card_expiry = Column(DateTime(timezone=True), nullable=True)
    hire_date = Column(DateTime(timezone=True), nullable=True)
    hourly_rate = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class SubcontractorRoster(Base):
    __tablename__ = 'subcontractor_roster'

    id = Column(String(64), primary_key=True)
    company_name = Column(String(200), nullable=False)
    contact_name = Column(String(200), nullable=True)
    email = Column(String(200), nullable=True)
    phone = Column(String(30), nullable=True)
    trade_specialty = Column(String(200), nullable=True)
    states_licensed = Column(String(300), nullable=True)  # comma-separated state codes
    license_number = Column(String(100), nullable=True)
    license_expiry = Column(DateTime(timezone=True), nullable=True)
    insurance_expiry = Column(DateTime(timezone=True), nullable=True)
    insurance_limit = Column(Float, nullable=True)
    bonded = Column(Boolean, default=False)
    status = Column(String(30), default='active')  # active, inactive, preferred, blacklisted
    rating = Column(Float, nullable=True)          # 1.0–5.0
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    performance_reviews = relationship('SubcontractorPerformance', back_populates='sub')


class SubcontractorPerformance(Base):
    __tablename__ = 'subcontractor_performance'

    id = Column(Integer, primary_key=True, autoincrement=True)
    sub_id = Column(String(64), ForeignKey('subcontractor_roster.id'), nullable=False, index=True)
    job_id = Column(String(64), nullable=True)
    job_date = Column(DateTime(timezone=True), nullable=True)
    quality_score = Column(Integer, nullable=True)     # 1–5
    schedule_score = Column(Integer, nullable=True)    # 1–5
    communication_score = Column(Integer, nullable=True)
    would_rehire = Column(Boolean, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    sub = relationship('SubcontractorRoster', back_populates='performance_reviews')


class SafetyToolboxTalk(Base):
    __tablename__ = 'safety_toolbox_talks'

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    topic = Column(String(100), nullable=False)  # fall_protection, struck_by, caught_between, electrical, heat, etc.
    content = Column(Text, nullable=False)
    duration_minutes = Column(Integer, default=10)
    presenter = Column(String(200), nullable=True)
    attendees = Column(Text, nullable=True)  # JSON array of names
    site_address = Column(String(300), nullable=True)
    presented_at = Column(DateTime(timezone=True), nullable=True)
    ai_generated = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class SafetyIncident(Base):
    __tablename__ = 'safety_incidents'

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_date = Column(DateTime(timezone=True), nullable=False)
    incident_type = Column(String(50), nullable=False)  # recordable, near_miss, first_aid, property_damage
    description = Column(Text, nullable=False)
    location = Column(String(300), nullable=True)
    injured_person = Column(String(200), nullable=True)
    body_part_affected = Column(String(100), nullable=True)
    days_away = Column(Integer, default=0)
    days_restricted = Column(Integer, default=0)
    root_cause = Column(Text, nullable=True)
    corrective_action = Column(Text, nullable=True)
    osha_recordable = Column(Boolean, default=False)
    reported_to_osha = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class CashFlowEntry(Base):
    __tablename__ = 'cashflow_entries'

    id = Column(Integer, primary_key=True, autoincrement=True)
    week_start = Column(DateTime(timezone=True), nullable=False, index=True)
    category = Column(String(60), nullable=False)   # revenue, materials, labor, equipment, overhead, other
    label = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)          # positive = inflow, negative = outflow
    is_actual = Column(Boolean, default=False)      # True = actual, False = projected
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class CashFlowAlert(Base):
    __tablename__ = 'cashflow_alerts'

    id = Column(Integer, primary_key=True, autoincrement=True)
    threshold_amount = Column(Float, nullable=False)
    alert_email = Column(String(254), nullable=True)
    is_active = Column(Boolean, default=True)
    triggered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class VdotBid(Base):
    __tablename__ = 'vdot_bids'

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_number = Column(String(50), nullable=True, index=True)
    project_name = Column(String(400), nullable=False)
    district = Column(String(100), nullable=True)
    county = Column(String(100), nullable=True)
    state_route = Column(String(50), nullable=True)
    bid_date = Column(DateTime(timezone=True), nullable=True, index=True)
    estimated_cost = Column(Float, nullable=True)
    project_type = Column(String(100), nullable=True)  # paving, grading, bridge, etc.
    tier = Column(String(10), nullable=True)            # WHALE, SHARK, FISH
    url = Column(String(500), nullable=True)
    status = Column(String(30), default='open')         # open, bid, awarded, cancelled
    scraped_at = Column(DateTime(timezone=True), default=utcnow)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class GalleryImage(Base):
    __tablename__ = 'gallery_images'

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(300), nullable=False)
    original_filename = Column(String(300), nullable=True)
    storage_path = Column(String(500), nullable=False)   # local path or S3 key
    storage_type = Column(String(10), default='local')   # local, s3
    url = Column(String(500), nullable=True)
    caption = Column(String(400), nullable=True)
    project_type = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    state_code = Column(String(2), nullable=True)
    is_before = Column(Boolean, nullable=True)           # True=before, False=after, None=standalone
    is_featured = Column(Boolean, default=False)
    is_public = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class ChatSession(Base):
    __tablename__ = 'chat_sessions'

    id = Column(String(64), primary_key=True)
    context = Column(String(200), nullable=True)   # 'jarvis', 'public', etc.
    created_at = Column(DateTime(timezone=True), default=utcnow)
    last_active_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    messages = relationship('ChatMessage', back_populates='session', order_by='ChatMessage.id')


class ChatMessage(Base):
    __tablename__ = 'chat_messages'

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey('chat_sessions.id'), nullable=False, index=True)
    role = Column(String(20), nullable=False)    # user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    session = relationship('ChatSession', back_populates='messages')


class ProposalOutcome(Base):
    __tablename__ = 'proposal_outcomes'

    id = Column(Integer, primary_key=True, autoincrement=True)
    lead_id = Column(String(64), ForeignKey('leads.id'), nullable=True, index=True)
    proposal_title = Column(String(300), nullable=False)
    proposal_body = Column(Text, nullable=True)
    estimated_value = Column(Float, nullable=True)
    outcome = Column(String(20), nullable=True)   # won, lost, pending, expired
    lost_reason = Column(String(300), nullable=True)
    competitor_won = Column(String(200), nullable=True)
    generated_at = Column(DateTime(timezone=True), default=utcnow)
    decided_at = Column(DateTime(timezone=True), nullable=True)


# ── Wave 6 Models — Anomaly Detection ────────────────────────────────────────

class AnomalyAlert(Base):
    __tablename__ = 'anomaly_alerts'

    id = Column(Integer, primary_key=True, autoincrement=True)
    metric_name = Column(String(100), nullable=False, index=True)
    current_value = Column(Float, nullable=False)
    baseline_value = Column(Float, nullable=False)
    z_score = Column(Float, nullable=False)
    severity = Column(String(20), nullable=False)   # CRITICAL, HIGH, MEDIUM, INFO
    message = Column(Text, nullable=False)
    tenant_id = Column(String(64), default='default', nullable=True, index=True)
    detected_at = Column(DateTime(timezone=True), default=utcnow)
    resolved_at = Column(DateTime(timezone=True), nullable=True)


# ── Wave 3 Models ─────────────────────────────────────────────────────────────

class TwoFactorSecret(Base):
    __tablename__ = 'two_factor_secrets'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), nullable=False, unique=True, index=True)
    secret = Column(String(64), nullable=False)       # base32 TOTP secret
    backup_codes = Column(Text, nullable=True)         # JSON array of remaining codes
    enabled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class AuditEvent(Base):
    __tablename__ = 'audit_events'

    id = Column(Integer, primary_key=True, autoincrement=True)
    actor = Column(String(100), nullable=False)       # username or 'system'
    action = Column(String(100), nullable=False)      # e.g. 'auth.login', 'lead.delete'
    resource_type = Column(String(60), nullable=True)
    resource_id = Column(String(64), nullable=True)
    detail = Column(Text, nullable=True)              # JSON extra data
    ip_address = Column(String(45), nullable=True)    # supports IPv6
    created_at = Column(DateTime(timezone=True), default=utcnow)


class EmailLog(Base):
    __tablename__ = 'email_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    to_email = Column(String(254), nullable=False, index=True)
    subject = Column(String(300), nullable=False)
    status = Column(String(20), default='pending')    # pending, sent, failed
    sent_at = Column(DateTime(timezone=True), nullable=True)
    error = Column(String(300), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class PermitLead(Base):
    __tablename__ = 'permit_leads'

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(50), nullable=False)           # vpt, deq, local
    permit_number = Column(String(100), nullable=True, index=True)
    permit_type = Column(String(100), nullable=True)
    permit_status = Column(String(50), nullable=True)
    contractor_name = Column(String(200), nullable=True)
    contractor_license = Column(String(100), nullable=True)
    property_address = Column(String(300), nullable=True)
    property_city = Column(String(100), nullable=True)
    property_state = Column(String(2), nullable=True, index=True)
    property_zip = Column(String(10), nullable=True)
    project_value = Column(Float, nullable=True)
    estimated_sqft = Column(Float, nullable=True)
    permit_date = Column(DateTime(timezone=True), nullable=True)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    priority_score = Column(Integer, nullable=True)       # 1–100
    priority_label = Column(String(10), nullable=True)    # HOT, WARM, COOL
    raw_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class ClientPortalToken(Base):
    __tablename__ = 'client_portal_tokens'

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=False, index=True)
    token_hash = Column(String(128), nullable=False, index=True)   # SHA-256 of JWT jti
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)


# ── Wave 4 Models — Property Scan → Direct Mail ───────────────────────────────

class ScanCampaign(Base):
    __tablename__ = 'scan_campaigns'

    id = Column(Integer, primary_key=True, autoincrement=True)
    zip_code = Column(String(10), nullable=False, index=True)
    label = Column(String(200), nullable=False)
    status = Column(String(30), default='pending')  # pending, queued, running, done, failed
    max_properties = Column(Integer, default=50)
    auto_mail = Column(Boolean, default=False)       # trigger Lob send after scan
    total_properties = Column(Integer, default=0)
    scanned = Column(Integer, default=0)
    mailed = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    properties = relationship('ScanProperty', back_populates='campaign')


class ScanProperty(Base):
    __tablename__ = 'scan_properties'

    id = Column(Integer, primary_key=True, autoincrement=True)
    campaign_id = Column(Integer, ForeignKey('scan_campaigns.id'), nullable=False, index=True)
    parcel_id = Column(String(100), nullable=True)
    address = Column(String(300), nullable=False)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    zip_code = Column(String(10), nullable=True)
    owner_name = Column(String(200), nullable=True)
    owner_type = Column(String(30), nullable=True)    # individual, corporate, trust
    land_use_code = Column(String(50), nullable=True)
    lot_size_sqft = Column(Float, nullable=True)
    year_built = Column(Integer, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(30), default='pending')    # pending, scanning, scanned, mailed, skipped
    created_at = Column(DateTime(timezone=True), default=utcnow)

    campaign = relationship('ScanCampaign', back_populates='properties')
    result = relationship('ScanResult', back_populates='property', uselist=False)


class ScanResult(Base):
    __tablename__ = 'scan_results'

    id = Column(Integer, primary_key=True, autoincrement=True)
    property_id = Column(Integer, ForeignKey('scan_properties.id'), nullable=False, unique=True, index=True)
    roof_condition = Column(String(10), nullable=True)       # good | fair | poor
    driveway_condition = Column(String(10), nullable=True)
    drainage_condition = Column(String(10), nullable=True)
    overall_score = Column(Integer, nullable=True)            # 0–100
    condition_narrative = Column(Text, nullable=True)
    services_recommended = Column(Text, nullable=True)        # JSON array
    service_type = Column(String(100), nullable=True)         # top recommended service
    estimated_sqft = Column(Float, nullable=True)
    estimate_low = Column(Float, nullable=True)
    estimate_high = Column(Float, nullable=True)
    mailer_html = Column(Text, nullable=True)                 # full HTML for printing/Lob
    lob_letter_id = Column(String(100), nullable=True)        # Lob ltr_... ID
    lob_status = Column(String(50), nullable=True)            # queued, sent, failed, mock_queued
    mailed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    property = relationship('ScanProperty', back_populates='result')


# ── Jarvis OS — Catalog & 3D/4D Selection Models ─────────────────────────────

class SelectableItem(Base):
    """Tagged catalog object — every finish, paver, fixture, planting, or material
    the customer can choose.  Each carries real price, real availability/lead time,
    and install labour so swapping a finish updates total + timeline live."""
    __tablename__ = 'selectable_items'

    id = Column(Integer, primary_key=True, autoincrement=True)
    sku = Column(String(60), nullable=False, unique=True, index=True)
    category = Column(String(60), nullable=False, index=True)   # pavers | fixtures | finishes | plantings | materials
    subcategory = Column(String(60), nullable=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    manufacturer = Column(String(200), nullable=True)
    unit = Column(String(30), nullable=False, default='sqft')   # sqft | ea | lnft | ton
    price_usd = Column(Float, nullable=False)                   # material cost per unit
    install_labor_usd = Column(Float, nullable=False, default=0.0)  # labor per unit
    lead_time_days = Column(Integer, nullable=False, default=0)  # 0 = in-stock
    in_stock = Column(Boolean, default=True)
    available_qty = Column(Float, nullable=True)                 # None = unlimited
    seasonal_note = Column(String(300), nullable=True)           # "Best installed Mar-Oct"
    tags = Column(Text, nullable=True)                           # JSON list: ["permeable","ADA","recycled"]
    color = Column(String(60), nullable=True)
    texture = Column(String(60), nullable=True)
    dimensions = Column(String(100), nullable=True)              # "12x12x2 in"
    weight_per_unit = Column(Float, nullable=True)               # lbs per unit
    thumbnail_url = Column(String(500), nullable=True)
    model_3d_url = Column(String(500), nullable=True)            # GLTF/GLB asset
    datasheet_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    tenant_id = Column(String(64), default='default', nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    selections = relationship('CatalogSelection', back_populates='item')


class CatalogProject(Base):
    """A customer's 3D/4D property model — the container for all their selections."""
    __tablename__ = 'catalog_projects'

    id = Column(Integer, primary_key=True, autoincrement=True)
    lead_id = Column(String(64), ForeignKey('leads.id'), nullable=True, index=True)
    customer_name = Column(String(200), nullable=False)
    property_address = Column(String(300), nullable=True)
    project_date = Column(DateTime(timezone=True), nullable=True)  # desired start
    total_sqft = Column(Float, nullable=True)
    budget_usd = Column(Float, nullable=True)
    status = Column(String(30), default='design')   # design | approved | ordered | installed
    notes = Column(Text, nullable=True)
    tenant_id = Column(String(64), default='default', nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    selections = relationship('CatalogSelection', back_populates='project')


class CatalogSelection(Base):
    """One item chosen within a CatalogProject — drives live total + timeline."""
    __tablename__ = 'catalog_selections'

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey('catalog_projects.id'), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey('selectable_items.id'), nullable=False, index=True)
    quantity = Column(Float, nullable=False, default=1.0)
    area_sqft = Column(Float, nullable=True)                     # for spatial items
    zone_label = Column(String(100), nullable=True)              # "Front driveway", "Patio"
    override_price_usd = Column(Float, nullable=True)            # owner override
    approved = Column(Boolean, default=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    project = relationship('CatalogProject', back_populates='selections')
    item = relationship('SelectableItem', back_populates='selections')


# ── Gantt / Critical-Path Models ──────────────────────────────────────────────

class GanttTask(Base):
    """Project schedule task for Gantt + critical-path planning."""
    __tablename__ = 'gantt_tasks'

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(64), ForeignKey('jobs.id'), nullable=True, index=True)
    project_name = Column(String(200), nullable=False)
    task_name = Column(String(200), nullable=False)
    phase = Column(String(60), nullable=True)              # mobilization | excavation | base | paving | striping | cleanup
    assigned_to = Column(String(200), nullable=True)       # crew name / ID
    equipment = Column(String(200), nullable=True)
    planned_start = Column(DateTime(timezone=True), nullable=False)
    planned_end = Column(DateTime(timezone=True), nullable=False)
    actual_start = Column(DateTime(timezone=True), nullable=True)
    actual_end = Column(DateTime(timezone=True), nullable=True)
    duration_hours = Column(Float, nullable=True)
    pct_complete = Column(Integer, default=0)              # 0–100
    depends_on = Column(Text, nullable=True)               # JSON list of task IDs
    is_critical = Column(Boolean, default=False)           # on critical path
    weather_hold = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    tenant_id = Column(String(64), default='default', nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


# ── SaaS / Multi-Tenant Billing Models ───────────────────────────────────────

class TenantRecord(Base):
    """White-label SaaS licensee — one row per contractor org."""
    __tablename__ = 'tenant_records'
    __table_args__ = (UniqueConstraint('slug', name='uq_tenant_records_slug'),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String(64), nullable=False, unique=True, index=True)  # e.g. 'blueridge-paving'
    slug = Column(String(64), nullable=False, index=True)
    business_name = Column(String(200), nullable=False)
    contact_email = Column(String(254), nullable=False)
    contact_phone = Column(String(30), nullable=True)
    plan = Column(String(30), default='starter')          # starter | pro | enterprise
    status = Column(String(30), default='trial')          # trial | active | past_due | cancelled
    stripe_customer_id = Column(String(100), nullable=True, index=True)
    stripe_subscription_id = Column(String(100), nullable=True, index=True)
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    monthly_price_cents = Column(Integer, default=29900)  # $299/mo starter
    primary_state = Column(String(2), nullable=True)      # home state for legal defaults
    logo_url = Column(String(500), nullable=True)
    primary_color = Column(String(20), nullable=True)
    custom_domain = Column(String(200), nullable=True)
    feature_flags = Column(Text, nullable=True)           # JSON: {"catalog": true, "drone": false}
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    subscription_events = relationship('TenantBillingEvent', back_populates='tenant')


class TenantBillingEvent(Base):
    """Stripe webhook event log per tenant."""
    __tablename__ = 'tenant_billing_events'

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey('tenant_records.id'), nullable=False, index=True)
    stripe_event_id = Column(String(100), nullable=False, unique=True)
    event_type = Column(String(100), nullable=False)       # invoice.paid, subscription.deleted, etc.
    amount_cents = Column(Integer, nullable=True)
    status = Column(String(30), nullable=True)
    raw_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    tenant = relationship('TenantRecord', back_populates='subscription_events')


class PlanMarkup(Base):
    """BIM / site plan with click-to-annotate zone markup.

    Zones JSON schema per element:
      {id, label, type, area_sqft, catalog_item_id, x_pct, y_pct, w_pct, h_pct, color, notes}
    """
    __tablename__ = 'plan_markups'

    id = Column(Integer, primary_key=True, autoincrement=True)
    catalog_project_id = Column(Integer, ForeignKey('catalog_projects.id'), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    file_url = Column(String(500), nullable=True)          # uploaded PDF/image/SVG URL
    file_type = Column(String(20), nullable=True)          # pdf | image | svg
    thumbnail_url = Column(String(500), nullable=True)
    zones = Column(Text, nullable=True)                    # JSON array of zone objects
    total_area_sqft = Column(Float, nullable=True)
    version = Column(Integer, default=1)
    is_approved = Column(Boolean, default=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    tenant_id = Column(String(64), default='default', nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class QuickBooksSync(Base):
    """QuickBooks Online sync log — one row per synced entity."""
    __tablename__ = 'quickbooks_sync'

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String(64), default='default', index=True)
    entity_type = Column(String(50), nullable=False)       # Invoice | Customer | Payment | Estimate
    local_id = Column(String(64), nullable=True)           # our DB id
    qb_id = Column(String(100), nullable=True, index=True) # QuickBooks entity Id
    sync_direction = Column(String(10), default='push')    # push | pull
    status = Column(String(30), default='pending')         # pending | synced | error
    error_message = Column(Text, nullable=True)
    raw_response = Column(Text, nullable=True)
    synced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class GroundScanReport(Base):
    """811 / subsurface utility locate scan report (Wave 8 road-scanning stack)."""
    __tablename__ = 'ground_scan_reports'

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String(64), default='default', index=True)
    address = Column(String(300), nullable=True)
    scan_area_sqft = Column(Float, nullable=True)
    ticket_811 = Column(String(100), nullable=True)
    ticket_status = Column(String(40), nullable=True)      # not_started | requested | clear | conflict | expired
    technologies = Column(Text, nullable=True)             # JSON array of scan technologies used
    utilities = Column(Text, nullable=True)                # JSON array of utility findings
    risk_level = Column(String(10), nullable=True)         # LOW | MEDIUM | HIGH
    confidence = Column(Float, nullable=True)
    recommendation = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class RevokedToken(Base):
    """JWT revocation blocklist — admin and portal tokens (Wave 9, closes M2)."""
    __tablename__ = 'revoked_tokens'

    id = Column(Integer, primary_key=True, autoincrement=True)
    jti = Column(String(64), nullable=False, unique=True, index=True)
    token_type = Column(String(20), default='admin')   # admin | portal
    expires_at = Column(DateTime(timezone=True), nullable=True)  # prune rows after this
    revoked_at = Column(DateTime(timezone=True), default=utcnow)
