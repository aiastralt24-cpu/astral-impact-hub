#!/bin/zsh

set -euo pipefail

export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
export PLAYWRIGHT_CLI_SESSION="${PLAYWRIGHT_CLI_SESSION:-astral-handbook}"

mkdir -p output/playwright

captures=(
  "dashboard:e37"
  "projects:e44"
  "updates:e48"
  "vendors:e53"
  "media:e60"
  "content:e66"
  "distribution:e70"
  "analytics:e75"
  "settings:e79"
)

for item in "${captures[@]}"; do
  route="${item%%:*}"
  ref="${item##*:}"
  "$PWCLI" click "$ref" >/tmp/astral-handbook-nav.txt
  "$PWCLI" snapshot >/tmp/astral-handbook-snapshot.txt
  "$PWCLI" screenshot >/tmp/astral-handbook-shot.txt
  latest_png="$(ls -t .playwright-cli/*.png | head -n1)"
  cp "$latest_png" "output/playwright/${route}.png"
done
