"""add_site_evaluations

Creates the site_evaluations table introduced in app/models.py.

Revision ID: d4f6a1b2c3e5
Revises: bc2d5f75bee4
Create Date: 2026-05-02 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers
revision: str = 'd4f6a1b2c3e5'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'site_evaluations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('compliance_score', sa.Float(), nullable=True),
        sa.Column('ad_roi', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('tenant_id', sa.String(), nullable=True),
        sa.Column('last_checked', sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_site_evaluations_tenant_id', 'site_evaluations', ['tenant_id'])
    op.create_index('ix_site_evaluations_last_checked', 'site_evaluations', ['last_checked'])


def downgrade() -> None:
    op.drop_index('ix_site_evaluations_last_checked', table_name='site_evaluations')
    op.drop_index('ix_site_evaluations_tenant_id', table_name='site_evaluations')
    op.drop_table('site_evaluations')
