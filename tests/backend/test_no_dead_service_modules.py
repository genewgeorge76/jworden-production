"""
A module nothing imports is a claim the codebase cannot back.

Four modules under app/services were unreachable — no importer anywhere in
app/, scripts/ or tests/, no test coverage, and no configured credential:

    rag.py               a RAG facade delegating to pinecone_client
    pinecone_client.py   reached only from rag.py
    long_memory.py       JSON "vector memory" written to local disk
    langsmith_tracer.py  LangSmith tracing wrapper

None of them fabricated anything — rag.query() honestly returned [] and
index_repo() reported indexed: 0. The cost was different: anyone reading the
tree concluded this system had retrieval-augmented generation, long-term vector
memory and full AI observability. It had none of the three wired.

Two were worse than inert. long_memory wrote to ./data/long_memory and called
os.makedirs at import time, so on an ephemeral host anything it stored would
die with the machine — the same trap the database backups fell into. And
rag/pinecone_client were a dead parallel implementation of vector search that
already exists and works: vector_search_service.py talks to the Pinecone SDK
directly and is wired into vector_tasks.py and admin_vector.py. Two Pinecone
integrations, reading different variable names for the same account, one of
them unreachable.

Deleted 2026-08-23, recoverable from git history if any of them is ever wanted.
This test stops the pattern returning rather than policing which modules exist.
"""
from __future__ import annotations

import ast
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

SERVICES = REPO_ROOT / "app" / "services"

#: Deleted. Named so a re-add is a deliberate act with a reason attached.
RETIRED = ("rag", "pinecone_client", "long_memory", "langsmith_tracer")

#: Modules that legitimately have no in-tree importer.
#: Entry points are imported by name at runtime, not by another module.
NO_IMPORTER_EXPECTED = {
    "__init__",
}


def _module_names() -> set[str]:
    return {p.stem for p in SERVICES.glob("*.py") if not p.stem.startswith("__")}


def _all_source_files():
    for root in ("app", "scripts", "tests"):
        yield from (REPO_ROOT / root).rglob("*.py")


def test_the_retired_modules_are_gone():
    present = _module_names()
    still_here = [m for m in RETIRED if m in present]
    assert not still_here, (
        f"{', '.join(still_here)} came back. If one is genuinely wanted, wire "
        f"it to a caller and give it a test — an unreachable module reads as a "
        f"capability the system does not have."
    )


def test_nothing_still_imports_them():
    """A dangling import would break at runtime, not at startup."""
    offenders = []
    for path in _all_source_files():
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:  # pragma: no cover
            continue
        for name in RETIRED:
            if f"services.{name}" in text or f"from .{name} import" in text:
                # The docstring above names them deliberately; only code counts.
                for lineno, line in enumerate(text.splitlines(), 1):
                    stripped = line.strip()
                    if stripped.startswith("#") or stripped.startswith('"'):
                        continue
                    if f"services.{name}" in stripped or f"from .{name} import" in stripped:
                        offenders.append(f"{path.relative_to(REPO_ROOT)}:{lineno}")
    assert not offenders, (
        "these reference a deleted module: " + ", ".join(sorted(set(offenders)))
    )


def test_the_surviving_vector_search_is_the_wired_one():
    """
    The reason deleting rag/pinecone_client was safe rather than lossy: the
    real implementation exists and has callers.
    """
    service = SERVICES / "vector_search_service.py"
    assert service.exists()

    importers = []
    for path in (REPO_ROOT / "app").rglob("*.py"):
        if path == service:
            continue
        if "vector_search_service" in path.read_text(encoding="utf-8", errors="ignore"):
            importers.append(path.name)
    assert importers, (
        "vector_search_service has no importers either — deleting its dead twin "
        "was the wrong call if this one is also unreachable"
    )


def test_deleted_modules_env_vars_are_not_still_advertised():
    """
    A variable in .env.example that nothing reads sends an operator to
    configure a feature that cannot run. LANGSMITH_* and the pinecone_client
    spellings went with their modules.
    """
    env_example = (REPO_ROOT / ".env.example").read_text(encoding="utf-8")
    for line in env_example.splitlines():
        stripped = line.strip()
        if stripped.startswith("#") or "=" not in stripped:
            continue
        name = stripped.split("=", 1)[0].strip()
        assert not name.startswith("LANGSMITH_"), (
            f"{name} is still advertised but its only reader was deleted"
        )
        assert name not in ("PINECONE_ENV", "PINECONE_INDEX"), (
            f"{name} belonged to the deleted pinecone_client; "
            "vector_search_service reads PINECONE_INDEX_NAME"
        )
