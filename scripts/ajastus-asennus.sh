#!/usr/bin/env bash
# Asentaa launchd-ajastuksen scripts/<nimi>.plist (5.11.2026: katalogi, kanta-palautus). Ajo: bash scripts/ajastus-asennus.sh katalogi
# Poisto: launchctl unload ~/Library/LaunchAgents/fi.huumorikauppa.<nimi>.plist && rm ~/Library/LaunchAgents/fi.huumorikauppa.<nimi>.plist
set -euo pipefail
NIMI="${1:?anna nimi: katalogi tai kanta-palautus}"
NODE="$(command -v node)"
KOHDE="$HOME/Library/LaunchAgents/fi.huumorikauppa.$NIMI.plist"
mkdir -p "$HOME/.huumorikauppa-some" "$HOME/Library/LaunchAgents"
sed -e "s#<string>NODE</string>#<string>$NODE</string>#" -e "s#KOTI#$HOME#g" "$HOME/huumorikauppa/scripts/$NIMI.plist" > "$KOHDE"
plutil -lint "$KOHDE" >/dev/null
launchctl unload "$KOHDE" 2>/dev/null || true
launchctl load "$KOHDE"
echo "Asennettu: fi.huumorikauppa.$NIMI"
