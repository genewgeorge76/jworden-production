"""client_job_records: what was agreed, billed and paid, and how well it is evidenced

The photo archive answers "where was a camera". This answers "what was agreed,
billed and paid" — the stronger record, and the only one that can support a
public claim of completed work.

The evidence grade is the reason this table exists rather than a flat list of
sites. The Project Red workbook holds 58 KFC sites — 28 Texas parking lots and
30 Michigan roofs — and 11 of them carry an invoice date or amount. Publishing
58 completed jobs from it would be a claim the paperwork does not support for
47 of them. And a punch list — "Riverdale G135101, 15 parking
blocks need replacing" — is the exact opposite of completed work; read
carelessly it turns a genuine document into a fabricated claim.

Money is in whole cents. A float total that disagrees with the invoice by a
cent is worse than no total at all on a page that exists to be trusted.

Revision ID: c9l1e2d3g4e5
Revises: b8p1h2o3t4o5
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c9l1e2d3g4e5"
# From ScriptDirectory.get_heads(), which is what `alembic upgrade head`
# resolves against — not from the last filename in the versions directory,
# which is not the tip and forks the graph when picked.
down_revision: Union[str, Sequence[str], None] = "b8p1h2o3t4o5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if "client_job_records" in sa.inspect(bind).get_table_names():
        return

    op.create_table(
        "client_job_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.String(length=60), nullable=False),
        sa.Column("store_number", sa.String(length=40), nullable=True),
        sa.Column("client", sa.String(length=160), nullable=True),
        sa.Column("program", sa.String(length=160), nullable=True),
        sa.Column("category", sa.String(length=40), nullable=True),
        sa.Column("address", sa.String(length=300), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("state", sa.String(length=60), nullable=True),
        sa.Column("postal_code", sa.String(length=20), nullable=True),
        sa.Column("invoice_number", sa.String(length=80), nullable=True),
        sa.Column("date_submitted", sa.DateTime(timezone=True), nullable=True),
        sa.Column("invoice_amount_cents", sa.Integer(), nullable=True),
        sa.Column("job_total_cents", sa.Integer(), nullable=True),
        sa.Column("amount_paid_cents", sa.Integer(), nullable=True),
        sa.Column("evidence", sa.String(length=20), nullable=False, server_default="listed"),
        sa.Column("outstanding_issues", sa.Text(), nullable=True),
        sa.Column("source_document", sa.String(length=300), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("published", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by", sa.String(length=254), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_client_job_records_tenant_id", "client_job_records", ["tenant_id"])
    op.create_index("ix_client_job_records_evidence", "client_job_records", ["evidence"])
    op.create_index("ix_client_job_records_store_number", "client_job_records", ["store_number"])
    # A re-import asks "is this store, in this category, already recorded for
    # this tenant" once per row.
    op.create_index(
        "ix_client_job_records_store",
        "client_job_records",
        ["tenant_id", "store_number", "category"],
    )


def downgrade() -> None:
    bind = op.get_bind()
    if "client_job_records" not in sa.inspect(bind).get_table_names():
        return
    for name in (
        "ix_client_job_records_store",
        "ix_client_job_records_store_number",
        "ix_client_job_records_evidence",
        "ix_client_job_records_tenant_id",
    ):
        op.drop_index(name, table_name="client_job_records")
    op.drop_table("client_job_records")
