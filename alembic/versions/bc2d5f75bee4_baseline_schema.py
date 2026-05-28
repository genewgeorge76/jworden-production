"""baseline_schema

Marker revision retained for backward compatibility.

For deployments that were already stamped at ``bc2d5f75bee4`` before the
real initial schema migration (``0e263db2f322``) was added, this
revision remains the head, so ``alembic upgrade head`` is a no-op and
the existing schema is left untouched.

For fresh deployments, the chain is::

    None -> 0e263db2f322 (initial_schema, creates tables)
         -> bc2d5f75bee4 (this baseline marker, no-op)

Revision ID: bc2d5f75bee4
Revises: 0e263db2f322
Create Date: 2026-04-27 00:27:30.514847

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bc2d5f75bee4'
down_revision: Union[str, Sequence[str], None] = '0e263db2f322'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # baseline marker migration (no-op — schema is created by 0e263db2f322)
    pass


def downgrade() -> None:
    """Downgrade schema."""
    # baseline marker migration (no-op — schema is dropped by 0e263db2f322)
    pass
