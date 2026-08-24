"""leads and contact_messages: record whether anybody was actually told

The notifier was fire-and-forget. It returned None and wrote its failures to
the log, which is the exact failure its own health endpoint warns about: the
form accepts the submission, the row is saved, the endpoint returns 200, and
the send fails in a background task after the response has already gone.

Nothing anywhere recorded it, so a lead pipeline with no configured channel
looked identical to a quiet week — and the only way to tell them apart was to
read the application log at the right moment.

These four columns are the receipt. Channel names only: "email", "sms". Never
an address and never key material, because they are read back through the API
and rendered on a screen.

Revision ID: g4n5o6t7i8f9
Revises: f3g4m5a6i7l8
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "g4n5o6t7i8f9"
# From ScriptDirectory.get_heads().
down_revision: Union[str, Sequence[str], None] = "f3g4m5a6i7l8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_COLUMNS = (
    ("notified_at", sa.DateTime(timezone=True)),
    ("notify_delivered", sa.String(length=60)),
    ("notify_failed", sa.String(length=60)),
    ("notify_error", sa.Text()),
)


# Both tables. A contact form is a lead source — arguably the main one — and it
# went through the same fire-and-forget notifier, so a failed alert on one of
# those was exactly as invisible as on a Lead.
_TABLES = ("leads", "contact_messages")


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for table in _TABLES:
        if table not in inspector.get_table_names():
            continue
        existing = {c["name"] for c in inspector.get_columns(table)}
        for name, kind in _COLUMNS:
            if name not in existing:
                op.add_column(table, sa.Column(name, kind, nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for table in _TABLES:
        if table not in inspector.get_table_names():
            continue
        existing = {c["name"] for c in inspector.get_columns(table)}
        for name, _ in reversed(_COLUMNS):
            if name in existing:
                op.drop_column(table, name)
