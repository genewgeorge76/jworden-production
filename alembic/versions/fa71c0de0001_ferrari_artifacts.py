"""ferrari_artifacts — tenant-scoped store for saved Ferrari work

The Ferrari tools kept their output in the browser. This table is where that
work goes instead, so a bid or a dispatch board belongs to a tenant rather
than to one laptop. See app.models.FerrariArtifact.

Re-entrant, like the rest of this chain: the schema is created only when the
table is absent, so a database that already has it (from a prior partial
apply, or from Base.metadata.create_all in a fresh test DB) upgrades to a
no-op instead of a DuplicateTable error.

Revision ID: fa71c0de0001
Revises: e6b28d4f1a37
Create Date: 2026-08-21
"""
from alembic import op
import sqlalchemy as sa


revision = "fa71c0de0001"
down_revision = "e6b28d4f1a37"
branch_labels = None
depends_on = None


def _has_table(name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(name)


def upgrade() -> None:
    if _has_table("ferrari_artifacts"):
        return
    op.create_table(
        "ferrari_artifacts",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("tenant_id", sa.String(length=60), nullable=True, index=True),
        sa.Column("ferrari", sa.String(length=40), nullable=False, index=True),
        sa.Column("kind", sa.String(length=40), nullable=False, server_default="default", index=True),
        sa.Column("ref", sa.String(length=120), nullable=True, index=True),
        sa.Column("title", sa.String(length=300), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_ferrari_artifacts_tenant_ferrari_kind", "ferrari_artifacts",
                    ["tenant_id", "ferrari", "kind"])


def downgrade() -> None:
    if not _has_table("ferrari_artifacts"):
        return
    op.drop_index("ix_ferrari_artifacts_tenant_ferrari_kind", table_name="ferrari_artifacts")
    op.drop_table("ferrari_artifacts")
