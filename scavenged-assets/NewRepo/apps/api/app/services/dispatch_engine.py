"""Dispatch assignment engine — score crew/equipment candidates for a work order."""
from __future__ import annotations

import math
from typing import Any


def _haversine_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 3958.8
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def score_crew_candidate(
    member: dict[str, Any],
    required_skills: list[str],
    job_lat: float | None,
    job_lng: float | None,
) -> dict[str, Any]:
    """Return a score (0–100) and reasoning for a crew member candidate."""
    score = 50.0
    reasons: list[str] = []

    # Status bonus
    if member.get('status') == 'active':
        score += 15
    else:
        score -= 30
        reasons.append('not active')

    # Skills match
    member_skills: list[str] = []
    raw_skills = member.get('skills') or ''
    if isinstance(raw_skills, str) and raw_skills.strip():
        import json
        try:
            member_skills = json.loads(raw_skills)
        except ValueError:
            member_skills = [s.strip() for s in raw_skills.split(',') if s.strip()]

    if required_skills:
        matched = sum(1 for s in required_skills if s.lower() in [ms.lower() for ms in member_skills])
        skill_pct = matched / len(required_skills)
        score += skill_pct * 20
        if skill_pct == 1.0:
            reasons.append('all required skills')
        elif skill_pct > 0:
            reasons.append(f'{matched}/{len(required_skills)} required skills')

    # Cert validity penalty
    import json as _json
    from datetime import datetime, timezone
    raw_certs = member.get('certifications') or '[]'
    try:
        certs: list[dict] = _json.loads(raw_certs) if isinstance(raw_certs, str) else raw_certs
    except ValueError:
        certs = []
    now = datetime.now(timezone.utc)
    for cert in certs:
        exp_str = cert.get('expiry')
        if exp_str:
            try:
                exp = datetime.fromisoformat(exp_str.replace('Z', '+00:00'))
                if exp < now:
                    score -= 10
                    reasons.append(f'expired cert: {cert.get("name", "unknown")}')
            except ValueError:
                pass

    # Distance penalty (if coordinates available)
    if job_lat and job_lng:
        member_lat = member.get('lat')
        member_lng = member.get('lng')
        if member_lat and member_lng:
            dist = _haversine_miles(member_lat, member_lng, job_lat, job_lng)
            if dist < 10:
                score += 10
                reasons.append(f'{dist:.0f} mi away')
            elif dist < 30:
                score += 5
            elif dist > 80:
                score -= 10
                reasons.append(f'{dist:.0f} mi — long haul')

    return {
        'member_id': member.get('id'),
        'name': member.get('name'),
        'score': max(0.0, min(100.0, score)),
        'reasons': reasons,
    }


def rank_candidates(
    candidates: list[dict[str, Any]],
    required_skills: list[str],
    job_lat: float | None = None,
    job_lng: float | None = None,
) -> list[dict[str, Any]]:
    scored = [score_crew_candidate(c, required_skills, job_lat, job_lng) for c in candidates]
    return sorted(scored, key=lambda x: x['score'], reverse=True)
