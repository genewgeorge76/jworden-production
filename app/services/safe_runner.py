"""Safe runner for approved npm scripts.

Runs whitelisted npm scripts from package.json and returns stdout/stderr.
"""
import json
import subprocess
import os
from pathlib import Path
from typing import Dict, Any
from datetime import datetime


_EXEC_ENABLED = (os.environ.get("ENABLE_EXECUTION") or "0") == "1"
_USE_DOCKER = (os.environ.get("USE_DOCKER_RUNNER") or "0") == "1"


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _allowed_scripts() -> Dict[str, str]:
    pkg = _repo_root() / 'package.json'
    if not pkg.exists():
        return {}
    data = json.loads(pkg.read_text(encoding='utf-8'))
    return data.get('scripts', {})


def run_npm_script(script: str, timeout: int = 120) -> Dict[str, Any]:
    scripts = _allowed_scripts()
    if script not in scripts:
        return {"ok": False, "error": "script not found or not allowed"}

    if not _EXEC_ENABLED:
        return {"ok": False, "error": "Execution disabled. Set ENABLE_EXECUTION=1 to enable."}

    repo = str(_repo_root())
    log_dir = _repo_root() / "logs"
    try:
        log_dir.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass
    audit_path = log_dir / "executions.log"

    def _audit(entry: Dict[str, Any]):
        try:
            with open(audit_path, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(entry, default=str) + "\n")
        except Exception:
            pass

    try:
        if _USE_DOCKER:
            # run inside a standard node image mounting the repo
            cmd = [
                "docker", "run", "--rm",
                "-v", f"{repo}:/workspace",
                "-w", "/workspace",
                "node:18",
                "bash", "-lc",
                f"npm run {script}"
            ]
        else:
            cmd = ["npm", "run", script]

        proc = subprocess.run(cmd, cwd=repo if not _USE_DOCKER else None, capture_output=True, text=True, timeout=timeout)
        out = proc.stdout or ""
        err = proc.stderr or ""
        max_chars = 12000
        if len(out) > max_chars:
            out = out[:max_chars] + "\n...[truncated]"
        if len(err) > max_chars:
            err = err[:max_chars] + "\n...[truncated]"

        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "script": script,
            "cmd": cmd,
            "returncode": proc.returncode,
            "ok": proc.returncode == 0,
            "stdout_len": len(out),
            "stderr_len": len(err),
        }
        _audit(entry)

        return {"ok": proc.returncode == 0, "returncode": proc.returncode, "stdout": out, "stderr": err}
    except Exception as exc:
        entry = {"timestamp": datetime.utcnow().isoformat() + "Z", "script": script, "error": str(exc)}
        _audit(entry)
        return {"ok": False, "error": str(exc)}
