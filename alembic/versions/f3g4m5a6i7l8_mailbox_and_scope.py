"""mailbox_connections, and what was actually done at each site

MAILBOXES

The work is spread across five addresses and a connector authorises exactly
one. Everything in the other four is invisible until each is consented to
separately, so each gets its own credential, its own resumable cursor and its
own record of what it produced.

Refresh tokens are stored encrypted and never leave the process. Access tokens
are not stored at all — they last an hour and are cheaper to mint than to
guard. A mailbox Google has stopped accepting records the error, because a
broken connection that returns nothing reads exactly like a mailbox with no
work in it.

SCOPE AND ROLE

"Some of these stores we built and paved, some we only did certain items."
Those are different claims and the difference cuts both ways: saying the
company built a restaurant where it only sealed the car park is false, and
filing a ground-up build under "paving" throws away the strongest thing in the
portfolio.

role carries its own source rather than borrowing scope's, because the two are
established by different documents: a contract states a scope, while a year of
correspondence — distributing the architect's plans to trades, running weekend
schedules across several sites, settling hood wall details with the engineer —
establishes a role.

All of them stay null until something says otherwise. The AIA contract for
2601 West Broad states its scope in five lines and names J Worden & Sons as the
Contractor; a row on a programme spreadsheet states neither and inherits
nothing from the site next to it.

Revision ID: f3g4m5a6i7l8
Revises: e2c3o4m5p6l7
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f3g4m5a6i7l8"
# From ScriptDirectory.get_heads().
down_revision: Union[str, Sequence[str], None] = "e2c3o4m5p6l7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_JOB_COLUMNS = (
    ("scope", sa.Text()),
    ("scope_source", sa.String(length=120)),
    ("role", sa.String(length=40)),
    ("role_source", sa.String(length=200)),
)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    existing = {c["name"] for c in inspector.get_columns("client_job_records")}
    for name, kind in _JOB_COLUMNS:
        if name not in existing:
            op.add_column("client_job_records", sa.Column(name, kind, nullable=True))

    if "mailbox_connections" in inspector.get_table_names():
        return

    op.create_table(
        "mailbox_connections",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.String(length=60), nullable=False),
        sa.Column("email_address", sa.String(length=254), nullable=False),
        sa.Column("refresh_token_encrypted", sa.Text(), nullable=True),
        sa.Column("scopes", sa.Text(), nullable=True),
        sa.Column("connected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("last_error_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("backfill_before", sa.DateTime(timezone=True), nullable=True),
        sa.Column("backfill_complete", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("history_id", sa.String(length=40), nullable=True),
        sa.Column("last_scan_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("messages_seen", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("records_created", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
        # One row per mailbox per tenant: connecting the same address twice
        # would double every record it produces.
        sa.UniqueConstraint("tenant_id", "email_address", name="uq_mailbox_per_tenant"),
    )
    op.create_index("ix_mailbox_connections_tenant_id", "mailbox_connections", ["tenant_id"])
    op.create_index("ix_mailbox_connections_email", "mailbox_connections", ["email_address"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "mailbox_connections" in inspector.get_table_names():
        op.drop_index("ix_mailbox_connections_email", table_name="mailbox_connections")
        op.drop_index("ix_mailbox_connections_tenant_id", table_name="mailbox_connections")
        op.drop_table("mailbox_connections")

    existing = {c["name"] for c in inspector.get_columns("client_job_records")}
    for name, _ in reversed(_JOB_COLUMNS):
        if name in existing:
            op.drop_column("client_job_records", name)
