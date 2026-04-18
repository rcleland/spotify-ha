#!/usr/bin/env sh
# Copy the built Lovelace bundle to repo-root dist/ and custom_components (auto resource).
set -e
ROOT="$(CDPATH= cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/dist"
mkdir -p "$ROOT/custom_components/spotify/frontend"
cp "$ROOT/spotify-spotlight-card/dist/spotify-spotlight-card.js" "$ROOT/dist/"
cp "$ROOT/spotify-spotlight-card/dist/spotify-spotlight-card.js" \
  "$ROOT/custom_components/spotify/frontend/spotify-spotlight-card.js"
if [ -f "$ROOT/spotify-spotlight-card/dist/spotify-spotlight-card.js.map" ]; then
  cp "$ROOT/spotify-spotlight-card/dist/spotify-spotlight-card.js.map" "$ROOT/dist/"
fi
echo "Synced → dist/spotify-spotlight-card.js + custom_components/spotify/frontend/"
