"""add_compaction_logs

Revision ID: f6a8b3c5d7e9
Revises: e5f7b2c4d6a8
Create Date: 2026-05-02

Adds the compaction_logs table for GPS-tagged intelligent compaction
telemetry from field rollers.
"""

from alembic import op
import sqlalchemy as sa

revision = "f6a8b3c5d7e9"
down_revision = "e5f7b2c4d6a8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "compaction_logs",
        sa.Column("id",               sa.Integer(),     nullable=False),
        sa.Column("project_site_id",  sa.Integer(),     nullable=True),
        sa.Column("roller_id",        sa.String(60),    nullable=False),
        sa.Column("operator_name",    sa.String(120),   nullable=True),
        sa.Column("lat",              sa.Float(),       nullable=False),
        sa.Column("lng",              sa.Float(),       nullable=False),
        sa.Column("pass_number",      sa.Integer(),     nullable=True),
        sa.Column("mat_temp_f",       sa.Float(),       nullable=True),
        sa.Column("mat_thickness_in", sa.Float(),       nullable=True),
        sa.Column("density_pct",      sa.Float(),       nullable=True),
        sa.Column("speed_mph",        sa.Float(),       nullable=True),
        sa.Column("gps_accuracy_ft",  sa.Float(),       nullable=True),
        sa.Column("notes",            sa.Text(),        nullable=True),
        sa.Column("tenant_id",        sa.String(60),    nullable=True),
        sa.Column("logged_at",        sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_at",       sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_compaction_logs_id",              "compaction_logs", ["id"],              unique=False)
    op.create_index("ix_compaction_logs_roller_id",       "compaction_logs", ["roller_id"],       unique=False)
    op.create_index("ix_compaction_logs_project_site_id", "compaction_logs", ["project_site_id"], unique=False)
    op.create_index("ix_compaction_logs_tenant_id",       "compaction_logs", ["tenant_id"],       unique=False)
    op.create_index("ix_compaction_logs_logged_at",       "compaction_logs", ["logged_at"],       unique=False)


def downgrade() -> None:
    op.drop_index("ix_compaction_logs_logged_at",       table_name="compaction_logs")
    op.drop_index("ix_compaction_logs_tenant_id",       table_name="compaction_logs")
    op.drop_index("ix_compaction_logs_project_site_id", table_name="compaction_logs")
    op.drop_index("ix_compaction_logs_roller_id",       table_name="compaction_logs")
    op.drop_index("ix_compaction_logs_id",              table_name="compaction_logs")
    op.drop_table("compaction_logs")
