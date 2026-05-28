"""add_regional_base_evaluations

Creates the regional_base_evaluations table introduced in app/models.py.

Revision ID: e5f7b2c4d6a8
Revises: d4f6a1b2c3e5
Create Date: 2026-05-02 00:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers
revision: str = 'e5f7b2c4d6a8'
down_revision: Union[str, Sequence[str], None] = 'd4f6a1b2c3e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'regional_base_evaluations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('site_location', sa.String(length=300), nullable=False),
        sa.Column('dot_standard', sa.String(length=120), nullable=True),
        sa.Column('soil_type', sa.Float(), nullable=True),
        sa.Column('required_base_depth', sa.Float(), nullable=True),
        sa.Column('compliance_status', sa.String(length=30), nullable=False, server_default='Pending'),
        sa.Column('evaluated_by', sa.String(length=80), nullable=True, server_default='SupremeCourtAI'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('tenant_id', sa.String(length=60), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_regional_base_evaluations_id', 'regional_base_evaluations', ['id'])
    op.create_index('ix_regional_base_evaluations_tenant_id', 'regional_base_evaluations', ['tenant_id'])


def downgrade() -> None:
    op.drop_index('ix_regional_base_evaluations_tenant_id', table_name='regional_base_evaluations')
    op.drop_index('ix_regional_base_evaluations_id', table_name='regional_base_evaluations')
    op.drop_table('regional_base_evaluations')
