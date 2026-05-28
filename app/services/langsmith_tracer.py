"""
langsmith_tracer.py — LangSmith observability wrapper for JWordenAI.

Wraps OpenAI calls with LangSmith tracing so every AI step is visible
in the LangSmith dashboard in real-time.

Usage:
    from app.services.langsmith_tracer import tracer

    with tracer.run("score_lead", inputs={"lead_id": 42, "email": "..."}) as run:
        result = openai_call(...)
        run.end(outputs={"score": result})

Configuration (Railway env vars):
    LANGSMITH_API_KEY     — LangSmith API key from smith.langchain.com
    LANGSMITH_PROJECT     — Project name (default: "jworden-ai")
    LANGSMITH_TRACING_V2  — Set to "true" to enable (default: off so local dev is silent)
"""

from __future__ import annotations

import logging
import os
from contextlib import contextmanager
from typing import Any, Generator

logger = logging.getLogger(__name__)

_TRACING_ENABLED = os.getenv("LANGSMITH_TRACING_V2", "false").lower() == "true"
_PROJECT = os.getenv("LANGSMITH_PROJECT", "jworden-ai")
_API_KEY = os.getenv("LANGSMITH_API_KEY", "")

# Lazily initialise the LangSmith client only when tracing is enabled and the
# langsmith package is installed.  This avoids a hard import dependency — the
# package is an optional extra and won't be present in all environments.
_client = None

if _TRACING_ENABLED and _API_KEY:
    try:
        from langsmith import Client  # type: ignore[import]
        _client = Client(api_key=_API_KEY)
        logger.info("LangSmith tracing enabled (project=%s)", _PROJECT)
    except ImportError:
        logger.warning(
            "LANGSMITH_TRACING_V2=true but langsmith package is not installed. "
            "Run: pip install langsmith"
        )
else:
    logger.debug("LangSmith tracing disabled (set LANGSMITH_TRACING_V2=true to enable)")


class _NoOpRun:
    """Returned when tracing is disabled — all methods are no-ops."""
    def end(self, outputs: dict | None = None, error: str | None = None) -> None:
        pass
    def add_metadata(self, metadata: dict) -> None:
        pass


class _LiveRun:
    """Wraps a real LangSmith RunTree for an active trace."""

    def __init__(self, run_tree: Any) -> None:
        self._run = run_tree

    def end(self, outputs: dict | None = None, error: str | None = None) -> None:
        try:
            self._run.end(outputs=outputs or {}, error=error)
            self._run.post()
        except Exception as exc:  # noqa: BLE001
            logger.debug("LangSmith run.end() failed: %s", exc)

    def add_metadata(self, metadata: dict) -> None:
        try:
            self._run.extra = {**(self._run.extra or {}), "metadata": metadata}
        except Exception:  # noqa: BLE001
            pass


class LangSmithTracer:
    """
    Lightweight facade over the LangSmith RunTree API.

    When LANGSMITH_TRACING_V2 is false or the package isn't installed,
    every call is a no-op so production code never breaks.
    """

    @contextmanager
    def run(
        self,
        name: str,
        run_type: str = "chain",
        inputs: dict | None = None,
        tags: list[str] | None = None,
    ) -> Generator[_NoOpRun | _LiveRun, None, None]:
        """
        Context manager that opens a LangSmith trace span.

        Example:
            with tracer.run("score_lead", inputs={"lead_id": 42}) as run:
                score = ai_model.score(lead)
                run.end(outputs={"score": score})
        """
        if _client is None:
            yield _NoOpRun()
            return

        try:
            from langsmith.run_trees import RunTree  # type: ignore[import]
            rt = RunTree(
                name=name,
                run_type=run_type,
                inputs=inputs or {},
                project_name=_PROJECT,
                tags=tags or [],
                client=_client,
            )
            rt.post()
            live = _LiveRun(rt)
            try:
                yield live
            except Exception as exc:
                live.end(error=str(exc))
                raise
            else:
                if not hasattr(rt, "_end_time"):
                    live.end()
        except ImportError:
            yield _NoOpRun()
        except Exception as exc:  # noqa: BLE001
            logger.debug("LangSmith tracer error: %s", exc)
            yield _NoOpRun()


# Module-level singleton — import this everywhere:
#   from app.services.langsmith_tracer import tracer
tracer = LangSmithTracer()
