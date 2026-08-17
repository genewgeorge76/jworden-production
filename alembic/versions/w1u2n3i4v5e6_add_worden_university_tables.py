"""Add Worden University exam attempt and certification tables.

The LMS shipped with courses, enrollments and lesson progress but no way to
record an exam result or issue a verifiable certificate, so finished training
left no auditable trace. These tables store every attempt (pass or fail) and
the resulting certificate, which expires annually for recertification.

Revision ID: w1u2n3i4v5e6
Revises: 971900dc0bd5
"""

from alembic import op
import sqlalchemy as sa


revision = "w1u2n3i4v5e6"
down_revision = "971900dc0bd5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lms_exam_attempts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("course_slug", sa.String(length=120), nullable=False),
        sa.Column("course_title", sa.String(length=200), nullable=False),
        sa.Column("user_email", sa.String(length=254), nullable=False),
        sa.Column("user_name", sa.String(length=160), nullable=True),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("passed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("answers_json", sa.Text(), nullable=True),
        sa.Column("tenant_id", sa.String(length=60), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lms_exam_attempts_course_slug", "lms_exam_attempts", ["course_slug"])
    op.create_index("ix_lms_exam_attempts_user_email", "lms_exam_attempts", ["user_email"])
    op.create_index("ix_lms_exam_attempts_tenant_id", "lms_exam_attempts", ["tenant_id"])

    op.create_table(
        "lms_certifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("cert_number", sa.String(length=64), nullable=False),
        sa.Column("course_slug", sa.String(length=120), nullable=False),
        sa.Column("course_title", sa.String(length=200), nullable=False),
        sa.Column("user_email", sa.String(length=254), nullable=False),
        sa.Column("user_name", sa.String(length=160), nullable=True),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("tenant_id", sa.String(length=60), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cert_number", name="uq_certification_number"),
        sa.UniqueConstraint("course_slug", "user_email", name="uq_certification"),
    )
    op.create_index("ix_lms_certifications_cert_number", "lms_certifications", ["cert_number"])
    op.create_index("ix_lms_certifications_course_slug", "lms_certifications", ["course_slug"])
    op.create_index("ix_lms_certifications_user_email", "lms_certifications", ["user_email"])
    op.create_index("ix_lms_certifications_tenant_id", "lms_certifications", ["tenant_id"])


def downgrade() -> None:
    op.drop_index("ix_lms_certifications_tenant_id", table_name="lms_certifications")
    op.drop_index("ix_lms_certifications_user_email", table_name="lms_certifications")
    op.drop_index("ix_lms_certifications_course_slug", table_name="lms_certifications")
    op.drop_index("ix_lms_certifications_cert_number", table_name="lms_certifications")
    op.drop_table("lms_certifications")

    op.drop_index("ix_lms_exam_attempts_tenant_id", table_name="lms_exam_attempts")
    op.drop_index("ix_lms_exam_attempts_user_email", table_name="lms_exam_attempts")
    op.drop_index("ix_lms_exam_attempts_course_slug", table_name="lms_exam_attempts")
    op.drop_table("lms_exam_attempts")
