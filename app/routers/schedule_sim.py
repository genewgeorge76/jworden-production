"""
schedule_sim.py — Agentic "What-If" schedule simulator for JWordenAI.

Routes:
  POST /api/v1/schedule/simulate      — run a what-if delay scenario
  GET  /api/v1/schedule/sim-status    — confirm the AI provider is active

The simulator uses GPT-4o when OPENAI_API_KEY is set, falling back to a
deterministic rule-based engine for dev/offline environments.

Use cases:
  - "What happens if we get a 4-day rain delay on Week 2?"
  - "Simulate a material delivery shortage delaying the base course by 5 days"
  - "What if the roller is unavailable for 3 days mid-project?"

Requires premium security.
"""

import logging
import os
from typing import Any, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..core.security import verify_premium_security
from ..services.simulation_agent import simulate_delay

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/schedule", tags=["schedule-sim"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class TaskInput(BaseModel):
    id:            str
    name:          str
    duration_days: int  = Field(..., ge=1, le=365)
    predecessors:  List[str] = Field(default_factory=list)
    crew_required: Optional[int] = Field(None, ge=0)
    notes:         Optional[str] = None


class SimulateRequest(BaseModel):
    scenario:        str       = Field(..., min_length=5, max_length=500)
    tasks:           List[TaskInput] = Field(..., min_length=1, max_length=100)
    project_start:   Optional[str]  = None   # ISO date "2026-05-15"
    tenant_id:       Optional[str]  = Field(None, max_length=60)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/sim-status", dependencies=[Depends(verify_premium_security)])
def sim_status():
    """Confirm which simulation engine is active."""
    return {
        "status":   "ok",
        "engine":   "gpt-4o" if os.getenv("OPENAI_API_KEY") else "rule-based",
        "ai_active": bool(os.getenv("OPENAI_API_KEY")),
    }


@router.post("/simulate", dependencies=[Depends(verify_premium_security)])
def run_simulation(req: SimulateRequest):
    """
    Run an agentic what-if schedule simulation.

    Supply your project tasks and a plain-English disruption scenario.
    The AI (or rule-based fallback) will:
      1. Identify impacted tasks via dependency chain
      2. Propose optimal re-sequencing
      3. Calculate net delay and new completion estimate
      4. Return concrete mitigation actions with time savings

    Example payload:
      {
        "scenario": "3-day rain delay starting Day 5 affecting all outdoor work",
        "project_start": "2026-06-01",
        "tasks": [
          {"id": "T1", "name": "Subgrade prep",      "duration_days": 3, "predecessors": []},
          {"id": "T2", "name": "Base course install", "duration_days": 4, "predecessors": ["T1"]},
          {"id": "T3", "name": "HMA paving",          "duration_days": 2, "predecessors": ["T2"]},
          {"id": "T4", "name": "Striping + signage",  "duration_days": 1, "predecessors": ["T3"]}
        ]
      }
    """
    task_dicts = [t.model_dump() for t in req.tasks]
    result = simulate_delay(task_dicts, req.scenario, req.project_start)
    return result
