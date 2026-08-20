"""add company_claims, social_accounts, social_posts

Outbound marketing copy is advertising, and every "licensed", "insured",
"4.9 stars" in it is a factual assertion the company has to be able to
defend. `company_claims` is where those are attested once, with evidence and
an expiry — so a lapsed certificate of insurance makes its own posts
unpublishable instead of quietly continuing to run.

`social_posts.source_kind`/`source_id` carry provenance for the same reason
material prices carry `source_note`: content with no source is a claim with
no backing, and nothing else in this platform is allowed to produce one.

Revision ID: b7c31e9a5d02
Revises: a4d18f2be6c7
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b7c31e9a5d02"
down_revision: Union[str, Sequence[str], None] = "a4d18f2be6c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "company_claims",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=True),
        sa.Column("key", sa.String(length=60), nullable=False),
        sa.Column("claim_text", sa.Text(), nullable=False),
        sa.Column("source_note", sa.Text(), nullable=False),
        sa.Column("evidence_url", sa.String(length=500), nullable=True),
        sa.Column("effective_from", sa.Date(), nullable=True),
        sa.Column("expires_on", sa.Date(), nullable=True),
        sa.Column("attested_by", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "key", name="uq_company_claim_tenant_key"),
    )
    op.create_index("ix_company_claims_id", "company_claims", ["id"])
    op.create_index("ix_company_claims_tenant_id", "company_claims", ["tenant_id"])
    op.create_index("ix_company_claims_key", "company_claims", ["key"])
    op.create_index("ix_company_claims_expires_on", "company_claims", ["expires_on"])

    op.create_table(
        "social_accounts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=True),
        sa.Column("platform", sa.String(length=30), nullable=False),
        sa.Column("handle", sa.String(length=120), nullable=False),
        sa.Column("display_name", sa.String(length=200), nullable=True),
        sa.Column("external_id", sa.String(length=120), nullable=True),
        sa.Column("credential_key_name", sa.String(length=80), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("last_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "platform", "handle", name="uq_social_account"),
    )
    op.create_index("ix_social_accounts_id", "social_accounts", ["id"])
    op.create_index("ix_social_accounts_tenant_id", "social_accounts", ["tenant_id"])
    op.create_index("ix_social_accounts_platform", "social_accounts", ["platform"])

    op.create_table(
        "social_posts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=True),
        sa.Column("platform", sa.String(length=30), nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("media_json", sa.JSON(), nullable=True),
        sa.Column("link_url", sa.String(length=500), nullable=True),
        sa.Column("source_kind", sa.String(length=40), nullable=True),
        sa.Column("source_id", sa.String(length=80), nullable=True),
        sa.Column("source_note", sa.Text(), nullable=True),
        sa.Column("claim_report_json", sa.JSON(), nullable=True),
        sa.Column("claims_cleared_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("external_post_id", sa.String(length=200), nullable=True),
        sa.Column("external_url", sa.String(length=500), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["social_accounts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_social_posts_id", "social_posts", ["id"])
    op.create_index("ix_social_posts_tenant_id", "social_posts", ["tenant_id"])
    op.create_index("ix_social_posts_platform", "social_posts", ["platform"])
    op.create_index("ix_social_posts_status", "social_posts", ["status"])
    op.create_index("ix_social_posts_source_kind", "social_posts", ["source_kind"])
    op.create_index("ix_social_posts_scheduled_for", "social_posts", ["scheduled_for"])


def downgrade() -> None:
    op.drop_table("social_posts")
    op.drop_table("social_accounts")
    op.drop_table("company_claims")
