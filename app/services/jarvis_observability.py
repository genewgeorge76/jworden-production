from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from typing import Any

from app.services.monitoring_service import monitoring

_MAX_SAMPLES = 2000
_LOCK = threading.Lock()

_request_latencies_ms = deque(maxlen=_MAX_SAMPLES)
_role_latencies_ms: dict[str, deque] = defaultdict(lambda: deque(maxlen=_MAX_SAMPLES))
_role_counts: dict[str, dict[str, int]] = defaultdict(lambda: {"requests": 0, "errors": 0, "fallbacks": 0})
_tenant_counts: dict[str, int] = defaultdict(int)
_tool_counts: dict[str, dict[str, int]] = defaultdict(lambda: {"total": 0, "failures": 0})
_engine_counts: dict[str, dict[str, int]] = defaultdict(lambda: {"total": 0, "fallbacks": 0})
_global_counts: dict[str, int] = {"requests": 0, "errors": 0, "fallbacks": 0}


def _percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    if len(ordered) == 1:
        return round(ordered[0], 2)
    rank = (len(ordered) - 1) * p
    lower = int(rank)
    upper = min(lower + 1, len(ordered) - 1)
    weight = rank - lower
    value = ordered[lower] * (1 - weight) + ordered[upper] * weight
    return round(value, 2)


def record_turn(
    *,
    role: str,
    tenant_id: str,
    latency_ms: float,
    engine: str,
    model: str,
    fallback_used: bool,
    error: bool,
) -> None:
    latency_ms = float(max(0.0, latency_ms))
    engine_key = f"{engine or 'unknown'}|{model or 'unknown'}"

    with _LOCK:
        _global_counts["requests"] += 1
        if error:
            _global_counts["errors"] += 1
        if fallback_used:
            _global_counts["fallbacks"] += 1

        _request_latencies_ms.append(latency_ms)
        _role_latencies_ms[role].append(latency_ms)

        _role_counts[role]["requests"] += 1
        if error:
            _role_counts[role]["errors"] += 1
        if fallback_used:
            _role_counts[role]["fallbacks"] += 1

        _tenant_counts[tenant_id or "default"] += 1
        _engine_counts[engine_key]["total"] += 1
        if fallback_used:
            _engine_counts[engine_key]["fallbacks"] += 1

    monitoring.log_metric(
        "jarvis.request.latency_ms",
        latency_ms,
        tags=[f"role:{role}", f"tenant:{tenant_id or 'default'}", f"engine:{engine or 'unknown'}"],
    )
    monitoring.log_metric(
        "jarvis.requests.total",
        1,
        tags=[f"role:{role}", f"tenant:{tenant_id or 'default'}"],
        metric_type="count",
    )
    if fallback_used:
        monitoring.log_metric(
            "jarvis.requests.fallback",
            1,
            tags=[f"role:{role}", f"engine:{engine or 'unknown'}"],
            metric_type="count",
        )
    if error:
        monitoring.log_metric(
            "jarvis.requests.error",
            1,
            tags=[f"role:{role}", f"engine:{engine or 'unknown'}"],
            metric_type="count",
        )


def record_tool_call(*, tool_name: str, role: str, tenant_id: str, ok: bool) -> None:
    name = tool_name or "unknown"
    with _LOCK:
        _tool_counts[name]["total"] += 1
        if not ok:
            _tool_counts[name]["failures"] += 1

    monitoring.log_metric(
        "jarvis.tools.calls",
        1,
        tags=[f"tool:{name}", f"role:{role}", f"tenant:{tenant_id or 'default'}"],
        metric_type="count",
    )
    if not ok:
        monitoring.log_metric(
            "jarvis.tools.failures",
            1,
            tags=[f"tool:{name}", f"role:{role}"],
            metric_type="count",
        )


def snapshot() -> dict[str, Any]:
    with _LOCK:
        total_requests = _global_counts["requests"]
        total_errors = _global_counts["errors"]
        total_fallbacks = _global_counts["fallbacks"]

        request_latencies = list(_request_latencies_ms)
        roles = {}
        for role, counts in _role_counts.items():
            role_requests = counts["requests"]
            role_errors = counts["errors"]
            role_fallbacks = counts["fallbacks"]
            role_lats = list(_role_latencies_ms[role])
            roles[role] = {
                "requests": role_requests,
                "errors": role_errors,
                "error_rate_pct": round((role_errors / role_requests * 100), 2) if role_requests else 0.0,
                "fallback_rate_pct": round((role_fallbacks / role_requests * 100), 2) if role_requests else 0.0,
                "latency_ms": {
                    "p50": _percentile(role_lats, 0.50),
                    "p95": _percentile(role_lats, 0.95),
                    "p99": _percentile(role_lats, 0.99),
                },
            }

        tools = []
        for name, counts in _tool_counts.items():
            total = counts["total"]
            failures = counts["failures"]
            tools.append(
                {
                    "name": name,
                    "calls": total,
                    "failures": failures,
                    "failure_rate_pct": round((failures / total * 100), 2) if total else 0.0,
                }
            )
        tools.sort(key=lambda item: item["calls"], reverse=True)

        engines = []
        for key, counts in _engine_counts.items():
            total = counts["total"]
            fallbacks = counts["fallbacks"]
            engine, model = key.split("|", 1)
            engines.append(
                {
                    "engine": engine,
                    "model": model,
                    "calls": total,
                    "fallbacks": fallbacks,
                    "fallback_rate_pct": round((fallbacks / total * 100), 2) if total else 0.0,
                }
            )
        engines.sort(key=lambda item: item["calls"], reverse=True)

        tenant_usage = [
            {"tenant_id": tenant, "requests": count}
            for tenant, count in sorted(_tenant_counts.items(), key=lambda item: item[1], reverse=True)
        ]

    return {
        "generated_at_epoch": int(time.time()),
        "requests": {
            "total": total_requests,
            "errors": total_errors,
            "error_rate_pct": round((total_errors / total_requests * 100), 2) if total_requests else 0.0,
        },
        "latency_ms": {
            "p50": _percentile(request_latencies, 0.50),
            "p95": _percentile(request_latencies, 0.95),
            "p99": _percentile(request_latencies, 0.99),
            "samples": len(request_latencies),
        },
        "provider_fallback": {
            "total": total_fallbacks,
            "rate_pct": round((total_fallbacks / total_requests * 100), 2) if total_requests else 0.0,
            "engines": engines,
        },
        "roles": roles,
        "tools": tools,
        "tenant_usage": tenant_usage,
    }
