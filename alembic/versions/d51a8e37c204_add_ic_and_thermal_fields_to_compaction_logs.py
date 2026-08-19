"""add IC, thermal differential and density method to compaction_logs

The field-QA path now accepts readings from the verified technology suite:
Intelligent Compaction (AASHTO R 111-22) reports an accelerometer-derived
ICMV, and thermal profiling (AASHTO R 110-22 / TxDOT Tex-244-F) grades
segregation on the temperature DIFFERENTIAL across the mat, which the existing
mat_temp_f column cannot express. density_method records how a density figure
was obtained so an electromagnetic reading (ASTM D7113 / AASHTO T 343) is
distinguishable from a nuclear gauge or a cut core.

All three are nullable: existing rows predate the instruments and must not be
backfilled with a value nobody measured.

Revision ID: d51a8e37c204
Revises: b3f71c2ad940
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d51a8e37c204"
down_revision: Union[str, Sequence[str], None] = "b3f71c2ad940"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("compaction_logs", sa.Column("icmv", sa.Float(), nullable=True))
    op.add_column(
        "compaction_logs", sa.Column("thermal_differential_f", sa.Float(), nullable=True)
    )
    op.add_column(
        "compaction_logs", sa.Column("density_method", sa.String(length=40), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("compaction_logs", "density_method")
    op.drop_column("compaction_logs", "thermal_differential_f")
    op.drop_column("compaction_logs", "icmv")
