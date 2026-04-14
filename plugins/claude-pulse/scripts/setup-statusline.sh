#!/usr/bin/env bash
# Wire claude-pulse as the Claude Code statusLine.
# Safe to re-run. Refuses to mutate broken settings.json.
set -euo pipefail

CLAUDE_DIR="$HOME/.claude"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
PLUGIN_BASE="$CLAUDE_DIR/plugins/cache/claude-pulse/claude-pulse"

for cmd in python3; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: $cmd is required but not installed." >&2
    exit 1
  fi
done

PLUGIN_DIR=$( (ls -td "$PLUGIN_BASE"/*/ 2>/dev/null || true) | head -1 )
if [ -z "$PLUGIN_DIR" ]; then
  echo "Error: claude-pulse plugin not found under $PLUGIN_BASE" >&2
  echo "Run inside Claude Code first:" >&2
  echo "  /plugin marketplace add ocean-zhc/claude-pulse" >&2
  echo "  /plugin install claude-pulse" >&2
  exit 1
fi

if command -v bun >/dev/null 2>&1; then
  RUNTIME=$(command -v bun)
  SOURCE_REL="src/index.ts"
elif command -v node >/dev/null 2>&1; then
  RUNTIME=$(command -v node)
  SOURCE_REL="dist/index.js"
else
  echo "Error: neither 'bun' nor 'node' found in PATH." >&2
  exit 1
fi

if [ ! -f "${PLUGIN_DIR}${SOURCE_REL}" ]; then
  echo "Error: plugin entry not found at ${PLUGIN_DIR}${SOURCE_REL}" >&2
  exit 1
fi

# Build a self-resolving statusLine command. Using $(ls ...) at runtime
# means future plugin updates are picked up automatically without re-running
# this installer.
COMMAND_STRING="bash -c '\"${RUNTIME}\" \"\$(ls -td ~/.claude/plugins/cache/claude-pulse/claude-pulse/*/ 2>/dev/null | head -1)${SOURCE_REL}\"'"

if [ -f "$SETTINGS_FILE" ]; then
  SETTINGS_FILE="$SETTINGS_FILE" python3 - <<'PYEOF'
import json
import os
import sys

path = os.environ["SETTINGS_FILE"]
try:
    with open(path, encoding="utf-8-sig") as f:
        json.load(f)
except Exception as exc:
    print(f"Error: {path} is not valid JSON. Refusing to modify it.", file=sys.stderr)
    print(f"Reason: {exc}", file=sys.stderr)
    sys.exit(1)
PYEOF
fi

EXISTING=""
if [ -f "$SETTINGS_FILE" ]; then
  EXISTING=$(SETTINGS_FILE="$SETTINGS_FILE" python3 - <<'PYEOF'
import json
import os

path = os.environ["SETTINGS_FILE"]
with open(path) as f:
    d = json.load(f)
sl = d.get("statusLine")
if isinstance(sl, dict):
    print(sl.get("command", ""))
elif isinstance(sl, str):
    print(sl)
PYEOF
  )
fi

if [ -n "$EXISTING" ]; then
  case "$EXISTING" in
    *claude-pulse*)
      echo "claude-pulse statusline already configured. No changes."
      echo "  $EXISTING"
      exit 0
      ;;
    *)
      echo "Another statusline is already configured:"
      echo "  $EXISTING"
      ans=""
      if [ -t 0 ]; then
        printf "Replace it with claude-pulse statusline? [Y/n] "
        read -r ans || true
      elif { exec 3</dev/tty; } 2>/dev/null; then
        printf "Replace it with claude-pulse statusline? [Y/n] "
        read -r ans <&3 || true
        exec 3<&-
      else
        echo "Refusing to overwrite non-claude-pulse statusline without an interactive tty." >&2
        echo "Re-run from a terminal, or remove the existing statusLine entry first." >&2
        exit 1
      fi
      if [ "$ans" = "n" ] || [ "$ans" = "N" ]; then
        echo "Skipped. Existing statusline kept."
        exit 0
      fi
      ;;
  esac
fi

mkdir -p "$CLAUDE_DIR"

SETTINGS_FILE="$SETTINGS_FILE" COMMAND_STRING="$COMMAND_STRING" python3 - <<'PYEOF'
import json
import os
import tempfile

path = os.environ["SETTINGS_FILE"]
cmd = os.environ["COMMAND_STRING"]

d = {}
if os.path.exists(path):
    with open(path, encoding="utf-8-sig") as f:
        d = json.load(f)

d["statusLine"] = {"type": "command", "command": cmd}

directory = os.path.dirname(path) or "."
fd, tmp_path = tempfile.mkstemp(prefix="settings.", suffix=".json.tmp", dir=directory)
with os.fdopen(fd, "w", encoding="utf-8") as f:
    json.dump(d, f, indent=2, ensure_ascii=False)
    f.write("\n")
os.replace(tmp_path, path)
PYEOF

echo "claude-pulse statusline installed. Restart Claude Code to activate."
echo "Tip: if you see a 513 error after switching Claude accounts, remove the statusLine entry from $SETTINGS_FILE, restart Claude Code, then re-run this script."
