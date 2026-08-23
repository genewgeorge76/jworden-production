"""operator_notes: somewhere for Jarvis to put issues and reminders

Jarvis had nowhere to record either. Asked to note a problem or to remind the
operator of something, the model could only answer as though it had — short
memory holds the last few turns of a single session, and nothing survives a
restart. This is the table that makes "I'll remind you" true.

One table for both kinds. They are the same record with a different reason for
existing; only `due_at` distinguishes them, and only reminders set it.

Revision ID: a7j1a2r3v4i5
Revises: b3d7c1e40002
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a7j1a2r3v4i5"
# The head as ScriptDirectory.get_heads() reports it — the same resolver
# `alembic upgrade head` uses. Chosen by asking alembic rather than by reading
# filenames: z6c7h8a9i0n1 looks like the tip in a directory listing and sits
# mid-chain, and building on it forks the migration graph. CI caught exactly
# that, which is what the one-head guard is for.
down_revision: Union[str, Sequence[str], None] = "b3d7c1e40002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    # Idempotent: AUTO_CREATE_TABLES may already have built this from the model
    # on a deployment that booted before the migration ran.
    if "operator_notes" in inspector.get_table_names():
        return

    op.create_table(
        "operator_notes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.String(length=60), nullable=False),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("severity", sa.String(length=20), nullable=False, server_default="normal"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("source", sa.String(length=60), nullable=False, server_default="jarvis"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_operator_notes_tenant_id", "operator_notes", ["tenant_id"])
    op.create_index("ix_operator_notes_kind", "operator_notes", ["kind"])
    op.create_index("ix_operator_notes_status", "operator_notes", ["status"])
    # Reminders are read as "what is due", which is a range scan over due_at
    # filtered by tenant. Indexed together so that stays one lookup.
    op.create_index("ix_operator_notes_due", "operator_notes", ["tenant_id", "due_at"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "operator_notes" not in inspector.get_table_names():
        return
    op.drop_index("ix_operator_notes_due", table_name="operator_notes")
    op.drop_index("ix_operator_notes_status", table_name="operator_notes")
    op.drop_index("ix_operator_notes_kind", table_name="operator_notes")
    op.drop_index("ix_operator_notes_tenant_id", table_name="operator_notes")
    op.drop_table("operator_notes")
