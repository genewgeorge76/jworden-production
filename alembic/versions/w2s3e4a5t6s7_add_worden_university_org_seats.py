"""Add Worden University organization and seat tables.

Company seat licensing: a contractor buys a block of seats for their crew.
The org admin key is stored only as a sha256 hash, so a database leak cannot
be replayed as organization access.

Revision ID: w2s3e4a5t6s7
Revises: w1u2n3i4v5e6
"""

from alembic import op
import sqlalchemy as sa


revision = "w2s3e4a5t6s7"
down_revision = "w1u2n3i4v5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lms_organizations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("billing_email", sa.String(length=254), nullable=False),
        sa.Column("seats_purchased", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("key_hash", sa.String(length=64), nullable=False),
        sa.Column("plan", sa.String(length=50), nullable=False, server_default="seats"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lms_organizations_billing_email", "lms_organizations", ["billing_email"])
    op.create_index("ix_lms_organizations_key_hash", "lms_organizations", ["key_hash"])

    op.create_table(
        "lms_org_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("org_id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="member"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("added_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["org_id"], ["lms_organizations.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("org_id", "email", name="uq_org_member"),
    )
    op.create_index("ix_lms_org_members_org_id", "lms_org_members", ["org_id"])
    op.create_index("ix_lms_org_members_email", "lms_org_members", ["email"])


def downgrade() -> None:
    op.drop_index("ix_lms_org_members_email", table_name="lms_org_members")
    op.drop_index("ix_lms_org_members_org_id", table_name="lms_org_members")
    op.drop_table("lms_org_members")

    op.drop_index("ix_lms_organizations_key_hash", table_name="lms_organizations")
    op.drop_index("ix_lms_organizations_billing_email", table_name="lms_organizations")
    op.drop_table("lms_organizations")
