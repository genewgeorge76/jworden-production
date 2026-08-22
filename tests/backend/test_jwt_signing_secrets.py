"""
No token may ever be signed with a constant from this repository.

Four call sites resolved the HS256 signing secret independently, and two of
them ended in a committed literal:

    core/security.py        → "fallback_secret"
    routers/auth.py (x2)    → "fallback_secret"
    services/staff_auth.py  → "CHANGE_ME_staff_jwt_secret_not_for_prod"

`os.getenv(name, default)` returns the default when the variable is absent, so
an unset STAFF_JWT_SECRET did not turn staff auth off. It signed every staff
token with that string and accepted every token signed with it. STAFF_JWT_SECRET
appeared in neither .env.example nor the managed-key list, so no operator had
ever been told the variable existed.

core/security.py even carried a guard for this — "Server authentication is not
configured" — placed after a chain whose last link was non-empty, so it could
not fire. The protection read as present in the source and was unreachable.

The second failure was quieter and purely functional: chat.py and
websocket_events.py verified against JWT_SECRET_KEY *only*, while the issuing
side signed with JWORDEN_JWT_SECRET or the master key. Set one of those and not
JWT_SECRET_KEY and a valid admin token works on every HTTP route and is
rejected by both WebSockets.

These tests read the source as well as exercising the functions, because the
property "this literal is not in the tree" is the one that regressed.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.core import jwt_secrets  # noqa: E402

ALL_SECRET_VARS = (
    "JWT_SECRET_KEY",
    "JWORDEN_JWT_SECRET",
    "JWORDEN_MASTER_KEY",
    "STAFF_JWT_SECRET",
)

#: The exact strings that used to be able to sign a production token.
RETIRED_LITERALS = ("fallback_secret", "CHANGE_ME_staff_jwt_secret_not_for_prod")


@pytest.fixture(scope="module")
def _ast_secret_defaults() -> list[str]:
    """Every `os.getenv(<secret var>, <default>)` in app/, located by AST."""
    import ast

    offenders: list[str] = []
    for path in sorted((REPO_ROOT / "app").rglob("*.py")):
        try:
            tree = ast.parse(path.read_text(encoding="utf-8", errors="ignore"))
        except SyntaxError:  # pragma: no cover - a broken file fails elsewhere
            continue
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue
            attr = getattr(node.func, "attr", None)
            if attr not in ("getenv", "get"):
                continue
            if not node.args or not isinstance(node.args[0], ast.Constant):
                continue
            if node.args[0].value not in ALL_SECRET_VARS:
                continue
            if len(node.args) < 2:
                continue  # no default — correct
            default = node.args[1]
            # An empty-string default is fine: it is falsy, so the caller has
            # to handle "not set" explicitly rather than being handed a key.
            if isinstance(default, ast.Constant) and default.value in ("", None):
                continue
            offenders.append(
                f"{path.relative_to(REPO_ROOT)}:{node.lineno} "
                f"({node.args[0].value})"
            )
    return offenders


@pytest.fixture()
def no_secrets(monkeypatch):
    for var in ALL_SECRET_VARS:
        monkeypatch.delenv(var, raising=False)


# ── The literals are gone from the tree ───────────────────────────────────────


def test_no_secret_variable_is_read_with_a_default(_ast_secret_defaults):
    """
    The regression guard that matters, stated as the general rule rather than
    as a hunt for two strings.

    `os.getenv("STAFF_JWT_SECRET", <anything>)` is the bug in its general
    form: a default turns "not configured" into a working, guessable key, and
    it reads as ordinary defensive code. No signing variable may be read with
    a fallback anywhere in app/.

    Checked over the parsed tree, not the text. Every module fixed here
    explains in its docstring which literal was removed and why, and a string
    search would report those explanations as the offence.
    """
    assert not _ast_secret_defaults, (
        "a signing secret is being read with a default again — an unset "
        "variable would silently become a working key: "
        + ", ".join(_ast_secret_defaults)
    )


# ── Fail closed, never fall back ──────────────────────────────────────────────


def test_platform_secret_raises_rather_than_returning_a_placeholder(no_secrets):
    with pytest.raises(jwt_secrets.SigningSecretUnavailable):
        jwt_secrets.platform_secret()


def test_staff_secret_raises_when_nothing_at_all_is_configured(no_secrets):
    with pytest.raises(jwt_secrets.SigningSecretUnavailable):
        jwt_secrets.staff_secret()


def test_staff_token_cannot_be_minted_without_a_secret(no_secrets):
    from app.services import staff_auth

    with pytest.raises(jwt_secrets.SigningSecretUnavailable):
        staff_auth.create_token(1, "foreman", "admin")


def test_staff_token_cannot_be_verified_without_a_secret(no_secrets):
    """A token that cannot be verified is not valid — decode returns None."""
    from app.services import staff_auth

    assert staff_auth.decode_token("anything.at.all") is None


# ── Resolution order is shared ────────────────────────────────────────────────


@pytest.mark.parametrize("var", jwt_secrets.PLATFORM_VARS)
def test_every_platform_variable_is_honoured(no_secrets, monkeypatch, var):
    monkeypatch.setenv(var, f"secret-from-{var}")
    assert jwt_secrets.platform_secret() == f"secret-from-{var}"
    assert jwt_secrets.platform_secret_source() == var


def test_first_configured_variable_wins(no_secrets, monkeypatch):
    monkeypatch.setenv("JWORDEN_MASTER_KEY", "master")
    monkeypatch.setenv("JWORDEN_JWT_SECRET", "jwt-specific")
    assert jwt_secrets.platform_secret() == "jwt-specific"
    monkeypatch.setenv("JWT_SECRET_KEY", "most-specific")
    assert jwt_secrets.platform_secret() == "most-specific"


def test_a_blank_variable_does_not_count_as_configured(no_secrets, monkeypatch):
    """`JWT_SECRET_KEY=` in a .env file is not a secret."""
    monkeypatch.setenv("JWT_SECRET_KEY", "   ")
    monkeypatch.setenv("JWORDEN_JWT_SECRET", "real")
    assert jwt_secrets.platform_secret() == "real"


def test_the_websocket_endpoints_verify_with_the_same_resolver(no_secrets, monkeypatch):
    """
    The functional half of the bug: an admin token good everywhere over HTTP
    used to be refused by live chat and the events feed.
    """
    from jose import jwt as jose_jwt

    from app.routers import chat, websocket_events

    # The exact configuration that split them: the issuing name is set, the
    # name the sockets used to read is not.
    monkeypatch.setenv("JWORDEN_JWT_SECRET", "the-one-true-secret")

    token = jose_jwt.encode(
        {"sub": "admin", "tenant_id": "JWORDEN_HQ"},
        jwt_secrets.platform_secret(),
        algorithm=jwt_secrets.ALGORITHM,
    )
    assert chat._verify_admin_token(token) is True
    assert websocket_events._verify_admin_token(token) is True


def test_websockets_still_reject_a_token_signed_with_something_else(
    no_secrets, monkeypatch
):
    from jose import jwt as jose_jwt

    from app.routers import websocket_events

    forged = jose_jwt.encode({"sub": "admin"}, "not-our-secret", algorithm="HS256")
    monkeypatch.setenv("JWORDEN_JWT_SECRET", "the-one-true-secret")
    assert websocket_events._verify_admin_token(forged) is False


def test_websockets_reject_everything_when_nothing_is_configured(no_secrets):
    from app.routers import websocket_events

    assert websocket_events._verify_admin_token("any-token") is False


# ── Staff keys are separate from platform keys ────────────────────────────────


def test_staff_secret_is_used_verbatim_when_set(no_secrets, monkeypatch):
    monkeypatch.setenv("STAFF_JWT_SECRET", "staff-only")
    assert jwt_secrets.staff_secret() == "staff-only"
    assert jwt_secrets.staff_secret_source() == "STAFF_JWT_SECRET"


def test_derived_staff_secret_is_stable_and_distinct(no_secrets, monkeypatch):
    """
    Derivation, not defaulting. A deployment that never set STAFF_JWT_SECRET
    still gets a key specific to it — stable across restarts and worker
    processes, so tokens survive a redeploy, and different from the platform
    key, so a staff token cannot be replayed as a platform token.
    """
    monkeypatch.setenv("JWORDEN_JWT_SECRET", "platform-key")

    first = jwt_secrets.staff_secret()
    assert first == jwt_secrets.staff_secret(), "derivation must be deterministic"
    assert first != jwt_secrets.platform_secret()
    assert first not in RETIRED_LITERALS
    assert jwt_secrets.staff_secret_source() == "derived"


def test_derived_staff_secret_changes_with_the_platform_key(no_secrets, monkeypatch):
    monkeypatch.setenv("JWORDEN_JWT_SECRET", "key-one")
    one = jwt_secrets.staff_secret()
    monkeypatch.setenv("JWORDEN_JWT_SECRET", "key-two")
    assert jwt_secrets.staff_secret() != one


def test_a_staff_token_does_not_verify_as_a_platform_token(no_secrets, monkeypatch):
    from jose import jwt as jose_jwt

    from app.routers import websocket_events
    from app.services import staff_auth

    monkeypatch.setenv("JWORDEN_JWT_SECRET", "platform-key")
    staff_token = staff_auth.create_token(7, "crew", "staff")

    assert staff_auth.decode_token(staff_token)["username"] == "crew"
    assert websocket_events._verify_admin_token(staff_token) is False

    del jose_jwt


# ── Diagnostics never leak the value ──────────────────────────────────────────


def test_fingerprint_does_not_contain_the_secret(no_secrets):
    fp = jwt_secrets.fingerprint("super-secret-value")
    assert "super-secret-value" not in fp
    assert fp.startswith("len=")
    assert jwt_secrets.fingerprint("") == "unset"


def test_sources_report_names_not_values(no_secrets, monkeypatch):
    monkeypatch.setenv("JWORDEN_MASTER_KEY", "actual-secret-material")
    assert jwt_secrets.platform_secret_source() == "JWORDEN_MASTER_KEY"
    assert "actual-secret-material" not in jwt_secrets.platform_secret_source()


def test_unconfigured_is_a_reportable_state(no_secrets):
    assert jwt_secrets.platform_secret_source() == "unconfigured"
    assert jwt_secrets.staff_secret_source() == "unconfigured"
