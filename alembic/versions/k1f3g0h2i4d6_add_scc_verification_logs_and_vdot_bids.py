"""add_scc_verification_logs_and_vdot_bids

Revision ID: k1f3g0h2i4d6
Revises: j0e2f9g1h3c5
Create Date: 2026-05-02

Adds two tables for the Statewide Intelligence module:
  - scc_verification_logs : Virginia SCC entity verification audit trail
  - vdot_bids             : VDOT bid board opportunities (scraped daily)
"""

from alembic import op
import sqlalchemy as sa

revision = "k1f3g0h2i4d6"
down_revision = "j0e2f9g1h3c5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── scc_verification_logs ─────────────────────────────────────────────────
    op.create_table(
        "scc_verification_logs",
        sa.Column("id",               sa.Integer(),    nullable=False),
        sa.Column("entity_id",        sa.String(60),   nullable=True),
        sa.Column("entity_name",      sa.String(200),  nullable=True),
        sa.Column("entity_type",      sa.String(80),   nullable=True),
        sa.Column("status",           sa.String(40),   nullable=False, server_default="Unknown"),
        sa.Column("is_good_standing", sa.Boolean(),    nullable=False, server_default=sa.text("false")),
        sa.Column("registered_agent", sa.String(200),  nullable=True),
        sa.Column("principal_office", sa.String(300),  nullable=True),
        sa.Column("date_formed",      sa.String(20),   nullable=True),
        sa.Column("source",           sa.String(30),   nullable=True),
        sa.Column("requested_by",     sa.String(120),  nullable=True),
        sa.Column("tenant_id",        sa.String(60),   nullable=True, server_default="default"),
        sa.Column("checked_at",       sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_at",       sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_scc_id",        "scc_verification_logs", ["id"],        unique=False)
    op.create_index("ix_scc_entity_id", "scc_verification_logs", ["entity_id"], unique=False)
    op.create_index("ix_scc_tenant_id", "scc_verification_logs", ["tenant_id"], unique=False)
    op.create_index("ix_scc_checked_at","scc_verification_logs", ["checked_at"],unique=False)

    # ── vdot_bids ─────────────────────────────────────────────────────────────
    op.create_table(
        "vdot_bids",
        sa.Column("id",              sa.Integer(),    nullable=False),
        sa.Column("contract_id",     sa.String(30),   nullable=False),
        sa.Column("title",           sa.String(300),  nullable=False),
        sa.Column("district",        sa.String(60),   nullable=True),
        sa.Column("county",          sa.String(80),   nullable=True),
        sa.Column("category",        sa.String(100),  nullable=True),
        sa.Column("contract_type",   sa.String(30),   nullable=True),
        sa.Column("estimated_value", sa.Float(),      nullable=True),
        sa.Column("open_date",       sa.DateTime(timezone=True), nullable=True),
        sa.Column("close_date",      sa.DateTime(timezone=True), nullable=True),
        sa.Column("location_desc",   sa.String(300),  nullable=True),
        sa.Column("prime_eligible",  sa.Boolean(),    nullable=False, server_default=sa.text("true")),
        sa.Column("is_active",       sa.Boolean(),    nullable=False, server_default=sa.text("true")),
        sa.Column("source",          sa.String(30),   nullable=True),
        sa.Column("tenant_id",       sa.String(60),   nullable=True, server_default="default"),
        sa.Column("scraped_at",      sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at",      sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_at",      sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("contract_id", name="uq_vdot_contract_id"),
    )
    op.create_index("ix_vdot_id",          "vdot_bids", ["id"],          unique=False)
    op.create_index("ix_vdot_contract_id", "vdot_bids", ["contract_id"], unique=True)
    op.create_index("ix_vdot_district",    "vdot_bids", ["district"],    unique=False)
    op.create_index("ix_vdot_county",      "vdot_bids", ["county"],      unique=False)
    op.create_index("ix_vdot_close_date",  "vdot_bids", ["close_date"],  unique=False)
    op.create_index("ix_vdot_is_active",   "vdot_bids", ["is_active"],   unique=False)
    op.create_index("ix_vdot_tenant_id",   "vdot_bids", ["tenant_id"],   unique=False)


def downgrade() -> None:
    op.drop_index("ix_vdot_tenant_id",   table_name="vdot_bids")
    op.drop_index("ix_vdot_is_active",   table_name="vdot_bids")
    op.drop_index("ix_vdot_close_date",  table_name="vdot_bids")
    op.drop_index("ix_vdot_county",      table_name="vdot_bids")
    op.drop_index("ix_vdot_district",    table_name="vdot_bids")
    op.drop_index("ix_vdot_contract_id", table_name="vdot_bids")
    op.drop_index("ix_vdot_id",          table_name="vdot_bids")
    op.drop_table("vdot_bids")

    op.drop_index("ix_scc_checked_at", table_name="scc_verification_logs")
    op.drop_index("ix_scc_tenant_id",  table_name="scc_verification_logs")
    op.drop_index("ix_scc_entity_id",  table_name="scc_verification_logs")
    op.drop_index("ix_scc_id",         table_name="scc_verification_logs")
    op.drop_table("scc_verification_logs")
