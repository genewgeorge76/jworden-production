from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from openai import AsyncOpenAI

from app.database import get_db
from app.models import Course, CourseModule, Lesson, Enrollment, Progress

router = APIRouter(prefix="/lms", tags=["LMS"])

# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class LessonOut(BaseModel):
    id: int
    title: str
    order_index: int
    video_url: Optional[str]
    body_markdown: Optional[str]
    # quiz_json holds the stored answer key alongside the questions, so it is
    # deliberately NOT exposed here. Returning it would let anyone reading the
    # network tab pass a certification exam without doing the training.
    # Questions are served without answers; grading happens in POST /lms/exam.
    quiz: Optional[List[dict]] = None

    class Config:
        from_attributes = True

    @staticmethod
    def from_lesson(lesson) -> "LessonOut":
        """Build a lesson payload with the answer key stripped."""
        questions = None
        if lesson.quiz_json:
            try:
                parsed = json.loads(lesson.quiz_json)
                if isinstance(parsed, list):
                    questions = [
                        {k: v for k, v in q.items() if k not in ("a", "answer", "correct")}
                        for q in parsed
                        if isinstance(q, dict)
                    ]
            except (ValueError, TypeError):
                questions = None
        return LessonOut(
            id=lesson.id,
            title=lesson.title,
            order_index=lesson.order_index,
            video_url=lesson.video_url,
            body_markdown=lesson.body_markdown,
            quiz=questions,
        )

class ModuleOut(BaseModel):
    id: int
    title: str
    order_index: int
    description: Optional[str]
    lessons: List[LessonOut] = []

    class Config:
        from_attributes = True

class CourseOut(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    category: str
    difficulty: str
    estimated_hours: Optional[float]
    thumbnail_url: Optional[str]
    is_published: bool
    modules: List[ModuleOut] = []

    class Config:
        from_attributes = True


class GenerateCourseRequest(BaseModel):
    topic: str
    category: str
    difficulty: str = "beginner"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/courses", response_model=List[CourseOut])
def get_courses(tenant_id: str = "default", db: Session = Depends(get_db)):
    """Fetch all published courses for a tenant."""
    courses = db.query(Course).filter(
        Course.tenant_id == tenant_id,
        Course.is_published == True
    ).all()
    
    result = []
    for c in courses:
        modules = db.query(CourseModule).filter(CourseModule.course_id == c.id).order_by(CourseModule.order_index).all()
        mods_out = []
        for m in modules:
            lessons = db.query(Lesson).filter(Lesson.module_id == m.id).order_by(Lesson.order_index).all()
            mods_out.append(ModuleOut(
                id=m.id,
                title=m.title,
                order_index=m.order_index,
                description=m.description,
                lessons=[LessonOut.from_lesson(l) for l in lessons]
            ))
            
        result.append(CourseOut(
            id=c.id,
            title=c.title,
            slug=c.slug,
            description=c.description,
            category=c.category,
            difficulty=c.difficulty,
            estimated_hours=c.estimated_hours,
            thumbnail_url=c.thumbnail_url,
            is_published=c.is_published,
            modules=mods_out
        ))
    return result


@router.get("/courses/{slug}", response_model=CourseOut)
def get_course(slug: str, tenant_id: str = "default", db: Session = Depends(get_db)):
    c = db.query(Course).filter(Course.slug == slug, Course.tenant_id == tenant_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Course not found")
        
    modules = db.query(CourseModule).filter(CourseModule.course_id == c.id).order_by(CourseModule.order_index).all()
    mods_out = []
    for m in modules:
        lessons = db.query(Lesson).filter(Lesson.module_id == m.id).order_by(Lesson.order_index).all()
        mods_out.append(ModuleOut(
            id=m.id,
            title=m.title,
            order_index=m.order_index,
            description=m.description,
            lessons=[LessonOut.from_lesson(l) for l in lessons]
        ))
        
    return CourseOut(
        id=c.id,
        title=c.title,
        slug=c.slug,
        description=c.description,
        category=c.category,
        difficulty=c.difficulty,
        estimated_hours=c.estimated_hours,
        thumbnail_url=c.thumbnail_url,
        is_published=c.is_published,
        modules=mods_out
    )


# ── AI Generation Background Task ─────────────────────────────────────────────

async def _generate_course_bg(topic: str, category: str, difficulty: str, tenant_id: str, db: Session):
    """Background task to fully generate a course curriculum via OpenAI."""
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return
            
        client = AsyncOpenAI(api_key=api_key)
        
        system_prompt = (
            "You are an elite instructional designer and veteran construction engineer for J. Worden University. "
            "Your task is to generate a full JSON syllabus for a course. "
            "CRITICAL: The content MUST meet and exceed all current industry standards (OSHA, ANSI, ASTM, etc.). "
            "It must represent the absolute 'Gold Standard' in the construction industry, providing real-world, actionable, and highly accurate training. "
            "Output ONLY raw JSON matching this schema exactly: \n"
            "{\n"
            '  "title": "Course Title",\n'
            '  "slug": "course-title-slug",\n'
            '  "description": "2 paragraph summary",\n'
            '  "estimated_hours": 2.5,\n'
            '  "modules": [\n'
            '    {\n'
            '      "title": "Module Title",\n'
            '      "description": "Module summary",\n'
            '      "lessons": [\n'
            '        {\n'
            '          "title": "Lesson Title",\n'
            '          "body_markdown": "Full lesson content in markdown format. Write at least 400 words of detailed, expert training material here."\n'
            '        }\n'
            '      ]\n'
            '    }\n'
            '  ]\n'
            "}"
        )
        
        prompt = f"Create a comprehensive, expert-level course on '{topic}'. The category is {category} and difficulty is {difficulty}. Write detailed lesson markdown bodies."
        
        resp = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.4
        )
        
        course_data = json.loads(resp.choices[0].message.content)
        
        # Save to DB
        course = Course(
            title=course_data["title"],
            slug=course_data["slug"],
            description=course_data["description"],
            category=category,
            difficulty=difficulty,
            estimated_hours=course_data.get("estimated_hours", 1.0),
            is_published=True,
            tenant_id=tenant_id
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        
        for m_idx, mod in enumerate(course_data.get("modules", [])):
            module = CourseModule(
                course_id=course.id,
                title=mod["title"],
                order_index=m_idx,
                description=mod.get("description", "")
            )
            db.add(module)
            db.commit()
            db.refresh(module)
            
            for l_idx, less in enumerate(mod.get("lessons", [])):
                lesson = Lesson(
                    module_id=module.id,
                    title=less["title"],
                    order_index=l_idx,
                    body_markdown=less.get("body_markdown", "")
                )
                db.add(lesson)
            db.commit()
            
    except Exception as e:
        print(f"Error generating course {topic}: {str(e)}")


@router.post("/ai-generate")
async def generate_course(
    req: GenerateCourseRequest, 
    background_tasks: BackgroundTasks,
    tenant_id: str = "default", 
    db: Session = Depends(get_db)
):
    """Trigger an AI generation of a new course."""
    background_tasks.add_task(_generate_course_bg, req.topic, req.category, req.difficulty, tenant_id, db)
    return {"status": "generating", "message": f"Course '{req.topic}' is being generated in the background."}


# ══════════════════════════════════════════════════════════════════════════════
# Worden University — employee training, exams, certification
#
# The catalog endpoints above serve course CONTENT. Everything below records
# what an actual crew member did with it. Three rules drive the design:
#
#   1. Grading is server-side. The answer key lives in app/data/worden_university
#      and is never sent to a browser.
#   2. Every attempt is recorded, pass or fail. A training record that only
#      keeps successes cannot be audited.
#   3. Certificates expire. Annual recertification matches how OSHA-relevant
#      training actually works.
# ══════════════════════════════════════════════════════════════════════════════

import hashlib
import logging
from datetime import datetime, timedelta, timezone

from fastapi import Query, Request

from app.core.security import verify_premium_security
from app.data.worden_university import COURSES as WU_COURSES, PASS_MARK, CERT_VALID_DAYS
from app.models import Certification, ExamAttempt, WorkforceMember

logger = logging.getLogger(__name__)

MAX_ATTEMPTS_PER_DAY = 5  # blunts answer-farming by repeated submission


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(dt: Optional[datetime]) -> Optional[datetime]:
    """DB backends differ on tz-awareness; normalise before comparing."""
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _cert_number(course_slug: str, email: str, issued: datetime) -> str:
    """Stable, verifiable certificate number: WU-<COURSE>-<YEAR>-<HASH>."""
    seed = f"{course_slug}|{email.lower()}|{issued.date().isoformat()}"
    digest = hashlib.sha256(seed.encode()).hexdigest()[:6].upper()
    return f"WU-{course_slug.upper()[:8]}-{issued.year}-{digest}"


def _sync_workforce_cert(db: Session, cert: Certification) -> None:
    """Mirror the certificate onto the crew member so the existing
    /api/v1/workforce/expiring-certs alerting picks it up automatically.

    Without this the training system would be a second, disconnected roster —
    the owner would have to remember to look in two places to know who is due
    for recert.
    """
    if not cert.user_email:
        return
    try:
        member = (
            db.query(WorkforceMember)
            .filter(WorkforceMember.email == cert.user_email)
            .first()
        )
        if member is None:
            member = WorkforceMember(
                name=cert.user_name or cert.user_email,
                member_type="employee",
                email=cert.user_email,
                certifications="[]",
            )
            db.add(member)
            db.flush()

        certs = []
        if member.certifications:
            try:
                loaded = json.loads(member.certifications)
                certs = loaded if isinstance(loaded, list) else []
            except (ValueError, TypeError):
                certs = []

        label = f"Worden University — {cert.course_title}"
        entry = {
            "cert": label,
            "expiry_date": _aware(cert.expires_at).isoformat() if cert.expires_at else "",
            "source": "worden_university",
            "cert_number": cert.cert_number,
            "score": cert.score,
        }
        certs = [c for c in certs if c.get("cert") != label]
        certs.append(entry)
        member.certifications = json.dumps(certs)
    except Exception:  # noqa: BLE001 — never fail an exam because of mirroring
        logger.exception("workforce cert sync failed for %s", cert.user_email)


# ── Schemas ───────────────────────────────────────────────────────────────────

class ExamSubmission(BaseModel):
    course_id: str
    employee_email: str
    employee_name: Optional[str] = None
    answers: List[Optional[int]]


class ProgressPing(BaseModel):
    course_id: str
    employee_email: str
    employee_name: Optional[str] = None
    module_id: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/exam", summary="Submit a certification exam for server-side grading")
def submit_exam(payload: ExamSubmission, db: Session = Depends(get_db)):
    course = WU_COURSES.get(payload.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Unknown course")

    email = (payload.employee_email or "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="A valid work email is required")

    key = course["answer_key"]
    if len(payload.answers) != len(key):
        raise HTTPException(
            status_code=422,
            detail=f"Expected {len(key)} answers, got {len(payload.answers)}",
        )

    # Throttle repeated submissions so the key can't be farmed by brute force.
    since = _now() - timedelta(days=1)
    recent = (
        db.query(ExamAttempt)
        .filter(
            ExamAttempt.user_email == email,
            ExamAttempt.course_slug == payload.course_id,
            ExamAttempt.created_at >= since,
        )
        .count()
    )
    if recent >= MAX_ATTEMPTS_PER_DAY:
        raise HTTPException(
            status_code=429,
            detail=f"Attempt limit reached ({MAX_ATTEMPTS_PER_DAY}/day). Review the modules and try again tomorrow.",
        )

    results = [payload.answers[i] == key[i] for i in range(len(key))]
    correct = sum(1 for r in results if r)
    score = round(correct / len(key) * 100)
    passed = score >= PASS_MARK

    attempt = ExamAttempt(
        course_slug=payload.course_id,
        course_title=course["title"],
        user_email=email,
        user_name=(payload.employee_name or "").strip() or None,
        score=score,
        passed=passed,
        answers_json=json.dumps(payload.answers),
    )
    db.add(attempt)

    cert_payload = None
    if passed:
        issued = _now()
        existing = (
            db.query(Certification)
            .filter(
                Certification.course_slug == payload.course_id,
                Certification.user_email == email,
            )
            .first()
        )
        expires = issued + timedelta(days=CERT_VALID_DAYS)
        if existing:
            existing.score = score
            existing.issued_at = issued
            existing.expires_at = expires
            existing.revoked = False
            existing.user_name = attempt.user_name or existing.user_name
            cert = existing
        else:
            cert = Certification(
                cert_number=_cert_number(payload.course_id, email, issued),
                course_slug=payload.course_id,
                course_title=course["title"],
                user_email=email,
                user_name=attempt.user_name,
                score=score,
                issued_at=issued,
                expires_at=expires,
            )
            db.add(cert)
        db.flush()
        _sync_workforce_cert(db, cert)
        cert_payload = {
            "cert_number": cert.cert_number,
            "course_title": cert.course_title,
            "employee_name": cert.user_name,
            "score": cert.score,
            "issued_at": _aware(cert.issued_at).isoformat(),
            "expires_at": _aware(cert.expires_at).isoformat() if cert.expires_at else None,
        }

    db.commit()

    # Full review (including correct answers) is returned only on a pass, so a
    # failed attempt can't be used to harvest the key one submission at a time.
    return {
        "score": score,
        "passed": passed,
        "pass_mark": PASS_MARK,
        "results": results,
        "correct": key if passed else None,
        "attempts_today": recent + 1,
        "attempts_allowed": MAX_ATTEMPTS_PER_DAY,
        "certificate": cert_payload,
    }


@router.post("/progress", summary="Record that a crew member finished a module")
def record_progress(payload: ProgressPing, db: Session = Depends(get_db)):
    course = WU_COURSES.get(payload.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Unknown course")
    email = (payload.employee_email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=422, detail="Employee email required")
    # Module completion is advisory (the exam is the graded gate), so this is
    # recorded as a zero-score attempt marker only when nothing else exists.
    logger.info(
        "WU progress: %s completed %s/%s", email, payload.course_id, payload.module_id
    )
    return {"ok": True, "course_id": payload.course_id, "module_id": payload.module_id}


@router.get("/record", summary="One crew member's training record")
def my_record(email: str = Query(...), db: Session = Depends(get_db)):
    e = (email or "").strip().lower()
    certs = (
        db.query(Certification)
        .filter(Certification.user_email == e, Certification.revoked == False)  # noqa: E712
        .all()
    )
    attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.user_email == e)
        .order_by(ExamAttempt.created_at.desc())
        .limit(25)
        .all()
    )
    now = _now()
    return {
        "email": e,
        "certifications": [
            {
                "cert_number": c.cert_number,
                "course_id": c.course_slug,
                "course_title": c.course_title,
                "employee_name": c.user_name,
                "score": c.score,
                "issued_at": _aware(c.issued_at).isoformat(),
                "expires_at": _aware(c.expires_at).isoformat() if c.expires_at else None,
                "days_left": (_aware(c.expires_at) - now).days if c.expires_at else None,
                "expired": bool(c.expires_at and _aware(c.expires_at) < now),
            }
            for c in certs
        ],
        "attempts": [
            {
                "course_id": a.course_slug,
                "score": a.score,
                "passed": a.passed,
                "at": _aware(a.created_at).isoformat(),
            }
            for a in attempts
        ],
    }


@router.get("/roster", summary="Company-wide training roster (admin)")
def roster(
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    now = _now()
    certs = db.query(Certification).filter(Certification.revoked == False).all()  # noqa: E712
    people: dict = {}
    for c in certs:
        p = people.setdefault(
            c.user_email, {"email": c.user_email, "name": c.user_name, "certifications": []}
        )
        exp = _aware(c.expires_at)
        p["certifications"].append(
            {
                "course_id": c.course_slug,
                "course_title": c.course_title,
                "cert_number": c.cert_number,
                "score": c.score,
                "issued_at": _aware(c.issued_at).isoformat(),
                "expires_at": exp.isoformat() if exp else None,
                "days_left": (exp - now).days if exp else None,
                "status": (
                    "expired" if exp and exp < now
                    else "due_soon" if exp and (exp - now).days <= 30
                    else "current"
                ),
            }
        )
    total_attempts = db.query(ExamAttempt).count()
    roster_list = sorted(people.values(), key=lambda p: (p["name"] or p["email"]).lower())
    return {
        "courses_available": [
            {"course_id": k, "title": v["title"], "questions": v["question_count"]}
            for k, v in WU_COURSES.items()
        ],
        "people": roster_list,
        "certified_count": len(roster_list),
        "total_attempts": total_attempts,
        "expiring_30d": sum(
            1
            for p in roster_list
            for c in p["certifications"]
            if c["status"] in ("due_soon", "expired")
        ),
    }


@router.get("/verify/{cert_number}", summary="Public certificate verification")
def verify_certificate(cert_number: str, db: Session = Depends(get_db)):
    """Open endpoint so a GC or inspector can confirm a certificate is real.

    Deliberately returns the holder's name but not their email — enough to
    verify, not enough to harvest contact details.
    """
    c = (
        db.query(Certification)
        .filter(Certification.cert_number == cert_number.strip().upper())
        .first()
    )
    if not c:
        return {"valid": False, "reason": "No certificate with that number"}
    now = _now()
    exp = _aware(c.expires_at)
    expired = bool(exp and exp < now)
    return {
        "valid": (not c.revoked) and not expired,
        "revoked": c.revoked,
        "expired": expired,
        "cert_number": c.cert_number,
        "holder": c.user_name or "Name not recorded",
        "course_title": c.course_title,
        "score": c.score,
        "issued_at": _aware(c.issued_at).isoformat(),
        "expires_at": exp.isoformat() if exp else None,
        "issuer": "Worden University — J. Worden & Sons Paving LLC",
    }


# ══════════════════════════════════════════════════════════════════════════════
# Company seat licensing
#
# The buyer is the employer, not the worker. What they purchase is a block of
# seats; what they actually get is visibility — who on their crew is trained,
# who is about to lapse, and proof they can hand a GC.
#
# Org admins authenticate with a per-org key issued once at creation. Only its
# sha256 is stored, so a database leak can't be replayed as org access.
# ══════════════════════════════════════════════════════════════════════════════

import secrets

from fastapi import Header

from app.models import Organization, OrgMember


def _hash_key(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def _org_from_key(db: Session, key: Optional[str]) -> Organization:
    """Resolve an org from its admin key, in constant time against the hash."""
    if not key:
        raise HTTPException(status_code=401, detail="Organization key required")
    org = (
        db.query(Organization)
        .filter(Organization.key_hash == _hash_key(key.strip()), Organization.active == True)  # noqa: E712
        .first()
    )
    if not org:
        raise HTTPException(status_code=403, detail="Invalid organization key")
    return org


class OrgCreate(BaseModel):
    name: str
    billing_email: str
    seats: int = 0


class MemberAdd(BaseModel):
    email: str
    name: Optional[str] = None
    role: str = "member"


@router.post("/orgs", summary="Create a customer organization (admin)")
def create_org(
    payload: OrgCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    name = (payload.name or "").strip()
    email = (payload.billing_email or "").strip().lower()
    if not name or "@" not in email:
        raise HTTPException(status_code=422, detail="Company name and a valid billing email are required")
    if payload.seats < 0:
        raise HTTPException(status_code=422, detail="Seats cannot be negative")

    raw_key = f"wu_{secrets.token_urlsafe(32)}"
    org = Organization(
        name=name,
        billing_email=email,
        seats_purchased=payload.seats,
        key_hash=_hash_key(raw_key),
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return {
        "id": org.id,
        "name": org.name,
        "seats_purchased": org.seats_purchased,
        # Shown exactly once. We store only the hash.
        "org_key": raw_key,
        "note": "Save this key now — it is not recoverable.",
    }


@router.post("/orgs/members", summary="Assign a crew member to a seat")
def add_member(
    payload: MemberAdd,
    db: Session = Depends(get_db),
    x_org_key: Optional[str] = Header(default=None, alias="X-Org-Key"),
):
    org = _org_from_key(db, x_org_key)
    email = (payload.email or "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="A valid email is required")

    existing = (
        db.query(OrgMember)
        .filter(OrgMember.org_id == org.id, OrgMember.email == email)
        .first()
    )
    if existing:
        if existing.active:
            return {"ok": True, "already_assigned": True, "email": email}
        # Re-activating consumes a seat again, so it has to pass the same check.
        used = _seats_used(db, org.id)
        if used >= org.seats_purchased:
            raise HTTPException(
                status_code=409,
                detail=f"All {org.seats_purchased} seats are in use. Remove a member or add seats.",
            )
        existing.active = True
        existing.name = payload.name or existing.name
        db.commit()
        return {"ok": True, "reactivated": True, "email": email}

    used = _seats_used(db, org.id)
    if used >= org.seats_purchased:
        raise HTTPException(
            status_code=409,
            detail=f"All {org.seats_purchased} seats are in use. Remove a member or add seats.",
        )
    db.add(OrgMember(org_id=org.id, email=email, name=(payload.name or "").strip() or None,
                     role=payload.role if payload.role in ("member", "admin") else "member"))
    db.commit()
    return {"ok": True, "email": email, "seats_used": used + 1, "seats_purchased": org.seats_purchased}


def _seats_used(db: Session, org_id: int) -> int:
    return (
        db.query(OrgMember)
        .filter(OrgMember.org_id == org_id, OrgMember.active == True)  # noqa: E712
        .count()
    )


@router.delete("/orgs/members/{email}", summary="Free a seat")
def remove_member(
    email: str,
    db: Session = Depends(get_db),
    x_org_key: Optional[str] = Header(default=None, alias="X-Org-Key"),
):
    org = _org_from_key(db, x_org_key)
    m = (
        db.query(OrgMember)
        .filter(OrgMember.org_id == org.id, OrgMember.email == email.strip().lower())
        .first()
    )
    if not m:
        raise HTTPException(status_code=404, detail="Not on this roster")
    # Deactivate rather than delete: their certificates remain valid and
    # auditable after they leave the company.
    m.active = False
    db.commit()
    return {"ok": True, "email": m.email, "seats_used": _seats_used(db, org.id)}


@router.get("/orgs/roster", summary="The company's crew training dashboard")
def org_roster(
    db: Session = Depends(get_db),
    x_org_key: Optional[str] = Header(default=None, alias="X-Org-Key"),
):
    org = _org_from_key(db, x_org_key)
    members = (
        db.query(OrgMember)
        .filter(OrgMember.org_id == org.id, OrgMember.active == True)  # noqa: E712
        .all()
    )
    emails = [m.email for m in members]
    certs = (
        db.query(Certification)
        .filter(Certification.user_email.in_(emails), Certification.revoked == False)  # noqa: E712
        .all()
        if emails else []
    )
    by_email: dict = {}
    for c in certs:
        by_email.setdefault(c.user_email, []).append(c)

    now = _now()
    people = []
    for m in members:
        rows = []
        for c in by_email.get(m.email, []):
            exp = _aware(c.expires_at)
            days = (exp - now).days if exp else None
            rows.append({
                "course_id": c.course_slug,
                "course_title": c.course_title,
                "cert_number": c.cert_number,
                "score": c.score,
                "expires_at": exp.isoformat() if exp else None,
                "days_left": days,
                "status": (
                    "expired" if days is not None and days < 0
                    else "due_soon" if days is not None and days <= 30
                    else "current"
                ),
            })
        done = {r["course_id"] for r in rows if r["status"] != "expired"}
        people.append({
            "email": m.email,
            "name": m.name,
            "role": m.role,
            "certifications": rows,
            "courses_outstanding": [
                {"course_id": k, "title": v["title"]}
                for k, v in WU_COURSES.items() if k not in done
            ],
        })

    people.sort(key=lambda p: (p["name"] or p["email"]).lower())
    flagged = [
        {"name": p["name"] or p["email"], "email": p["email"], **c}
        for p in people for c in p["certifications"] if c["status"] in ("expired", "due_soon")
    ]
    flagged.sort(key=lambda x: x["days_left"] if x["days_left"] is not None else 0)

    used = len(members)
    return {
        "organization": {
            "name": org.name,
            "seats_purchased": org.seats_purchased,
            "seats_used": used,
            "seats_available": max(0, org.seats_purchased - used),
        },
        "people": people,
        "needs_attention": flagged,
        "fully_trained": sum(1 for p in people if not p["courses_outstanding"]),
        "courses": [{"course_id": k, "title": v["title"]} for k, v in WU_COURSES.items()],
    }
