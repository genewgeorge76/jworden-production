"""client_job_records: paved area, only where a document states it

The contract for 2601 West Broad Street, Richmond reads "Mill down entire
parking lot approx. 14,218 sq. ft. (2 inches)" — an area both parties put their
names to, alongside a contract sum of $32,500.00. That is worth recording.

The column is nullable and is meant to stay null when no document states an
area. The fabricated store database's headline figures were invented square
footages — 18,500, 24,500, 28,000 — so an unsourced area is exactly the field
that has already caused this problem once. area_source names the document.

Revision ID: d1a2r3e4a5s6
Revises: c9l1e2d3g4e5
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d1a2r3e4a5s6"
# From ScriptDirectory.get_heads().
down_revision: Union[str, Sequence[str], None] = "c9l1e2d3g4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {c["name"] for c in sa.inspect(bind).get_columns("client_job_records")}
    if "area_sqft" not in existing:
        op.add_column("client_job_records", sa.Column("area_sqft", sa.Integer(), nullable=True))
    if "area_source" not in existing:
        op.add_column(
            "client_job_records", sa.Column("area_source", sa.String(length=120), nullable=True)
        )


def downgrade() -> None:
    bind = op.get_bind()
    existing = {c["name"] for c in sa.inspect(bind).get_columns("client_job_records")}
    if "area_source" in existing:
        op.drop_column("client_job_records", "area_source")
    if "area_sqft" in existing:
        op.drop_column("client_job_records", "area_sqft")
