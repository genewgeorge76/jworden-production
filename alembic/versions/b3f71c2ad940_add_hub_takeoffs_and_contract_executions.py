"""add hub_takeoffs and hub_contract_executions

The JWordenAI master-node router records two things the schema had no home
for: a measured takeoff pushed up by a portfolio site, and the report that a
contract was executed. Domains and field QA reuse `market_sites` and
`compaction_logs`, which already exist, so only these two tables are new.

Both carry a unique business key (`takeoff_ref`, `contract_ref`) so a client
retrying a sync updates its own row rather than writing a duplicate record of
the same event.

Revision ID: b3f71c2ad940
Revises: ff0d93af7dd4
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b3f71c2ad940"
down_revision: Union[str, Sequence[str], None] = "ff0d93af7dd4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hub_takeoffs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("takeoff_ref", sa.String(length=120), nullable=False),
        sa.Column("source_domain", sa.String(length=200), nullable=True),
        sa.Column("project_name", sa.String(length=200), nullable=True),
        sa.Column("address", sa.String(length=300), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("state_code", sa.String(length=2), nullable=True),
        sa.Column("service_type", sa.String(length=60), nullable=True),
        sa.Column("measured_area_sqft", sa.Float(), nullable=True),
        sa.Column("measured_depth_in", sa.Float(), nullable=True),
        sa.Column("estimated_tons", sa.Float(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("method", sa.String(length=60), nullable=True),
        sa.Column("raw_payload_json", sa.JSON(), nullable=True),
        sa.Column("tenant_id", sa.String(length=60), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_hub_takeoffs_id", "hub_takeoffs", ["id"])
    op.create_index("ix_hub_takeoffs_takeoff_ref", "hub_takeoffs", ["takeoff_ref"], unique=True)
    op.create_index("ix_hub_takeoffs_source_domain", "hub_takeoffs", ["source_domain"])
    op.create_index("ix_hub_takeoffs_state_code", "hub_takeoffs", ["state_code"])
    op.create_index("ix_hub_takeoffs_tenant_id", "hub_takeoffs", ["tenant_id"])
    op.create_index("ix_hub_takeoffs_recorded_at", "hub_takeoffs", ["recorded_at"])

    op.create_table(
        "hub_contract_executions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("contract_ref", sa.String(length=120), nullable=False),
        sa.Column("source_domain", sa.String(length=200), nullable=True),
        sa.Column("customer_name", sa.String(length=200), nullable=True),
        sa.Column("project_name", sa.String(length=200), nullable=True),
        sa.Column("contract_value", sa.Float(), nullable=True),
        sa.Column("signer_name", sa.String(length=200), nullable=True),
        sa.Column("erp_status", sa.String(length=40), nullable=False),
        sa.Column("executed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("raw_payload_json", sa.JSON(), nullable=True),
        sa.Column("tenant_id", sa.String(length=60), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_hub_contract_executions_id", "hub_contract_executions", ["id"])
    op.create_index(
        "ix_hub_contract_executions_contract_ref",
        "hub_contract_executions", ["contract_ref"], unique=True,
    )
    op.create_index(
        "ix_hub_contract_executions_source_domain", "hub_contract_executions", ["source_domain"]
    )
    op.create_index(
        "ix_hub_contract_executions_executed_at", "hub_contract_executions", ["executed_at"]
    )
    op.create_index(
        "ix_hub_contract_executions_tenant_id", "hub_contract_executions", ["tenant_id"]
    )


def downgrade() -> None:
    op.drop_table("hub_contract_executions")
    op.drop_table("hub_takeoffs")
