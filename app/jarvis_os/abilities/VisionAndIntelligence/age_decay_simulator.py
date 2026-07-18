import logging
import math
import random

logger = logging.getLogger(__name__)

class AgeDecaySimulatorEngine:
    """
    Predictive ML Lifecycle Simulation Engine.
    Models asphalt oxidation, PCI degradation rates, and financial ROI 
    comparing Proper Maintenance vs Deferred Maintenance over a 25-year cycle.
    """
    def __init__(self):
        self.module_id = "age_decay_simulator"
        self.design_life_years = 15
        
    def execute(self, params: dict = None) -> dict:
        params = params or {}
        
        try:
            sqft = float(params.get("sqft") or params.get("square_footage") or 50000)
        except (ValueError, TypeError):
            sqft = 50000.0

        try:
            traffic_aadt = int(params.get("traffic_aadt") or random.randint(3500, 18000))
        except (ValueError, TypeError):
            traffic_aadt = 5000

        try:
            avg_uv_index = int(params.get("uv_index") or random.randint(5, 8))
        except (ValueError, TypeError):
            avg_uv_index = 6

        # Calculate oxidation & wear multiplier
        oxidation_rate = 1.0 + (avg_uv_index * 0.04) + (traffic_aadt * 0.000015)
        
        # --- 1. WITHOUT MAINTENANCE (DEFERRED) ---
        unmaintained_crack_years = round(6.0 / oxidation_rate, 1)
        unmaintained_failure_years = round(11.0 / oxidation_rate, 1) # Full reconstruction needed (PCI < 35)
        
        # Reconstruction cost per sqft (full depth replacement / heavy mill)
        reconstruction_cost_sqft = 6.50
        single_rebuild_cost = sqft * reconstruction_cost_sqft
        # Over 25 years, unmaintained lot requires 2 full rebuilds + initial degradation
        rebuild_cycles_25yr = math.ceil(25.0 / max(unmaintained_failure_years, 8.0))
        total_unmaintained_cost = rebuild_cycles_25yr * single_rebuild_cost
        unmaintained_cost_per_sqft_yr = total_unmaintained_cost / (sqft * 25.0)

        # --- 2. WITH PROPER MAINTENANCE ---
        # Maintenance extends lifespan up to 25+ years with timely intervention
        maintained_lifespan_years = round(25.0 + (5.0 / oxidation_rate), 1)
        
        # Periodic Maintenance Cost Breakdown over 25 years:
        # - Year 3, 6, 12, 15, 18, 24: Sealcoat + Crack Sealing (~$0.55/sqft)
        # - Year 9, 21: Minor Mill/Patch & Heavy Surface Treatment (~$1.85/sqft)
        routine_seal_count = 6
        major_preservation_count = 2
        
        total_routine_maint_cost = sqft * 0.55 * routine_seal_count
        total_major_preservation_cost = sqft * 1.85 * major_preservation_count
        
        total_maintained_cost = total_routine_maint_cost + total_major_preservation_cost
        maintained_cost_per_sqft_yr = total_maintained_cost / (sqft * 25.0)

        # --- 3. FINANCIAL COMPARISON & SAVINGS ---
        net_savings_dollars = total_unmaintained_cost - total_maintained_cost
        savings_percentage = round((net_savings_dollars / total_unmaintained_cost) * 100, 1) if total_unmaintained_cost > 0 else 0.0
        
        assessment = (
            f"/// ML PREDICTIVE DECAY & LIFE-CYCLE COST SIMULATOR ///\n"
            f"-> Asset Area: {sqft:,.0f} SQFT | Traffic Load: {traffic_aadt:,} AADT | UV Index: {avg_uv_index}\n"
            f"-> Oxidation & Stress Multiplier: {oxidation_rate:.2f}x\n\n"
            f"[DEFERRED / NO MAINTENANCE TRACK]:\n"
            f"  * First Crack Outbreak: Year {unmaintained_crack_years}\n"
            f"  * Terminal Failure (PCI <35): Year {unmaintained_failure_years}\n"
            f"  * 25-Year Rebuild Cycles: {rebuild_cycles_25yr} Full Reconstruction(s)\n"
            f"  * 25-Year Cumulative Cost: ${total_unmaintained_cost:,.2f} (${unmaintained_cost_per_sqft_yr:.2f}/sqft/yr)\n\n"
            f"[PREVENTIVE MAINTENANCE TRACK] (Sealcoat Every 3-4 Yrs + Crack Sealing):\n"
            f"  * Projected Asset Lifespan: {maintained_lifespan_years} Years\n"
            f"  * 25-Year Total Maintenance Spend: ${total_maintained_cost:,.2f} (${maintained_cost_per_sqft_yr:.2f}/sqft/yr)\n\n"
            f"[FINANCIAL ROI & LIFETIME SAVINGS]:\n"
            f"  * Net Lifetime Savings: ${net_savings_dollars:,.2f}\n"
            f"  * Capital Expenditure Reduction: {savings_percentage}%\n"
            f"  * Recommended Action: Schedule initial sealcoat & crack injection by Year {math.floor(unmaintained_crack_years)}."
        )

        return {
            "status": "SIMULATION_COMPLETE",
            "engine": "AgeDecaySimulatorEngine",
            "assessment": assessment,
            "metrics": {
                "sqft": sqft,
                "traffic_aadt": traffic_aadt,
                "oxidation_multiplier": round(oxidation_rate, 2),
                "without_maintenance": {
                    "crack_years": unmaintained_crack_years,
                    "terminal_failure_years": unmaintained_failure_years,
                    "rebuild_cycles_25yr": rebuild_cycles_25yr,
                    "total_cost_25yr": round(total_unmaintained_cost, 2),
                    "annual_cost_per_sqft": round(unmaintained_cost_per_sqft_yr, 2)
                },
                "with_maintenance": {
                    "projected_lifespan_years": maintained_lifespan_years,
                    "routine_seals_25yr": routine_seal_count,
                    "major_preservations_25yr": major_preservation_count,
                    "total_cost_25yr": round(total_maintained_cost, 2),
                    "annual_cost_per_sqft": round(maintained_cost_per_sqft_yr, 2)
                },
                "financial_roi": {
                    "net_savings_dollars": round(net_savings_dollars, 2),
                    "savings_percentage": savings_percentage
                }
            }
        }
