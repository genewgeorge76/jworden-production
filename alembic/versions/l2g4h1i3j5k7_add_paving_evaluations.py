"""add_paving_evaluations

Revision ID: l2g4h1i3j5k7
Revises: k1f3g0h2i4d6
Create Date: 2026-05-02

Creates the ``paving_evaluations`` table used by the automated quoting engine.
Records are produced by field staff or GPT-4 Vision photo inspection and drive
the POST /api/v1/quotes/generate/{evaluation_id} endpoint.
"""

from alembic import op
import sqlalchemy as sa

revision = "l2g4h1i3j5k7"
down_revision = "k1f3g0h2i4d6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "paving_evaluations",
        sa.Column("id",              sa.Integer(),               nullable=False),
        sa.Column("region",          sa.String(200),             nullable=False),
        sa.Column("calculated_sqft", sa.Float(),                 nullable=False),
        sa.Column("damage_type",     sa.String(60),              nullable=False,
                  server_default="good"),
        sa.Column("notes",           sa.Text(),                  nullable=True),
        sa.Column("tenant_id",       sa.String(60),              nullable=True,
                  server_default="default"),
        sa.Column("created_at",      sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_paving_evaluations_id",        "paving_evaluations", ["id"])
    op.create_index("ix_paving_evaluations_tenant_id", "paving_evaluations", ["tenant_id"])


def downgrade() -> None:
    op.drop_index("ix_paving_evaluations_tenant_id", table_name="paving_evaluations")
    op.drop_index("ix_paving_evaluations_id",        table_name="paving_evaluations")
    op.drop_table("paving_evaluations")
