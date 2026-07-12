from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Lead, Job

router = APIRouter(prefix='/analytics', tags=['analytics'])


@router.get('/summary')
def summary(db: Session = Depends(get_db)):
    lead_count = db.query(func.count(Lead.id)).scalar()
    job_count = db.query(func.count(Job.id)).scalar()
    pipeline = db.query(func.sum(Job.bid)).scalar() or 0.0
    paid = db.query(func.sum(Job.bid)).filter(Job.status == 'Paid').scalar() or 0.0
    ar = db.query(func.sum(Job.bid)).filter(Job.status == 'Invoiced').scalar() or 0.0

    leads_by_tier = {
        row[0]: row[1]
        for row in db.query(Lead.tier, func.count(Lead.id)).group_by(Lead.tier).all()
    }
    jobs_by_status = {
        row[0]: row[1]
        for row in db.query(Job.status, func.count(Job.id)).group_by(Job.status).all()
    }

    return {
        'leads': lead_count,
        'jobs': job_count,
        'pipeline': pipeline,
        'revenue_paid': paid,
        'accounts_receivable': ar,
        'leads_by_tier': leads_by_tier,
        'jobs_by_status': jobs_by_status,
    }
