"""Wave 8 — 51-state legal advisor engine tests."""
from tests.test_states_51 import ALL_51


class TestLegalStrategyService:
    def setup_method(self):
        from app.services.lawyer_recommender import (
            find_strongest_states,
            rank_states_by_reciprocity,
            recommend_legal_strategy,
        )
        self.recommend = recommend_legal_strategy
        self.strongest = find_strongest_states
        self.reciprocity = rank_states_by_reciprocity

    def test_all_51_states_scored(self):
        from app.services.lawyer_recommender import _STATE_SCORES
        assert set(_STATE_SCORES) == set(ALL_51)

    def test_recommendation_shape(self):
        rec = self.recommend('VA', 'lien', 'gc')
        assert rec.state == 'VA'
        assert rec.state_name == 'Virginia'
        assert 0 <= rec.composite_score <= 100
        assert rec.strength_label in ('STRONG', 'MODERATE', 'WEAK')
        assert len(rec.key_actions) >= 3
        assert len(rec.top_states) == 5

    def test_every_state_every_dispute_type(self):
        for code in ALL_51:
            for dtype in ('lien', 'payment', 'contract_breach', 'general'):
                rec = self.recommend(code, dtype)
                assert 0 <= rec.composite_score <= 100, f'{code}/{dtype}'

    def test_unknown_dispute_falls_back_to_general(self):
        rec = self.recommend('VA', 'alien_abduction')
        assert rec.dispute_type == 'general'

    def test_strongest_states_sorted_desc(self):
        results = self.strongest('payment', top_n=10)
        scores = [r['score'] for r in results]
        assert scores == sorted(scores, reverse=True)
        assert len(results) == 10

    def test_reciprocity_ranking(self):
        results = self.reciprocity('VA', top_n=51)
        assert len(results) == 51
        counts = [r['reciprocity_count'] for r in results]
        assert counts == sorted(counts, reverse=True)


class TestContractorRanker:
    def setup_method(self):
        from app.services.contractor_ranker import (
            ContractorBid,
            optimize_license_states,
            rank_contractor_bids,
        )
        self.Bid = ContractorBid
        self.rank = rank_contractor_bids
        self.optimize = optimize_license_states

    def test_rank_orders_by_composite(self):
        strong = self.Bid(
            name='Strong Co', bid_amount=50_000, license_state='VA',
            license_classes=['Class A'], bond_amount=50_000,
            years_experience=25, has_insurance=True, workers_comp=True,
        )
        weak = self.Bid(
            name='Weak Co', bid_amount=95_000, license_state='',
            license_classes=[], bond_amount=0,
            years_experience=1, has_insurance=False, workers_comp=False,
        )
        ranked = self.rank([weak, strong], estimate_low=45_000, estimate_high=60_000)
        assert ranked[0].contractor.name == 'Strong Co'
        assert ranked[0].rank == 1
        assert ranked[1].rank == 2
        assert ranked[1].flags, 'Weak bid must carry warning flags'

    def test_suspiciously_low_bid_flagged(self):
        lowball = self.Bid(name='Lowball', bid_amount=10_000, years_experience=10)
        ranked = self.rank([lowball], estimate_low=50_000, estimate_high=70_000)
        assert any('below estimate' in f for f in ranked[0].flags)

    def test_license_optimizer_covers_51(self):
        results = self.optimize(top_n=51)
        assert len(results) == 51
        scores = [r.optimizer_score for r in results]
        assert scores == sorted(scores, reverse=True)

    def test_license_optimizer_data_covers_51(self):
        from app.services.contractor_ranker import _STATE_LICENSE_DATA
        assert set(_STATE_LICENSE_DATA) == set(ALL_51)


class TestAdvisorEndpoints:
    def test_legal_strategy_endpoint(self, client):
        resp = client.post('/api/v1/advisor/legal-strategy', json={
            'state': 'CA', 'dispute_type': 'payment', 'role': 'sub',
        })
        assert resp.status_code == 200
        body = resp.json()
        assert body['scores']['composite'] > 0
        assert 'disclaimer' in body

    def test_top_states_endpoint(self, client):
        resp = client.get('/api/v1/advisor/top-states?dispute_type=lien&top_n=5')
        assert resp.status_code == 200
        assert len(resp.json()['states']) == 5

    def test_license_optimizer_endpoint(self, client):
        resp = client.get('/api/v1/advisor/license-optimizer?top_n=10')
        assert resp.status_code == 200
        assert len(resp.json()['results']) == 10

    def test_rank_contractors_endpoint(self, client):
        resp = client.post('/api/v1/advisor/rank-contractors', json={
            'bids': [{'name': 'Test Co', 'bid_amount': 20000, 'years_experience': 12,
                      'license_classes': ['Class A'], 'bond_amount': 20000}],
            'estimate_low': 18000, 'estimate_high': 25000,
        })
        assert resp.status_code == 200
        assert resp.json()['ranked'][0]['rank'] == 1

    def test_utility_risk_private_lines(self, client):
        resp = client.post('/api/v1/advisor/utility-risk', json={'has_septic': True})
        assert resp.status_code == 200
        assert resp.json()['risk_level'] == 'High'

    def test_utility_risk_clear(self, client):
        resp = client.post('/api/v1/advisor/utility-risk', json={})
        assert resp.status_code == 200
        assert resp.json()['risk_level'] == 'Low'
