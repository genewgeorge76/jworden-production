"""add_drone_scans

Revision ID: g7b9c4d6e8f0
Revises: f6a8b3c5d7e9
Create Date: 2026-05-02

Adds the drone_scans table for photogrammetry, LiDAR, and thermal
flight records linked to project sites.
"""

from alembic import op
import sqlalchemy as sa

revision = "g7b9c4d6e8f0"
down_revision = "f6a8b3c5d7e9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "drone_scans",
        sa.Column("id",                 sa.Integer(),    nullable=False),
        sa.Column("project_site_id",    sa.Integer(),    nullable=False),
        sa.Column("scan_type",          sa.String(60),   nullable=False),
        sa.Column("operator_name",      sa.String(120),  nullable=True),
        sa.Column("drone_model",        sa.String(120),  nullable=True),
        sa.Column("flight_altitude_ft", sa.Float(),      nullable=True),
        sa.Column("coverage_sqft",      sa.Float(),      nullable=True),
        sa.Column("resolution_cm",      sa.Float(),      nullable=True),
        sa.Column("geojson_url",        sa.String(500),  nullable=True),
        sa.Column("geojson_summary",    sa.Text(),       nullable=True),
        sa.Column("findings_json",      sa.Text(),       nullable=True),
        sa.Column("ai_summary",         sa.Text(),       nullable=True),
        sa.Column("deviation_count",    sa.Integer(),    nullable=True),
        sa.Column("risk_level",         sa.String(20),   nullable=False),
        sa.Column("notes",              sa.Text(),       nullable=True),
        sa.Column("tenant_id",          sa.String(60),   nullable=True),
        sa.Column("scanned_at",         sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_at",         sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_drone_scans_id",              "drone_scans", ["id"],              unique=False)
    op.create_index("ix_drone_scans_project_site_id", "drone_scans", ["project_site_id"], unique=False)
    op.create_index("ix_drone_scans_tenant_id",       "drone_scans", ["tenant_id"],       unique=False)
    op.create_index("ix_drone_scans_scanned_at",      "drone_scans", ["scanned_at"],      unique=False)


def downgrade() -> None:
    op.drop_index("ix_drone_scans_scanned_at",      table_name="drone_scans")
    op.drop_index("ix_drone_scans_tenant_id",       table_name="drone_scans")
    op.drop_index("ix_drone_scans_project_site_id", table_name="drone_scans")
    op.drop_index("ix_drone_scans_id",              table_name="drone_scans")
    op.drop_table("drone_scans")
