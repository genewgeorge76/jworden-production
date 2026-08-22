"""
A request body must not be classified as a query parameter.

POST /api/v1/ferrari/{ferrari}/artifacts, /ferrari/vision-takeoff/analyze and
/ferrari/street-recon/text returned this to every caller, whatever was sent:

    422 {"loc": ["query", "body"], "msg": "Field required"}

Three ingredients, all individually reasonable:

  1. ferrari_router.py used `from __future__ import annotations`, so every
     annotation is a string FastAPI has to resolve later.
  2. slowapi's @limiter.limit wraps the endpoint function.
  3. On the pinned FastAPI (0.115.12) that resolution happens against the
     WRAPPER's module globals — slowapi's — where ArtifactIn does not exist.

The annotation stays a ForwardRef, FastAPI concludes it cannot be a body model,
and falls back to Query. The endpoint then demands a query parameter literally
named "body" and rejects the JSON payload.

WHY IT WAS NEVER SEEN. requirements.backend.txt pins fastapi==0.115.12 and
pydantic==2.11.4, which is what CI and the Docker image install. A dev sandbox
had fastapi 0.141 / pydantic 2.13, which resolve it correctly. The suite passed
locally and the endpoints were broken in production. It surfaced the first time
CI ever ran the tests — until then the CI job ran none.

permits.py already carried "Do NOT add `from __future__ import annotations` to
this module." Somebody hit this before and fixed the one file. This test is
that knowledge written down where it applies to all of them.

Two checks: a static rule that holds on any version, and a runtime check of the
built app that would catch the same symptom arriving by some other route.
"""
from __future__ import annotations

import ast
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

APP = REPO_ROOT / "app"


def _module_uses_future_annotations(tree: ast.Module) -> bool:
    return any(
        isinstance(node, ast.ImportFrom)
        and node.module == "__future__"
        and any(alias.name == "annotations" for alias in node.names)
        for node in tree.body
    )


def _pydantic_models(tree: ast.Module) -> set[str]:
    return {
        node.name
        for node in ast.walk(tree)
        if isinstance(node, ast.ClassDef)
        and any(
            getattr(base, "id", getattr(base, "attr", "")) == "BaseModel"
            for base in node.bases
        )
    }


def test_no_rate_limited_endpoint_takes_a_body_model_under_future_annotations():
    """
    The static rule. Deliberately AST-based: permits.py documents this hazard
    in a comment, and a text search reports that comment as a violation —
    which is exactly the false positive that sent the first version of this
    scan after the wrong file.
    """
    offenders = []
    for path in sorted(APP.rglob("*.py")):
        try:
            tree = ast.parse(path.read_text(encoding="utf-8", errors="ignore"))
        except SyntaxError:  # pragma: no cover
            continue
        if not _module_uses_future_annotations(tree):
            continue
        models = _pydantic_models(tree)
        if not models:
            continue
        for node in ast.walk(tree):
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            decorators = [ast.unparse(d) for d in node.decorator_list]
            if not any("limiter.limit" in d for d in decorators):
                continue
            for arg in node.args.args + node.args.kwonlyargs:
                if arg.annotation is None:
                    continue
                annotated = (
                    ast.unparse(arg.annotation)
                    .replace("Optional[", "")
                    .replace("]", "")
                    .strip()
                )
                if annotated in models:
                    offenders.append(
                        f"{path.relative_to(REPO_ROOT)}:{node.lineno} "
                        f"{node.name}({arg.arg}: {annotated})"
                    )

    assert not offenders, (
        "these rate-limited endpoints take a Pydantic body model in a module "
        "using `from __future__ import annotations`. On the pinned FastAPI "
        "the body is classified as a QUERY parameter and every request gets a "
        "422. Remove the future import from the module:\n  "
        + "\n  ".join(offenders)
    )


async def test_no_route_expects_a_pydantic_model_as_a_query_parameter(client):
    """
    The runtime check, against the app as actually built.

    Independent of the cause above: whatever makes FastAPI misclassify a body
    model, the symptom is a query parameter whose type is a BaseModel. That is
    never intentional.
    """
    from fastapi.routing import APIRoute
    from pydantic import BaseModel

    from app.main import app

    offenders = []
    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue
        for param in route.dependant.query_params:
            annotation = getattr(param.field_info, "annotation", None)
            if isinstance(annotation, type) and issubclass(annotation, BaseModel):
                offenders.append(
                    f"{sorted(route.methods)} {route.path} — query param "
                    f"{param.name!r} is typed {annotation.__name__}"
                )

    assert not offenders, (
        "a Pydantic model is being read from the query string, which means "
        "the request body will be rejected with 422:\n  " + "\n  ".join(offenders)
    )


def test_the_three_ferrari_endpoints_keep_their_body_models():
    """
    Guards the fix itself. Removing the future import is what makes these
    work; a well-meaning edit re-adding it would silently break all three
    again on the pinned version while still passing on a newer local one.
    """
    source = (APP / "routers" / "ferrari_router.py").read_text(encoding="utf-8")
    tree = ast.parse(source)

    assert not _module_uses_future_annotations(tree), (
        "ferrari_router.py must not use `from __future__ import annotations` — "
        "its rate-limited POST endpoints would take their body from the query "
        "string and 422 on every request"
    )

    for model in ("ArtifactIn", "VisionAnalyzeIn", "ReconTextIn"):
        assert model in _pydantic_models(tree), f"{model} disappeared"
