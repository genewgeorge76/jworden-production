"""Gantt / Critical-Path scheduling router.

Provides task CRUD, critical-path computation (longest-path algorithm),
and schedule health summary for the /os dashboard Gantt module.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import GanttTask, utcnow

router = APIRouter(prefix='/gantt', tags=['gantt'])


def _utc_parse(s: str) -> datetime:
    return datetime.fromisoformat(s.replace('Z', '+00:00'))


# ── Schemas ───────────────────────────────────────────────────────────────────

class TaskIn(BaseModel):
    project_name: str
    task_name: str
    phase: Optional[str] = None
    assigned_to: Optional[str] = None
    equipment: Optional[str] = None
    planned_start: str          # ISO-8601
    planned_end: str            # ISO-8601
    duration_hours: Optional[float] = None
    pct_complete: int = 0
    depends_on: Optional[list[int]] = None
    weather_hold: bool = False
    notes: Optional[str] = None


class TaskPatch(BaseModel):
    pct_complete: Optional[int] = None
    actual_start: Optional[str] = None
    actual_end: Optional[str] = None
    weather_hold: Optional[bool] = None
    notes: Optional[str] = None


class TaskOut(BaseModel):
    id: int
    project_name: str
    task_name: str
    phase: Optional[str]
    assigned_to: Optional[str]
    equipment: Optional[str]
    planned_start: str
    planned_end: str
    actual_start: Optional[str]
    actual_end: Optional[str]
    duration_hours: Optional[float]
    pct_complete: int
    depends_on: list[int]
    is_critical: bool
    weather_hold: bool
    notes: Optional[str]


def _task_out(t: GanttTask) -> dict:
    deps = json.loads(t.depends_on) if t.depends_on else []
    return {
        'id': t.id,
        'project_name': t.project_name,
        'task_name': t.task_name,
        'phase': t.phase,
        'assigned_to': t.assigned_to,
        'equipment': t.equipment,
        'planned_start': t.planned_start.isoformat() if t.planned_start else '',
        'planned_end': t.planned_end.isoformat() if t.planned_end else '',
        'actual_start': t.actual_start.isoformat() if t.actual_start else None,
        'actual_end': t.actual_end.isoformat() if t.actual_end else None,
        'duration_hours': t.duration_hours,
        'pct_complete': t.pct_complete,
        'depends_on': deps,
        'is_critical': t.is_critical,
        'weather_hold': t.weather_hold,
        'notes': t.notes,
    }


# ── Critical-path computation ─────────────────────────────────────────────────

def _compute_critical_path(tasks: list[GanttTask]) -> set[int]:
    """Longest-path algorithm on planned durations.

    Returns set of task IDs on the critical path.
    """
    if not tasks:
        return set()
    by_id = {t.id: t for t in tasks}
    deps_map: dict[int, list[int]] = {}
    for t in tasks:
        deps = json.loads(t.depends_on) if t.depends_on else []
        deps_map[t.id] = [d for d in deps if d in by_id]

    # Forward pass — earliest finish
    ef: dict[int, float] = {}

    def earliest_finish(tid: int) -> float:
        if tid in ef:
            return ef[tid]
        t = by_id[tid]
        dur = t.duration_hours or ((t.planned_end - t.planned_start).total_seconds() / 3600)
        es = max((earliest_finish(d) for d in deps_map[tid]), default=0.0)
        ef[tid] = es + dur
        return ef[tid]

    for tid in by_id:
        earliest_finish(tid)

    project_end = max(ef.values())
    # Backward pass — latest start
    ls: dict[int, float] = {}

    def latest_start(tid: int) -> float:
        if tid in ls:
            return ls[tid]
        t = by_id[tid]
        dur = t.duration_hours or ((t.planned_end - t.planned_start).total_seconds() / 3600)
        successors = [s for s, deps in deps_map.items() if tid in deps]
        if not successors:
            lf = project_end
        else:
            lf = min(latest_start(s) for s in successors)
        ls[tid] = lf - dur
        return ls[tid]

    for tid in by_id:
        latest_start(tid)

    # Float = 0 → on critical path
    critical: set[int] = set()
    for tid in by_id:
        t = by_id[tid]
        dur = t.duration_hours or ((t.planned_end - t.planned_start).total_seconds() / 3600)
        es = ef[tid] - dur
        total_float = ls[tid] - es
        if abs(total_float) < 0.01:
            critical.add(tid)
    return critical


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get('/projects', dependencies=[Depends(verify_premium_security)])
def list_projects(db: Session = Depends(get_db)):
    from sqlalchemy import func
    rows = db.query(GanttTask.project_name, func.count(GanttTask.id), func.min(GanttTask.planned_start), func.max(GanttTask.planned_end)).group_by(GanttTask.project_name).all()
    return {'projects': [{'name': r[0], 'task_count': r[1], 'start': r[2].isoformat() if r[2] else None, 'end': r[3].isoformat() if r[3] else None} for r in rows]}


@router.get('/', dependencies=[Depends(verify_premium_security)])
def list_tasks(
    project_name: Optional[str] = Query(None),
    phase: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    qs = db.query(GanttTask)
    if project_name:
        qs = qs.filter(GanttTask.project_name == project_name)
    if phase:
        qs = qs.filter(GanttTask.phase == phase)
    tasks = qs.order_by(GanttTask.planned_start).all()
    return {'tasks': [_task_out(t) for t in tasks], 'total': len(tasks)}


@router.post('/', dependencies=[Depends(verify_premium_security)])
def create_task(body: TaskIn, db: Session = Depends(get_db)):
    task = GanttTask(
        project_name=body.project_name,
        task_name=body.task_name,
        phase=body.phase,
        assigned_to=body.assigned_to,
        equipment=body.equipment,
        planned_start=_utc_parse(body.planned_start),
        planned_end=_utc_parse(body.planned_end),
        duration_hours=body.duration_hours,
        pct_complete=body.pct_complete,
        depends_on=json.dumps(body.depends_on or []),
        weather_hold=body.weather_hold,
        notes=body.notes,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    # Recompute critical path for project
    _refresh_critical_path(body.project_name, db)
    db.commit()
    return _task_out(task)


@router.patch('/{task_id}', dependencies=[Depends(verify_premium_security)])
def update_task(task_id: int, body: TaskPatch, db: Session = Depends(get_db)):
    task = db.query(GanttTask).filter(GanttTask.id == task_id).first()
    if not task:
        raise HTTPException(404, 'Task not found')
    if body.pct_complete is not None:
        task.pct_complete = body.pct_complete
    if body.actual_start is not None:
        task.actual_start = _utc_parse(body.actual_start)
    if body.actual_end is not None:
        task.actual_end = _utc_parse(body.actual_end)
    if body.weather_hold is not None:
        task.weather_hold = body.weather_hold
    if body.notes is not None:
        task.notes = body.notes
    db.commit()
    return _task_out(task)


@router.delete('/{task_id}', dependencies=[Depends(verify_premium_security)])
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(GanttTask).filter(GanttTask.id == task_id).first()
    if not task:
        raise HTTPException(404, 'Task not found')
    project_name = task.project_name
    db.delete(task)
    db.commit()
    _refresh_critical_path(project_name, db)
    db.commit()
    return {'deleted': task_id}


@router.get('/critical-path', dependencies=[Depends(verify_premium_security)])
def critical_path(project_name: str = Query(...), db: Session = Depends(get_db)):
    tasks = db.query(GanttTask).filter(GanttTask.project_name == project_name).all()
    if not tasks:
        raise HTTPException(404, 'No tasks for project')
    critical_ids = _compute_critical_path(tasks)
    total_dur = sum(
        (t.duration_hours or (t.planned_end - t.planned_start).total_seconds() / 3600)
        for t in tasks if t.id in critical_ids
    )
    overdue = [t for t in tasks if t.pct_complete < 100 and t.planned_end < utcnow()]
    on_hold = [t for t in tasks if t.weather_hold]
    completion = round(sum(t.pct_complete for t in tasks) / len(tasks)) if tasks else 0
    return {
        'project_name': project_name,
        'total_tasks': len(tasks),
        'critical_path_task_ids': sorted(critical_ids),
        'critical_path_hours': round(total_dur, 1),
        'overall_completion_pct': completion,
        'overdue_tasks': [{'id': t.id, 'name': t.task_name, 'planned_end': t.planned_end.isoformat()} for t in overdue],
        'weather_holds': [{'id': t.id, 'name': t.task_name} for t in on_hold],
    }


def _refresh_critical_path(project_name: str, db: Session) -> None:
    tasks = db.query(GanttTask).filter(GanttTask.project_name == project_name).all()
    if not tasks:
        return
    critical_ids = _compute_critical_path(tasks)
    for t in tasks:
        t.is_critical = t.id in critical_ids


@router.get('/demo', dependencies=[Depends(verify_premium_security)])
def demo_gantt(db: Session = Depends(get_db)):
    """Seed and return a demo Chesterfield paving project Gantt."""
    project_name = 'Chesterfield County — Lot #7 Paving (Demo)'
    existing = db.query(GanttTask).filter(GanttTask.project_name == project_name).count()
    if existing == 0:
        from datetime import timedelta
        base = datetime.now(timezone.utc).replace(hour=7, minute=0, second=0, microsecond=0)
        phases = [
            ('Mobilization', 'mobilization', 0, 4, None),
            ('Subgrade Prep', 'excavation', 0, 8, None),
            ('Base Compaction', 'base', 8, 16, None),
            ('Asphalt Laydown — South Pass', 'paving', 16, 24, None),
            ('Asphalt Laydown — North Pass', 'paving', 24, 32, None),
            ('Final Rolling & Compaction', 'paving', 32, 36, None),
            ('Line Striping', 'striping', 40, 44, None),
            ('Cleanup & Demob', 'cleanup', 44, 48, None),
        ]
        ids: list[int] = []
        for i, (name, phase, start_h, end_h, _) in enumerate(phases):
            t = GanttTask(
                project_name=project_name,
                task_name=name,
                phase=phase,
                planned_start=base + timedelta(hours=start_h),
                planned_end=base + timedelta(hours=end_h),
                duration_hours=end_h - start_h,
                pct_complete=min(100, max(0, int((i / len(phases)) * 100))),
                depends_on=json.dumps([ids[-1]] if ids else []),
            )
            db.add(t)
            db.flush()
            ids.append(t.id)
        db.commit()
        _refresh_critical_path(project_name, db)
        db.commit()

    tasks = db.query(GanttTask).filter(GanttTask.project_name == project_name).order_by(GanttTask.planned_start).all()
    return {'project_name': project_name, 'tasks': [_task_out(t) for t in tasks]}


@router.post('/weather-sync', dependencies=[Depends(verify_premium_security)])
async def weather_sync(
    project_name: str = Query(...),
    lat: float = Query(37.5407),
    lng: float = Query(-77.4360),
    db: Session = Depends(get_db),
):
    """Auto-flag weather_hold on tasks whose planned_start falls on a forecast NO-GO day.

    Uses Open-Meteo (free, no key). Clears holds on GO days.
    """
    import httpx

    _MIN_TEMP_F = 50.0
    _RAIN_PCT = 30
    _WIND_MPH = 25

    def _c2f(c: float) -> float:
        return c * 9 / 5 + 32

    try:
        params = {
            'latitude': lat, 'longitude': lng,
            'daily': ['temperature_2m_max', 'precipitation_probability_max', 'wind_speed_10m_max'],
            'temperature_unit': 'celsius', 'wind_speed_unit': 'mph',
            'timezone': 'America/New_York', 'forecast_days': 7,
        }
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get('https://api.open-meteo.com/v1/forecast', params=params)
            r.raise_for_status()
            data = r.json()
    except Exception:
        return {'synced': 0, 'message': 'Weather fetch failed — holds unchanged.', 'mock': True}

    daily = data['daily']
    nogo_dates: set[str] = set()
    for i, date_str in enumerate(daily['time']):
        temp_f = _c2f(daily['temperature_2m_max'][i])
        precip = daily['precipitation_probability_max'][i]
        wind = daily['wind_speed_10m_max'][i]
        if temp_f < _MIN_TEMP_F or precip >= _RAIN_PCT or wind > _WIND_MPH:
            nogo_dates.add(date_str)

    tasks = db.query(GanttTask).filter(GanttTask.project_name == project_name).all()
    synced = 0
    for task in tasks:
        task_date = task.planned_start.strftime('%Y-%m-%d')
        hold = task_date in nogo_dates
        if task.weather_hold != hold:
            task.weather_hold = hold
            synced += 1
    db.commit()

    return {
        'project_name': project_name,
        'nogo_dates': sorted(nogo_dates),
        'tasks_updated': synced,
        'total_tasks': len(tasks),
        'message': f'{synced} tasks updated. {len(nogo_dates)} NO-GO days in forecast window.',
    }

