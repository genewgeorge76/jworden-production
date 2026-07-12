"""51-jurisdiction coverage tests — lien calendar and pricing must cover all 50 states + DC."""
from datetime import datetime, timedelta, timezone

ALL_51 = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI',
    'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN',
    'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH',
    'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA',
    'WV', 'WI', 'WY',
]


class TestLienCalendar51:
    def setup_method(self):
        from app.services.lien_calendar import SUPPORTED_STATES, calculate_deadlines
        self.supported = SUPPORTED_STATES
        self.calculate = calculate_deadlines

    def test_all_51_jurisdictions_supported(self):
        missing = set(ALL_51) - set(self.supported)
        assert missing == set(), f'Lien calendar missing jurisdictions: {sorted(missing)}'

    def test_exactly_51_no_strays(self):
        strays = set(self.supported) - set(ALL_51)
        assert strays == set(), f'Unknown state codes in lien laws: {sorted(strays)}'
        assert len(self.supported) == 51

    def test_no_state_falls_back_to_default_rules(self):
        start = datetime.now(timezone.utc) - timedelta(days=60)
        last = datetime.now(timezone.utc) - timedelta(days=10)
        for code in ALL_51:
            result = self.calculate(code, start, last)
            assert result['used_default_rules'] is False, f'{code} fell back to default rules'

    def test_every_state_has_valid_rules(self):
        from app.services.lien_calendar import _LIEN_LAWS
        for code in ALL_51:
            law = _LIEN_LAWS[code]
            assert law['lien_filing_days'] > 0, f'{code}: lien_filing_days must be positive'
            assert law['foreclosure_days'] > 0, f'{code}: foreclosure_days must be positive'
            assert law['notes'], f'{code}: notes must not be empty'
            prelim = law['preliminary_notice_days']
            assert prelim is None or prelim > 0, f'{code}: invalid preliminary_notice_days'

    def test_deadlines_ordered(self):
        """Lien deadline is after last furnishing; foreclosure after lien deadline."""
        start = datetime.now(timezone.utc) - timedelta(days=60)
        last = datetime.now(timezone.utc) - timedelta(days=10)
        for code in ALL_51:
            result = self.calculate(code, start, last)
            lien = datetime.fromisoformat(result['lien_filing_deadline'])
            foreclose = datetime.fromisoformat(result['foreclosure_deadline'])
            assert lien > last, f'{code}: lien deadline not after last furnishing'
            assert foreclose > lien, f'{code}: foreclosure deadline not after lien deadline'

    def test_states_endpoint_returns_51(self, client):
        resp = client.get('/api/v1/lien/states')
        assert resp.status_code == 200
        assert len(resp.json()['supported_states']) == 51


class TestPricing51:
    def test_all_51_multipliers_present(self):
        from app.services.pricing_engine import _STATE_MULTIPLIERS
        missing = set(ALL_51) - set(_STATE_MULTIPLIERS)
        assert missing == set(), f'Pricing missing state multipliers: {sorted(missing)}'
        assert len(_STATE_MULTIPLIERS) == 51

    def test_every_state_estimate_works(self):
        from app.services.pricing_engine import estimate_price
        for code in ALL_51:
            est = estimate_price('paving', 'residential', 2000.0, code)
            assert 'error' not in est, f'{code}: estimate returned error'
            assert est['low_usd'] > 0
            assert est['high_usd'] >= est['low_usd']
