"""add scheduler_heartbeats and a scheduled status for social posts

Celery beat failing is silent: the queue stays empty, the worker reports
healthy, and periodic jobs simply never fire. For a scheduled-post queue that
is indistinguishable from "nothing is due" until someone asks why nothing went
out. Each run stamps this table so a stalled dispatcher can be told apart from
an idle one.

Revision ID: d5a17c3e8b40
Revises: c8d42f1b6e93
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d5a17c3e8b40"
down_revision: Union[str, Sequence[str], None] = "c8d42f1b6e93"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "scheduler_heartbeats",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("task_name", sa.String(length=120), nullable=False),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_status", sa.String(length=20), nullable=False),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("runs", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("task_name"),
    )
    op.create_index("ix_scheduler_heartbeats_id", "scheduler_heartbeats", ["id"])
    op.create_index("ix_scheduler_heartbeats_task_name", "scheduler_heartbeats",
                    ["task_name"])


def downgrade() -> None:
    op.drop_table("scheduler_heartbeats")
