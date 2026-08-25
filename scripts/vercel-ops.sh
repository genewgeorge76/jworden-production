#!/usr/bin/env bash
#
# vercel-ops.sh — the domain and project operations this estate actually needs.
#
# WHY A SCRIPT AND NOT AD-HOC CURL
# ────────────────────────────────
# Three reasons, in order of how much they matter.
#
# 1. AUDITABILITY. A domain move is not reversible in a visitor's cache and a
#    detach takes a live site off the internet. Ad-hoc curl leaves no record of
#    what was run against a production estate; this leaves a reviewable file and
#    a --dry-run that prints the exact call before making it.
#
# 2. A NARROW PERMISSION SURFACE. Granting an agent "curl" grants it every HTTP
#    request to every host. Granting it this script grants it exactly these
#    seven operations against exactly api.vercel.com. That difference is the
#    entire point of the .claude/settings.local.json rule that accompanies it.
#
# 3. THE TOKEN STOPS BEING PASTED. It is read from the environment or from a
#    0600 file, never from a command line, so it cannot end up in shell history,
#    a transcript, or a process list where `ps` would show it.
#
# WHAT IT DELIBERATELY WILL NOT DO
# ────────────────────────────────
# No delete-project, no delete-deployment, no environment-variable access, and
# no writes outside the two projects named below. An estate of 45 domains does
# not need an agent that can remove a project, and a tool that cannot do a thing
# cannot be talked into doing it.
#
# Usage:
#   vercel-ops.sh domains [<project>]        what each project serves
#   vercel-ops.sh whereis <domain>           which project holds a domain
#   vercel-ops.sh attach <project> <domain>  attach a domain to a project
#   vercel-ops.sh detach <project> <domain>  remove a domain from a project
#   vercel-ops.sh move <from> <to> <domain>  detach then attach, in that order
#   vercel-ops.sh pause <project>            stop a project serving traffic
#   vercel-ops.sh unpause <project>          resume it
#
# Token: $VERCEL_TOKEN, else ~/.vercel-token (chmod 600).
# Add --dry-run as the last argument to print the call without making it.

set -euo pipefail

API="https://api.vercel.com"
TEAM="${VERCEL_TEAM_ID:-team_7JRl2mp5TJUobHTzTlLHA1xT}"

# Projects this script is allowed to touch. A typo in a project name should be
# an error, not a silent no-op against something else in the account.
ALLOWED_PROJECTS="jworden-production jworden-hub worden-pavement-group obx-paving-co minnesota-asphalt-paving blueridgeasphaltpaving wordenuniversity"

die() { printf 'vercel-ops: %s\n' "$*" >&2; exit 1; }

token() {
  if [ -n "${VERCEL_TOKEN:-}" ]; then printf '%s' "$VERCEL_TOKEN"; return; fi
  if [ -f "$HOME/.vercel-token" ]; then tr -d '\n' < "$HOME/.vercel-token"; return; fi
  die "no token: set VERCEL_TOKEN or write ~/.vercel-token (chmod 600)"
}

check_project() {
  case " $ALLOWED_PROJECTS " in
    *" $1 "*) : ;;
    *) die "project '$1' is not in the allowed list. Add it to ALLOWED_PROJECTS if that is deliberate." ;;
  esac
}

# Every call goes through here so the dry-run and the auth header cannot drift
# apart between operations.
call() {
  local method="$1" path="$2" body="${3:-}"
  if [ "${DRY_RUN:-0}" = "1" ]; then
    printf 'DRY RUN: %s %s%s%s\n' "$method" "$API" "$path" "${body:+  body=$body}"
    return 0
  fi
  local args=(-sS -X "$method" -H "Authorization: Bearer $(token)" -w '\n%{http_code}')
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' -d "$body")
  curl "${args[@]}" "$API$path"
}

# Prints "ok" / "FAILED <code>" plus the body, so a caller sees the outcome
# rather than having to interpret raw JSON.
report() {
  local label="$1" out="$2"
  local code body
  # A dry run produced a printed line, not an HTTP response. Parsing it as one
  # made every --dry-run report FAILED, which is the opposite of reassuring
  # before a domain move.
  if [ "${DRY_RUN:-0}" = "1" ]; then
    printf '  %s\n' "$out"
    return 0
  fi
  code="$(printf '%s' "$out" | tail -n1)"
  body="$(printf '%s' "$out" | sed '$d')"
  if [ "$code" -ge 200 ] && [ "$code" -lt 300 ]; then
    printf '  %-46s ok (%s)\n' "$label" "$code"
  else
    printf '  %-46s FAILED (%s) %s\n' "$label" "$code" "$(printf '%s' "$body" | head -c 200)"
    return 1
  fi
}

cmd_domains() {
  local projects="${1:-$ALLOWED_PROJECTS}"
  for p in $projects; do
    check_project "$p"
    printf '%s\n' "$p"
    call GET "/v9/projects/$p/domains?limit=100&teamId=$TEAM" | sed '$d' | python3 -c '
import json,sys
try: d=json.load(sys.stdin)
except Exception: print("  (could not read)"); sys.exit()
ds=d.get("domains",[])
if not ds: print("  (none)")
for x in ds:
    r=x.get("redirect")
    print("  ", x["name"], ("-> "+r) if r else "", "" if x.get("verified") else "[UNVERIFIED]")
'
  done
}

cmd_whereis() {
  local domain="$1"
  for p in $ALLOWED_PROJECTS; do
    if call GET "/v9/projects/$p/domains?limit=100&teamId=$TEAM" | sed '$d' \
      | grep -q "\"name\":\"$domain\""; then
      printf '%s is on %s\n' "$domain" "$p"; return 0
    fi
  done
  printf '%s is not attached to any allowed project\n' "$domain"
}

cmd_attach() {
  local project="$1" domain="$2"
  check_project "$project"
  report "attach $domain -> $project" \
    "$(call POST "/v10/projects/$project/domains?teamId=$TEAM" "{\"name\":\"$domain\"}")"
}

cmd_detach() {
  local project="$1" domain="$2"
  check_project "$project"
  report "detach $domain from $project" \
    "$(call DELETE "/v9/projects/$project/domains/$domain?teamId=$TEAM")"
}

cmd_move() {
  local from="$1" to="$2" domain="$3"
  check_project "$from"; check_project "$to"
  # Detach first, and stop if it fails. Vercel will not attach a domain that is
  # still held elsewhere, so attaching first cannot work — and continuing after
  # a failed detach would leave the domain serving the old project while the
  # log claimed it had moved.
  cmd_detach "$from" "$domain" || die "detach failed — not attempting the attach"
  cmd_attach "$to" "$domain"
}

cmd_pause()   { check_project "$1"; report "pause $1"   "$(call POST "/v1/projects/$1/pause?teamId=$TEAM")"; }
cmd_unpause() { check_project "$1"; report "unpause $1" "$(call POST "/v1/projects/$1/unpause?teamId=$TEAM")"; }

# --dry-run may appear anywhere; strip it before dispatch.
ARGS=()
for a in "$@"; do
  if [ "$a" = "--dry-run" ]; then DRY_RUN=1; else ARGS+=("$a"); fi
done
[ "${#ARGS[@]}" -gt 0 ] || die "no command. See the header of this file for usage."

action="${ARGS[0]}"; rest=("${ARGS[@]:1}")
case "$action" in
  domains) cmd_domains "${rest[@]:-}" ;;
  whereis) [ "${#rest[@]}" -eq 1 ] || die "whereis <domain>"; cmd_whereis "${rest[0]}" ;;
  attach)  [ "${#rest[@]}" -eq 2 ] || die "attach <project> <domain>"; cmd_attach "${rest[0]}" "${rest[1]}" ;;
  detach)  [ "${#rest[@]}" -eq 2 ] || die "detach <project> <domain>"; cmd_detach "${rest[0]}" "${rest[1]}" ;;
  move)    [ "${#rest[@]}" -eq 3 ] || die "move <from> <to> <domain>"; cmd_move "${rest[0]}" "${rest[1]}" "${rest[2]}" ;;
  pause)   [ "${#rest[@]}" -eq 1 ] || die "pause <project>"; cmd_pause "${rest[0]}" ;;
  unpause) [ "${#rest[@]}" -eq 1 ] || die "unpause <project>"; cmd_unpause "${rest[0]}" ;;
  *) die "unknown command '$action'" ;;
esac
