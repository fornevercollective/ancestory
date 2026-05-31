#!/bin/bash
# Build ancestory.icns from a source image and apply to Launch Ancestory.app
# Usage: support/macos/refresh-launcher-icon.sh [source-image]
#   source-image: png/jpg/ico to use (defaults to looking for public/morph/*.png or similar)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SUPPORT="$ROOT/support"
APP_ICNS="$ROOT/Launch Ancestory.app/Contents/Resources/applet.icns"

SRC_IMAGE="${1:-}"
if [[ -z "$SRC_IMAGE" ]]; then
  # Try common locations
  for cand in \
    "$ROOT/public/morph/face-shapes-grid.png" \
    "$ROOT/public/morph/face-shape-oval.png" \
    "$ROOT/favicon.png" \
    "$ROOT/favicon.ico"; do
    if [[ -f "$cand" ]]; then
      SRC_IMAGE="$cand"
      break
    fi
  done
fi

if [[ -z "$SRC_IMAGE" || ! -f "$SRC_IMAGE" ]]; then
  echo "No source image found. Provide one as argument or place an image at public/morph/face-shapes-grid.png" >&2
  echo "Usage: $0 [source-image.(png|jpg|ico)]" >&2
  exit 1
fi

TMP="${TMPDIR:-/tmp}/ancestory-launcher-icon-$$"
mkdir -p "$TMP"

sips -s format png "$SRC_IMAGE" --out "$TMP/src.png" >/dev/null
sips -z 1024 1024 "$TMP/src.png" --out "$TMP/master.png" >/dev/null

ICSET="$TMP/Ancestory.iconset"
mkdir -p "$ICSET"
SRC="$TMP/master.png"
sips -z 16 16 "$SRC" --out "$ICSET/icon_16x16.png" >/dev/null
sips -z 32 32 "$SRC" --out "$ICSET/icon_16x16@2x.png" >/dev/null
sips -z 32 32 "$SRC" --out "$ICSET/icon_32x32.png" >/dev/null
sips -z 64 64 "$SRC" --out "$ICSET/icon_32x32@2x.png" >/dev/null
sips -z 128 128 "$SRC" --out "$ICSET/icon_128x128.png" >/dev/null
sips -z 256 256 "$SRC" --out "$ICSET/icon_128x128@2x.png" >/dev/null
sips -z 256 256 "$SRC" --out "$ICSET/icon_256x256.png" >/dev/null
sips -z 512 512 "$SRC" --out "$ICSET/icon_256x256@2x.png" >/dev/null
sips -z 512 512 "$SRC" --out "$ICSET/icon_512x512.png" >/dev/null
sips -z 1024 1024 "$SRC" --out "$ICSET/icon_512x512@2x.png" >/dev/null

OUT="$SUPPORT/ancestory.icns"
iconutil -c icns "$ICSET" -o "$OUT"
mkdir -p "$(dirname "$APP_ICNS")"
cp "$OUT" "$APP_ICNS"

# Apple's bundled asset catalog can override applet.icns in Finder; keep one backup rename.
CAR="$ROOT/Launch Ancestory.app/Contents/Resources/Assets.car"
STOCK="$ROOT/Launch Ancestory.app/Contents/Resources/Assets.car.stock"
if [[ -f "$CAR" && ! -f "$STOCK" ]]; then
  mv "$CAR" "$STOCK"
  echo "Renamed Assets.car -> Assets.car.stock so your logo (applet.icns) shows in Finder/Dock."
fi

# Bump app so Finder refreshes the icon cache
touch "$ROOT/Launch Ancestory.app"
rm -rf "$TMP"
echo "Updated $OUT and $APP_ICNS"
echo "Source image: $SRC_IMAGE"
