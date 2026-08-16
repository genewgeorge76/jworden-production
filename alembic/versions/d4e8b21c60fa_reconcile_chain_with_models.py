"""reconcile the alembic chain with models.py

The migration chain could not rebuild this database.  Building a database from
``alembic upgrade head`` and diffing it against ``Base.metadata`` showed seven
tables that no migration ever creates and four tables missing columns:

    tables absent from the chain
        users, market_sites, inbox_messages, staff_users,
        worker_profiles, worker_documents, daily_checkins

    columns absent from the chain
        tenants     industry, subscription_tier,
                    stripe_customer_id, stripe_subscription_id
        leads       latitude, longitude, source, raw_data
        jobs        price
        blog_posts  market_site_id

Two of those are load-bearing.  ``market_sites`` is the table models.py:1406
describes as "Replacing the hardcoded siteFactoryManifest.json" -- the Site
Factory's hostname resolution reads it.  ``leads.latitude`` / ``leads.longitude``
are what the geocoding service writes.

How the drift happened: nothing in the deploy path runs Alembic.  The Dockerfile
CMD goes straight to uvicorn, fly.toml has no release_command, and the schema has
instead been produced by ``create_all_tables()`` at startup (app/main.py:349).
``Base.metadata.create_all()`` creates missing *tables*, so new models appeared
in the database without anyone writing a migration -- and it never ALTERs an
existing table, which is why new *columns* on old tables (subdomain_slug,
branding_tier in the previous revision) never landed at all.

WHAT THIS MIGRATION IS FOR

Restoring the ability to build the database from empty.  Right now there is no
path from a blank Postgres to a working schema, which means no disaster
recovery and no trustworthy staging environment.

Every operation is guarded, so against the live database -- where all of this
already exists -- this revision is a no-op.  It only does work on a fresh build.

A NOTE ON THE APPROACH

The missing tables are created from ``Base.metadata`` with ``checkfirst=True``
rather than transcribed by hand.  That is deliberate: transcribing seven table
definitions invites a silent typo, and this revision's whole purpose is to make
the chain agree with the models.  The usual objection -- that a migration should
be a frozen historical record and should not import models -- is real, and the
trade-off is accepted *for this one reconciliation revision*.  Ordinary
migrations after this should declare their own DDL in the normal way.

Indexes are handled only for the columns this revision adds (three of the ten
carry index=True: blog_posts.market_site_id, tenants.stripe_customer_id,
tenants.stripe_subscription_id).

Broader index reconciliation is deliberately NOT attempted.  An autogenerate run
produced 91 index drop/create pairs that were artefacts of SQLite reflection and
would emit wrong DDL against Postgres.  After this revision, a rebuilt database
matches the models exactly on tables and columns, and 32 indexes across 8 tables
remain absent -- all of them pre-existing omissions in older revisions, none
introduced here:

    vdot_bids (7), license_verification_logs (6), anomaly_alerts (5),
    project_estimates (4), scc_verification_logs (4), product_catalog (3),
    ad_url_exclusions (2), site_evaluations (1)

Those are a performance gap on a rebuilt database, not a correctness one -- the
tables and their columns are all present.  Worth a follow-up revision generated
against Postgres, not SQLite.

Revision ID: d4e8b21c60fa
Revises: c7f3a91b45d2
Create Date: 2026-08-16 04:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e8b21c60fa'
down_revision: Union[str, Sequence[str], None] = 'c7f3a91b45d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Tables the chain never created. Order matters only for foreign keys, and
# create_all sorts by dependency itself.
_MISSING_TABLES = (
    'users',
    'market_sites',
    'inbox_messages',
    'staff_users',
    'worker_profiles',
    'worker_documents',
    'daily_checkins',
)

# (table, column, type, nullable, server_default, indexed)
#
# server_default is required on the NOT NULL columns so existing rows backfill.
# Both values match the model defaults, so no row changes meaning.
#
# `indexed` mirrors index=True on the model column. It matters in both
# directions: without it the rebuilt schema silently lacks the index, and on
# downgrade SQLite's batch_alter_table reconstructs the table from reflection
# and tries to recreate the index on a column that is being dropped, which
# fails with "no such column".
_MISSING_COLUMNS = (
    ('tenants', 'industry', sa.String(length=100), False, 'Asphalt Paving', False),
    ('tenants', 'subscription_tier', sa.String(length=30), False, 'lite', False),
    ('tenants', 'stripe_customer_id', sa.String(length=100), True, None, True),
    ('tenants', 'stripe_subscription_id', sa.String(length=100), True, None, True),
    ('leads', 'latitude', sa.Float(), True, None, False),
    ('leads', 'longitude', sa.Float(), True, None, False),
    ('leads', 'source', sa.String(length=100), True, None, False),
    ('leads', 'raw_data', sa.JSON(), True, None, False),
    ('jobs', 'price', sa.Float(), True, None, False),
    ('blog_posts', 'market_site_id', sa.Integer(), True, None, True),
)


def upgrade() -> None:
    """Create tables and columns the chain is missing. No-op where they exist."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    # ── tables ────────────────────────────────────────────────────────────────
    from app.models import Base  # noqa: PLC0415 -- see "A NOTE ON THE APPROACH"

    to_create = [
        Base.metadata.tables[name]
        for name in _MISSING_TABLES
        if name not in existing_tables and name in Base.metadata.tables
    ]
    if to_create:
        Base.metadata.create_all(bind=conn, tables=to_create, checkfirst=True)

    # ── columns ───────────────────────────────────────────────────────────────
    existing_tables = set(sa.inspect(conn).get_table_names())
    for table, column, type_, nullable, server_default, indexed in _MISSING_COLUMNS:
        if table not in existing_tables:
            # Table itself is absent and not one this revision creates; leave it
            # to whichever revision owns it rather than inventing it here.
            continue
        cols = {c['name'] for c in sa.inspect(conn).get_columns(table)}
        if column in cols:
            continue
        with op.batch_alter_table(table) as batch_op:
            batch_op.add_column(
                sa.Column(
                    column,
                    type_,
                    nullable=nullable,
                    server_default=server_default,
                )
            )
        if indexed:
            index_name = op.f(f'ix_{table}_{column}')
            existing_idx = {i['name'] for i in sa.inspect(conn).get_indexes(table)}
            if index_name not in existing_idx:
                op.create_index(index_name, table, [column], unique=False)


def downgrade() -> None:
    """
    Reverse the columns only.

    The seven tables are intentionally not dropped. They hold live data in every
    environment this revision will ever run against -- users, market sites,
    inbox messages -- and a downgrade that silently destroys them would be far
    more dangerous than an incomplete reversal. Drop them by hand if a genuine
    rebuild demands it.
    """
    conn = op.get_bind()
    existing_tables = set(sa.inspect(conn).get_table_names())

    for table, column, _type, _nullable, _default, indexed in reversed(_MISSING_COLUMNS):
        if table not in existing_tables:
            continue
        cols = {c['name'] for c in sa.inspect(conn).get_columns(table)}
        if column not in cols:
            continue
        # Drop the index first. On SQLite, batch_alter_table rebuilds the table
        # from reflection and would otherwise try to recreate this index against
        # the column it is dropping.
        if indexed:
            index_name = op.f(f'ix_{table}_{column}')
            if index_name in {i['name'] for i in sa.inspect(conn).get_indexes(table)}:
                op.drop_index(index_name, table_name=table)
        with op.batch_alter_table(table) as batch_op:
            batch_op.drop_column(column)
