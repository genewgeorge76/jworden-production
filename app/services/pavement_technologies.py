"""
pavement_technologies.py — The verified civil technology suite, with citations.

One source of truth for the six technologies the Worden Standard specs are
written around. Jarvis cites from here, the hub serves it to the portfolio
sites, and the field-QA path validates against the same constants, so a
correction lands in one place instead of three.

Every citation below was checked against the issuing body before it was
entered, because these numbers end up in bids and the other side's engineer
checks them. Six claims in the source document did not survive that check.
They are recorded in `CORRECTIONS` rather than quietly fixed — a spec that
changed without saying so is worse than one that was wrong openly, since
anyone holding the old version has no way to know.

The corrections, in short:

  * Thermal profiling is AASHTO R 110-22 (formerly PP 80). There is no
    AASHTO PP 108. The TxDOT *test method* is Tex-244-F; Item 344 is a
    Superpave mixture item, not the thermal profile procedure.
  * Tex-244-F grades segregation on temperature *differential* (>25 F
    moderate, >50 F severe), not an absolute 250 F floor.
  * Intelligent compaction is AASHTO PP 81-14, superseded by R 111-22.
    ASTM D698 is the standard Proctor test for soil and has nothing to do
    with IC on asphalt.
  * ASTM D8395-23 sets aramid dosage at 2.1 oz/ton. The document said 4.2 —
    exactly double, which on a 2,000-ton lot is 262 lb of fibre nobody
    budgeted.
  * Flexural beam fatigue is AASHTO T 321. AASHTO TP 105 is real but measures
    low-temperature fracture energy by semicircular bend, so it does not
    support a fatigue claim.
  * LEED v4 grades non-roof hardscape on solar reflectance, not SRI:
    three-year aged SR >= 0.28, or initial SR >= 0.33. SRI is the roof metric.
    "SRI >= 29" cites the wrong quantity against the wrong threshold.

Vendor performance figures (+300% fatigue, +150% rutting, 35 F surface drop,
40% oxidation life) are carried as manufacturer claims and labelled as such.
They are not standards, and no issuing body publishes them.
"""

from __future__ import annotations

from typing import Any

# Compaction floor every Worden paving spec is written against.
COMPACTION_FLOOR_PCT = 96.0

# Tex-244-F thermal segregation grading, by temperature differential (F).
THERMAL_DIFFERENTIAL_MODERATE_F = 25.0
THERMAL_DIFFERENTIAL_SEVERE_F = 50.0

# ASTM D8395-23 aramid dosage.
ARAMID_DOSE_OZ_PER_TON = 2.1

# LEED v4 Heat Island Reduction, non-roof hardscape (solar reflectance).
LEED_V4_SR_AGED_MIN = 0.28
LEED_V4_SR_INITIAL_MIN = 0.33


def grade_thermal_segregation(differential_f: float | None) -> str | None:
    """Tex-244-F grading. None when nothing was measured."""
    if differential_f is None:
        return None
    if differential_f > THERMAL_DIFFERENTIAL_SEVERE_F:
        return "severe"
    if differential_f > THERMAL_DIFFERENTIAL_MODERATE_F:
        return "moderate"
    return "acceptable"


TECHNOLOGIES: list[dict[str, Any]] = [
    {
        "id": "thermal_profiling",
        "name": "Paver-Mounted Infrared Thermal Profiling",
        "category": "Placement QA",
        "standards": [
            {"body": "AASHTO", "designation": "R 110-22",
             "title": "Continuous Thermal Profile of Asphalt Mixture Construction",
             "note": "Formerly PP 80."},
            {"body": "TxDOT", "designation": "Tex-244-F",
             "title": "Thermal Profile of Hot Mix Asphalt"},
        ],
        "hardware": ["MOBA Pave-IR", "Topcon Thermal Mapper"],
        "verified_parameters": [
            "Transverse sensor spacing 12 +/- 1 in (Tex-244-F)",
            "Profiling width at least 12 ft, full paving width",
            "Accuracy +/- 4.0 F or 2% of reading above 32 F",
            "Excludes the 2 ft nearest the uncompacted mat edge",
        ],
        "acceptance": {
            "basis": "temperature differential, not absolute temperature",
            "moderate_segregation_f": THERMAL_DIFFERENTIAL_MODERATE_F,
            "severe_segregation_f": THERMAL_DIFFERENTIAL_SEVERE_F,
        },
        "vendor_claims": [],
    },
    {
        "id": "intelligent_compaction",
        "name": "Intelligent Compaction and Accelerometer Drum Telematics",
        "category": "Compaction QA",
        "standards": [
            {"body": "AASHTO", "designation": "R 111-22",
             "title": "Intelligent Compaction for Embankment and Asphalt Pavement Applications",
             "note": "Supersedes PP 81-14."},
            {"body": "FHWA", "designation": "Intelligent Compaction program",
             "title": "IC specifications and verification guidance"},
        ],
        "hardware": ["Hamm HCM", "BOMAG Terrameter", "10-12 ton vibratory double-drum"],
        "verified_parameters": [
            "Accelerometer-derived ICMV correlates to compacted stiffness",
            "RTK-GPS pass-count mapping with colour-coded coverage",
            "Coverage = % of area at or above the target pass count for the lot",
            "Target passes established from a trial section, not assumed",
        ],
        "acceptance": {"compaction_floor_pct": COMPACTION_FLOOR_PCT},
        "vendor_claims": [],
    },
    {
        "id": "non_nuclear_density",
        "name": "Non-Nuclear Pavement Quality Density Profiling",
        "category": "Density QA",
        "standards": [
            {"body": "ASTM", "designation": "D7113",
             "title": "Density of Bituminous Paving Mixtures in Place by the "
                      "Electromagnetic Surface Contact Methods"},
            {"body": "AASHTO", "designation": "T 343",
             "title": "Density of In-Place Asphalt Mixture by Electronic Surface Contact Devices"},
        ],
        "hardware": ["TransTech PQI 380"],
        "verified_parameters": [
            "Electromagnetic surface contact; no radioactive source",
            "No nuclear materials licence or radiation transport permit",
            "Reading in roughly 3 seconds, non-destructive",
            "Correlated to core Gmb; requires project-specific calibration",
        ],
        "acceptance": {"compaction_floor_pct": COMPACTION_FLOOR_PCT},
        "vendor_claims": [],
    },
    {
        "id": "aramid_fiber",
        "name": "Aramid Fiber-Reinforced Asphalt Concrete",
        "category": "Material Science",
        "standards": [
            {"body": "ASTM", "designation": "D8395-23",
             "title": "Standard Specification for Aramid Fiber for Asphalt Mixtures"},
            {"body": "AASHTO", "designation": "T 321",
             "title": "Fatigue Life of Compacted Asphalt Mixtures Subjected to Repeated "
                      "Flexural Bending",
             "note": "The correct reference for a flexural beam fatigue claim."},
        ],
        "hardware": ["19 mm aramid / polyolefin blended fiber, pugmill dosed"],
        "verified_parameters": [
            f"Dosage {ARAMID_DOSE_OZ_PER_TON} oz per US ton of mix (ASTM D8395-23)",
            "Aramid tensile strength on the order of 400,000 psi (~2.9 GPa)",
            "D8395 specifies length, density, strength, modulus, decomposition",
        ],
        "acceptance": {"dose_oz_per_ton": ARAMID_DOSE_OZ_PER_TON},
        "vendor_claims": [
            "+300% fatigue cracking resistance (manufacturer, flexural beam fatigue)",
            "+150% rutting resistance (manufacturer, Asphalt Pavement Analyzer)",
            "Surface lift reduction 2.5 in to 1.75 in at equal structural number "
            "(manufacturer; requires a project-specific pavement design to claim)",
        ],
    },
    {
        "id": "lidar_hydrology",
        "name": "Drone LiDAR Hydraulic Runoff and Slope Analysis",
        "category": "Site Engineering",
        "standards": [
            {"body": "FHWA", "designation": "HEC-22",
             "title": "Urban Drainage Design Manual"},
            {"body": "FAA", "designation": "14 CFR Part 107",
             "title": "Small Unmanned Aircraft Systems"},
        ],
        "hardware": ["UAS LiDAR / photogrammetry, sub-centimetre DEM"],
        "verified_parameters": [
            "Manning's equation, US customary: V = (1.486 / n) * R^(2/3) * S^(1/2)",
            "DEM contour audit identifies micro-depressions before milling",
            "Positive slope verification against design cross-slope",
        ],
        "acceptance": {"ponding_grade_threshold_pct": 1.0},
        "vendor_claims": [
            "0.5 cm DEM resolution (equipment-dependent; a function of flight "
            "altitude, sensor and ground control, not a fixed capability)",
        ],
    },
    {
        "id": "cool_pavement",
        "name": "Solar Reflective Cool Pavement Micro-Surfacing",
        "category": "Sustainability",
        "standards": [
            {"body": "ASTM", "designation": "E1980",
             "title": "Calculating Solar Reflectance Index of Horizontal and Low-Sloped "
                      "Opaque Surfaces"},
            {"body": "USGBC", "designation": "LEED v4 SS Heat Island Reduction",
             "title": "Non-roof hardscape is graded on solar reflectance (SR), not SRI",
             "note": f"Three-year aged SR >= {LEED_V4_SR_AGED_MIN}, or initial "
                     f"SR >= {LEED_V4_SR_INITIAL_MIN}."},
        ],
        "hardware": ["High-albedo polymer-modified micro-surfacing", "Photocatalytic TiO2"],
        "verified_parameters": [
            f"LEED v4 non-roof: aged SR >= {LEED_V4_SR_AGED_MIN} or initial "
            f"SR >= {LEED_V4_SR_INITIAL_MIN}",
            "New dense-graded asphalt reflects roughly 0.05 SR",
            "SRI (ASTM E1980) is the roof metric and is not the LEED non-roof criterion",
        ],
        "acceptance": {
            "leed_v4_sr_aged_min": LEED_V4_SR_AGED_MIN,
            "leed_v4_sr_initial_min": LEED_V4_SR_INITIAL_MIN,
        },
        "vendor_claims": [
            "Surface temperature reduction of roughly 35 F (manufacturer)",
            "+40% binder oxidation life (manufacturer)",
        ],
    },
]


CORRECTIONS: list[dict[str, str]] = [
    {
        "technology": "thermal_profiling",
        "claimed": "AASHTO PP 108",
        "verified": "AASHTO R 110-22 (formerly PP 80)",
        "why_it_matters": "PP 108 is not an AASHTO designation for thermal profiling. "
                          "A spec citing it cannot be complied with as written.",
    },
    {
        "technology": "thermal_profiling",
        "claimed": "TxDOT Item 344",
        "verified": "TxDOT Tex-244-F",
        "why_it_matters": "Item 344 is a Superpave mixture item. The thermal profile "
                          "procedure is the Tex-244-F test method.",
    },
    {
        "technology": "thermal_profiling",
        "claimed": "Detects pockets below 250 F",
        "verified": "Graded on differential: >25 F moderate, >50 F severe",
        "why_it_matters": "An absolute floor passes a uniformly cold mat and fails a "
                          "hot one with a cold streak — the opposite of the intent.",
    },
    {
        "technology": "intelligent_compaction",
        "claimed": "ASTM D698",
        "verified": "AASHTO PP 81-14, superseded by R 111-22",
        "why_it_matters": "D698 is the standard Proctor moisture-density test for soil. "
                          "Citing it for asphalt IC invites a rejected submittal.",
    },
    {
        "technology": "aramid_fiber",
        "claimed": "4.2 oz/ton dosage",
        "verified": "2.1 oz/ton per ASTM D8395-23",
        "why_it_matters": "Double the specified dose. On a 2,000-ton lot that is about "
                          "262 lb of fibre priced into a bid that nobody needs.",
    },
    {
        "technology": "aramid_fiber",
        "claimed": "AASHTO TP 105 supports the fatigue claim",
        "verified": "TP 105 is low-temperature fracture energy (SCB); flexural beam "
                    "fatigue is AASHTO T 321",
        "why_it_matters": "TP 105 is a real standard measuring a different property, "
                          "so it does not substantiate a fatigue percentage.",
    },
    {
        "technology": "cool_pavement",
        "claimed": "SRI >= 29 for LEED v4",
        "verified": f"LEED v4 non-roof uses solar reflectance: aged SR >= "
                    f"{LEED_V4_SR_AGED_MIN} or initial SR >= {LEED_V4_SR_INITIAL_MIN}",
        "why_it_matters": "Wrong quantity against the wrong threshold. A LEED credit "
                          "claimed on SRI for hardscape does not survive review.",
    },
]


def technology_ids() -> list[str]:
    return [t["id"] for t in TECHNOLOGIES]


def get_technology(tech_id: str) -> dict[str, Any] | None:
    return next((t for t in TECHNOLOGIES if t["id"] == tech_id), None)


def as_citation_lines() -> list[str]:
    """
    Flat, quotable lines for the knowledge base.

    Vendor claims are excluded: the knowledge base is what Jarvis cites as
    fact, and a manufacturer percentage repeated without its source becomes a
    warranty the moment it lands in a proposal.
    """
    lines: list[str] = []
    for tech in TECHNOLOGIES:
        cites = ", ".join(f"{s['body']} {s['designation']}" for s in tech["standards"])
        lines.append(f"{tech['name']} ({tech['category']}) — {cites}")
        lines.extend(f"  - {p}" for p in tech["verified_parameters"])
    return lines
