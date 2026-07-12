"""Safety/OSHA — toolbox talks, incident log, OSHA 300 rate, site scores."""
from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from openai import OpenAI
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..config import settings
from ..core.limiter import limiter, AI_LIMIT
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import SafetyToolboxTalk, SafetyIncident

router = APIRouter(prefix='/safety', tags=['safety'])

OSHA_TOPICS = [
    'fall_protection', 'struck_by', 'caught_between', 'electrical',
    'heat_illness', 'traffic_control', 'silica', 'equipment_operation',
    'ppe', 'hazard_communication', 'trenching', 'fire_prevention',
]


class ToolboxTalkCreate(BaseModel):
    title: str | None = None
    topic: str
    content: str | None = None      # if None and openai key set, AI generates
    duration_minutes: int = 10
    presenter: str | None = None
    attendees: list[str] | None = None
    site_address: str | None = None
    presented_at: str | None = None


class IncidentCreate(BaseModel):
    incident_date: str
    incident_type: str              # recordable, near_miss, first_aid, property_damage
    description: str
    location: str | None = None
    injured_person: str | None = None
    body_part_affected: str | None = None
    days_away: int = 0
    days_restricted: int = 0
    root_cause: str | None = None
    corrective_action: str | None = None
    osha_recordable: bool = False


def _generate_toolbox_content(topic: str) -> str:
    if not settings.openai_api_key:
        return f'Toolbox talk on {topic.replace("_", " ").title()}. Set OPENAI_API_KEY for AI-generated content.'
    client = OpenAI(api_key=settings.openai_api_key)
    resp = client.chat.completions.create(
        model='gpt-4o',
        messages=[{
            'role': 'user',
            'content': f'''Write a concise 10-minute toolbox talk for a paving and general contracting crew on the topic: {topic.replace("_", " ").title()}.

Structure:
1. **Opening Hook** (1 sentence — real incident or statistic)
2. **Key Hazards** (3 bullet points specific to paving/construction)
3. **Prevention Steps** (4–5 concrete actions crew takes today)
4. **Site-Specific Note** (adapt to asphalt paving context)
5. **Sign-Off** (crew acknowledgment reminder)

Keep it direct, field-practical, jargon-free. Under 400 words.'''
        }],
        max_tokens=600,
        temperature=0.4,
    )
    return resp.choices[0].message.content or ''


@router.post('/toolbox-talks', dependencies=[Depends(verify_premium_security)])
@limiter.limit(AI_LIMIT)
async def create_toolbox_talk(
    request: Request,
    body: ToolboxTalkCreate,
    db: Session = Depends(get_db),
):
    content = body.content
    ai_generated = False
    if not content:
        content = _generate_toolbox_content(body.topic)
        ai_generated = True

    title = body.title or f'{body.topic.replace("_", " ").title()} Safety Talk'
    talk = SafetyToolboxTalk(
        title=title,
        topic=body.topic,
        content=content,
        duration_minutes=body.duration_minutes,
        presenter=body.presenter,
        attendees=json.dumps(body.attendees or []),
        site_address=body.site_address,
        presented_at=datetime.fromisoformat(body.presented_at.replace('Z', '+00:00')) if body.presented_at else None,
        ai_generated=ai_generated,
    )
    db.add(talk)
    db.commit()
    db.refresh(talk)
    return {
        'id': talk.id,
        'title': talk.title,
        'topic': talk.topic,
        'content': talk.content,
        'duration_minutes': talk.duration_minutes,
        'attendees': json.loads(talk.attendees or '[]'),
        'ai_generated': talk.ai_generated,
        'presented_at': talk.presented_at.isoformat() if talk.presented_at else None,
        'created_at': talk.created_at.isoformat(),
    }


@router.get('/toolbox-talks', dependencies=[Depends(verify_premium_security)])
async def list_toolbox_talks(topic: str | None = None, limit: int = 50, db: Session = Depends(get_db)):
    q = db.query(SafetyToolboxTalk)
    if topic:
        q = q.filter(SafetyToolboxTalk.topic == topic)
    talks = q.order_by(SafetyToolboxTalk.created_at.desc()).limit(limit).all()
    return {
        'talks': [
            {'id': t.id, 'title': t.title, 'topic': t.topic,
             'presenter': t.presenter, 'presented_at': t.presented_at.isoformat() if t.presented_at else None,
             'attendees_count': len(json.loads(t.attendees or '[]')), 'ai_generated': t.ai_generated}
            for t in talks
        ],
        'topics': OSHA_TOPICS,
    }


@router.post('/incidents', dependencies=[Depends(verify_premium_security)])
async def log_incident(body: IncidentCreate, db: Session = Depends(get_db)):
    valid_types = {'recordable', 'near_miss', 'first_aid', 'property_damage'}
    if body.incident_type not in valid_types:
        raise HTTPException(status_code=422, detail=f'incident_type must be one of {valid_types}')

    inc = SafetyIncident(
        incident_date=datetime.fromisoformat(body.incident_date.replace('Z', '+00:00')),
        incident_type=body.incident_type,
        description=body.description,
        location=body.location,
        injured_person=body.injured_person,
        body_part_affected=body.body_part_affected,
        days_away=body.days_away,
        days_restricted=body.days_restricted,
        root_cause=body.root_cause,
        corrective_action=body.corrective_action,
        osha_recordable=body.osha_recordable,
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return {'id': inc.id, 'incident_type': inc.incident_type, 'osha_recordable': inc.osha_recordable}


@router.get('/incidents', dependencies=[Depends(verify_premium_security)])
async def list_incidents(
    incident_type: str | None = None,
    osha_only: bool = False,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(SafetyIncident)
    if incident_type:
        q = q.filter(SafetyIncident.incident_type == incident_type)
    if osha_only:
        q = q.filter(SafetyIncident.osha_recordable == True)
    incidents = q.order_by(SafetyIncident.incident_date.desc()).limit(limit).all()
    return {
        'incidents': [
            {'id': i.id, 'incident_date': i.incident_date.isoformat(), 'incident_type': i.incident_type,
             'description': i.description, 'location': i.location, 'osha_recordable': i.osha_recordable,
             'days_away': i.days_away, 'days_restricted': i.days_restricted}
            for i in incidents
        ],
        'total': len(incidents),
    }


@router.get('/osha-rate', dependencies=[Depends(verify_premium_security)])
async def osha_rate(hours_worked: float = 200000, db: Session = Depends(get_db)):
    """Calculate OSHA 300 incident rate per 200,000 hours worked."""
    recordables = db.query(SafetyIncident).filter(SafetyIncident.osha_recordable == True).count()
    dart_cases = (
        db.query(SafetyIncident)
        .filter(SafetyIncident.osha_recordable == True)
        .filter((SafetyIncident.days_away > 0) | (SafetyIncident.days_restricted > 0))
        .count()
    )
    trir = round((recordables * 200000) / hours_worked, 2) if hours_worked > 0 else 0
    dart = round((dart_cases * 200000) / hours_worked, 2) if hours_worked > 0 else 0
    return {
        'recordable_incidents': recordables,
        'dart_cases': dart_cases,
        'hours_worked': hours_worked,
        'trir': trir,
        'dart_rate': dart,
        'industry_avg_trir': 3.4,
        'vs_industry': 'above_avg' if trir > 3.4 else 'below_avg',
    }


@router.get('/site-score', dependencies=[Depends(verify_premium_security)])
async def site_safety_score(db: Session = Depends(get_db)):
    """Aggregate safety score across all tracked sites (0–100)."""
    total_talks = db.query(SafetyToolboxTalk).count()
    total_incidents = db.query(SafetyIncident).count()
    recordables = db.query(SafetyIncident).filter(SafetyIncident.osha_recordable == True).count()
    base_score = 100
    if total_incidents > 0:
        base_score -= min(40, recordables * 10 + (total_incidents - recordables) * 3)
    talk_bonus = min(20, total_talks * 2)
    score = max(0, min(100, base_score + talk_bonus))
    return {'score': score, 'total_talks': total_talks, 'total_incidents': total_incidents, 'recordables': recordables}
