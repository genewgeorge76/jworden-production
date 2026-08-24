"""
The Kickserv loader writes what the export says and nothing more.

The three things worth guarding here, in order of how much damage they would do
if they broke:

1. A re-import must never demote a record. The ledger is fed from several
   places — this export, the mailbox scanner, hand entry in the Job Book. A job
   graded `invoiced` off a real invoice email, then re-imported from an export
   that never closed it out, must stay `invoiced`. Get this wrong and every
   re-run quietly deletes the strongest evidence in the ledger.

2. A re-import must not duplicate. Rows are keyed on
   (tenant_id, source_document). Get this wrong and the track record inflates
   by a full copy of itself on every run.

3. A residential job must not acquire an address or a pin. That rule lives in
   kickserv_import, and it is asserted again from this side because the loader
   is what actually persists — a rule that holds in the parser and leaks in the
   writer is not a rule.
"""

import csv
import io
import zipfile

import pytest


def _zip(tmp_path, jobs, customers, charges=(), payments=()):
    """A minimal Kickserv export archive."""

    def csv_bytes(rows, fields):
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
        return buf.getvalue()

    path = tmp_path / "export.zip"
    with zipfile.ZipFile(path, "w") as z:
        z.writestr(
            "jobs.csv",
            csv_bytes(
                jobs,
                ["id", "job_number", "customer_id", "name", "total",
                 "completed_on", "estimate_type"],
            ),
        )
        z.writestr(
            "customers.csv",
            csv_bytes(
                customers,
                ["id", "name", "company_name", "company", "service_address",
                 "service_city", "service_state", "service_zip_code",
                 "latitude", "longitude"],
            ),
        )
        z.writestr(
            "job_charges.csv",
            csv_bytes(charges, ["job_id", "description", "details", "total"]),
        )
        z.writestr(
            "payments.csv",
            csv_bytes(payments, ["customer_id", "amount", "deleted_at"]),
        )
    return str(path)


COMMERCIAL = {
    "id": "c1", "name": "KBP Foods", "company_name": "KBP Foods",
    "company": "true", "service_address": "1400 N Lewis Ave",
    "service_city": "Waukegan", "service_state": "il",
    "service_zip_code": "60085", "latitude": "42.37", "longitude": "-87.84",
}
RESIDENTIAL = {
    "id": "c2", "name": "A Homeowner", "company_name": "A Homeowner",
    "company": "false", "service_address": "12 Private Lane",
    "service_city": "Chester", "service_state": "va",
    "service_zip_code": "23831", "latitude": "37.35", "longitude": "-77.44",
}


@pytest.fixture()
def loaded(app_modules):
    """The loader, the session factory and the model, wired to a temp sqlite."""
    _, dbmod = app_modules
    from app.models import ClientJobRecord
    from app.services import kickserv_load

    return kickserv_load, dbmod.SessionLocal, ClientJobRecord


def test_a_reimport_never_demotes_a_stronger_grade(loaded, tmp_path, app_modules):
    """The whole reason the rank guard exists."""
    kickserv_load, SessionLocal, ClientJobRecord = loaded
    archive = _zip(
        tmp_path,
        jobs=[{"id": "j1", "job_number": "1001", "customer_id": "c1",
               "name": "Parking lot rehab", "total": "35575.00",
               "completed_on": "", "estimate_type": "job"}],
        customers=[COMMERCIAL],
    )

    session = SessionLocal()
    try:
        first = kickserv_load.load(session, archive, "default")
        assert first["written"]["created"] == 1

        # Something stronger arrives from elsewhere — a real invoice email.
        row = session.query(ClientJobRecord).one()
        row.evidence = "invoiced"
        session.commit()

        again = kickserv_load.load(session, archive, "default")
        assert again["written"]["created"] == 0, "re-import duplicated the job"
        assert again["written"]["evidence_upgraded"] == 0

        assert session.query(ClientJobRecord).one().evidence == "invoiced", (
            "a re-import knocked a job back down the evidence ladder"
        )
    finally:
        session.close()


def test_a_reimport_does_upgrade_a_weaker_grade(loaded, tmp_path):
    kickserv_load, SessionLocal, ClientJobRecord = loaded
    archive = _zip(
        tmp_path,
        jobs=[{"id": "j1", "job_number": "1001", "customer_id": "c1",
               "name": "Parking lot rehab", "total": "35575.00",
               "completed_on": "2017-11-02", "estimate_type": "job"}],
        customers=[COMMERCIAL],
    )

    session = SessionLocal()
    try:
        kickserv_load.load(session, archive, "default")
        row = session.query(ClientJobRecord).one()
        strong = row.evidence

        row.evidence = "requested"
        session.commit()

        again = kickserv_load.load(session, archive, "default")
        assert again["written"]["evidence_upgraded"] == 1
        assert session.query(ClientJobRecord).one().evidence == strong
    finally:
        session.close()


def test_importing_twice_writes_one_row_per_job(loaded, tmp_path):
    kickserv_load, SessionLocal, ClientJobRecord = loaded
    archive = _zip(
        tmp_path,
        jobs=[
            {"id": "j1", "job_number": "1001", "customer_id": "c1",
             "name": "Lot", "total": "10000.00", "completed_on": "2018-04-01",
             "estimate_type": "job"},
            {"id": "j2", "job_number": "1002", "customer_id": "c2",
             "name": "Driveway", "total": "4200.00", "completed_on": "2018-05-01",
             "estimate_type": "job"},
        ],
        customers=[COMMERCIAL, RESIDENTIAL],
    )

    session = SessionLocal()
    try:
        kickserv_load.load(session, archive, "default")
        kickserv_load.load(session, archive, "default")
        kickserv_load.load(session, archive, "default")
        assert session.query(ClientJobRecord).count() == 2
    finally:
        session.close()


def test_a_residential_job_gets_no_address_and_no_pin(loaded, tmp_path):
    """The privacy rule has to hold on the write path, not just the read path."""
    kickserv_load, SessionLocal, ClientJobRecord = loaded
    archive = _zip(
        tmp_path,
        jobs=[{"id": "j2", "job_number": "1002", "customer_id": "c2",
               "name": "Driveway", "total": "4200.00",
               "completed_on": "2018-05-01", "estimate_type": "job"}],
        customers=[RESIDENTIAL],
    )

    session = SessionLocal()
    try:
        kickserv_load.load(session, archive, "default")
        row = session.query(ClientJobRecord).one()
        assert row.category == "residential"
        assert row.address is None
        assert row.postal_code is None
        assert row.latitude is None
        assert row.longitude is None
        # City and state are fine — a service area is not an address.
        assert row.city == "Chester"
        assert row.state == "VA"
        # And the homeowner's name is not published as a client either.
        assert row.client is None
    finally:
        session.close()


def test_a_commercial_job_keeps_its_address_and_pin(loaded, tmp_path):
    kickserv_load, SessionLocal, ClientJobRecord = loaded
    archive = _zip(
        tmp_path,
        jobs=[{"id": "j1", "job_number": "1001", "customer_id": "c1",
               "name": "Lot", "total": "35575.00", "completed_on": "2017-11-02",
               "estimate_type": "job"}],
        customers=[COMMERCIAL],
    )

    session = SessionLocal()
    try:
        kickserv_load.load(session, archive, "default")
        row = session.query(ClientJobRecord).one()
        assert row.category == "commercial"
        assert row.address == "1400 N Lewis Ave"
        assert row.state == "IL"
        assert row.latitude is not None and row.longitude is not None
        assert row.client == "KBP Foods"
        assert row.invoice_amount_cents == 3557500
    finally:
        session.close()


def test_dry_run_writes_nothing_but_still_counts(loaded, tmp_path):
    kickserv_load, SessionLocal, ClientJobRecord = loaded
    archive = _zip(
        tmp_path,
        jobs=[{"id": "j1", "job_number": "1001", "customer_id": "c1",
               "name": "Lot", "total": "35575.00", "completed_on": "2017-11-02",
               "estimate_type": "job"}],
        customers=[COMMERCIAL],
    )

    session = SessionLocal()
    try:
        result = kickserv_load.load(session, archive, "default", dry_run=True)
        assert result["written"]["created"] == 1
        assert result["written"]["dry_run"] is True
        assert session.query(ClientJobRecord).count() == 0
    finally:
        session.close()


def test_a_job_with_no_job_number_is_skipped_not_written(loaded, tmp_path):
    """
    Without a job number there is no stable key, so a re-import would duplicate
    the row every single run. Counted and reported rather than written.
    """
    kickserv_load, SessionLocal, ClientJobRecord = loaded
    archive = _zip(
        tmp_path,
        jobs=[{"id": "j9", "job_number": "", "customer_id": "c1",
               "name": "Unnumbered", "total": "500.00", "completed_on": "",
               "estimate_type": "job"}],
        customers=[COMMERCIAL],
    )

    session = SessionLocal()
    try:
        result = kickserv_load.load(session, archive, "default")
        assert result["written"]["skipped_no_source_document"] == 1
        assert result["written"]["created"] == 0
        assert session.query(ClientJobRecord).count() == 0
    finally:
        session.close()


def test_a_refresh_never_blanks_a_populated_field(loaded, tmp_path):
    """
    The export not carrying a value is not the same as the value being empty.
    A city already on the row must survive an export that omits it.
    """
    kickserv_load, SessionLocal, ClientJobRecord = loaded
    job = {"id": "j1", "job_number": "1001", "customer_id": "c1",
           "name": "Lot", "total": "35575.00", "completed_on": "2017-11-02",
           "estimate_type": "job"}

    first = tmp_path / "with-city"
    second = tmp_path / "without-city"
    first.mkdir()
    second.mkdir()

    with_city = _zip(first, jobs=[job], customers=[COMMERCIAL])
    without_city = _zip(
        second, jobs=[job], customers=[{**COMMERCIAL, "service_city": ""}]
    )

    session = SessionLocal()
    try:
        kickserv_load.load(session, with_city, "default")
        assert session.query(ClientJobRecord).one().city == "Waukegan"

        kickserv_load.load(session, without_city, "default")
        assert session.query(ClientJobRecord).one().city == "Waukegan", (
            "an export that omitted the city blanked a city already on the row"
        )
    finally:
        session.close()


def test_summarise_written_reports_counts_not_percentages(loaded, tmp_path):
    kickserv_load, SessionLocal, _ = loaded
    archive = _zip(
        tmp_path,
        jobs=[{"id": "j1", "job_number": "1001", "customer_id": "c1",
               "name": "Lot", "total": "35575.00", "completed_on": "2017-11-02",
               "estimate_type": "job"}],
        customers=[COMMERCIAL],
    )
    session = SessionLocal()
    try:
        result = kickserv_load.load(session, archive, "default")
        text = kickserv_load.summarise_written(result)
        assert "%" not in text
        assert "1 jobs read" in text or "1 job" in text
    finally:
        session.close()


def test_two_unnumbered_jobs_do_not_collapse_into_one_row(loaded, tmp_path):
    """
    The bug this guards: `source_document` was built as an f-string over
    job_number, so a blank number produced the key "kickserv:job:" — truthy,
    and identical for every unnumbered job in the export. The first one was
    written and each one after it merged onto that same row, so jobs
    disappeared into each other with no error anywhere.

    Both are skipped now. Losing two rows visibly beats merging two real jobs
    into one silently.
    """
    kickserv_load, SessionLocal, ClientJobRecord = loaded
    archive = _zip(
        tmp_path,
        jobs=[
            {"id": "j8", "job_number": "", "customer_id": "c1",
             "name": "Lot A", "total": "1000.00", "completed_on": "2019-01-01",
             "estimate_type": "job"},
            {"id": "j9", "job_number": "", "customer_id": "c1",
             "name": "Lot B — a different job entirely", "total": "9000.00",
             "completed_on": "2020-06-01", "estimate_type": "job"},
        ],
        customers=[COMMERCIAL],
    )

    session = SessionLocal()
    try:
        result = kickserv_load.load(session, archive, "default")
        assert result["written"]["skipped_no_source_document"] == 2
        assert session.query(ClientJobRecord).count() == 0
    finally:
        session.close()


def test_a_numbered_job_still_gets_its_key(loaded, tmp_path):
    """The guard above must not have thrown out the normal case."""
    from app.services import kickserv_import

    archive = _zip(
        tmp_path,
        jobs=[{"id": "j1", "job_number": " 1001 ", "customer_id": "c1",
               "name": "Lot", "total": "35575.00", "completed_on": "2017-11-02",
               "estimate_type": "job"}],
        customers=[COMMERCIAL],
    )
    record = kickserv_import.read_export(archive)["records"][0]
    assert record["source_document"] == "kickserv:job:1001"
    assert record["scope_source"] == "kickserv:job:1001"
    assert record["invoice_number"] == "1001"
