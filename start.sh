#!/bin/bash
# Shared launcher: Terminal-friendly PATH, then Vite dev server + optional browser.
set -euo pipefail
cd "$(dirname "$0")"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
fi

PORT="${PORT:-5173}"
export PORT

LISTEN_HOST="${ANCESTORY_HOST:-127.0.0.1}"
echo "Starting ancestory Vite dev server…"
echo "  directory  $(pwd)"
echo "  url        http://${LISTEN_HOST}:${PORT}/"
echo "  (build)    npm run build && npm run preview"
echo ""

# Browser open is OPT-IN only (prevents StageForge loop from spawning infinite windows).
# Finder: Launch.command sets ANCESTORY_OPEN_BROWSER=1
if [[ "${ANCESTORY_OPEN_BROWSER:-}" == "1" && "${ANCESTORY_NO_OPEN:-}" != "1" && "${STAGEFORGE:-}" != "1" ]]; then
  ( sleep 0.8 && open "http://${LISTEN_HOST}:${PORT}/" ) &
fi

# Run Vite without its built-in browser open; we control it above.
exec npx vite --host "$LISTEN_HOST" --port "$PORT" --no-open
