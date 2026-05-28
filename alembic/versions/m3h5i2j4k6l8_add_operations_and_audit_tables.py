"""add_operations_and_audit_tables

Revision ID: m3h5i2j4k6l8
Revises: l2g4h1i3j5k7
Create Date: 2026-05-03

Adds the operational workflow tables introduced for the contractor operating
system backbone:
  - estimates
  - jobs
  - work_orders
  - audit_events

The migration is idempotent so Railway databases created outside Alembic do not
fail on upgrade.
"""

from alembic import op
import sqlalchemy as sa

revision = "m3h5i2j4k6l8"
down_revision = "l2g4h1i3j5k7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    if "estimates" not in existing_tables:
        op.create_table(
            "estimates",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("lead_id", sa.Integer(), nullable=True),
            sa.Column("customer_id", sa.Integer(), nullable=True),
            sa.Column("estimate_number", sa.String(length=80), nullable=False),
            sa.Column("status", sa.String(length=30), nullable=False, server_default="draft"),
            sa.Column("service_type", sa.String(length=60), nullable=True),
            sa.Column("scope_summary", sa.Text(), nullable=True),
            sa.Column("amount_low", sa.Float(), nullable=True),
            sa.Column("amount_high", sa.Float(), nullable=True),
            sa.Column("currency", sa.String(length=10), nullable=False, server_default="usd"),
            sa.Column("state_code", sa.String(length=2), nullable=True),
            sa.Column("tenant_id", sa.String(length=60), nullable=True, server_default="default"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("estimate_number", name="uq_estimates_estimate_number"),
        )
        op.create_index("ix_estimates_id", "estimates", ["id"])
        op.create_index("ix_estimates_lead_id", "estimates", ["lead_id"])
        op.create_index("ix_estimates_customer_id", "estimates", ["customer_id"])
        op.create_index("ix_estimates_estimate_number", "estimates", ["estimate_number"])
        op.create_index("ix_estimates_state_code", "estimates", ["state_code"])
        op.create_index("ix_estimates_tenant_id", "estimates", ["tenant_id"])

    if "jobs" not in existing_tables:
        op.create_table(
            "jobs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("estimate_id", sa.Integer(), nullable=True),
            sa.Column("lead_id", sa.Integer(), nullable=True),
            sa.Column("customer_id", sa.Integer(), nullable=True),
            sa.Column("job_number", sa.String(length=80), nullable=False),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("status", sa.String(length=30), nullable=False, server_default="scheduled"),
            sa.Column("service_type", sa.String(length=60), nullable=True),
            sa.Column("site_address", sa.String(length=300), nullable=True),
            sa.Column("state_code", sa.String(length=2), nullable=True),
            sa.Column("scheduled_start", sa.DateTime(timezone=True), nullable=True),
            sa.Column("scheduled_end", sa.DateTime(timezone=True), nullable=True),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("tenant_id", sa.String(length=60), nullable=True, server_default="default"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("job_number", name="uq_jobs_job_number"),
        )
        op.create_index("ix_jobs_id", "jobs", ["id"])
        op.create_index("ix_jobs_estimate_id", "jobs", ["estimate_id"])
        op.create_index("ix_jobs_lead_id", "jobs", ["lead_id"])
        op.create_index("ix_jobs_customer_id", "jobs", ["customer_id"])
        op.create_index("ix_jobs_job_number", "jobs", ["job_number"])
        op.create_index("ix_jobs_state_code", "jobs", ["state_code"])
        op.create_index("ix_jobs_tenant_id", "jobs", ["tenant_id"])

    if "work_orders" not in existing_tables:
        op.create_table(
            "work_orders",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("job_id", sa.Integer(), nullable=False),
            sa.Column("work_order_number", sa.String(length=80), nullable=False),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("status", sa.String(length=30), nullable=False, server_default="scheduled"),
            sa.Column("assigned_crew", sa.String(length=120), nullable=True),
            sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=True),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("tenant_id", sa.String(length=60), nullable=True, server_default="default"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("work_order_number", name="uq_work_orders_work_order_number"),
        )
        op.create_index("ix_work_orders_id", "work_orders", ["id"])
        op.create_index("ix_work_orders_job_id", "work_orders", ["job_id"])
        op.create_index("ix_work_orders_work_order_number", "work_orders", ["work_order_number"])
        op.create_index("ix_work_orders_tenant_id", "work_orders", ["tenant_id"])

    if "audit_events" not in existing_tables:
        op.create_table(
            "audit_events",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("event_type", sa.String(length=80), nullable=False),
            sa.Column("actor_type", sa.String(length=40), nullable=False, server_default="system"),
            sa.Column("actor_id", sa.String(length=120), nullable=True),
            sa.Column("entity_type", sa.String(length=80), nullable=True),
            sa.Column("entity_id", sa.String(length=120), nullable=True),
            sa.Column("tenant_id", sa.String(length=60), nullable=True, server_default="default"),
            sa.Column("summary", sa.String(length=500), nullable=False),
            sa.Column("detail_json", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_audit_events_id", "audit_events", ["id"])
        op.create_index("ix_audit_events_event_type", "audit_events", ["event_type"])
        op.create_index("ix_audit_events_actor_id", "audit_events", ["actor_id"])
        op.create_index("ix_audit_events_entity_type", "audit_events", ["entity_type"])
        op.create_index("ix_audit_events_entity_id", "audit_events", ["entity_id"])
        op.create_index("ix_audit_events_tenant_id", "audit_events", ["tenant_id"])


def downgrade() -> None:
    for idx in ["ix_audit_events_tenant_id", "ix_audit_events_entity_id", "ix_audit_events_entity_type", "ix_audit_events_actor_id", "ix_audit_events_event_type", "ix_audit_events_id"]:
        op.drop_index(idx, table_name="audit_events")
    op.drop_table("audit_events")

    for idx in ["ix_work_orders_tenant_id", "ix_work_orders_work_order_number", "ix_work_orders_job_id", "ix_work_orders_id"]:
        op.drop_index(idx, table_name="work_orders")
    op.drop_table("work_orders")

    for idx in ["ix_jobs_tenant_id", "ix_jobs_state_code", "ix_jobs_job_number", "ix_jobs_customer_id", "ix_jobs_lead_id", "ix_jobs_estimate_id", "ix_jobs_id"]:
        op.drop_index(idx, table_name="jobs")
    op.drop_table("jobs")

    for idx in ["ix_estimates_tenant_id", "ix_estimates_state_code", "ix_estimates_estimate_number", "ix_estimates_customer_id", "ix_estimates_lead_id", "ix_estimates_id"]:
        op.drop_index(idx, table_name="estimates")
    op.drop_table("estimates")