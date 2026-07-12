"""Unit tests for parcel_service, property_vision, scan_estimator, mailer_service."""
import pytest


# ── parcel_service ────────────────────────────────────────────────────────────

class TestParcelService:
    def setup_method(self):
        from app.services.parcel_service import get_parcels_by_zip
        self.get_parcels = get_parcels_by_zip

    def test_mock_returns_parcels(self):
        parcels = self.get_parcels('23220', api_key='')
        assert len(parcels) > 0

    def test_government_parcel_excluded(self):
        parcels = self.get_parcels('23220', api_key='')
        gov = [p for p in parcels if p.owner_type == 'government']
        assert gov == [], 'Government parcels must be excluded'

    def test_parcel_has_required_fields(self):
        parcel = self.get_parcels('23220', api_key='')[0]
        assert parcel.address
        assert parcel.parcel_id
        assert parcel.lot_size_sqft > 0

    def test_max_results_honoured(self):
        parcels = self.get_parcels('23220', api_key='', max_results=2)
        assert len(parcels) <= 2

    def test_invalid_zip_raises(self):
        with pytest.raises(ValueError, match='Invalid ZIP'):
            self.get_parcels('ABCDE', api_key='')

    def test_zip_plus_four_accepted(self):
        parcels = self.get_parcels('23220-1234', api_key='')
        assert len(parcels) > 0

    def test_ssrf_injection_blocked(self):
        with pytest.raises(ValueError):
            self.get_parcels('../../etc', api_key='')


# ── property_vision ───────────────────────────────────────────────────────────

class TestPropertyVision:
    def setup_method(self):
        from app.services.property_vision import assess_property_condition
        self.assess = assess_property_condition

    def test_mock_returns_condition(self):
        result = self.assess('img_b64', '415 Oak Ridge Rd, Richmond VA', openai_api_key='')
        assert result.overall_score >= 0
        assert result.overall_score <= 100
        assert result.roof in ('good', 'fair', 'poor')
        assert result.driveway in ('good', 'fair', 'poor')
        assert result.drainage in ('good', 'fair', 'poor')

    def test_mock_deterministic(self):
        """Same address → same result."""
        r1 = self.assess('x', '123 Test St', openai_api_key='')
        r2 = self.assess('x', '123 Test St', openai_api_key='')
        assert r1.overall_score == r2.overall_score
        assert r1.roof == r2.roof

    def test_mock_services_recommended_list(self):
        result = self.assess('x', '500 Elm St', openai_api_key='')
        assert isinstance(result.services_recommended, list)

    def test_mock_narrative_nonempty(self):
        result = self.assess('x', '500 Elm St', openai_api_key='')
        assert result.narrative and len(result.narrative) > 0


# ── scan_estimator ────────────────────────────────────────────────────────────

class TestScanEstimator:
    def setup_method(self):
        from app.services.scan_estimator import estimate_for_property
        self.estimate = estimate_for_property

    def test_returns_estimate(self):
        est = self.estimate(['Driveway Paving'], 5000.0, 'VA')
        assert est is not None
        assert est.estimate_low > 0
        assert est.estimate_high >= est.estimate_low

    def test_unknown_service_falls_back(self):
        est = self.estimate(['unknown_service_xyz'], 5000.0, 'VA')
        # Should return None or a fallback estimate — not raise
        # (implementation returns None when no mapping found)
        # Just verify it doesn't blow up

    def test_sqft_scales_estimate(self):
        # Use 'sealcoating' (a recognised key) and sqft large enough to clear the
        # mobilization floor on the large case ($600 high).  At rate $0.35/sqft,
        # 30000*0.30=9000 sqft → $2268+, well above the floor.
        small = self.estimate(['sealcoating'], 500.0, 'VA')
        large = self.estimate(['sealcoating'], 30000.0, 'VA')
        assert large.estimate_high > small.estimate_high

    def test_state_multiplier_applied(self):
        # 'driveway resurfacing' maps to paving ($8/sqft high); at 2000*0.30=600 sqft
        # VA high ≈ $5200, CA high ≈ $6250 — both well above the $600 floor.
        va = self.estimate(['driveway resurfacing'], 2000.0, 'VA')
        ca = self.estimate(['driveway resurfacing'], 2000.0, 'CA')
        assert ca.estimate_high > va.estimate_high


# ── mailer_service ────────────────────────────────────────────────────────────

class TestMailerService:
    def setup_method(self):
        from app.services.mailer_service import generate_mailer_html, mock_send, export_campaign_zip
        self.generate_html = generate_mailer_html
        self.mock_send = mock_send
        self.export_zip = export_campaign_zip

    def test_generate_html_contains_disclaimer(self):
        html = self.generate_html(
            address='123 Main St', city='Richmond', state='VA', zip_code='23220',
            owner_name='John Doe', roof='fair', driveway='poor', drainage='good',
            narrative='Driveway needs attention.', service_label='Driveway Paving',
            sqft=600.0, estimate_low=1800, estimate_high=3200,
            company_name='J. Worden & Sons', company_phone='804-555-0100',
            company_website='jwordenasphaltpaving.com',
        )
        assert 'DISCLAIMER' in html.upper() or 'disclaimer' in html.lower()

    def test_generate_html_contains_address(self):
        html = self.generate_html(
            address='456 Oak Ave', city='Roanoke', state='VA', zip_code='24011',
            owner_name='Jane Doe', roof='good', driveway='fair', drainage='fair',
            narrative='Minor wear.', service_label='Sealcoating',
            sqft=400.0, estimate_low=300, estimate_high=600,
            company_name='J. Worden & Sons', company_phone='804-555-0100',
            company_website='jwordenasphaltpaving.com',
        )
        assert '456 Oak Ave' in html

    def test_mock_send_returns_mock_id(self):
        result = self.mock_send('MOCK-001')
        assert result['mock'] is True
        assert result['id'].startswith('ltr_mock_')
        assert result['status'] == 'mock_queued'

    def test_export_zip_produces_bytes(self):
        rows = [{
            'parcel_id': 'P001', 'address': '1 Test Rd', 'city': 'Richmond',
            'state': 'VA', 'zip_code': '23220', 'owner_name': 'Bob',
            'roof': 'fair', 'driveway': 'poor', 'drainage': 'good',
            'overall_score': 60, 'service_recommended': 'paving',
            'sqft': 2000, 'estimate_low': 3500, 'estimate_high': 7000,
            'mailer_sent': False, 'lob_id': '', 'mailer_html': '<p>test</p>',
        }]
        zip_bytes = self.export_zip(rows)
        assert isinstance(zip_bytes, bytes)
        assert len(zip_bytes) > 0

    def test_export_zip_is_valid_zip(self):
        import io
        import zipfile
        zip_bytes = self.export_zip([])
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            names = zf.namelist()
        assert 'addresses.csv' in names
