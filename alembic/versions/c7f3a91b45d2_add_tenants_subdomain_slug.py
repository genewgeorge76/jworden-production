"""add tenants.subdomain_slug and tenants.branding_tier

Self-serve SaaS tenants are meant to be reachable at
``<slug>.thewordenstandard.com``.  ``routers/factory.py`` resolves that hostname
against ``Tenant.subdomain_slug`` and sets the same column when provisioning a
new tenant -- but the column did not exist on the model, and both call sites are
guarded with ``hasattr(Tenant, 'subdomain_slug')``:

    saas_tenant = db.query(Tenant).filter(
        Tenant.subdomain_slug == subdomain_slug
    ).first() if hasattr(Tenant, 'subdomain_slug') else None      # factory.py:159

    for col, val in [..., ("subdomain_slug", safe_slug)]:
        if hasattr(Tenant, col):                                   # factory.py:306
            tenant_kwargs[col] = val

With the attribute absent, the guards evaluated false: the lookup silently
returned ``None`` and the slug was silently discarded on write.  A subdomain-only
signup therefore reported success and then resolved to nothing -- self-serve
onboarding could never work.

The column is nullable so existing tenants and custom-domain-only tenants are
unaffected, and unique because the slug *is* the hostname.  SQL permits multiple
NULLs under a unique index, so the existing rows do not collide.

Length 63 is the DNS label limit.

``branding_tier`` has the identical story and the identical cause.  factory.py
accepts it on the provision request (jarvis | worden_standard | white_label),
drops it through the same ``hasattr`` guard, and then echoes the *requested*
tier back in the response at line 349 -- so provisioning reported success for a
value that was never stored.  ``src/lib/siteProfiles.js`` reads this column to
choose the tier, and ``factory.py:176`` falls back to ``"jarvis"`` when it is
missing, so a customer who signed up for white-label branding was silently
served Jarvis branding.

It is added NOT NULL with a server default of ``'jarvis'`` -- the same value the
read path already fell back to -- so no existing tenant changes appearance.

Revision ID: c7f3a91b45d2
Revises: 971900dc0bd5
Create Date: 2026-08-16 04:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7f3a91b45d2'
down_revision: Union[str, Sequence[str], None] = '971900dc0bd5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add subdomain_slug and branding_tier columns to tenants."""
    # Guard per column: skip whichever already exists (e.g. a DB created from
    # models.py directly without Alembic) -- same idempotency pattern as
    # a1b2c3d4e5f6, applied independently so a partially-migrated DB converges.
    conn = op.get_bind()
    existing_cols = [c['name'] for c in sa.inspect(conn).get_columns('tenants')]

    if 'subdomain_slug' not in existing_cols:
        with op.batch_alter_table('tenants') as batch_op:
            batch_op.add_column(sa.Column('subdomain_slug', sa.String(length=63), nullable=True))
        op.create_index(
            op.f('ix_tenants_subdomain_slug'), 'tenants', ['subdomain_slug'], unique=True
        )

    if 'branding_tier' not in existing_cols:
        # NOT NULL with a server default so existing rows backfill to 'jarvis',
        # which is the same value factory.py already fell back to when reading
        # the missing attribute -- so this migration does not change how any
        # existing tenant renders.
        with op.batch_alter_table('tenants') as batch_op:
            batch_op.add_column(
                sa.Column(
                    'branding_tier',
                    sa.String(length=30),
                    nullable=False,
                    server_default='jarvis',
                )
            )


def downgrade() -> None:
    """Drop the tenants.subdomain_slug and branding_tier columns."""
    conn = op.get_bind()
    existing_cols = [c['name'] for c in sa.inspect(conn).get_columns('tenants')]

    if 'branding_tier' in existing_cols:
        with op.batch_alter_table('tenants') as batch_op:
            batch_op.drop_column('branding_tier')

    if 'subdomain_slug' in existing_cols:
        op.drop_index(op.f('ix_tenants_subdomain_slug'), table_name='tenants')
        with op.batch_alter_table('tenants') as batch_op:
            batch_op.drop_column('subdomain_slug')
