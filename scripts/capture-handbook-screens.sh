#!/bin/zsh

set -euo pipefail

export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
export PLAYWRIGHT_CLI_SESSION="${PLAYWRIGHT_CLI_SESSION:-astral-handbook}"

mkdir -p output/playwright

routes=(
  dashboard
  projects
  updates
  vendors
  media
  content
  distribution
  analytics
  settings
)

for route in "${routes[@]}"; do
  "$PWCLI" open "https://hub.theastralfoundation.org/$route" >/tmp/astral-handbook-open.txt
  "$PWCLI" screenshot >/tmp/astral-handbook-shot.txt
  latest_png="$(ls -t .playwright-cli/*.png | head -n1)"
  cp "$latest_png" "output/playwright/${route}.png"
done
