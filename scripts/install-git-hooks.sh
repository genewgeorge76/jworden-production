#!/usr/bin/env bash
# Install the local pre-commit secret scan.
#
# Run once per clone:  bash scripts/install-git-hooks.sh
#
# Git hooks are not themselves version-controlled, so this script writes the
# hook into .git/hooks. It exists because three separate live credentials were
# found already committed to this PUBLIC repository; the scan is the cheapest
# point at which to stop the fourth.

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
hook_path="$repo_root/.git/hooks/pre-commit"

if [ -e "$hook_path" ] && ! grep -q "scan_secrets.py" "$hook_path"; then
    echo "A pre-commit hook already exists and does not call scan_secrets.py:"
    echo "  $hook_path"
    echo "Add this line to it manually instead of overwriting:"
    echo '  python3 scripts/scan_secrets.py --staged || exit 1'
    exit 1
fi

cat > "$hook_path" <<'HOOK'
#!/usr/bin/env bash
# Blocks commits containing high-confidence credentials. See scripts/scan_secrets.py.
# Bypass (only when you are certain it is a false positive): git commit --no-verify
python3 "$(git rev-parse --show-toplevel)/scripts/scan_secrets.py" --staged || {
    echo ""
    echo "Commit blocked by the secret scan. Fix the finding above, or run"
    echo "  git commit --no-verify"
    echo "if you have verified it is a false positive."
    exit 1
}
HOOK

chmod +x "$hook_path"
echo "Installed pre-commit secret scan at $hook_path"
