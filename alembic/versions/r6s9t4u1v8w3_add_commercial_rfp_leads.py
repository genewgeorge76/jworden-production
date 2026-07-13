"""add_commercial_rfp_leads

Revision ID: r6s9t4u1v8w3
Revises: 971900dc0bd5
Create Date: 2026-07-13

Adds the commercial_rfp_leads table backing the B2B Neural Hunter — general
multi-state commercial RFP discovery via Exa, complementing the existing
Virginia-only VDOT bid board scraper (vdot_bids table).
"""

import sqlalchemy as sa

from alembic import op

revision = "r6s9t4u1v8w3"
down_revision = "971900dc0bd5"
branch_labels = None
depends_on = None


def _column_names(inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    if "commercial_rfp_leads" not in existing_tables:
        op.create_table(
            "commercial_rfp_leads",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(length=400), nullable=False),
            sa.Column("url", sa.String(length=1000), nullable=False),
            sa.Column("source_domain", sa.String(length=200), nullable=True),
            sa.Column("query", sa.String(length=300), nullable=True),
            sa.Column("published_date", sa.DateTime(timezone=True), nullable=True),
            sa.Column("summary", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=30), nullable=False, server_default="new"),
            sa.Column("provider", sa.String(length=20), nullable=True),
            sa.Column("tenant_id", sa.String(length=60), nullable=True, server_default="default"),
            sa.Column("scraped_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("url", name="uq_commercial_rfp_leads_url"),
        )
        op.create_index(
            "ix_commercial_rfp_leads_source_domain", "commercial_rfp_leads", ["source_domain"]
        )
        op.create_index(
            "ix_commercial_rfp_leads_status", "commercial_rfp_leads", ["status"]
        )
        op.create_index(
            "ix_commercial_rfp_leads_tenant_id", "commercial_rfp_leads", ["tenant_id"]
        )
    else:
        cols = _column_names(inspector, "commercial_rfp_leads")
        if "status" not in cols:
            op.add_column(
                "commercial_rfp_leads",
                sa.Column("status", sa.String(length=30), nullable=False, server_default="new"),
            )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "commercial_rfp_leads" in set(inspector.get_table_names()):
        op.drop_table("commercial_rfp_leads")
