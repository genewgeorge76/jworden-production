"""
Tests for app/services/rfp_hunter.py — B2B Neural Hunter commercial RFP
discovery (general Exa web search, falls back to a stub dataset without a
key), and its persistence layer against the commercial_rfp_leads table.
"""
from __future__ import annotations

import pytest

from app.services import rfp_hunter


def test_search_rfps_requires_query():
    with pytest.raises(ValueError):
        rfp_hunter.search_rfps("")


def test_search_rfps_falls_back_to_stub_without_exa_key(monkeypatch):
    monkeypatch.delenv("EXA_API_KEY", raising=False)
    results = rfp_hunter.search_rfps("Virginia warehouse paving RFP", num_results=5)
    assert len(results) == 5
    assert all(r["provider"] == "stub" for r in results)
    assert all(r["url"].startswith("https://") for r in results)
    # Stub results must be clearly labeled as demo data, never mistaken for real leads.
    assert all("[DEMO]" in r["title"] for r in results)


def test_search_rfps_caps_num_results():
    results = rfp_hunter.search_rfps("test query", num_results=999)
    assert len(results) <= 25


def test_search_and_persist_new_leads(app_modules):
    _, dbmod = app_modules
    with dbmod.SessionLocal() as db:
        result = rfp_hunter.search_and_persist(db, "school district paving RFP", num_results=3)
        assert result["new"] == 3
        assert result["skipped"] == 0
        assert result["total_fetched"] == 3

        from app.models import CommercialRfpLead
        stored = db.query(CommercialRfpLead).all()
        assert len(stored) == 3
        assert all(l.query == "school district paving RFP" for l in stored)
        assert all(l.status == "new" for l in stored)


def test_search_and_persist_dedupes_by_url(app_modules, monkeypatch):
    _, dbmod = app_modules

    fixed_results = [
        {"title": "Same RFP", "url": "https://example.com/rfp/dup-1",
         "source_domain": "example.com", "published_date": None,
         "summary": "test", "provider": "stub"},
    ]
    monkeypatch.setattr(rfp_hunter, "search_rfps", lambda query, num_results=10: fixed_results)

    with dbmod.SessionLocal() as db:
        first = rfp_hunter.search_and_persist(db, "dup query", num_results=1)
        assert first["new"] == 1

        second = rfp_hunter.search_and_persist(db, "dup query", num_results=1)
        assert second["new"] == 0
        assert second["skipped"] == 1

        from app.models import CommercialRfpLead
        assert db.query(CommercialRfpLead).count() == 1
