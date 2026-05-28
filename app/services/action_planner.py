"""Simple action planner that maps natural language intents to tool calls.

This is a rule-based planner for now. It returns a small plan structure
that Jarvis can execute or present to the operator for confirmation.
"""
from typing import Dict, Any, List
import re
import os

try:
    from app.services import llm_client as _llm
except Exception:
    _llm = None


def _llm_plan(query: str) -> Dict[str, Any]:
    """Ask the LLM to produce a small JSON plan. Returns plan dict or raises."""
    if not _llm:
        raise RuntimeError("LLM client not available")
    prompt = (
        "You are an automated planner. Given the user request, produce a JSON object with keys: intent ('execute'|'answer_only') and steps (list of {action, args}). "
        "Actions allowed: code_search, open_file, run_npm. Use only these. Respond with JSON only.")
    resp = _llm.chat(task="reasoning", system=prompt, user=query, max_tokens=400, temperature=0.0)
    if resp.error or not resp.text:
        raise RuntimeError(resp.error_detail or "empty response")
    # try to find JSON in resp.text
    import json
    txt = resp.text
    start = txt.find('{')
    if start >= 0:
        txt = txt[start:]
    try:
        plan = json.loads(txt)
        return plan
    except Exception as exc:
        raise RuntimeError(f"Failed to parse LLM plan: {exc}")


def plan(query: str, available_tools: Dict[str, bool]) -> Dict[str, Any]:
    q = (query or "").lower()
    use_llm = (os.environ.get("ENABLE_LLM_PLANNER") or "0") == "1"
    if use_llm:
        try:
            plan = _llm_plan(query)
            # basic sanitation: only allow known actions
            steps = []
            for s in plan.get("steps", []):
                if s.get("action") in ("code_search", "open_file", "run_npm"):
                    steps.append({"action": s.get("action"), "args": s.get("args") or {}})
            intent = plan.get("intent") if plan.get("intent") in ("execute", "answer_only") else ("execute" if steps else "answer_only")
            return {"intent": intent, "steps": steps}
        except Exception:
            # fall back to rule-based below
            pass

    steps: List[Dict[str, Any]] = []

    # repo search / open file
    if any(w in q for w in ["find", "search", "where is", "open file", "show file", "search repo"]):
        term = query
        steps.append({"action": "code_search", "args": {"query": term}})

    # run tests / lint / build
    if any(w in q for w in ["run tests", "run test", "pytest", "test suite"]):
        if available_tools.get("run_npm"):
            steps.append({"action": "run_npm", "args": {"script": "test"}})
    if any(w in q for w in ["lint", "fix imports", "eslint"]):
        if available_tools.get("run_npm"):
            steps.append({"action": "run_npm", "args": {"script": "lint"}})
    if any(w in q for w in ["build", "compile", "deploy preview"]):
        if available_tools.get("run_npm"):
            steps.append({"action": "run_npm", "args": {"script": "build"}})

    # open file explicit path
    m = re.search(r"open file ([\w\-\./]+)", q)
    if m:
        steps.append({"action": "open_file", "args": {"path": m.group(1)}})

    intent = "execute" if any(s for s in steps) else "answer_only"
    return {"intent": intent, "steps": steps}
