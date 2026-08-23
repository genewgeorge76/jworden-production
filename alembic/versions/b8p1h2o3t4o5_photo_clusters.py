"""photo_clusters: places the crews photographed, pending confirmation

The archive in Dropbox and OneDrive carries GPS and capture times in its file
metadata, so thousands of photographs can be surveyed without downloading any
of them. What that produces is coordinates, not jobsites — and the difference
matters here more than usual.

Photographs already in this repository sat in folders named
store_07_orlando_idrive and store_10_neworleans_veterans that all held images
from a single coordinate. The names recorded intent; publishing them would
have claimed work in six cities the photographs disprove. Personal photographs
also share these accounts, and no coordinate separates a customer's car park
from a family holiday.

So each cluster waits here until a person confirms it. Rejections are kept
rather than deleted, or a rescan offers the same holiday snap for review every
time it runs.

Revision ID: b8p1h2o3t4o5
Revises: a7j1a2r3v4i5
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b8p1h2o3t4o5"
# Taken from ScriptDirectory.get_heads(), which is the resolver
# `alembic upgrade head` uses — not from reading the versions directory, where
# the last filename alphabetically is not the tip and choosing it forks the
# graph.
down_revision: Union[str, Sequence[str], None] = "a7j1a2r3v4i5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if "photo_clusters" in sa.inspect(bind).get_table_names():
        return

    op.create_table(
        "photo_clusters",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.String(length=60), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("photo_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("first_seen", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_seen", sa.DateTime(timezone=True), nullable=True),
        sa.Column("source", sa.String(length=30), nullable=False, server_default="dropbox"),
        sa.Column("sample_paths", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("kind", sa.String(length=20), nullable=True),
        sa.Column("label", sa.String(length=200), nullable=True),
        sa.Column("address", sa.String(length=300), nullable=True),
        sa.Column("evidence", sa.String(length=30), nullable=False, server_default="photo_gps"),
        sa.Column("evidence_note", sa.Text(), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("state", sa.String(length=60), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by", sa.String(length=254), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_photo_clusters_tenant_id", "photo_clusters", ["tenant_id"])
    op.create_index("ix_photo_clusters_status", "photo_clusters", ["status"])
    # A rescan asks "is there already a cluster near this point for this
    # tenant", which is a bounded lat/lon sweep per cluster found.
    op.create_index("ix_photo_clusters_point", "photo_clusters", ["tenant_id", "lat", "lon"])


def downgrade() -> None:
    bind = op.get_bind()
    if "photo_clusters" not in sa.inspect(bind).get_table_names():
        return
    op.drop_index("ix_photo_clusters_point", table_name="photo_clusters")
    op.drop_index("ix_photo_clusters_status", table_name="photo_clusters")
    op.drop_index("ix_photo_clusters_tenant_id", table_name="photo_clusters")
    op.drop_table("photo_clusters")
