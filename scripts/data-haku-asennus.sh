#!/usr/bin/env bash
# Asentaa datan haun (Search Console, Merchant, IG, TikTok) (launchd, Aarnin kone). Ajo kerran: bash ~/huumorikauppa/scripts/data-haku-asennus.sh
# Poisto: launchctl unload ~/Library/LaunchAgents/fi.huumorikauppa.data-haku.plist && rm ~/Library/LaunchAgents/fi.huumorikauppa.data-haku.plist
set -euo pipefail
NODE="$(command -v node)"
KOHDE="$HOME/Library/LaunchAgents/fi.huumorikauppa.data-haku.plist"
mkdir -p "$HOME/.huumorikauppa-some" "$HOME/Library/LaunchAgents"
sed -e "s#<string>NODE</string>#<string>$NODE</string>#" -e "s#KOTI#$HOME#g" "$HOME/huumorikauppa/scripts/data-haku.plist" > "$KOHDE"
launchctl unload "$KOHDE" 2>/dev/null || true
launchctl load "$KOHDE"
echo "Asennettu: datahaku maanantaisin klo 8 Suomen aikaa. Loki: ~/huumorikauppa/some/datahakuloki.txt"
