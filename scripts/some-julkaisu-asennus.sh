#!/usr/bin/env bash
# Asentaa somevideoiden julkaisuajon (launchd, Aarnin kone). Ajo kerran: bash ~/huumorikauppa/scripts/some-julkaisu-asennus.sh
# Poisto: launchctl unload ~/Library/LaunchAgents/fi.huumorikauppa.some-julkaisu.plist && rm ~/Library/LaunchAgents/fi.huumorikauppa.some-julkaisu.plist
set -euo pipefail
NODE="$(command -v node)"
KOHDE="$HOME/Library/LaunchAgents/fi.huumorikauppa.some-julkaisu.plist"
mkdir -p "$HOME/.huumorikauppa-some" "$HOME/Library/LaunchAgents"
sed -e "s#<string>NODE</string>#<string>$NODE</string>#" -e "s#KOTI#$HOME#g" "$HOME/huumorikauppa/scripts/some-julkaisu.plist" > "$KOHDE"
launchctl unload "$KOHDE" 2>/dev/null || true
launchctl load "$KOHDE"
echo "Asennettu: julkaisu klo 11.30 ja 18.30 Suomen aikaa 24.12.2026 asti. Loki: ~/huumorikauppa/some/julkaisuloki.txt"
