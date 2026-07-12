"""RAG (Retrieval-Augmented Generation) — context assembly for Jarvis."""
from __future__ import annotations

# ── Static knowledge domains (keyword-gated injection) ────────────────────────

_CORE_FACTS = """
BUSINESS: J. Worden & Sons — 4th-generation asphalt paving & general contracting, est. 1984, Chester, VA.
SERVICES: Asphalt paving, sealcoating, crack filling, parking lot paving, driveway paving, resurfacing,
  milling, chip seal, concrete, line striping, general contracting, cobblestone/pavers, stone masonry.
SERVICE AREA: 51 Virginia cities and counties. Expanding to all 50 states + DC for licensed operators.
LICENSE: Class A Contractor license required in Virginia. Obtained through the Department of Professional
  and Occupational Regulation (DPOR).
BONDING: Virginia requires a $50,000 surety bond for Class A contractors.
INSURANCE: Minimum $1M general liability; $500K workers' compensation for employees.
LIEN LAWS: Virginia has strict 150-day preliminary notice requirements for mechanics liens.
DEPOSIT POLICY: Standard 20% deposit on contract signing; balance due on completion.
PAYMENT METHODS: Check, bank transfer, credit card (3% processing fee applies).
WARRANTY: 1-year labor warranty on all paving work; material warranty follows manufacturer specs.
TYPICAL TIMELINE: Small driveway 1 day; parking lot 3-5 days; commercial lot 1-2 weeks.
"""

_PRICING_FACTS = """
PAVING RATES: Residential $3.50–$8.00/sqft; Commercial $2.50–$6.00/sqft (Virginia rates).
SEALCOATING: $0.15–$0.35/sqft residential; $0.12–$0.30/sqft commercial.
CRACK FILLING: $0.40–$1.00/sqft (linear feet pricing varies by crack width).
MOBILIZATION: Minimum job size $300 low / $600 high — no job too small policy abandoned for sub-300 projects.
THICKNESS: Standard paving 2–3 inches; heavy commercial 3–4 inches; base layer 4–6 inches stone aggregate.
MATERIAL COST: Asphalt tonnage priced at EIA weekly spot rate ± haul premium. Budget $75–$110/ton delivered.
STATE MULTIPLIERS: Higher-cost states (AK, HI, CA, NY, MA) add 20–45% to base rates.
BINDER INDEX: Premium-grade polymer-modified binder adds 12–18% to material cost.
DISCOUNT: Volume >10,000 sqft commercial jobs may qualify for 5–8% volume discount.
LARGE JOB THRESHOLD: Jobs >$50K use tiered billing (40/40/20 draw schedule).
"""

_TECHNICAL_FACTS = """
MIX TYPES: SM-9.5A (surface course, high traffic), SM-12.5A (surface course, standard),
  BM-25.0 (base mix), IM-19.0 (intermediate). VDOT specifies mix by project type.
TEMPERATURE: Lay-down temp minimum 275°F (135°C). Do not pave if ambient <40°F or rising moisture.
COMPACTION: Target 92–96% Marshall density. Breakdown roll at 240–280°F; finish roll <175°F.
CURING: Allow 24–48h before light traffic; 5–7 days before heavy truck traffic on new paving.
SUBBASE: 4–6" crushed stone (VDOT 21A/21B spec). Soft spots require geotextile fabric + extra stone.
DRAINAGE: 1–2% cross-slope minimum to prevent ponding. French drain required for high water table sites.
TACK COAT: CRS-2 emulsion @ 0.05–0.10 gal/sqft between lifts. Critical for bond adhesion.
SEALCOAT TIMING: Wait 12–18 months after paving before first sealcoat application.
CRACK TYPES: Alligator cracking indicates base failure — requires full-depth reclamation, not fill.
PCI SCALE: Pavement Condition Index 0–100. >70 = Good; 55–70 = Fair; 40–55 = Poor; <40 = Failed.
"""

_OSHA_FACTS = """
OSHA STANDARDS: 29 CFR 1926 governs construction. 29 CFR 1926.701 covers concrete/masonry.
FALL PROTECTION: Required >6ft on construction sites. Use guardrails, safety nets, or personal fall arrest.
STRUCK-BY: High-visibility vests (ANSI Class 2+) required in traffic. Spotter required for backing equipment.
HEAT ILLNESS: Rest 5 min/hour in shade when heat index >103°F. Water 1 cup/15 min. Cool-down areas mandatory.
SILICA: Asphalt milling/grinding triggers OSHA silica rule (Table 1). Use wet cutting or local exhaust.
PPE MINIMUM: Hard hat, safety glasses, steel-toe boots, hi-vis vest, hearing protection near equipment.
TRIR BENCHMARK: Construction industry average TRIR = 3.4. Target <2.0 for competitive bonding.
TOOLBOX TALKS: Minimum weekly; document attendees, topic, presenter. Retain 3 years.
OSHA 300 LOG: Maintain for work-related injuries/illnesses. Post Feb 1–Apr 30 annually.
TRAFFIC CONTROL: MUTCD Part 6 governs work zones. Certified Flagger required in live traffic lanes.
OSHA 10/30: OSHA 10-hour required for all workers; OSHA 30 required for supervisors in many states.
"""

_LEGAL_FACTS = """
WORKER CLASSIFICATION: Virginia follows the IRS 20-Factor Test. Misclassification = back taxes + penalties.
ABC TEST: Adopted by some states (CA AB5). Three-prong: free from control, outside usual business, independent trade.
DAY LABOR: Must pay same day in Virginia if requested. Written contract required for jobs >3 days.
PREVAILING WAGE: Virginia adopted state prevailing wage law 2021. Applies to state contracts >$500K.
MECHANICS LIEN: Virginia Code § 43-1 et seq. Contractor must file within 90 days of last furnishing.
PRELIMINARY NOTICE: Not required in VA (unlike many states) but recommended. General contractor rules differ.
SUBCONTRACTOR BONDS: Performance bond (100% contract value) + payment bond required for public projects >$500K VA.
CONTRACT MUST-HAVES: Scope of work, payment schedule, change order process, warranty, dispute resolution.
ARBITRATION: Include binding arbitration clause — saves litigation costs. AAA Commercial Rules recommended.
INSURANCE CERTIFICATE: Always require ACORD certificate naming owner as additional insured before starting.
"""

_DOMAIN_KEYWORDS: dict[str, list[str]] = {
    'pricing': ['price', 'cost', 'quote', 'estimate', 'sqft', 'rate', 'bid', 'dollar', 'cheap', 'expensive', 'budget', 'ton', 'material'],
    'technical': ['mix', 'temperature', 'compaction', 'density', 'base', 'subbase', 'tack', 'binder', 'lift', 'pci', 'cure', 'drain', 'slope', 'crack', 'alligator'],
    'osha': ['osha', 'safety', 'ppe', 'hard hat', 'vest', 'fall', 'struck', 'heat', 'silica', 'trir', 'toolbox', 'incident', 'recordable', '300 log', 'flagger', 'traffic control'],
    'legal': ['license', 'bond', 'insurance', 'lien', 'contract', 'worker classification', 'prevailing wage', 'abc test', 'subcontractor', 'arbitration', 'permit'],
    'core': [],   # always injected
}

_DOMAIN_CONTENT: dict[str, str] = {
    'core': _CORE_FACTS,
    'pricing': _PRICING_FACTS,
    'technical': _TECHNICAL_FACTS,
    'osha': _OSHA_FACTS,
    'legal': _LEGAL_FACTS,
}


def assemble_context(question: str, state_code: str = 'VA') -> str:
    """Assemble RAG context blocks relevant to the question."""
    q_lower = question.lower()
    blocks = [_CORE_FACTS]

    for domain, keywords in _DOMAIN_KEYWORDS.items():
        if domain == 'core':
            continue
        if any(kw in q_lower for kw in keywords):
            blocks.append(_DOMAIN_CONTENT[domain])

    # Always include pricing for estimate-adjacent questions
    if 'pricing' not in [d for d, kws in _DOMAIN_KEYWORDS.items() if any(k in q_lower for k in kws)]:
        if any(w in q_lower for w in ['how much', 'what does', 'afford', 'money']):
            blocks.append(_PRICING_FACTS)

    return '\n\n---\n\n'.join(blocks)


def build_rag_system_prompt(
    question: str,
    state_code: str = 'VA',
    base_prompt: str = '',
) -> str:
    """Inject RAG context into a system prompt for Jarvis."""
    context = assemble_context(question, state_code)
    rag_section = f"""
== KNOWLEDGE BASE ==
{context}
== END KNOWLEDGE BASE ==

Use the knowledge base above to answer factually. If the question is outside the knowledge base, say so honestly rather than guessing. For pricing questions, always give a range and note that final pricing requires site inspection.
"""
    return (base_prompt + '\n\n' + rag_section).strip()


def search_and_augment(question: str, db, state_code: str = 'VA') -> str:
    """
    Build RAG prompt: static knowledge base + Pinecone semantic search results.
    Falls back gracefully to static-only if Pinecone is not configured.
    """
    from .vector_search_service import search_semantic
    base = build_rag_system_prompt(question, state_code)
    results = search_semantic(question, limit=3)
    if not results:
        return base
    articles = '\n'.join(
        f'- [{r["title"]}]: {r["excerpt"]}' for r in results
    )
    return base + f'\n\n== RELEVANT BLOG ARTICLES ==\n{articles}\n== END ARTICLES =='
