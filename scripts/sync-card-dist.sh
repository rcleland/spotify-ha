#!/usr/bin/env sh
# Copy the built Lovelace bundle to repo-root dist/ for HACS (Dashboard) installs.
set -e
ROOT="$(CDPATH= cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/dist"
cp "$ROOT/spotify-spotlight-card/dist/spotify-spotlight-card.js" "$ROOT/dist/"
if [ -f "$ROOT/spotify-spotlight-card/dist/spotify-spotlight-card.js.map" ]; then
  cp "$ROOT/spotify-spotlight-card/dist/spotify-spotlight-card.js.map" "$ROOT/dist/"
fi
echo "Synced → dist/spotify-spotlight-card.js"
