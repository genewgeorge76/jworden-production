"""client_job_records: the completion date, and where the site actually is

"KFC Hackettstown NJ Finished Pictures", 5 May 2017, from this company to KBP's
facilities director. That date is the record — not a date somebody typed into a
spreadsheet afterwards — and it is what makes a completion claim checkable.

Kept apart from date_submitted, which is when an invoice went out. The two are
different events and on most jobs they are weeks apart.

latitude and longitude come with it, so a verified record can become a pin. Both
are nullable and a null stays null — a record placed "about right" on a map is a
false claim with a map reference attached, which is worse than no pin at all.

Revision ID: e2c3o4m5p6l7
Revises: d1a2r3e4a5s6
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e2c3o4m5p6l7"
# From ScriptDirectory.get_heads().
down_revision: Union[str, Sequence[str], None] = "d1a2r3e4a5s6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {c["name"] for c in sa.inspect(bind).get_columns("client_job_records")}
    if "completed_on" not in existing:
        op.add_column(
            "client_job_records", sa.Column("completed_on", sa.DateTime(timezone=True), nullable=True)
        )
    if "latitude" not in existing:
        op.add_column("client_job_records", sa.Column("latitude", sa.Float(), nullable=True))
    if "longitude" not in existing:
        op.add_column("client_job_records", sa.Column("longitude", sa.Float(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    existing = {c["name"] for c in sa.inspect(bind).get_columns("client_job_records")}
    for name in ("longitude", "latitude", "completed_on"):
        if name in existing:
            op.drop_column("client_job_records", name)
