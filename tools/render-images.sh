#!/usr/bin/env bash
# Renders the social preview image and Apple touch icon with headless Chrome (macOS path).
# Run from the repo root:  bash tools/render-images.sh
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
render() { # src out width height
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --virtual-time-budget=4000 --window-size="$3,$4" --screenshot="$PWD/$2" "file://$PWD/$1" >/dev/null 2>&1
}
render tools/og-image.html   assets/og-image.png         1200 630
render tools/touch-icon.html assets/apple-touch-icon.png 180  180
echo "Rendered assets/og-image.png and assets/apple-touch-icon.png"
