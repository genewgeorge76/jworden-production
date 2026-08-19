"""add seo_keywords

Backing table for the SERP engine. Every metric column is nullable —
unmeasured is a real state and must be representable — but `source` is NOT
NULL, so a number cannot be stored without saying where it came from.

Revision ID: e77b419c8d35
Revises: d51a8e37c204
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e77b419c8d35"
down_revision: Union[str, Sequence[str], None] = "d51a8e37c204"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "seo_keywords",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("keyword", sa.String(length=300), nullable=False),
        sa.Column("vertical", sa.String(length=60), nullable=False),
        sa.Column("category", sa.String(length=60), nullable=True),
        sa.Column("country", sa.String(length=2), nullable=False),
        sa.Column("volume_monthly", sa.Integer(), nullable=True),
        sa.Column("cpc_usd", sa.Float(), nullable=True),
        sa.Column("difficulty", sa.Integer(), nullable=True),
        sa.Column("current_position", sa.Float(), nullable=True),
        sa.Column("impressions", sa.Integer(), nullable=True),
        sa.Column("clicks", sa.Integer(), nullable=True),
        sa.Column("intent", sa.String(length=60), nullable=True),
        sa.Column("target_domain", sa.String(length=200), nullable=True),
        sa.Column("source", sa.String(length=120), nullable=False),
        sa.Column("source_captured_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id", sa.String(length=60), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("keyword", "vertical", "country", name="uq_seo_keyword_scope"),
    )
    op.create_index("ix_seo_keywords_id", "seo_keywords", ["id"])
    op.create_index("ix_seo_keywords_keyword", "seo_keywords", ["keyword"])
    op.create_index("ix_seo_keywords_vertical", "seo_keywords", ["vertical"])
    op.create_index("ix_seo_keywords_category", "seo_keywords", ["category"])
    op.create_index("ix_seo_keywords_target_domain", "seo_keywords", ["target_domain"])
    op.create_index("ix_seo_keywords_tenant_id", "seo_keywords", ["tenant_id"])


def downgrade() -> None:
    op.drop_table("seo_keywords")
