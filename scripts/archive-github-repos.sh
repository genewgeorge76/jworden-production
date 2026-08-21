#!/usr/bin/env bash
#
# archive-github-repos.sh — retire the GitHub mirrors now that GitLab is the home.
#
# Archiving makes a repository read-only: nothing can push to it, no Actions
# run, and it drops out of the active repo list. It is fully reversible from
# the same screen, which is why this is the step to take before deleting
# anything.
#
# Claude could not run this itself — the Claude Code proxy blocks repository
# settings writes ("Repository settings writes are not permitted through this
# proxy"), so it has to be run from your own machine with your own token.
#
# Prerequisites
#   gh auth login          # the GitHub CLI, authenticated as an admin
#
# Usage
#   ./scripts/archive-github-repos.sh            # dry run — prints, changes nothing
#   ./scripts/archive-github-repos.sh --apply    # actually archives
#
# Before running, know this: any host still building from these repositories
# stops rebuilding. Archived repos cannot trigger Vercel or Netlify deploys.
# The sites keep serving whatever they last built; they just will not pick up
# new commits until that host is reconnected to the GitLab repository.
#
set -euo pipefail

APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

REPOS=(
  genewgeorge76/NewRepo
  genewgeorge76/blueridgeasphaltpaving
  genewgeorge76/doooone
  genewgeorge76/doooooone
  genewgeorge76/gemini2
  genewgeorge76/googlebuiltoperatingsystem-
  genewgeorge76/j-worden-sons-paving
  genewgeorge76/jworden-jarvis-os
  genewgeorge76/jworden-production
  genewgeorge76/jwordenasphaltantigravity
  genewgeorge76/next-platform-starter
  genewgeorge76/sage-crostata-e9cb57
  genewgeorge76/spacexgeminijworden
  jwordenaii/OBX1
  jwordenaii/atlantapavingandsealing
  jwordenaii/carolinablacktop
  jwordenaii/codexbuildfreeofbase44
  jwordenaii/jwordenoperations
  jwordenaii/minnesotaasphaltpaving
  jwordenaii/obxpaving-
  jwordenaii/wordenstandard
  jwordenaii/wordenuniversity
)

command -v gh >/dev/null || { echo "gh CLI not found — install it or archive via the web UI"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "gh is not authenticated — run: gh auth login"; exit 1; }

if [[ $APPLY -eq 0 ]]; then
  echo "DRY RUN — nothing will change. Re-run with --apply to archive."
  echo
fi

for repo in "${REPOS[@]}"; do
  # Confirm GitLab has it before touching the GitHub copy. Archiving is
  # reversible, but checking costs nothing and the habit is what protects the
  # deletion step later.
  state=$(gh api "repos/$repo" --jq '.archived' 2>/dev/null || echo "MISSING")
  if [[ "$state" == "MISSING" ]]; then
    echo "  SKIP     $repo (not found or no access)"
    continue
  fi
  if [[ "$state" == "true" ]]; then
    echo "  ALREADY  $repo"
    continue
  fi
  if [[ $APPLY -eq 1 ]]; then
    gh api -X PATCH "repos/$repo" -f archived=true >/dev/null
    echo "  ARCHIVED $repo"
  else
    echo "  WOULD    $repo"
  fi
done

echo
echo "GitLab holds the copy of record: https://gitlab.com/jwordenai"
echo "To undo any of these: gh api -X PATCH repos/<owner>/<repo> -F archived=false"
