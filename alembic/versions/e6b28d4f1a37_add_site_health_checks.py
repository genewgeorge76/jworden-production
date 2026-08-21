"""add site_health_checks

A four-hourly health check reported jwordenasphaltpaving.com green every cycle
while it served a Sedo advertising parking page, because the check stopped at
the status line and a parked domain answers 200. This table records what each
domain actually serves.

One row per domain rather than an append-only log: the operational questions
are "is it serving the site now" and "when did that change", and severity_since
answers the second without a table that grows by every domain every hour.

Revision ID: e6b28d4f1a37
Revises: d5a17c3e8b40
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e6b28d4f1a37"
down_revision: Union[str, Sequence[str], None] = "d5a17c3e8b40"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Re-entrant on purpose. This migration was applied, then the deploy that
    # carried it was reverted; db_release saw a stamp not in the reverted
    # repo's chain and re-stamped head — which rewrites only the version row
    # and leaves the table standing. Re-applying then died on DuplicateTable
    # and aborted every deploy during the 2026-08-21 outage. The postcondition
    # of this migration is "the table exists"; if it already does, that
    # postcondition is met and there is nothing to do.
    bind = op.get_bind()
    if sa.inspect(bind).has_table("site_health_checks"):
        return
    op.create_table(
        "site_health_checks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("domain", sa.String(length=200), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=True),
        sa.Column("visible_words", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=300), nullable=True),
        sa.Column("canonical", sa.String(length=500), nullable=True),
        sa.Column("server", sa.String(length=60), nullable=True),
        sa.Column("body_hash", sa.String(length=64), nullable=True),
        sa.Column("findings_json", sa.JSON(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("severity_since", sa.DateTime(timezone=True), nullable=True),
        sa.Column("checked_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("domain"),
    )
    op.create_index("ix_site_health_checks_id", "site_health_checks", ["id"])
    op.create_index("ix_site_health_checks_domain", "site_health_checks", ["domain"])
    op.create_index("ix_site_health_checks_severity", "site_health_checks", ["severity"])
    op.create_index("ix_site_health_checks_body_hash", "site_health_checks", ["body_hash"])


def downgrade() -> None:
    op.drop_table("site_health_checks")
