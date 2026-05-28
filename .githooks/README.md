# .githooks/README.md

Lightweight git hooks for this repo. **No new npm dependency** — pure shell scripts that work on Windows (Git Bash that ships with Git for Windows), macOS, and Linux.

## What runs when

| Hook | Trigger | Runs |
|------|---------|------|
| `pre-commit` | `git commit` | ESLint on staged JS/JSX/TS/TSX + secret scan on staged diff |
| `pre-push` | `git push` | Full `npm run lint` + `npm run build` |

## One-time setup (per clone of the repo)

```powershell
git config core.hooksPath .githooks
```

Or run the helper:

```powershell
.\scripts\enable-githooks.ps1
```

That's it. Hooks now run automatically.

## Bypass (emergency only)

```powershell
git commit --no-verify    # skip pre-commit
git push --no-verify      # skip pre-push
```

Use sparingly. CI will still catch problems on the server side.

## Why this matters

- Lint errors caught on YOUR machine = no failed CI runs that block PRs
- Secrets caught BEFORE they enter git history (impossible to fully scrub later)
- Builds verified locally = no broken `main` branch
- Same standards across every contributor automatically
