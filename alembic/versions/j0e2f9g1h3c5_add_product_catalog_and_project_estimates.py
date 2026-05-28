"""add_product_catalog_and_project_estimates

Revision ID: j0e2f9g1h3c5
Revises: i9d1e6f8g0b2
Create Date: 2026-05-02

Adds two tables for the GC Interior Design & Cost Estimation module:
  - product_catalog    : material/labor price catalog with unit rates
  - project_estimates  : line-item cost estimates per project site

Also seeds a baseline product catalog with common GC trade items
so the tool works out-of-the-box after migration.
"""

from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa

revision = "j0e2f9g1h3c5"
down_revision = "i9d1e6f8g0b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── product_catalog ───────────────────────────────────────────────────────
    op.create_table(
        "product_catalog",
        sa.Column("id",          sa.Integer(),    nullable=False),
        sa.Column("category",    sa.String(60),   nullable=False, server_default="other"),
        sa.Column("name",        sa.String(200),  nullable=False),
        sa.Column("unit",        sa.String(30),   nullable=False),
        sa.Column("base_rate",   sa.Float(),      nullable=False, server_default="0"),
        sa.Column("labor_rate",  sa.Float(),      nullable=False, server_default="0"),
        sa.Column("description", sa.String(300),  nullable=True),
        sa.Column("is_active",   sa.Boolean(),    nullable=False, server_default=sa.text("true")),
        sa.Column("tenant_id",   sa.String(60),   nullable=True),
        sa.Column("created_at",  sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at",  sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pc_id",       "product_catalog", ["id"],       unique=False)
    op.create_index("ix_pc_category", "product_catalog", ["category"], unique=False)
    op.create_index("ix_pc_tenant_id","product_catalog", ["tenant_id"],unique=False)

    # ── project_estimates ─────────────────────────────────────────────────────
    op.create_table(
        "project_estimates",
        sa.Column("id",              sa.Integer(),   nullable=False),
        sa.Column("project_site_id", sa.Integer(),   nullable=True),
        sa.Column("item_id",         sa.Integer(),   nullable=True),
        sa.Column("item_name",       sa.String(200), nullable=True),
        sa.Column("unit",            sa.String(30),  nullable=True),
        sa.Column("quantity",        sa.Float(),     nullable=False, server_default="0"),
        sa.Column("base_rate",       sa.Float(),     nullable=False, server_default="0"),
        sa.Column("labor_rate",      sa.Float(),     nullable=False, server_default="0"),
        sa.Column("markup_pct",      sa.Float(),     nullable=False, server_default="0.15"),
        sa.Column("total_cost",      sa.Float(),     nullable=False, server_default="0"),
        sa.Column("notes",           sa.String(300), nullable=True),
        sa.Column("created_by",      sa.String(120), nullable=True),
        sa.Column("tenant_id",       sa.String(60),  nullable=True),
        sa.Column("created_at",      sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at",      sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pe_id",              "project_estimates", ["id"],              unique=False)
    op.create_index("ix_pe_project_site_id", "project_estimates", ["project_site_id"], unique=False)
    op.create_index("ix_pe_item_id",         "project_estimates", ["item_id"],         unique=False)
    op.create_index("ix_pe_tenant_id",       "project_estimates", ["tenant_id"],       unique=False)

    # ── Seed baseline product catalog ─────────────────────────────────────────
    _seed_catalog()


def _seed_catalog() -> None:
    """Seed standard GC trade items so the estimator is useful out-of-the-box."""
    catalog = op.get_bind()
    now = datetime.now(timezone.utc).isoformat()

    items = [
        # flooring
        ("flooring", "Hardwood Oak Flooring (3/4″)",     "sq_ft", 5.50, 3.50),
        ("flooring", "LVP Luxury Vinyl Plank",           "sq_ft", 3.20, 2.80),
        ("flooring", "Ceramic Tile (Standard)",          "sq_ft", 2.80, 4.50),
        ("flooring", "Porcelain Tile (Large Format)",    "sq_ft", 4.50, 5.50),
        ("flooring", "Carpet (Mid-Grade)",               "sq_ft", 2.20, 1.80),
        ("flooring", "Concrete Polished Overlay",        "sq_ft", 3.00, 2.50),
        # framing
        ("framing",  "Exterior Wall Framing (2×6 16oc)", "sq_ft", 3.80, 5.20),
        ("framing",  "Interior Partition (2×4 16oc)",    "sq_ft", 1.80, 3.50),
        ("framing",  "Roof Truss (Engineered)",          "sq_ft", 6.50, 4.50),
        ("framing",  "LVL Ridge Beam",                   "linear_ft", 12.00, 8.00),
        # roofing
        ("roofing",  "Asphalt Shingles (Architectural)", "sq_ft", 2.50, 3.50),
        ("roofing",  "Metal Roof (Standing Seam)",       "sq_ft", 6.00, 5.00),
        ("roofing",  "TPO Flat Roof Membrane",           "sq_ft", 3.50, 4.00),
        ("roofing",  "Roof Decking (5/8″ OSB)",          "sq_ft", 1.20, 1.50),
        # concrete
        ("concrete", "Slab-on-Grade (4″ w/ rebar)",     "sq_ft", 4.50, 3.50),
        ("concrete", "Foundation Wall (8″ Poured)",      "linear_ft", 55.00, 45.00),
        ("concrete", "Flatwork Sidewalk (4″)",           "sq_ft", 5.50, 4.00),
        # asphalt
        ("asphalt",  "Asphalt Overlay (2″ Surface)",     "sq_ft", 2.00, 1.50),
        ("asphalt",  "Full-Depth Asphalt (4″)",          "sq_ft", 4.50, 2.50),
        ("asphalt",  "Asphalt Milling (2″)",             "sq_ft", 1.20, 1.00),
        ("asphalt",  "Sealcoating (Coal Tar Emulsion)",  "sq_ft", 0.22, 0.18),
        ("asphalt",  "Pavement Marking (4″ Line)",       "linear_ft", 0.30, 0.25),
        # electrical
        ("electrical","Rough-In Wiring (per circuit)",   "ea",    180.00, 150.00),
        ("electrical","Electrical Panel (200A)",          "ea",    800.00, 1200.00),
        ("electrical","Recessed Light (6″)",              "ea",    45.00,  95.00),
        # plumbing
        ("plumbing", "PEX Supply Rough-In",              "linear_ft", 4.00, 8.00),
        ("plumbing", "Toilet Rough-In + Fixture",        "ea",    280.00, 320.00),
        ("plumbing", "Shower Valve + Trim",              "ea",    350.00, 450.00),
        ("plumbing", "Kitchen Sink + Faucet",            "ea",    320.00, 280.00),
        # finishes
        ("finishes", "Drywall (1/2″, hang+tape+finish)", "sq_ft", 1.80, 3.20),
        ("finishes", "Interior Paint (2 coats + prime)", "sq_ft", 0.45, 1.35),
        ("finishes", "Trim & Baseboard (3.5″ primed)",   "linear_ft", 1.80, 2.50),
        ("finishes", "Interior Door (Hollow-Core prehung)","ea",  120.00, 180.00),
        ("finishes", "Exterior Door (Fiberglass, prehung)","ea",  650.00, 350.00),
    ]

    for category, name, unit, base_rate, labor_rate in items:
        catalog.execute(
            sa.text(
                "INSERT INTO product_catalog "
                "(category, name, unit, base_rate, labor_rate, is_active, tenant_id, created_at, updated_at) "
                "VALUES (:cat, :name, :unit, :br, :lr, true, 'default', :now, :now)"
            ),
            {"cat": category, "name": name, "unit": unit, "br": base_rate, "lr": labor_rate, "now": now},
        )


def downgrade() -> None:
    op.drop_index("ix_pe_tenant_id",       table_name="project_estimates")
    op.drop_index("ix_pe_item_id",         table_name="project_estimates")
    op.drop_index("ix_pe_project_site_id", table_name="project_estimates")
    op.drop_index("ix_pe_id",              table_name="project_estimates")
    op.drop_table("project_estimates")

    op.drop_index("ix_pc_tenant_id", table_name="product_catalog")
    op.drop_index("ix_pc_category",  table_name="product_catalog")
    op.drop_index("ix_pc_id",        table_name="product_catalog")
    op.drop_table("product_catalog")
