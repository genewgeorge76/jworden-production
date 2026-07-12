"""AI proposal generation — produces professional markdown proposals from estimate data."""
from __future__ import annotations

from openai import OpenAI

from ..config import settings


def generate_proposal(
    customer_name: str,
    project_address: str,
    scope: str,
    estimate_data: dict,
    tenant_name: str = 'J. Worden & Sons Paving & General Contracting',
    tenant_phone: str = '(804) 446-1296',
    tenant_license: str = 'Class A Virginia Contractor License',
    engineering_standard: str = '96% Marshall compaction, VDOT Section 315 #21A Stone base, 6-inch minimum base depth',
) -> str:
    """Generate a professional proposal markdown document via GPT-4o."""
    if not settings.openai_api_key:
        return _stub_proposal(customer_name, project_address, scope, estimate_data, tenant_name)

    client = OpenAI(api_key=settings.openai_api_key)

    prompt = f"""You are a senior estimator at {tenant_name}, a professional paving and general contracting company.

Write a professional proposal document in markdown for the following project. The proposal should be ready to send to the client — professional, specific, and confidence-building.

**Project Details:**
- Customer: {customer_name}
- Site Address: {project_address}
- Scope: {scope}
- Trade: {estimate_data.get('trade_label', 'Asphalt Paving')}
- Estimated Quantity: {estimate_data.get('quantity', 0)} {estimate_data.get('unit', 'sq ft')}
- Material Cost: ${estimate_data.get('material_cost', 0):,.2f}
- Final Bid: ${estimate_data.get('final_bid', 0):,.2f}
- Large Job: {'Yes' if estimate_data.get('is_large_job') else 'No'}

**Our Engineering Standard:**
{engineering_standard}

Write a proposal with these sections:
1. **Executive Summary** (2-3 sentences — what we're building and the outcome)
2. **Scope of Work** (specific, bulleted, measurable — quantities and spec references)
3. **Materials & Methods** (spec our engineering standard: compaction target, base spec, wearing course)
4. **Project Timeline** (estimated start, duration, weather contingency language)
5. **Investment Summary** (line-item breakdown, deposit requirement of 20%, balance due on completion)
6. **Why {tenant_name}** (3-4 trust signals: license, bond, rating, guarantee)
7. **Next Steps** (call to action: call {tenant_phone} or sign and return)

Keep the tone professional and confident. Do not use filler language. Specific numbers win trust."""

    response = client.chat.completions.create(
        model='gpt-4o',
        messages=[{'role': 'user', 'content': prompt}],
        max_tokens=2000,
        temperature=0.3,
    )
    return response.choices[0].message.content or ''


def _stub_proposal(
    customer_name: str,
    project_address: str,
    scope: str,
    estimate_data: dict,
    tenant_name: str,
) -> str:
    bid = estimate_data.get('final_bid', 0)
    deposit = bid * 0.20
    return f"""# Proposal — {scope}

**Prepared for:** {customer_name}
**Site:** {project_address}
**Prepared by:** {tenant_name}

---

## Executive Summary

{tenant_name} is pleased to submit this proposal for {scope} at {project_address}. This proposal covers all labor, materials, and equipment required to complete the project to our engineering standard.

## Scope of Work

- {estimate_data.get('trade_label', 'Asphalt paving')} — {estimate_data.get('quantity', 0)} sq ft
- Full base preparation to specification
- Material supply, transport, and placement
- Final compaction and inspection

## Investment Summary

| Item | Amount |
|---|---|
| Materials | ${estimate_data.get('material_cost', 0):,.2f} |
| **Total Bid** | **${bid:,.2f}** |
| Deposit (20%) | ${deposit:,.2f} |
| Balance due on completion | ${bid - deposit:,.2f} |

*Note: Set OPENAI_API_KEY to generate full AI proposals.*
"""
