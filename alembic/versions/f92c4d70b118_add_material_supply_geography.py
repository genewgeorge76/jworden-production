"""add material sources, dated prices, haul profiles and labor markets

Pricing had one geographic input: a state multiplier. Every Virginia job
therefore priced identically, when what actually separates Charlottesville,
Richmond and Roanoke is haul distance to a plant that can supply the mix.

Four tables: where material comes from, what it costs FOB on a given date,
the trucking assumptions that turn that into a delivered price, and crew cost
by market rather than by state.

Prices are a dated history, not a single current value, so a bid can always be
traced to the quote it was built on.

Revision ID: f92c4d70b118
Revises: e77b419c8d35
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f92c4d70b118"
down_revision: Union[str, Sequence[str], None] = "e77b419c8d35"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "material_sources",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("operator", sa.String(length=200), nullable=True),
        sa.Column("source_type", sa.String(length=40), nullable=False),
        sa.Column("address", sa.String(length=300), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("state", sa.String(length=2), nullable=True),
        sa.Column("lat", sa.Float(), nullable=True),
        sa.Column("lng", sa.Float(), nullable=True),
        sa.Column("season_open_month", sa.Integer(), nullable=True),
        sa.Column("season_close_month", sa.Integer(), nullable=True),
        sa.Column("max_haul_minutes", sa.Integer(), nullable=True),
        sa.Column("account_number", sa.String(length=60), nullable=True),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("tenant_id", sa.String(length=60), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_material_sources_id", "material_sources", ["id"])
    op.create_index("ix_material_sources_source_type", "material_sources", ["source_type"])
    op.create_index("ix_material_sources_city", "material_sources", ["city"])
    op.create_index("ix_material_sources_state", "material_sources", ["state"])
    op.create_index("ix_material_sources_tenant_id", "material_sources", ["tenant_id"])

    op.create_table(
        "material_source_prices",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=False),
        sa.Column("material_code", sa.String(length=60), nullable=False),
        sa.Column("material_name", sa.String(length=200), nullable=True),
        sa.Column("unit", sa.String(length=20), nullable=False),
        sa.Column("fob_price", sa.Float(), nullable=False),
        sa.Column("effective_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("quoted_by", sa.String(length=160), nullable=True),
        sa.Column("source_note", sa.String(length=200), nullable=False),
        sa.Column("tenant_id", sa.String(length=60), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["source_id"], ["material_sources.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source_id", "material_code", "effective_date",
                            name="uq_source_material_date"),
    )
    op.create_index("ix_material_source_prices_id", "material_source_prices", ["id"])
    op.create_index("ix_material_source_prices_source_id", "material_source_prices", ["source_id"])
    op.create_index("ix_material_source_prices_material_code", "material_source_prices", ["material_code"])
    op.create_index("ix_material_source_prices_effective_date", "material_source_prices", ["effective_date"])
    op.create_index("ix_material_source_prices_tenant_id", "material_source_prices", ["tenant_id"])

    op.create_table(
        "haul_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("truck_type", sa.String(length=60), nullable=True),
        sa.Column("tons_per_load", sa.Float(), nullable=False),
        sa.Column("truck_cost_per_hour", sa.Float(), nullable=False),
        sa.Column("load_minutes", sa.Float(), nullable=False),
        sa.Column("dump_minutes", sa.Float(), nullable=False),
        sa.Column("average_speed_mph", sa.Float(), nullable=False),
        sa.Column("circuity_factor", sa.Float(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False),
        sa.Column("tenant_id", sa.String(length=60), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_haul_profiles_id", "haul_profiles", ["id"])
    op.create_index("ix_haul_profiles_tenant_id", "haul_profiles", ["tenant_id"])

    op.create_table(
        "labor_markets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("state", sa.String(length=2), nullable=False),
        sa.Column("lat", sa.Float(), nullable=True),
        sa.Column("lng", sa.Float(), nullable=True),
        sa.Column("radius_miles", sa.Float(), nullable=False),
        sa.Column("crew_cost_per_hour", sa.Float(), nullable=True),
        sa.Column("prevailing_wage_required", sa.Boolean(), nullable=False),
        sa.Column("per_diem_per_day", sa.Float(), nullable=True),
        sa.Column("source_note", sa.String(length=200), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("tenant_id", sa.String(length=60), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_labor_markets_id", "labor_markets", ["id"])
    op.create_index("ix_labor_markets_state", "labor_markets", ["state"])
    op.create_index("ix_labor_markets_tenant_id", "labor_markets", ["tenant_id"])


def downgrade() -> None:
    op.drop_table("labor_markets")
    op.drop_table("haul_profiles")
    op.drop_table("material_source_prices")
    op.drop_table("material_sources")
