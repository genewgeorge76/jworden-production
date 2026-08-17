"""Reconcile 20 columns that exist in the models but not in the database.

Production was built by create_all() and then drifted: columns were added to
app/models.py over time without matching migrations, so the ORM emitted SQL for
columns the tables did not have. It surfaced as

    column leads.source does not exist

from get_lead_funnel — because db.query(Lead).count() selects every mapped
column, not just id. That single failure then aborted the transaction and took
the other four dashboard metrics with it (fixed separately in analytics._abort).

A live comparison of Base.metadata against the running database found 19 such
columns across 5 tables, plus proposal_outcomes.outcome_recorded_at, which was
missing from the *model* as well despite four call sites reading it.

Every add is guarded by an inspector check, so this is safe to run against a
database that already has some of these columns — including any environment that
create_all() has since caught up on.

Revision ID: x3d1r2i3f4t5
Revises: w2s3e4a5t6s7
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "x3d1r2i3f4t5"
down_revision = "w2s3e4a5t6s7"
branch_labels = None
depends_on = None


# (table, column, type, nullable) — mirrors app/models.py exactly.
_COLUMNS = [
    ("estimates", "public_token", sa.String(length=100), True),
    ("estimates", "total_amount", sa.Float(), True),
    ("estimates", "deposit_amount", sa.Float(), True),
    ("estimates", "signature_data_url", sa.Text(), True),
    ("estimates", "signed_at_utc", sa.DateTime(timezone=True), True),
    ("estimates", "terms_accepted", sa.Boolean(), True),
    ("estimates", "payment_method", sa.String(length=30), True),
    ("estimates", "payment_status", sa.String(length=30), True),
    ("jobs", "price", sa.Float(), True),
    ("jobs", "geo_lat", sa.Float(), True),
    ("jobs", "geo_lng", sa.Float(), True),
    ("jobs", "scope_geojson", postgresql.JSON(astext_type=sa.Text()), True),
    ("jobs", "pictures_json", postgresql.JSON(astext_type=sa.Text()), True),
    ("leads", "source", sa.String(length=100), True),
    ("leads", "latitude", sa.Float(), True),
    ("leads", "longitude", sa.Float(), True),
    ("leads", "raw_data", postgresql.JSON(astext_type=sa.Text()), True),
    ("blog_posts", "market_site_id", sa.Integer(), True),
]


def _existing(table: str) -> set[str]:
    insp = sa.inspect(op.get_bind())
    if table not in insp.get_table_names():
        return set()
    return {c["name"] for c in insp.get_columns(table)}


def upgrade() -> None:
    for table, column, type_, nullable in _COLUMNS:
        if column in _existing(table):
            continue
        op.add_column(table, sa.Column(column, type_, nullable=nullable))

    # public_token is unique=True, index=True on the model. Unique matters:
    # it is the unguessable handle in a customer-facing estimate link, so a
    # collision would expose one customer's estimate to another.
    if "public_token" in _existing("estimates"):
        insp = sa.inspect(op.get_bind())
        names = {i["name"] for i in insp.get_indexes("estimates")}
        if "ix_estimates_public_token" not in names:
            op.create_index(
                "ix_estimates_public_token", "estimates", ["public_token"], unique=True
            )

    if "market_site_id" in _existing("blog_posts"):
        insp = sa.inspect(op.get_bind())
        names = {i["name"] for i in insp.get_indexes("blog_posts")}
        if "ix_blog_posts_market_site_id" not in names:
            op.create_index(
                "ix_blog_posts_market_site_id", "blog_posts", ["market_site_id"]
            )
        fks = {f.get("name") for f in insp.get_foreign_keys("blog_posts")}
        if "fk_blog_posts_market_site_id" not in fks and "market_sites" in insp.get_table_names():
            op.create_foreign_key(
                "fk_blog_posts_market_site_id",
                "blog_posts",
                "market_sites",
                ["market_site_id"],
                ["id"],
            )

    # tenants.industry is NOT NULL on the model. Existing rows have no value, so
    # add it nullable, fill it, then tighten. The server_default stays: it keeps
    # the constraint satisfiable for any insert that bypasses the ORM default.
    if "industry" not in _existing("tenants"):
        op.add_column(
            "tenants",
            sa.Column(
                "industry",
                sa.String(length=100),
                nullable=True,
                server_default="Asphalt Paving",
            ),
        )
        op.execute("UPDATE tenants SET industry = 'Asphalt Paving' WHERE industry IS NULL")
        op.alter_column("tenants", "industry", nullable=False)

    # outcome_recorded_at is NOT NULL and is read by four call sites, including
    # the KPI wall's 12-month bid-to-win window. Backfill from created_at rather
    # than now(): stamping every historical bid with today's date would reorder
    # the outcome list and distort the window it feeds.
    if "outcome_recorded_at" not in _existing("proposal_outcomes"):
        op.add_column(
            "proposal_outcomes",
            sa.Column("outcome_recorded_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.execute(
            "UPDATE proposal_outcomes "
            "SET outcome_recorded_at = created_at "
            "WHERE outcome_recorded_at IS NULL"
        )
        op.alter_column(
            "proposal_outcomes",
            "outcome_recorded_at",
            nullable=False,
            server_default=sa.text("now()"),
        )


def downgrade() -> None:
    # Guarded the same way, so a partial upgrade can still be reversed.
    for table, column in [
        ("proposal_outcomes", "outcome_recorded_at"),
        ("tenants", "industry"),
    ]:
        if column in _existing(table):
            op.drop_column(table, column)

    insp = sa.inspect(op.get_bind())
    if "blog_posts" in insp.get_table_names():
        fks = {f.get("name") for f in insp.get_foreign_keys("blog_posts")}
        if "fk_blog_posts_market_site_id" in fks:
            op.drop_constraint(
                "fk_blog_posts_market_site_id", "blog_posts", type_="foreignkey"
            )
        names = {i["name"] for i in insp.get_indexes("blog_posts")}
        if "ix_blog_posts_market_site_id" in names:
            op.drop_index("ix_blog_posts_market_site_id", table_name="blog_posts")

    if "estimates" in insp.get_table_names():
        names = {i["name"] for i in insp.get_indexes("estimates")}
        if "ix_estimates_public_token" in names:
            op.drop_index("ix_estimates_public_token", table_name="estimates")

    for table, column, _type, _nullable in reversed(_COLUMNS):
        if column in _existing(table):
            op.drop_column(table, column)
