"""lms_course_generation_jobs — record every AI course generation attempt

The LMS course generator runs as a FastAPI background task. Its failure
handler was a bare `print`, and since the course row is only written on
success, a failed generation left nothing behind at all — no error, no row,
no way for the caller to find out. This table is where the attempt is
recorded, pass or fail. See app.models.CourseGenerationJob.

Re-entrant, like the rest of this chain: the schema is created only when the
table is absent, so a database that already has it (from a prior partial
apply, or from Base.metadata.create_all in a fresh test DB) upgrades to a
no-op instead of a DuplicateTable error.

Revision ID: b3d7c1e40002
Revises: fa71c0de0001
Create Date: 2026-08-22
"""
from alembic import op
import sqlalchemy as sa


revision = "b3d7c1e40002"
down_revision = "fa71c0de0001"
branch_labels = None
depends_on = None

_TABLE = "lms_course_generation_jobs"


def _has_table(name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(name)


def upgrade() -> None:
    if _has_table(_TABLE):
        return
    op.create_table(
        _TABLE,
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("tenant_id", sa.String(length=60), nullable=True, index=True),
        sa.Column("topic", sa.String(length=500), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("difficulty", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="queued", index=True),
        sa.Column("engine", sa.String(length=60), nullable=True),
        sa.Column("course_id", sa.Integer(), nullable=True, index=True),
        sa.Column("modules_created", sa.Integer(), nullable=True),
        sa.Column("lessons_created", sa.Integer(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_lms_course_gen_jobs_tenant_status",
        _TABLE,
        ["tenant_id", "status"],
    )


def downgrade() -> None:
    if not _has_table(_TABLE):
        return
    op.drop_index("ix_lms_course_gen_jobs_tenant_status", table_name=_TABLE)
    op.drop_table(_TABLE)
