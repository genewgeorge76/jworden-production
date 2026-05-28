"""add_ad_url_exclusions_and_anomaly_alerts

Revision ID: i9d1e6f8g0b2
Revises: h8c0d5e7f9a1
Create Date: 2026-05-02

Adds two tables powering the Autonomous Agentic Ads Intelligence layer:
  - ad_url_exclusions    : operator-managed URL paths excluded from AI Max
  - anomaly_alerts       : persistent records from the anomaly detection engine
"""

from alembic import op
import sqlalchemy as sa

revision = "i9d1e6f8g0b2"
down_revision = "h8c0d5e7f9a1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── ad_url_exclusions ─────────────────────────────────────────────────────
    op.create_table(
        "ad_url_exclusions",
        sa.Column("id",           sa.Integer(),    nullable=False),
        sa.Column("path_pattern", sa.String(300),  nullable=False),
        sa.Column("reason",       sa.String(200),  nullable=True),
        sa.Column("created_by",   sa.String(120),  nullable=True),
        sa.Column("tenant_id",    sa.String(60),   nullable=True),
        sa.Column("is_active",    sa.Boolean(),    nullable=False, server_default=sa.text("true")),
        sa.Column("created_at",   sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("path_pattern", name="uq_ad_url_exclusions_path_pattern"),
    )
    op.create_index("ix_aue_id",        "ad_url_exclusions", ["id"],        unique=False)
    op.create_index("ix_aue_tenant_id", "ad_url_exclusions", ["tenant_id"], unique=False)
    op.create_index("ix_aue_is_active", "ad_url_exclusions", ["is_active"], unique=False)

    # ── anomaly_alerts ────────────────────────────────────────────────────────
    op.create_table(
        "anomaly_alerts",
        sa.Column("id",              sa.Integer(),    nullable=False),
        sa.Column("metric_name",     sa.String(80),   nullable=False),
        sa.Column("current_value",   sa.Float(),      nullable=False),
        sa.Column("baseline_value",  sa.Float(),      nullable=False),
        sa.Column("z_score",         sa.Float(),      nullable=True),
        sa.Column("severity",        sa.String(10),   nullable=False),
        sa.Column("message",         sa.String(500),  nullable=False),
        sa.Column("resolved_at",     sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id",       sa.String(60),   nullable=True),
        sa.Column("detected_at",     sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_at",      sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_aa_id",          "anomaly_alerts", ["id"],          unique=False)
    op.create_index("ix_aa_metric_name", "anomaly_alerts", ["metric_name"], unique=False)
    op.create_index("ix_aa_severity",    "anomaly_alerts", ["severity"],    unique=False)
    op.create_index("ix_aa_tenant_id",   "anomaly_alerts", ["tenant_id"],   unique=False)
    op.create_index("ix_aa_detected_at", "anomaly_alerts", ["detected_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_aa_detected_at", table_name="anomaly_alerts")
    op.drop_index("ix_aa_tenant_id",   table_name="anomaly_alerts")
    op.drop_index("ix_aa_severity",    table_name="anomaly_alerts")
    op.drop_index("ix_aa_metric_name", table_name="anomaly_alerts")
    op.drop_index("ix_aa_id",          table_name="anomaly_alerts")
    op.drop_table("anomaly_alerts")

    op.drop_index("ix_aue_is_active", table_name="ad_url_exclusions")
    op.drop_index("ix_aue_tenant_id", table_name="ad_url_exclusions")
    op.drop_index("ix_aue_id",        table_name="ad_url_exclusions")
    op.drop_table("ad_url_exclusions")
