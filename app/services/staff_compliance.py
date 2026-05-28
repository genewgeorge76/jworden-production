"""
staff_compliance.py — Virginia labor law reference data + required-document
mappings for the Staff Portal (Ship I).

⚠️  LEGAL NOTICE: This data is for internal HR-process guidance only.
    Consult a licensed Virginia employment attorney before making any
    wage/hour, classification, or leave policy decisions.
"""

from __future__ import annotations

# ── Virginia Labor Law Reference ─────────────────────────────────────────────

VA_LABOR_LAW: dict = {
    "minimum_wage": {
        "rate_usd": 12.41,
        "effective": "2024-01-01",
        "authority": "Virginia Minimum Wage Act § 40.1-28.10",
        "notes": (
            "Rate adjusts annually with CPI (check DOLI for current year). "
            "Tipped employees: $2.13/hr tip credit; tips + base must meet minimum. "
            "Youth / training wage: 85% for employees under 18 during first 90 days."
        ),
    },
    "overtime": {
        "threshold_hours_per_week": 40,
        "multiplier": 1.5,
        "authority": "Virginia Overtime Wage Act (VOWA) § 40.1-29.2 — effective 2021-07-01",
        "statute_of_limitations_years": 3,
        "notes": (
            "VOWA mirrors FLSA but extends lookback to 3 years (vs 2 federal). "
            "OT required for ALL non-exempt employees >40 hrs/week. "
            "Construction foremen/field workers are generally non-exempt. "
            "Exemptions: bona fide executive, administrative, professional, outside sales, "
            "computer employees (salary threshold ≥$684/week + duties test). "
            "Day-rate workers: OT = (day rate / hours worked) × 0.5 × OT hours."
        ),
        "day_rate_note": (
            "Day-rate or per-diem workers ARE covered. Overtime = regular rate × 0.5 × hours >40. "
            "Regular rate = total weekly pay ÷ total hours worked."
        ),
    },
    "payday_law": {
        "frequency": "At least twice monthly (semimonthly)",
        "authority": "Virginia Code § 40.1-29",
        "wage_due_within_days": 7,
        "notes": (
            "Employers must designate regular paydays and post them. "
            "Final paycheck: all wages due by next regular payday after separation "
            "(no acceleration required but best practice is faster). "
            "Written notice of pay rate required at hire. "
            "Wage deductions require written employee authorization."
        ),
    },
    "sick_leave": {
        "universal_mandate": False,
        "authority": "Virginia Code § 40.1-33.4 (limited — home health workers only as of 2026)",
        "notes": (
            "Virginia has NO universal paid sick leave mandate for construction workers (as of 2026). "
            "FMLA (federal): 12 weeks unpaid, job-protected leave for covered employers "
            "(50+ employees within 75 miles). "
            "FFCRA / state COVID rules expired. "
            "Best practice: Adopt a written PTO/sick policy in the employee handbook."
        ),
        "fmla": {
            "weeks": 12,
            "trigger_employees": 50,
            "authority": "29 CFR Part 825",
        },
    },
    "workers_compensation": {
        "trigger_employees": 3,
        "includes_principals": True,
        "authority": "Virginia Workers' Compensation Act § 65.2",
        "fine_per_day_uninsured": 250,
        "notes": (
            "Mandatory for employers with 3+ employees (including owners/principals). "
            "Subcontractors must carry their own WC or be covered under GC's policy. "
            "GC remains liable for subs' workers if sub is uninsured. "
            "Report workplace injuries to VWC within 10 days."
        ),
    },
    "new_hire_reporting": {
        "deadline_days": 20,
        "authority": "Virginia Code § 63.2-1946",
        "portal": "https://www.dss.virginia.gov/newhire/",
        "notes": (
            "Report all new and rehired employees AND independent contractors "
            "receiving $600+ within 20 days of hire to Virginia NHRC. "
            "Required info: name, SSN, address, DOH, employer EIN."
        ),
    },
    "classification": {
        "authority": "Virginia Code § 40.1-28.7:7 (ABC test — eff. 2020)",
        "penalties": "Back wages + 10% civil penalty + attorney fees + debarment risk",
        "abc_test": [
            "A) Worker is free from direction/control in performance of service",
            "B) Service is outside the company's usual course of business OR "
            "performed outside all company places of business",
            "C) Worker is customarily engaged in an independently established "
            "trade, occupation, profession, or business",
        ],
        "notes": (
            "ALL three prongs must be met to classify as independent contractor. "
            "Failure → reclassification as employee + back wages + penalties. "
            "Subcontractors must carry own COI (GL + WC) and have a signed contract."
        ),
    },
    "right_to_work": {
        "authority": "Virginia Code §§ 40.1-58 through 40.1-69",
        "notes": "Virginia is a right-to-work state. Union membership cannot be a condition of employment.",
    },
    "anti_discrimination": {
        "authority": "Virginia Human Rights Act § 2.2-3900 et seq.",
        "min_employees": 1,
        "protected_classes": [
            "race", "color", "religion", "national origin", "sex",
            "pregnancy / childbirth / lactation", "age (40+)", "disability",
            "sexual orientation", "gender identity", "marital status",
            "veteran / military status", "HIV status",
        ],
        "notes": "File complaint with DHRM within 300 days. EEOC charge also available.",
    },
    "i9_e_verify": {
        "i9_required": True,
        "e_verify_required": "Federal contractors + state contractors over $50k",
        "authority": "8 USC § 1324a; Virginia Code § 2.2-4312 (state contractors)",
        "retention": "3 years from hire OR 1 year after termination, whichever is later",
        "notes": "I-9 must be completed by Day 3 of employment. Keep physical or electronic copy.",
    },
}

# ── CDL / DOT Requirements ────────────────────────────────────────────────────

CDL_REQUIREMENTS: dict = {
    "license_classes": {
        "A": "Combination vehicles ≥26,001 lbs GCWR (towing >10,000 lbs) — tri-axle dumps, tractor-trailers",
        "B": "Single vehicle ≥26,001 lbs or towing ≤10,000 lbs — straight trucks, large dump trucks",
        "C": "Vehicles transporting 16+ passengers or HazMat not covered by A or B",
    },
    "endorsements": {
        "T": "Double/triple trailers",
        "P": "Passenger",
        "N": "Tank vehicles",
        "H": "Hazardous materials (TSA threat assessment required)",
        "X": "Tank + HazMat combination",
    },
    "medical_certificate": {
        "form": "MCSA-5876 (DOT Physical — Medical Examiner's Certificate)",
        "validity_years": 2,
        "authority": "49 CFR § 391.45",
        "notes": "Must be current and on file. Copy on driver, copy on file here. Expiry tracked.",
    },
    "mvr": {
        "frequency": "Pre-employment + annually",
        "authority": "49 CFR § 391.25",
        "lookback_years": 3,
        "disqualifying": [
            "DUI/DWI in any vehicle — 1 year disqualification (3 years if HazMat)",
            "Leaving scene of accident",
            "Use of vehicle in felony",
            "2+ serious traffic violations within 3 years",
            "Railroad grade crossing violation",
        ],
    },
    "drug_alcohol": {
        "authority": "49 CFR Part 40 + FMCSA 49 CFR Part 382",
        "pre_employment": "Required before first drive",
        "substances": "5-panel DOT: marijuana, cocaine, opiates, phencyclidine, amphetamines",
        "random_rate_2026": "50% drug / 10% alcohol",
        "fmcsa_clearinghouse": {
            "required": True,
            "authority": "49 CFR Part 382 Subpart G (eff. 2020-01-06)",
            "notes": (
                "Pre-employment full query (with driver consent). "
                "Annual limited query for existing CDL drivers. "
                "Must register at clearinghouse.fmcsa.dot.gov."
            ),
        },
        "return_to_duty": "SAP program required after positive test before return to driving",
    },
    "hours_of_service": {
        "authority": "49 CFR Part 395",
        "property_carrying": {
            "11_hour_rule": "Max 11 hrs driving after 10 consecutive off-duty",
            "14_hour_rule": "No driving after 14th hour on-duty",
            "60_70_hour_rule": "Max 60 hrs/7 days or 70 hrs/8 days",
            "short_haul_exception": "100 air-mile radius, no log required if back to home terminal daily",
        },
    },
    "vehicle_inspection": {
        "pre_trip": "Required before each trip (DVIR)",
        "authority": "49 CFR § 396.13",
    },
}

# ── Document Types ────────────────────────────────────────────────────────────

DOC_LABELS: dict[str, str] = {
    "govt_photo_id":        "Government-Issued Photo ID (Driver's License or Passport)",
    "i9_doc":               "I-9 Employment Eligibility Verification + supporting docs",
    "w4":                   "Federal W-4 Withholding Certificate",
    "va4":                  "Virginia VA-4 Employee Withholding Exemption Certificate",
    "direct_deposit":       "Direct Deposit Authorization Form",
    "emergency_contact":    "Emergency Contact Form",
    "background_consent":   "Background Check Authorization",
    "drug_test_consent":    "Drug Test Consent Form",
    "handbook_ack":         "Employee Handbook Acknowledgment",
    "safety_orientation":   "Safety Orientation Sign-Off",
    "w9":                   "IRS Form W-9 (Taxpayer ID / Subcontractor)",
    "coi_gl":               "Certificate of Insurance — General Liability ($1M min)",
    "coi_wc":               "Certificate of Insurance — Workers Compensation",
    "signed_subcontract":   "Signed Subcontract / MSA Agreement",
    "cdl_license":          "CDL License — Front & Back (legible copy)",
    "dot_medical_card":     "DOT Medical Examiner's Certificate (MCSA-5876)",
    "mvr_report":           "Motor Vehicle Record (MVR) — 3-year history",
    "drug_screen_result":   "Pre-Employment DOT Drug Screen Result (49 CFR Part 40)",
    "fmcsa_clearinghouse":  "FMCSA Drug & Alcohol Clearinghouse Full Query Result",
    "annual_mvr":           "Annual MVR Review Acknowledgment",
}

# Which doc types have expiry dates that must be tracked
DOC_EXPIRY_REQUIRED: frozenset = frozenset({
    "cdl_license", "dot_medical_card", "coi_gl", "coi_wc",
    "drug_screen_result", "fmcsa_clearinghouse", "annual_mvr",
})

# Required docs per worker type
REQUIRED_DOCS: dict[str, list[str]] = {
    "employee_ft": [
        "govt_photo_id", "i9_doc", "w4", "va4", "direct_deposit",
        "emergency_contact", "background_consent", "drug_test_consent",
        "handbook_ack", "safety_orientation",
    ],
    "employee_pt": [
        "govt_photo_id", "i9_doc", "w4", "va4",
        "emergency_contact", "drug_test_consent", "safety_orientation",
    ],
    "employee_temp": [
        "govt_photo_id", "i9_doc", "w4", "va4", "safety_orientation",
    ],
    "subcontractor": [
        "govt_photo_id", "w9", "coi_gl", "coi_wc",
        "signed_subcontract", "safety_orientation",
    ],
    "general_labor": [
        "govt_photo_id", "i9_doc", "w4", "va4", "safety_orientation",
    ],
    "cdl_driver": [
        "govt_photo_id", "i9_doc", "w4", "va4", "direct_deposit",
        "background_consent", "drug_test_consent",
        "cdl_license", "dot_medical_card", "mvr_report",
        "drug_screen_result", "fmcsa_clearinghouse", "safety_orientation",
    ],
}

WORKER_TYPE_LABELS: dict[str, str] = {
    "employee_ft":   "Full-Time Employee (W-2)",
    "employee_pt":   "Part-Time Employee (W-2)",
    "employee_temp": "Temporary / Seasonal Employee (W-2)",
    "subcontractor": "Subcontractor (1099)",
    "general_labor": "General Labor / Day Worker (W-2)",
    "cdl_driver":    "CDL Driver (W-2)",
}


def compliance_check(worker_type: str, uploaded_docs: list[dict]) -> dict:
    """Return compliance status for a worker given their uploaded docs."""
    required = REQUIRED_DOCS.get(worker_type, [])
    by_type = {d["doc_type"]: d for d in uploaded_docs}
    missing  = [dt for dt in required if dt not in by_type]
    pending  = [dt for dt in required if by_type.get(dt, {}).get("status") == "pending"]
    rejected = [dt for dt in required if by_type.get(dt, {}).get("status") == "rejected"]
    expired  = [dt for dt in required if by_type.get(dt, {}).get("status") == "expired"]
    approved = [dt for dt in required if by_type.get(dt, {}).get("status") == "approved"]
    complete = (len(approved) == len(required))
    return {
        "required_count": len(required),
        "missing":  missing,
        "pending":  pending,
        "rejected": rejected,
        "expired":  expired,
        "approved": approved,
        "complete": complete,
        "pct": round(len(approved) / max(len(required), 1) * 100),
    }
