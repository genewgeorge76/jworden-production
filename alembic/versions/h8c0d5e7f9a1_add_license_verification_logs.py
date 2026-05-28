"""add_license_verification_logs

Revision ID: h8c0d5e7f9a1
Revises: g7b9c4d6e8f0
Create Date: 2026-05-02

Adds the license_verification_logs table for the 50-state contractor
license compliance audit trail.
"""

from alembic import op
import sqlalchemy as sa

revision = "h8c0d5e7f9a1"
down_revision = "g7b9c4d6e8f0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "license_verification_logs",
        sa.Column("id",               sa.Integer(),    nullable=False),
        sa.Column("entity_name",      sa.String(200),  nullable=True),
        sa.Column("state_code",       sa.String(2),    nullable=False),
        sa.Column("license_number",   sa.String(100),  nullable=False),
        sa.Column("license_type",     sa.String(120),  nullable=True),
        sa.Column("status",           sa.String(40),   nullable=False),
        sa.Column("expiration_date",  sa.DateTime(timezone=True), nullable=True),
        sa.Column("days_until_exp",   sa.Integer(),    nullable=True),
        sa.Column("is_compliant",     sa.Boolean(),    nullable=False),
        sa.Column("api_source",       sa.String(60),   nullable=True),
        sa.Column("raw_json",         sa.Text(),       nullable=True),
        sa.Column("subcontractor_id", sa.Integer(),    nullable=True),
        sa.Column("tenant_id",        sa.String(60),   nullable=True),
        sa.Column("checked_at",       sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_at",       sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lvl_id",               "license_verification_logs", ["id"],             unique=False)
    op.create_index("ix_lvl_state_code",        "license_verification_logs", ["state_code"],     unique=False)
    op.create_index("ix_lvl_license_number",    "license_verification_logs", ["license_number"], unique=False)
    op.create_index("ix_lvl_subcontractor_id",  "license_verification_logs", ["subcontractor_id"], unique=False)
    op.create_index("ix_lvl_tenant_id",         "license_verification_logs", ["tenant_id"],     unique=False)
    op.create_index("ix_lvl_checked_at",        "license_verification_logs", ["checked_at"],    unique=False)


def downgrade() -> None:
    op.drop_index("ix_lvl_checked_at",       table_name="license_verification_logs")
    op.drop_index("ix_lvl_tenant_id",        table_name="license_verification_logs")
    op.drop_index("ix_lvl_subcontractor_id", table_name="license_verification_logs")
    op.drop_index("ix_lvl_license_number",   table_name="license_verification_logs")
    op.drop_index("ix_lvl_state_code",       table_name="license_verification_logs")
    op.drop_index("ix_lvl_id",              table_name="license_verification_logs")
    op.drop_table("license_verification_logs")
