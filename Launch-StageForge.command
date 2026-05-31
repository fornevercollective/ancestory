#!/bin/bash
# Launch StageForge orchestrator for ancestory (TUI + version hub).
set -euo pipefail
cd "$(dirname "$0")"

export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/go/bin:$PATH"
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
fi

STAGEFORGE="${STAGEFORGE_BIN:-}"
if [[ -z "$STAGEFORGE" ]]; then
  for c in "$HOME/dev/stageforge/bin/stageforge" stageforge; do
    if command -v "$c" &>/dev/null || [[ -x "$c" ]]; then
      STAGEFORGE="$c"
      break
    fi
  done
fi

if [[ -z "$STAGEFORGE" ]]; then
  echo "stageforge not found — build: make -C ~/dev/stageforge build"
  echo "Then re-run Launch-StageForge.command"
  exit 1
fi

echo "StageForge → ancestory ($(pwd))"
echo "  TUI:      $STAGEFORGE up"
echo "  workspace http://127.0.0.1:\${PORT:-5173}/"
echo "  (no auto-browser — open once manually)"
echo ""

exec "$STAGEFORGE" up -c stageforge.yaml
