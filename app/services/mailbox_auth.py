"""
mailbox_auth.py — consent for one mailbox, and the key that protects it.

WHAT A REFRESH TOKEN IS
───────────────────────
A long-lived key to a person's entire mail. Not a password equivalent — worse
in one respect, because it does not expire on its own and its holder never has
to answer a challenge. It is stored encrypted, it is never returned by any
endpoint, and it is never logged. The API can say a mailbox is connected; it
can never say how.

WHY OAUTH AND NOT A SERVICE ACCOUNT
───────────────────────────────────
The rest of this codebase reaches Google through service accounts, which is
right for Search Console and Analytics — those are properties an organisation
owns. A mailbox is a person's, and a service account can only read one through
domain-wide delegation, which requires Workspace and grants the account every
mailbox in the domain at once. These are consumer Gmail addresses, so the only
correct route is the owner consenting to each, one at a time, and being able to
withdraw each separately.

READ ONLY, DELIBERATELY
───────────────────────
gmail.readonly. This system extracts evidence; it has no reason to send, label,
delete or draft, and a narrower scope is one less thing to get wrong.
"""

import base64
import hashlib
import json
import logging
import os
from typing import Optional
from urllib.parse import urlencode

import httpx

from . import runtime_config as _cfg

logger = logging.getLogger(__name__)

AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"

# Read only. Nothing here sends, labels, deletes or drafts.
SCOPES = ("https://www.googleapis.com/auth/gmail.readonly",)


class MailboxAuthNotConfigured(RuntimeError):
    """No OAuth client, or no key to protect what it returns."""


def _client_id() -> str:
    return (_cfg.get("GMAIL_OAUTH_CLIENT_ID") or "").strip()


def _client_secret() -> str:
    return (_cfg.get("GMAIL_OAUTH_CLIENT_SECRET") or "").strip()


def redirect_uri() -> str:
    return (_cfg.get("GMAIL_OAUTH_REDIRECT_URI") or "").strip()


def configured() -> bool:
    return bool(_client_id() and _client_secret() and redirect_uri() and _fernet() is not None)


def _fernet():
    """
    The cipher that protects stored tokens, or None.

    MAILBOX_TOKEN_KEY must be a urlsafe base64 32-byte key. It is deliberately
    NOT derived from JWORDEN_MASTER_KEY or any other secret: rotating the
    signing key for the API should not silently make every stored mailbox
    unreadable, and a key that protects mail at rest should be rotatable on its
    own schedule.
    """
    raw = (_cfg.get("MAILBOX_TOKEN_KEY") or "").strip()
    if not raw:
        return None
    try:
        from cryptography.fernet import Fernet  # noqa: PLC0415

        return Fernet(raw.encode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        logger.error("MAILBOX_TOKEN_KEY is not a usable Fernet key: %s", exc)
        return None


def encrypt_token(token: str) -> str:
    cipher = _fernet()
    if cipher is None:
        raise MailboxAuthNotConfigured(
            "MAILBOX_TOKEN_KEY is not set, so a refresh token cannot be stored safely. "
            "Generate one with: python -c \"from cryptography.fernet import Fernet; "
            "print(Fernet.generate_key().decode())\""
        )
    return cipher.encrypt(token.encode("utf-8")).decode("ascii")


def decrypt_token(blob: str) -> str:
    cipher = _fernet()
    if cipher is None:
        raise MailboxAuthNotConfigured("MAILBOX_TOKEN_KEY is not set; stored tokens cannot be read.")
    return cipher.decrypt(blob.encode("ascii")).decode("utf-8")


def token_fingerprint(token: str) -> str:
    """
    A short, non-reversible marker for logs and support.

    Truncated so it cannot be brute-forced back into the token, and salted with
    nothing on purpose — it is an identity check between two stored blobs, not
    a secret.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()[:12]


def consent_url(*, email_hint: str = "", state: str = "") -> str:
    """
    The link the operator opens to grant this system read access to one mailbox.

    access_type=offline and prompt=consent together are what produce a refresh
    token. Without prompt=consent Google returns one only on a mailbox's FIRST
    ever authorisation and silently omits it every time after — so reconnecting
    an address appears to succeed and then cannot be used, which is a very
    quiet way to lose an afternoon.

    login_hint pre-fills the address, which matters here: five accounts are
    being connected in a row and picking the wrong one grants access to the
    wrong mail.
    """
    if not _client_id() or not redirect_uri():
        raise MailboxAuthNotConfigured(
            "GMAIL_OAUTH_CLIENT_ID and GMAIL_OAUTH_REDIRECT_URI must be set before a "
            "mailbox can be connected."
        )

    params = {
        "client_id": _client_id(),
        "redirect_uri": redirect_uri(),
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
    }
    if email_hint:
        params["login_hint"] = email_hint
    if state:
        params["state"] = state
    return f"{AUTH_ENDPOINT}?{urlencode(params)}"


async def exchange_code(code: str, *, timeout_seconds: float = 30.0) -> dict:
    """
    An authorisation code for a refresh token and the address it belongs to.

    The address is read from the id_token's payload rather than trusted from
    whoever started the flow: the consent screen is where the human chose which
    mailbox to grant, and that choice is the only authority on which mailbox
    this token opens.
    """
    if not configured():
        raise MailboxAuthNotConfigured(
            "Gmail OAuth is not fully configured. Needs GMAIL_OAUTH_CLIENT_ID, "
            "GMAIL_OAUTH_CLIENT_SECRET, GMAIL_OAUTH_REDIRECT_URI and MAILBOX_TOKEN_KEY."
        )

    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        response = await client.post(
            TOKEN_ENDPOINT,
            data={
                "code": code,
                "client_id": _client_id(),
                "client_secret": _client_secret(),
                "redirect_uri": redirect_uri(),
                "grant_type": "authorization_code",
            },
        )

    if response.status_code >= 400:
        # The body carries Google's own reason ("redirect_uri_mismatch",
        # "invalid_grant") and it is the only useful thing about the failure.
        # It contains no secret: the code is already spent.
        detail = response.text[:400]
        logger.error("Gmail token exchange failed: HTTP %s %s", response.status_code, detail)
        raise MailboxAuthNotConfigured(f"Google refused the authorisation code: {detail}")

    payload = response.json()
    refresh_token = payload.get("refresh_token")
    if not refresh_token:
        raise MailboxAuthNotConfigured(
            "Google returned no refresh token. That happens when the mailbox was "
            "authorised before and prompt=consent was not sent; revoke this app's "
            "access to the account and connect it again."
        )

    return {
        "refresh_token": refresh_token,
        "email_address": _email_from_id_token(payload.get("id_token", "")),
        "scopes": payload.get("scope", " ".join(SCOPES)),
    }


def _email_from_id_token(id_token: str) -> Optional[str]:
    """
    The address out of an id_token's payload.

    The signature is NOT verified here, and that is safe only because of where
    this value came from: a direct, TLS-protected POST to Google's own token
    endpoint moments earlier. It must never be used on a token that arrived
    from a browser or any other party.
    """
    try:
        payload_segment = id_token.split(".")[1]
        padded = payload_segment + "=" * (-len(payload_segment) % 4)
        claims = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
    except (IndexError, ValueError, UnicodeDecodeError):
        return None
    address = (claims.get("email") or "").strip().lower()
    return address or None


async def access_token(refresh_token: str, *, timeout_seconds: float = 30.0) -> str:
    """
    A one-hour access token. Never stored — minting one is cheaper than guarding it.
    """
    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        response = await client.post(
            TOKEN_ENDPOINT,
            data={
                "refresh_token": refresh_token,
                "client_id": _client_id(),
                "client_secret": _client_secret(),
                "grant_type": "refresh_token",
            },
        )
    if response.status_code >= 400:
        raise MailboxAuthNotConfigured(
            f"Google would not refresh this mailbox's token (HTTP {response.status_code}). "
            "Consent may have been withdrawn, or the account's password changed."
        )
    token = response.json().get("access_token")
    if not token:
        raise MailboxAuthNotConfigured("Google returned no access token.")
    return token
