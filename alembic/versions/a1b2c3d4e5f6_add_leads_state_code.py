"""add leads.state_code

Adds a 2-letter state_code column to the ``leads`` table so the public
quote intake can capture, persist, and surface the lead's state.  The
column is nullable to remain backward-compatible with existing rows
and to allow gradual frontend rollout.

Revision ID: a1b2c3d4e5f6
Revises: bc2d5f75bee4
Create Date: 2026-05-01 02:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'bc2d5f75bee4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add nullable, indexed state_code column to leads."""
    # Guard: skip if the column already exists (e.g. Railway DB created from
    # models.py directly without Alembic -- same idempotency pattern as 0e263db2f322).
    conn = op.get_bind()
    existing_cols = [c['name'] for c in sa.inspect(conn).get_columns('leads')]
    if 'state_code' in existing_cols:
        return

    with op.batch_alter_table('leads') as batch_op:
        batch_op.add_column(sa.Column('state_code', sa.String(length=2), nullable=True))
    op.create_index(op.f('ix_leads_state_code'), 'leads', ['state_code'], unique=False)


def downgrade() -> None:
    """Drop the leads.state_code column and its index."""
    op.drop_index(op.f('ix_leads_state_code'), table_name='leads')
    with op.batch_alter_table('leads') as batch_op:
        batch_op.drop_column('state_code')
