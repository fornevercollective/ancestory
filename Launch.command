#!/bin/bash
# Double-click: Terminal + ancestory Vite dev server + one browser tab.
cd "$(dirname "$0")"
export ANCESTORY_OPEN_BROWSER=1
exec ./start.sh
