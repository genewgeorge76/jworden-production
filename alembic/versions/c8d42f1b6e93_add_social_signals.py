"""add social_signals

Listening writes here, and only for posts the search actually cited. The URL
is not nullable and is unique per tenant: a row is something a person can
click through and read, or it does not exist. A model asked what people are
saying about potholes will produce a fluent, specific paragraph whether or
not the search returned anything, so an uncited summary is refused rather
than stored.

Unique on (tenant_id, url) so re-running a query over the same window
refreshes last_seen_at instead of stacking duplicates.

Revision ID: c8d42f1b6e93
Revises: b7c31e9a5d02
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c8d42f1b6e93"
down_revision: Union[str, Sequence[str], None] = "b7c31e9a5d02"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "social_signals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=True),
        sa.Column("kind", sa.String(length=40), nullable=False),
        sa.Column("url", sa.String(length=600), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=True),
        sa.Column("excerpt", sa.Text(), nullable=True),
        sa.Column("query", sa.Text(), nullable=True),
        sa.Column("place", sa.String(length=160), nullable=True),
        sa.Column("provider", sa.String(length=40), nullable=False),
        sa.Column("model", sa.String(length=60), nullable=True),
        sa.Column("review_status", sa.String(length=20), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by", sa.String(length=120), nullable=True),
        sa.Column("dismissed_reason", sa.Text(), nullable=True),
        sa.Column("lead_id", sa.Integer(), nullable=True),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "url", name="uq_social_signal_tenant_url"),
    )
    op.create_index("ix_social_signals_id", "social_signals", ["id"])
    op.create_index("ix_social_signals_tenant_id", "social_signals", ["tenant_id"])
    op.create_index("ix_social_signals_kind", "social_signals", ["kind"])
    op.create_index("ix_social_signals_place", "social_signals", ["place"])
    op.create_index("ix_social_signals_review_status", "social_signals", ["review_status"])


def downgrade() -> None:
    op.drop_table("social_signals")
