"""
pavement_intel.py — Pavement condition intelligence (road-scanning stack).

Pure-Python port of the WordenEnterpriseOS math-AI pavement models:
  - score_pavement_condition()      — PCI 0-100, calibrated against ASTM D6433 curves
  - forecast_maintenance_schedule() — exponential decay PCI(t) = 100·e^(−k·t)
  - analyze_ground_scan()           — 811 / subsurface utility locate risk scoring
  - simulate_pavement_decay()       — road/lot/driveway age-decay projection
  - premium_civil_stack()           — 7-module weighted GO / CONDITIONAL / HOLD decision

No numpy/scipy required — deterministic math only, safe for any deploy target.
"""
from __future__ import annotations

import math
from datetime import date, timedelta
from typing import Any, Optional

# ── PCI thresholds (ASTM D6433-inspired) ──────────────────────────────────────
PCI_EXCELLENT = 85
PCI_GOOD = 70
PCI_FAIR = 55
PCI_POOR = 40
PCI_VERY_POOR = 25

_SEALCOAT_THRESHOLD = 70
_CRACKFILL_THRESHOLD = 55
_OVERLAY_THRESHOLD = 40
_RECONSTRUCT_THRESHOLD = 25

_TRAFFIC_FACTORS = {'low': 1.0, 'medium': 1.4, 'high': 1.9, 'very_high': 2.6}

# Decay-simulation factor tables
_TRAFFIC_DECAY = {'low': 0.0, 'medium': 1.0, 'high': 2.2, 'heavy_truck': 4.0}
_DRAINAGE_DECAY = {'good': 0.0, 'fair': 1.0, 'poor': 3.0}
_CRACK_DECAY = {'none': 0.0, 'low': 0.8, 'medium': 2.0, 'high': 4.0}

_CRITICAL_UTILITY_TYPES = {'gas', 'electric', 'fiber', 'water', 'sewer'}
_GROUND_RISK_SCORE = {'LOW': 92, 'MEDIUM': 68, 'HIGH': 38}
_TRAFFIC_LOAD_SCORE = {'low': 94, 'medium': 84, 'high': 70, 'heavy_truck': 56}
_DRAINAGE_SCORE_PENALTY = {'good': 0, 'fair': 18, 'poor': 38}

_MODULE_WEIGHTS = {
    'utility': 0.24, 'gpr': 0.16, 'pavement': 0.18, 'thermal': 0.12,
    'drainage': 0.14, 'traffic': 0.10, 'potholing': 0.06,
}


def _clip(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


# ── 1. PCI scoring ────────────────────────────────────────────────────────────

def score_pavement_condition(
    age: float,
    cracks: float,
    potholes: int,
    traffic: str = 'medium',
) -> dict[str, Any]:
    """
    Compute a Pavement Condition Index (PCI) score on a 0-100 scale using a
    weighted deduction model calibrated against ASTM D6433 field curves.

    age      : pavement age in years
    cracks   : % of surface area showing cracking (0-100)
    potholes : potholes per 1,000 sqft
    traffic  : low | medium | high | very_high
    """
    age = max(0.0, float(age))
    cracks = _clip(float(cracks), 0.0, 100.0)
    potholes = max(0, int(potholes))
    tf = _TRAFFIC_FACTORS.get(traffic.lower(), _TRAFFIC_FACTORS['medium'])

    # Age deduction: logistic decay — slow early, accelerates after ~12 yrs
    age_deduction = 100.0 / (1.0 + math.exp(-0.18 * (age - 12.0)))
    age_deduction = _clip(age_deduction * tf * 0.55, 0.0, 55.0)

    # Crack deduction: square-root model (small cracks → large impact)
    crack_deduction = _clip(math.sqrt(cracks) * 4.5 * tf, 0.0, 35.0)

    # Pothole deduction: each pothole per 1k sqft deducts ~6 pts (capped)
    pothole_deduction = _clip(potholes * 6.0 * tf, 0.0, 30.0)

    total_deduction = age_deduction + crack_deduction + pothole_deduction
    if cracks > 30 and potholes > 2:
        total_deduction *= 1.15  # compounding severe distresses

    score = int(_clip(round(100.0 - total_deduction), 0, 100))

    if score >= PCI_EXCELLENT:
        condition, action, urgency = 'Excellent', 'No action required — schedule routine inspection in 2 years', 'routine'
    elif score >= PCI_GOOD:
        condition, action, urgency = 'Good', 'Preventive sealcoating recommended within 12 months', 'within_1_year'
    elif score >= PCI_FAIR:
        condition, action, urgency = 'Fair', 'Crack filling and sealcoating required within 6 months', 'within_6_months'
    elif score >= PCI_POOR:
        condition, action, urgency = 'Poor', 'Mill-and-overlay or structural patching required — schedule now', 'immediate'
    elif score >= PCI_VERY_POOR:
        condition, action, urgency = 'Very Poor', 'Full-depth reclamation or reconstruction required urgently', 'immediate'
    else:
        condition, action, urgency = 'Failed', 'Immediate reconstruction required — surface is unsafe', 'immediate'

    spread = abs(score - 50) / 50.0
    confidence = round(0.70 + 0.28 * spread, 3)

    return {
        'score': score,
        'condition': condition,
        'deductions': {
            'age_deduction': round(age_deduction, 2),
            'crack_deduction': round(crack_deduction, 2),
            'pothole_deduction': round(pothole_deduction, 2),
            'traffic_factor': tf,
        },
        'recommended_action': action,
        'urgency': urgency,
        'confidence': confidence,
    }


# ── 2. Maintenance forecast ───────────────────────────────────────────────────

def forecast_maintenance_schedule(pavement_age: float, condition: float) -> dict[str, Any]:
    """
    Forecast maintenance milestones with exponential decay PCI(t) = 100·e^(−k·t).
    k is fitted from current age + PCI; defaults to industry-average 3.5%/yr.
    """
    pavement_age = max(0.0, float(pavement_age))
    condition = _clip(float(condition), 0.0, 100.0)

    if pavement_age > 0 and condition < 100:
        k = -math.log(max(condition, 1.0) / 100.0) / pavement_age
    else:
        k = 0.035

    def pci_at(years_from_now: float) -> float:
        return _clip(100.0 * math.exp(-k * (pavement_age + years_from_now)), 0.0, 100.0)

    def years_to_threshold(threshold: float) -> Optional[float]:
        if condition <= threshold:
            return 0.0
        if k <= 0:
            return None
        return max(math.log(condition / threshold) / k, 0.0)

    today = date.today()

    def _date_from_years(yrs: Optional[float]) -> Optional[str]:
        if yrs is None:
            return None
        return (today + timedelta(days=int(yrs * 365.25))).isoformat()

    yrs_sealcoat = years_to_threshold(_SEALCOAT_THRESHOLD)
    yrs_crackfill = years_to_threshold(_CRACKFILL_THRESHOLD)
    yrs_overlay = years_to_threshold(_OVERLAY_THRESHOLD)
    yrs_reconstruct = years_to_threshold(_RECONSTRUCT_THRESHOLD)

    schedule: list[dict] = []
    for service_name, yrs, threshold in [
        ('Sealcoating', yrs_sealcoat, _SEALCOAT_THRESHOLD),
        ('Crack Filling', yrs_crackfill, _CRACKFILL_THRESHOLD),
        ('Mill & Overlay', yrs_overlay, _OVERLAY_THRESHOLD),
        ('Reconstruction', yrs_reconstruct, _RECONSTRUCT_THRESHOLD),
    ]:
        if yrs is not None:
            schedule.append({
                'service': service_name,
                'years_from_now': round(yrs, 2),
                'target_date': _date_from_years(yrs),
                'pci_at_trigger': threshold,
                'status': 'overdue' if yrs == 0.0 else 'upcoming',
            })
    schedule.sort(key=lambda x: x['years_from_now'])

    return {
        'current_pci': round(condition, 1),
        'projected_pci_1yr': round(pci_at(1.0), 1),
        'projected_pci_3yr': round(pci_at(3.0), 1),
        'projected_pci_5yr': round(pci_at(5.0), 1),
        'next_sealcoat_date': _date_from_years(yrs_sealcoat),
        'next_crackfill_date': _date_from_years(yrs_crackfill),
        'next_overlay_date': _date_from_years(yrs_overlay),
        'next_reconstruct_date': _date_from_years(yrs_reconstruct),
        'decay_rate': round(k, 5),
        'service_schedule': schedule,
        'model_notes': (
            f'Deterioration modelled as PCI(t) = 100 × e^(−k·t). Fitted k={k:.5f}/yr '
            f'from current age ({pavement_age:.1f} yr) and PCI ({condition:.0f}). '
            'Actual deterioration depends on climate, traffic, and drainage.'
        ),
    }


# ── 3. Ground scan (811 / subsurface utility locate) risk analysis ────────────

def analyze_ground_scan(
    ticket_status: Optional[str],
    technologies: list[str],
    utilities: list[dict],
    soil_moisture: Optional[str] = None,
    anomalies_detected: bool = False,
) -> dict[str, Any]:
    """
    Score an excavation locate package. utilities entries:
      {utility_type, depth_inches?, confidence?, marked, notes?}
    """
    tech = {t.lower().replace('-', ' ').replace('_', ' ') for t in technologies}
    score = 0
    findings: list[str] = []

    if ticket_status != 'clear':
        score += 35
        findings.append('811 ticket is not marked clear.')
    has_gpr = 'gpr' in tech or 'ground penetrating radar' in tech
    if not has_gpr:
        score += 18
        findings.append('GPR sweep missing for unknown/abandoned utilities.')
    has_em = 'em locator' in tech or 'electromagnetic locator' in tech or 'utility locator' in tech
    if not has_em:
        score += 14
        findings.append('Electromagnetic locating pass missing for conductive utilities.')
    has_potholing = 'potholing' in tech or 'vacuum excavation' in tech
    if not has_potholing:
        score += 16
        findings.append('No daylighting/vacuum potholing confirmation listed.')
    if soil_moisture == 'saturated':
        score += 8
        findings.append('Saturated soil may reduce detection confidence and increase trench instability.')
    if anomalies_detected:
        score += 18
        findings.append('Unresolved subsurface anomalies detected.')

    critical_unmarked = [
        u for u in utilities
        if str(u.get('utility_type', '')).lower() in _CRITICAL_UTILITY_TYPES and not u.get('marked')
    ]
    if critical_unmarked:
        score += 25
        findings.append('Critical utilities are present but not marked/confirmed.')

    low_confidence = [u for u in utilities if u.get('confidence') is not None and u['confidence'] < 0.75]
    if low_confidence:
        score += 10
        findings.append('One or more utility detections are below 75% confidence.')

    risk = 'HIGH' if score >= 70 else 'MEDIUM' if score >= 35 else 'LOW'

    recommended_steps = []
    if ticket_status != 'clear':
        recommended_steps.append('Request/refresh 811 ticket and wait for all utility owner responses before excavation.')
    if not has_gpr:
        recommended_steps.append('Run a GPR grid scan across the dig/patch limits and mark anomalies.')
    if not has_em:
        recommended_steps.append('Run active/passive EM locating for power, tracer wire, telecom, and metallic services.')
    if critical_unmarked or anomalies_detected:
        recommended_steps.append('Use vacuum excavation/potholing to daylight crossings before sawcut, milling, or excavation.')
    if not recommended_steps:
        recommended_steps.append('Proceed with documented marks, photos, and tolerance-zone hand digging per local law.')

    confidence = max(0.35, min(0.98, 0.95 - (score / 180)))

    return {
        'risk_level': risk,
        'confidence': round(confidence, 2),
        'findings': findings or ['No major locate gaps identified from submitted data.'],
        'recommended_steps': recommended_steps,
        'recommended_tech_stack': [
            '811 ticket + positive response audit',
            'GPR grid scan',
            'EM active/passive utility locating',
            'GIS/as-built overlay',
            'LiDAR/drone surface capture for plan overlay',
            'Vacuum potholing for conflict verification',
            'Photo log + mark-out map before sawcut/dig',
        ],
        'recommendation': (
            'Do not excavate until HIGH/MEDIUM risk items are closed. '
            'Treat unknown anomalies as live utilities until daylighted.'
            if risk != 'LOW'
            else 'Locate package looks dig-ready; keep tolerance-zone hand-digging and photo documentation in place.'
        ),
    }


# ── 4. Pavement age-decay simulation ──────────────────────────────────────────

def _condition_band(score: float) -> str:
    if score >= 80:
        return 'excellent'
    if score >= 65:
        return 'good'
    if score >= 45:
        return 'fair'
    if score >= 25:
        return 'poor'
    return 'failed'


def _risk_from_score(score: float) -> str:
    if score >= 80:
        return 'LOW'
    if score >= 55:
        return 'MEDIUM'
    return 'HIGH'


def simulate_pavement_decay(
    pavement_type: str,
    age_years: float,
    current_condition_score: Optional[float] = None,
    traffic_level: str = 'medium',
    drainage_quality: str = 'fair',
    crack_severity: str = 'none',
    potholes: int = 0,
    rutting_inches: float = 0.0,
    last_sealcoat_years: Optional[float] = None,
    freeze_thaw: bool = True,
) -> dict[str, Any]:
    """Road / parking lot / driveway age-decay projection at 0/1/3/5/10 years."""
    if current_condition_score is not None:
        pci_now = float(current_condition_score)
    else:
        pci_now = 100 - (age_years * 4.2)
        if pavement_type in {'commercial_parking_lot', 'road'}:
            pci_now -= 5
        pci_now = _clip(pci_now, 5, 100)

    annual = 3.0
    annual += _TRAFFIC_DECAY.get(traffic_level, 1.0)
    annual += _DRAINAGE_DECAY.get(drainage_quality, 1.0)
    annual += _CRACK_DECAY.get(crack_severity, 0.0)
    annual += min(5.0, potholes * 0.25)
    annual += min(4.0, (rutting_inches or 0) * 1.5)
    if freeze_thaw:
        annual += 1.2
    if last_sealcoat_years is None or last_sealcoat_years > 4:
        annual += 1.0

    projection = [
        {
            'year': year,
            'condition_score': max(0, round(pci_now - annual * year, 1)),
            'condition_band': _condition_band(max(0, pci_now - annual * year)),
        }
        for year in (0, 1, 3, 5, 10)
    ]

    if pci_now < 35 or potholes > 10 or (rutting_inches or 0) >= 1.5:
        action, risk = 'Full-depth repair or overlay evaluation recommended now.', 'HIGH'
    elif pci_now < 55 or crack_severity in {'medium', 'high'}:
        action, risk = 'Crack fill, patching, drainage correction, and overlay planning recommended.', 'MEDIUM'
    else:
        action, risk = 'Preventive maintenance: sealcoat, crack fill, and annual inspection.', 'LOW'

    return {
        'pavement_type': pavement_type,
        'current_condition_score': round(pci_now, 1),
        'annual_decay_points': round(annual, 1),
        'risk_level': risk,
        'projection': projection,
        'recommended_action': action,
        'scan_stack': [
            'visual PCI survey',
            'drone orthomosaic / LiDAR surface model',
            'thermal/moisture anomaly review',
            'GPR pavement thickness and base void scan',
            'core sample or FWD verification for commercial/road projects',
        ],
    }


# ── 5. Premium civil stack — 7-module GO / CONDITIONAL / HOLD ─────────────────

def premium_civil_stack(
    *,
    ticket_status: Optional[str] = 'requested',
    technologies: Optional[list[str]] = None,
    utilities: Optional[list[dict]] = None,
    soil_moisture: Optional[str] = 'normal',
    anomalies_detected: bool = False,
    pavement_type: str = 'commercial_parking_lot',
    age_years: float = 8,
    current_condition_score: Optional[float] = None,
    traffic_level: str = 'high',
    drainage_quality: str = 'fair',
    crack_severity: str = 'medium',
    potholes: int = 2,
    rutting_inches: float = 0.25,
    last_sealcoat_years: Optional[float] = 4,
    freeze_thaw: bool = True,
    asphalt_temp_f: Optional[float] = None,
    target_delivery_temp_f: float = 275,
    estimated_arrival_minutes: Optional[float] = None,
) -> dict[str, Any]:
    """Blend 7 civil-tech scan modules into one weighted production decision."""
    technologies = technologies or []
    utilities = utilities or []
    tech = {t.lower().replace('-', ' ').replace('_', ' ') for t in technologies}

    ground = analyze_ground_scan(ticket_status, technologies, utilities, soil_moisture, anomalies_detected)
    decay = simulate_pavement_decay(
        pavement_type, age_years, current_condition_score, traffic_level,
        drainage_quality, crack_severity, potholes, rutting_inches,
        last_sealcoat_years, freeze_thaw,
    )
    pci_now = decay['current_condition_score']
    annual_decay = decay['annual_decay_points']
    years_to_rehab = max(0, round((pci_now - 45) / annual_decay, 1)) if annual_decay else 30

    gpr_ready = 'gpr' in tech or 'ground penetrating radar' in tech
    em_ready = 'em locator' in tech or 'electromagnetic locator' in tech or 'utility locator' in tech
    lidar_ready = 'lidar' in tech or 'drone photogrammetry' in tech or 'drone' in tech
    pothole_ready = 'potholing' in tech or 'vacuum excavation' in tech
    thermal_ready = 'thermal' in tech or 'infrared' in tech
    gis_ready = 'gis overlay' in tech or 'as built' in tech or 'as-built' in tech

    projected_temp = None
    if asphalt_temp_f is not None:
        projected_temp = asphalt_temp_f - min(35, (estimated_arrival_minutes or 0) * 0.18)

    utility_score = _GROUND_RISK_SCORE[ground['risk_level']]
    gpr_score = (
        50 + (22 if gpr_ready else 0) + (6 if em_ready else 0) + (12 if gis_ready else 0)
        + (10 if lidar_ready else 0) - (18 if anomalies_detected else 0)
    )
    pavement_score = max(0, 100 - ((100 - pci_now) * 0.7) - (annual_decay * 2.2))
    if projected_temp is None:
        thermal_score = 92 if thermal_ready else 84
    else:
        thermal_score = 100 - max(0, target_delivery_temp_f - projected_temp) * 1.8
    drainage_score = 92 - _DRAINAGE_SCORE_PENALTY.get(drainage_quality, 18) - (18 if soil_moisture == 'saturated' else 0)
    traffic_score = _TRAFFIC_LOAD_SCORE.get(traffic_level, 84)

    autonomous_score = (
        utility_score * _MODULE_WEIGHTS['utility']
        + gpr_score * _MODULE_WEIGHTS['gpr']
        + pavement_score * _MODULE_WEIGHTS['pavement']
        + thermal_score * _MODULE_WEIGHTS['thermal']
        + drainage_score * _MODULE_WEIGHTS['drainage']
        + traffic_score * _MODULE_WEIGHTS['traffic']
        + (95 if pothole_ready else 60) * _MODULE_WEIGHTS['potholing']
    )

    def _module(name: str, title: str, score: float, summary: str, actions: list[str], math_detail: dict) -> dict:
        score = round(_clip(score, 0, 100), 1)
        return {
            'name': name, 'title': title, 'score': score,
            'risk_level': _risk_from_score(score), 'summary': summary,
            'actions': actions, 'math': math_detail,
        }

    modules = [
        _module(
            'utility_locate_shield', '811 + Utility Locate Shield', utility_score,
            f"Utility locate package is {ground['risk_level']} risk with {int(ground['confidence'] * 100)}% confidence.",
            ground['recommended_steps'],
            {'risk_level': ground['risk_level'], 'confidence': ground['confidence']},
        ),
        _module(
            'gpr_subsurface_digital_twin', 'GPR Subsurface Digital Twin', gpr_score,
            'Combines GPR, GIS/as-built overlays, LiDAR/drone surface capture, and unresolved anomaly flags.',
            [
                'Run orthogonal GPR grid passes at utility crossings and sawcut limits.',
                'Overlay GPR anomaly picks with as-builts and drone/LiDAR surface control.',
            ],
            {'gpr_ready': gpr_ready, 'gis_ready': gis_ready, 'lidar_ready': lidar_ready, 'anomalies_detected': anomalies_detected},
        ),
        _module(
            'pavement_decay_digital_twin', 'Pavement Age-Decay Digital Twin', pavement_score,
            f"Current condition is {_condition_band(pci_now)} at {round(pci_now, 1)}/100 with {round(annual_decay, 1)} points/year decay.",
            [
                'Use PCI survey, drone orthomosaic, thermal moisture review, and GPR/base verification.',
                f'Plan rehabilitation trigger in approximately {years_to_rehab} years if conditions do not improve.',
            ],
            {'current_condition_score': round(pci_now, 1), 'annual_decay_points': round(annual_decay, 1), 'years_to_rehab': years_to_rehab},
        ),
        _module(
            'asphalt_thermal_delivery_ai', 'Asphalt Thermal Delivery AI', thermal_score,
            'Models haul-time cooling against target delivery temperature for HMA/WMA load acceptance.',
            [
                'Use insulated beds, thermal ticketing, plant departure stamps, and infrared arrival checks.',
                'Escalate if projected arrival temperature falls below the job mix target.',
            ],
            {
                'asphalt_temp_f': asphalt_temp_f,
                'projected_arrival_temp_f': None if projected_temp is None else round(projected_temp, 1),
                'target_delivery_temp_f': target_delivery_temp_f,
            },
        ),
        _module(
            'drainage_moisture_failure_radar', 'Drainage + Moisture Failure Radar', drainage_score,
            'Scores standing water, saturated subgrade risk, drainage quality, and moisture-driven pavement failure.',
            [
                'Correct ponding, edge failures, and base saturation before overlay.',
                'Use infrared/moisture survey after rain events for hidden wet-base zones.',
            ],
            {'drainage_quality': drainage_quality, 'soil_moisture': soil_moisture},
        ),
        _module(
            'traffic_load_phasing_optimizer', 'Traffic Load + Phasing Optimizer', traffic_score,
            'Evaluates residential/commercial/road traffic severity and production phasing pressure.',
            [
                'Sequence heavy-truck areas, drive lanes, ADA routes, and business access windows.',
                'Use heavier section design or staged full-depth repair where truck loads concentrate.',
            ],
            {'traffic_level': traffic_level, 'pavement_type': pavement_type},
        ),
        _module(
            'autonomous_go_no_go_foreman', 'Autonomous Go / No-Go Foreman', autonomous_score,
            'Blends all module scores into one production decision for dig, pave, overlay, or hold.',
            [
                'Proceed only after utility conflicts, thermal risk, drainage defects, and pavement failure triggers are closed.',
                'Attach scan logs, photos, 811 responses, and production notes to the job package.',
            ],
            {'weighted_score': round(autonomous_score, 1), 'module_count': 7},
        ),
    ]

    return {
        'module_count': len(modules),
        'overall_score': round(autonomous_score, 1),
        'overall_risk': _risk_from_score(autonomous_score),
        'decision': 'GO' if autonomous_score >= 80 else 'CONDITIONAL' if autonomous_score >= 55 else 'HOLD',
        'modules': modules,
    }
