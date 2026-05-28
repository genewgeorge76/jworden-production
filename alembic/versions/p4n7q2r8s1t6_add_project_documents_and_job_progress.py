"""add_project_documents_and_job_progress

Revision ID: p4n7q2r8s1t6
Revises: m3h5i2j4k6l8
Create Date: 2026-05-03

Adds persistent customer-document storage and job progress fields used by the
admin documents workflow and customer-facing project views.
"""

from alembic import op
import sqlalchemy as sa

revision = "p4n7q2r8s1t6"
down_revision = "m3h5i2j4k6l8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    if "jobs" in existing_tables:
        existing_columns = {column["name"] for column in inspector.get_columns("jobs")}
        if "progress_percent" not in existing_columns:
            op.add_column("jobs", sa.Column("progress_percent", sa.Integer(), nullable=False, server_default="0"))
        if "progress_notes" not in existing_columns:
            op.add_column("jobs", sa.Column("progress_notes", sa.Text(), nullable=True))

    if "project_documents" not in existing_tables:
        op.create_table(
            "project_documents",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("job_id", sa.Integer(), nullable=False),
            sa.Column("client_email", sa.String(length=254), nullable=True),
            sa.Column("document_type", sa.String(length=40), nullable=False, server_default="other"),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("filename", sa.String(length=300), nullable=False),
            sa.Column("mime_type", sa.String(length=120), nullable=True),
            sa.Column("file_size_bytes", sa.Integer(), nullable=True),
            sa.Column("file_url", sa.Text(), nullable=False),
            sa.Column("visible_to_client", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("uploaded_by", sa.String(length=120), nullable=True),
            sa.Column("tenant_id", sa.String(length=60), nullable=True, server_default="default"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_project_documents_id", "project_documents", ["id"])
        op.create_index("ix_project_documents_job_id", "project_documents", ["job_id"])
        op.create_index("ix_project_documents_client_email", "project_documents", ["client_email"])
        op.create_index("ix_project_documents_tenant_id", "project_documents", ["tenant_id"])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    if "project_documents" in existing_tables:
        for idx in [
            "ix_project_documents_tenant_id",
            "ix_project_documents_client_email",
            "ix_project_documents_job_id",
            "ix_project_documents_id",
        ]:
            op.drop_index(idx, table_name="project_documents")
        op.drop_table("project_documents")

    if "jobs" in existing_tables:
        existing_columns = {column["name"] for column in inspector.get_columns("jobs")}
        if "progress_notes" in existing_columns:
            op.drop_column("jobs", "progress_notes")
        if "progress_percent" in existing_columns:
            op.drop_column("jobs", "progress_percent")