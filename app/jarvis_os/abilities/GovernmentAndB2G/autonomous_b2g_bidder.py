import logging
try:
    from app.jarvis_os.abilities.SalesAndEstimation.proposal_generator import ProposalGeneratorEngine
except ImportError:
    ProposalGeneratorEngine = None

# These were local stubs shadowing the real functions: calculate_takeoff
# returned {"sqft": 50000, "tonnage": 3500} and estimate_price returned
# {"total_estimate": 175000.00}, for every input, forever. This module
# generates UNSOLICITED PROPOSALS TO MUNICIPALITIES, so those constants went
# out as a quantity and a price on work nobody had measured.
#
# The real takeoff is imported instead. It returns tonnage from geometry and
# refuses to invent a price, which means this module can no longer produce a
# dollar figure on its own — correctly. A government proposal carries a number
# somebody stands behind or it carries none.
try:
    from app.jarvis_os.abilities.SalesAndEstimation.takeoff import calculate_takeoff
except ImportError:  # pragma: no cover - import guard for standalone runs
    calculate_takeoff = None

logging.basicConfig(level=logging.INFO, format='%(asctime)s - B2G-BIDDER - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AutonomousB2GBidder:
    """
    Scrapes SAM.gov and local municipalities. Autonomously generates unsolicited
    predictive infrastructure proposals using prevailing wage laws.
    """
    def __init__(self):
        logger.info("Initializing Autonomous Government Contracting Engine (B2G)...")

    def submit_unsolicited_proposal(self, municipality_name="Richmond, VA", scan_data=None):
        if not isinstance(scan_data, dict):
            scan_data = {}
        logger.info(f"Analyzing infrastructure scan for {municipality_name}...")
        sqft = scan_data.get("estimated_sqft")
        if sqft is None:
            return {
                "status": "no_data",
                "reason": "no measured area supplied. A proposal to a municipality needs a "
                          "real takeoff — estimated_sqft is required, not defaulted.",
            }
        sqft = float(sqft)
        
        if calculate_takeoff is None:
            return {
                "status": "unavailable",
                "reason": "takeoff calculator could not be imported; no proposal generated",
            }

        # Quantities are geometry and always resolve.
        takeoff_data = calculate_takeoff(area_sqft=sqft, state_code="VA")

        # Pricing is not. Rates are specific to a market and a season, and this
        # module has no location beyond a municipality name, so it cannot reach
        # the costing engine for a delivered price. It therefore proposes scope
        # and quantities and stops short of a number.
        #
        # Davis-Bacon adds roughly 20% to public work, but a markup on an
        # unknown base is still unknown, so it is stated as a factor to apply
        # rather than applied to a placeholder.
        davis_bacon_markup = 1.20
        low_usd = None
        high_usd = None
        
        # This previously logged "JARVIS FINDING: Subsurface drainage collapsing in
        # <municipality>" for every call. No inspection had happened. Asserting a
        # structural failure to a city council on the strength of nothing is the
        # kind of claim that ends a vendor relationship, and it was hardcoded.
        logger.info(
            "Drafting unsolicited proposal for %s: %s sq ft, quantities from takeoff, "
            "no condition finding asserted (none was surveyed).",
            municipality_name, f"{sqft:,.0f}",
        )
        
        # 2026-2030 Macro-Economic AI Adaptation Rules
        # Injected from Overnight Evolution Protocol Findings
        macro_economic_rules = (
            "CRITICAL B2G BIDDING DIRECTIVE (2026-2030 Trends):\n"
            "1. Shift from IIJA Mega-Grants to Public-Private Partnerships (P3s) due to the funding cliff.\n"
            "2. Emphasize Asset Preservation (sealcoating, mill-and-fill) over total replacement due to municipal capital constraints.\n"
            "3. MANDATORY SUSTAINABILITY: You must propose Reclaimed Asphalt Pavement (RAP), Warm-Mix Asphalt (WMA), or bio-based binders to meet decarbonization mandates.\n"
            "4. Include Intelligent Paving QA/QC with embedded sensors to guarantee compaction density.\n"
        )
        
        # Construct lead payload for the proposal generator
        lead_payload = {
            "name": f"{municipality_name} City Council",
            "address": municipality_name,
            "state_code": "VA",
            "service_type": "commercial_paving",
            "property_type": "government",
            "project_size_sqft": sqft,
            "price_low": low_usd,
            "price_high": high_usd,
            "message": f"Unsolicited predictive proposal for critical infrastructure repair. Must comply with Davis-Bacon prevailing wages.\n\n{macro_economic_rules}"
        }
        
        logger.info("Generating multi-page proposal using GPT-4o logic...")
        proposal_generator = ProposalGeneratorEngine()
        proposal_text = proposal_generator.execute(lead_payload)
        
        logger.warning(
            "JARVIS ACTION: Unsolicited proposal generated for %s (scope and quantities "
            "only; no price — rates are market-specific and none were resolved).",
            municipality_name,
        )
        logger.warning(f"SECURITY LOCK: Bid drafted but NOT SENT. Waiting for Owner Approval (status: PENDING_APPROVAL).")
        
        # In a real database we would INSERT INTO bids... returning bid_id
        import uuid
        bid_id = f"BID-{str(uuid.uuid4())[:8].upper()}"
        
        return {
            "bid_id": bid_id,
            "status": "PENDING_APPROVAL",
            "proposal": proposal_text,
            "takeoff": takeoff_data,
            "pricing": {
                "low": low_usd,
                "high": high_usd,
                "priced": False,
                "markup_to_apply": f"Davis-Bacon prevailing wage, x{davis_bacon_markup}",
                "note": "Scope and quantities only. Price this through "
                        "POST /api/v1/estimate/job with the site coordinates, so the "
                        "rate reflects haul distance to a plant that can supply it, "
                        "then apply the prevailing-wage factor.",
            }
        }

if __name__ == "__main__":
    b2g = AutonomousB2GBidder()
    result = b2g.submit_unsolicited_proposal("Richmond City", {"estimated_sqft": 45000})
    print(result["proposal"][:500])

