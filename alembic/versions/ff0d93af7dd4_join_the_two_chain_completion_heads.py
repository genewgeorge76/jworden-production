"""join the two chain-completion heads

The chain forked. Two revisions were authored independently to fix the same
defect — the migration chain could not rebuild the database from scratch —
and each branched from a different parent:

    d4e8b21c60fa  reconcile the alembic chain with models.py   (from c7f3a91b45d2)
    z6c7h8a9i0n1  complete the chain: 7 tables and 3 columns   (from y4s1t2a3t4u5)

With two heads `alembic upgrade head` is ambiguous and refuses to run, which
is why test:api asserts on a single head. That guard did its job here.

Neither revision is dropped, because their coverage is not identical and both
are safe to apply in either order: each inspects the live schema first and
skips anything already present. d4e8b21c60fa creates missing tables through
Base.metadata.create_all(checkfirst=True) and adds columns only when absent;
z6c7h8a9i0n1 guards every create_table with _has_table() and every add_column
with _cols(). Whichever runs second finds its objects already there and does
nothing.

This revision only rejoins them. It has no schema effect of its own.

Revision ID: ff0d93af7dd4
Revises: d4e8b21c60fa, z6c7h8a9i0n1
Create Date: 2026-08-18
"""

from typing import Sequence, Union

revision: str = 'ff0d93af7dd4'
down_revision: Union[str, Sequence[str], None] = ('d4e8b21c60fa', 'z6c7h8a9i0n1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No schema change: this revision exists to converge two heads."""


def downgrade() -> None:
    """Splitting back into two heads is the inverse, and needs no DDL."""
