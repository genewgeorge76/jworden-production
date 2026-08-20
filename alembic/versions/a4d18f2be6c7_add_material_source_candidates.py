"""add material_source_candidates

Supplier discovery writes here, not to material_sources. A text search for
"asphalt plant" also returns paving contractors, sales offices and closed
yards; a candidate enrolled automatically would be priced against as though
trucks could load there. Promotion is a separate, deliberate step.

Unique on (provider, provider_place_id) so re-running discovery over the same
ground refreshes candidates rather than stacking duplicates.

Revision ID: a4d18f2be6c7
Revises: f92c4d70b118
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a4d18f2be6c7"
down_revision: Union[str, Sequence[str], None] = "f92c4d70b118"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "material_source_candidates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=40), nullable=False),
        sa.Column("provider_place_id", sa.String(length=200), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("address", sa.String(length=300), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("state", sa.String(length=2), nullable=True),
        sa.Column("lat", sa.Float(), nullable=True),
        sa.Column("lng", sa.Float(), nullable=True),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("website", sa.String(length=300), nullable=True),
        sa.Column("searched_category", sa.String(length=60), nullable=False),
        sa.Column("provider_primary_type", sa.String(length=80), nullable=True),
        sa.Column("business_status", sa.String(length=40), nullable=True),
        sa.Column("distance_from_search_center_mi", sa.Float(), nullable=True),
        sa.Column("raw_json", sa.JSON(), nullable=True),
        sa.Column("review_status", sa.String(length=20), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("review_note", sa.String(length=300), nullable=True),
        sa.Column("promoted_source_id", sa.Integer(), nullable=True),
        sa.Column("tenant_id", sa.String(length=60), nullable=True),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider", "provider_place_id",
                            name="uq_candidate_provider_place"),
    )
    for col in ("id", "provider", "state", "searched_category", "review_status",
                "promoted_source_id", "tenant_id"):
        op.create_index(f"ix_material_source_candidates_{col}",
                        "material_source_candidates", [col])


def downgrade() -> None:
    op.drop_table("material_source_candidates")
