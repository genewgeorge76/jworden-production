/**
 * command-center-auth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Netlify Edge Function — PIN gate for /command-center
 *
 * Intercepts every request to /command-center and /command-center/* before the
 * SPA bundle is served.  Unauthenticated visitors see a minimal HTML PIN-entry
 * form.  On correct PIN submission the function sets an HttpOnly cookie and
 * redirects back so the SPA loads normally.
 *
 * REQUIRED NETLIFY ENVIRONMENT VARIABLE
 * ─────────────────────────────────────
 *   COMMAND_CENTER_PIN   — the 4-digit (or longer) PIN.
 *                          Set in Netlify UI → Site → Environment variables.
 *                          NEVER give this a VITE_ prefix — it must stay
 *                          server-side only.
 *
 * COOKIE
 * ──────
 *   Name  : cc_auth
 *   Flags : HttpOnly; Secure; SameSite=Lax; Path=/command-center
 *   Value : sha-256 hash of the PIN (so the raw PIN never leaves the server)
 *   TTL   : 8 hours (session-length access)
 *
 * LOGOUT
 * ──────
 *   Clear the cookie to log out:
 *     document.cookie = 'cc_auth=; Max-Age=0; Path=/command-center';
 *   Or navigate to /command-center?logout=1.
 */

import type { Context } from "https://edge.netlify.com";

const COOKIE_NAME = "cc_auth";
const COOKIE_TTL_SECONDS = 8 * 60 * 60; // 8 hours

/** Hex-encode a Uint8Array */
function toHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** SHA-256 hex digest of a UTF-8 string */
async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(hashBuf));
}

/** Render the PIN-entry page */
function loginPage(errorMsg = ""): Response {
  const errorHtml = errorMsg
    ? `<p style="color:#e53e3e;margin-bottom:12px;font-size:.875rem">${errorMsg}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Command Center — Access Required</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#0a1628;min-height:100vh;display:flex;align-items:center;justify-content:center;color:#fff}
    .card{background:#fff;border-radius:16px;padding:2rem;width:100%;max-width:360px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4)}
    .icon{width:56px;height:56px;border-radius:12px;background:#0a1628;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto 1.5rem}
    h2{color:#0a1628;font-size:1.5rem;font-weight:700;margin-bottom:.5rem}
    p{color:#6b7280;font-size:.875rem;margin-bottom:1.5rem}
    input{width:100%;border:1px solid #d1d5db;border-radius:8px;padding:.75rem 1rem;font-size:1.125rem;text-align:center;letter-spacing:.25em;outline:none;margin-bottom:.75rem}
    input:focus{border-color:#d97706;box-shadow:0 0 0 2px rgba(217,119,6,.3)}
    button{width:100%;background:#0a1628;color:#fff;border:none;border-radius:8px;padding:.875rem;font-size:1rem;font-weight:600;cursor:pointer}
    button:hover{background:#162035}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <h2>Command Center</h2>
    <p>Enter your access PIN to continue.</p>
    ${errorHtml}
    <form method="POST">
      <input type="password" name="pin" placeholder="PIN" autocomplete="current-password" autofocus maxlength="10"/>
      <button type="submit">Unlock</button>
    </form>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 401,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export default async function handler(
  request: Request,
  context: Context
): Promise<Response> {
  const authMode = String(Deno.env.get("COMMAND_CENTER_AUTH_MODE") ?? "none").toLowerCase();
  if (["none", "off", "disabled", "0", "false"].includes(authMode)) {
    return context.next();
  }

  const url = new URL(request.url);

  // ── Logout shortcut ──────────────────────────────────────────────────────
  if (url.searchParams.get("logout") === "1") {
    const res = Response.redirect(new URL("/command-center", url).href, 302);
    res.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=; Max-Age=0; Path=/command-center; HttpOnly; Secure; SameSite=Lax`
    );
    return res;
  }

  // ── Read the PIN from the environment ───────────────────────────────────
  const configuredPin = Deno.env.get("COMMAND_CENTER_PIN") ?? "";
  if (!configuredPin) {
    // No PIN configured → refuse access with a generic error
    return new Response("Service temporarily unavailable.", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
  const expectedHash = await sha256(configuredPin);

  // ── Handle POST (form submission) ────────────────────────────────────────
  if (request.method === "POST") {
    let body: URLSearchParams;
    try {
      body = new URLSearchParams(await request.text());
    } catch {
      return loginPage("Invalid request body.");
    }
    const submittedPin = body.get("pin") ?? "";
    const submittedHash = await sha256(submittedPin);

    if (submittedHash !== expectedHash) {
      return loginPage("Incorrect PIN. Please try again.");
    }

    // Correct PIN — set cookie and redirect to strip the POST
    const redirectUrl = new URL("/command-center", url).href;
    const res = Response.redirect(redirectUrl, 303);
    res.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=${expectedHash}; Max-Age=${COOKIE_TTL_SECONDS}; Path=/command-center; HttpOnly; Secure; SameSite=Lax`
    );
    return res;
  }

  // ── Check auth cookie for GET requests ──────────────────────────────────
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieMatch = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));

  if (cookieMatch) {
    const cookieValue = cookieMatch.slice(COOKIE_NAME.length + 1);
    if (cookieValue === expectedHash) {
      // Valid cookie — pass through to the SPA
      return context.next();
    }
  }

  // ── Unauthenticated — show login form ────────────────────────────────────
  return loginPage();
}
