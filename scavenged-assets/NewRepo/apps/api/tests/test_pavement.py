"""Wave 8 — pavement intelligence / road-scanning stack tests."""


class TestPCIScoring:
    def setup_method(self):
        from app.services.pavement_intel import score_pavement_condition
        self.score = score_pavement_condition

    def test_new_pavement_scores_excellent(self):
        result = self.score(age=0, cracks=0, potholes=0, traffic='low')
        assert result['score'] >= 85
        assert result['condition'] == 'Excellent'

    def test_failed_pavement_scores_low(self):
        result = self.score(age=30, cracks=80, potholes=20, traffic='very_high')
        assert result['score'] <= 24
        assert result['condition'] == 'Failed'
        assert result['urgency'] == 'immediate'

    def test_score_monotonic_in_age(self):
        young = self.score(age=2, cracks=5, potholes=0)['score']
        old = self.score(age=25, cracks=5, potholes=0)['score']
        assert young > old

    def test_traffic_worsens_score(self):
        low = self.score(age=10, cracks=15, potholes=1, traffic='low')['score']
        heavy = self.score(age=10, cracks=15, potholes=1, traffic='very_high')['score']
        assert low > heavy

    def test_deductions_breakdown_present(self):
        result = self.score(age=10, cracks=20, potholes=3)
        d = result['deductions']
        assert d['age_deduction'] >= 0
        assert d['crack_deduction'] > 0
        assert d['pothole_deduction'] > 0


class TestMaintenanceForecast:
    def setup_method(self):
        from app.services.pavement_intel import forecast_maintenance_schedule
        self.forecast = forecast_maintenance_schedule

    def test_pci_declines_over_horizon(self):
        result = self.forecast(pavement_age=8, condition=75)
        assert result['projected_pci_1yr'] > result['projected_pci_3yr'] > result['projected_pci_5yr']

    def test_poor_pavement_overdue_milestones(self):
        result = self.forecast(pavement_age=15, condition=35)
        sealcoat = next(m for m in result['service_schedule'] if m['service'] == 'Sealcoating')
        assert sealcoat['status'] == 'overdue'

    def test_new_pavement_uses_default_decay(self):
        result = self.forecast(pavement_age=0, condition=100)
        assert result['decay_rate'] == 0.035

    def test_schedule_sorted_by_time(self):
        result = self.forecast(pavement_age=5, condition=80)
        years = [m['years_from_now'] for m in result['service_schedule']]
        assert years == sorted(years)


class TestGroundScan:
    def setup_method(self):
        from app.services.pavement_intel import analyze_ground_scan
        self.analyze = analyze_ground_scan

    def test_complete_package_low_risk(self):
        result = self.analyze(
            ticket_status='clear',
            technologies=['GPR', 'EM locator', 'potholing', 'LiDAR'],
            utilities=[{'utility_type': 'gas', 'marked': True, 'confidence': 0.95}],
        )
        assert result['risk_level'] == 'LOW'
        assert result['confidence'] >= 0.85

    def test_missing_everything_high_risk(self):
        result = self.analyze(
            ticket_status='not_started', technologies=[], utilities=[],
            anomalies_detected=True,
        )
        assert result['risk_level'] == 'HIGH'
        assert any('811' in f for f in result['findings'])

    def test_unmarked_critical_utility_raises_risk(self):
        base = self.analyze('clear', ['GPR', 'EM locator', 'potholing'], [])
        with_unmarked = self.analyze(
            'clear', ['GPR', 'EM locator', 'potholing'],
            [{'utility_type': 'gas', 'marked': False}],
        )
        assert with_unmarked['confidence'] < base['confidence']


class TestDecaySimulation:
    def setup_method(self):
        from app.services.pavement_intel import simulate_pavement_decay
        self.simulate = simulate_pavement_decay

    def test_projection_declines(self):
        result = self.simulate('road', age_years=5, traffic_level='high')
        scores = [p['condition_score'] for p in result['projection']]
        assert scores == sorted(scores, reverse=True)

    def test_bad_lot_high_risk(self):
        result = self.simulate(
            'commercial_parking_lot', age_years=20, potholes=15,
            crack_severity='high', drainage_quality='poor',
        )
        assert result['risk_level'] == 'HIGH'

    def test_explicit_condition_score_respected(self):
        result = self.simulate('road', age_years=2, current_condition_score=42.0)
        assert result['current_condition_score'] == 42.0


class TestCivilStack:
    def setup_method(self):
        from app.services.pavement_intel import premium_civil_stack
        self.stack = premium_civil_stack

    def test_seven_modules(self):
        result = self.stack()
        assert result['module_count'] == 7
        assert result['decision'] in ('GO', 'CONDITIONAL', 'HOLD')

    def test_full_tech_package_beats_empty(self):
        empty = self.stack(technologies=[])
        full = self.stack(
            ticket_status='clear',
            technologies=['GPR', 'EM locator', 'potholing', 'LiDAR', 'thermal', 'GIS overlay'],
            age_years=2, crack_severity='none', drainage_quality='good',
            traffic_level='low', potholes=0, rutting_inches=0, last_sealcoat_years=1,
        )
        assert full['overall_score'] > empty['overall_score']
        assert full['decision'] == 'GO'


class TestPavementEndpoints:
    def test_score_endpoint(self, client):
        resp = client.post('/api/v1/pavement/score', json={
            'age': 8, 'cracks': 15, 'potholes': 2, 'traffic': 'medium',
        })
        assert resp.status_code == 200
        assert 0 <= resp.json()['score'] <= 100

    def test_forecast_endpoint(self, client):
        resp = client.post('/api/v1/pavement/forecast', json={
            'pavement_age': 8, 'condition': 72,
        })
        assert resp.status_code == 200
        assert resp.json()['current_pci'] == 72

    def test_decay_endpoint(self, client):
        resp = client.post('/api/v1/pavement/decay', json={
            'pavement_type': 'residential_driveway', 'age_years': 10,
        })
        assert resp.status_code == 200
        assert len(resp.json()['projection']) == 5

    def test_ground_scan_requires_auth(self, client):
        resp = client.post('/api/v1/pavement/ground-scan', json={'technologies': []})
        assert resp.status_code in (401, 403)

    def test_ground_scan_persists_report(self, authed):
        resp = authed.post('/api/v1/pavement/ground-scan', json={
            'address': '123 Dig Site Rd, Chester VA',
            'ticket_status': 'requested',
            'technologies': ['GPR'],
            'utilities': [{'utility_type': 'gas', 'marked': False}],
        })
        assert resp.status_code == 200
        report_id = resp.json()['report_id']
        listing = authed.get('/api/v1/pavement/ground-scans')
        assert listing.status_code == 200
        assert any(r['id'] == report_id for r in listing.json()['reports'])

    def test_civil_stack_endpoint(self, authed):
        resp = authed.post('/api/v1/pavement/civil-stack', json={})
        assert resp.status_code == 200
        assert resp.json()['module_count'] == 7


class TestRemodelPricing:
    """Interior/exterior remodeling services added to the pricing engine."""

    REMODEL_SERVICES = [
        'kitchen_remodel', 'bathroom_remodel', 'basement_finish', 'home_addition',
        'garage_build', 'interior_demolition', 'drywall', 'flooring',
        'interior_painting', 'insulation', 'roofing', 'siding',
        'exterior_painting', 'deck_construction',
    ]

    def test_all_remodel_services_priced(self):
        from app.services.pricing_engine import estimate_price
        for svc in self.REMODEL_SERVICES:
            est = estimate_price(svc, 'residential', 200.0, 'VA')
            assert 'error' not in est, f'{svc} missing from pricing engine'
            assert est['high_usd'] >= est['low_usd'] > 0

    def test_kitchen_beats_drywall_per_sqft(self):
        from app.services.pricing_engine import estimate_price
        kitchen = estimate_price('kitchen_remodel', 'residential', 200.0, 'VA')
        drywall = estimate_price('drywall', 'residential', 200.0, 'VA')
        assert kitchen['high_usd'] > drywall['high_usd']

    def test_state_multiplier_applies_to_remodel(self):
        from app.services.pricing_engine import estimate_price
        va = estimate_price('bathroom_remodel', 'residential', 100.0, 'VA')
        ca = estimate_price('bathroom_remodel', 'residential', 100.0, 'CA')
        assert ca['high_usd'] > va['high_usd']
