"""Give tenants.subscription_status a server default.

The column exists in production as NOT NULL with no default and was absent from
the Tenant model, so every INSERT built from the model omitted it and Postgres
refused the row:

    NotNullViolation: null value in column "subscription_status" of relation
    "tenants" violates not-null constraint

/auth/register returned 500 for everyone as a result, which is why the users
table was empty and nobody could sign in. The model now declares the column with
a "pending" default; this migration adds the matching server default so an
INSERT that bypasses the ORM is safe too, and creates the column on any database
that lacks it entirely (it was never in the migration chain).

"pending" rather than "active": registration commits the tenant *before* Stripe
checkout runs, so a brand new tenant has not paid yet and must not be recorded
as though it had.

Revision ID: y4s1t2a3t4u5
Revises: x3d1r2i3f4t5
"""

from alembic import op
import sqlalchemy as sa


revision = "y4s1t2a3t4u5"
down_revision = "x3d1r2i3f4t5"
branch_labels = None
depends_on = None


def _columns() -> dict:
    insp = sa.inspect(op.get_bind())
    if "tenants" not in insp.get_table_names():
        return {}
    return {c["name"]: c for c in insp.get_columns("tenants")}


def upgrade() -> None:
    cols = _columns()
    if not cols:
        return

    if "subscription_status" not in cols:
        op.add_column(
            "tenants",
            sa.Column(
                "subscription_status",
                sa.String(length=20),
                nullable=False,
                server_default="pending",
            ),
        )
        return

    # Present already: backfill any nulls, then make it self-sufficient.
    op.execute(
        "UPDATE tenants SET subscription_status = 'pending' "
        "WHERE subscription_status IS NULL"
    )
    op.alter_column(
        "tenants",
        "subscription_status",
        existing_type=sa.String(length=20),
        nullable=False,
        server_default="pending",
    )


def downgrade() -> None:
    cols = _columns()
    if "subscription_status" in cols:
        # Drop only the default. The column predates this migration in
        # production, so removing it would destroy data this did not create.
        op.alter_column(
            "tenants",
            "subscription_status",
            existing_type=sa.String(length=20),
            server_default=None,
        )
