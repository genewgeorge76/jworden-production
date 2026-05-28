"""Simple repo-aware code reader used by Jarvis.

Provides `search(query, max_results)` and `open_file(path)` helpers.
This is intentionally read-only and safe — it never executes code.
"""
from pathlib import Path
from typing import List, Dict
import re


def _repo_root() -> Path:
    # app/services/code_reader.py -> repo root is parents[3]
    return Path(__file__).resolve().parents[3]


def search(query: str, max_results: int = 12) -> List[Dict[str, str]]:
    q = (query or "").strip()
    if not q:
        return []
    root = _repo_root()
    exts = {'.py', '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.html', '.css'}
    results = []
    pattern = re.compile(re.escape(q), re.IGNORECASE)
    for p in root.rglob('*'):
        if len(results) >= max_results:
            break
        if p.is_file() and p.suffix in exts:
            try:
                text = p.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                continue
            for i, line in enumerate(text.splitlines(), start=1):
                if pattern.search(line):
                    results.append({
                        'path': str(p.relative_to(root)).replace('\\', '/'),
                        'line': i,
                        'snippet': line.strip(),
                    })
                    if len(results) >= max_results:
                        break
    return results


def open_file(relpath: str) -> Dict[str, str]:
    root = _repo_root()
    target = (root / relpath).resolve()
    try:
        # safety: ensure target is inside repo
        target.relative_to(root)
    except Exception:
        return {'error': 'path outside repository root'}
    if not target.exists() or not target.is_file():
        return {'error': 'file not found'}
    try:
        content = target.read_text(encoding='utf-8', errors='ignore')
        return {'path': str(target.relative_to(root)).replace('\\', '/'), 'content': content}
    except Exception as exc:
        return {'error': str(exc)}
