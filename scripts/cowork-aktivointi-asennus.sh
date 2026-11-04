#!/usr/bin/env bash
# Asentaa Coworkin aktivointilinkin aamuajon (launchd, Aarnin kone). Ajo kerran: bash ~/huumorikauppa/scripts/cowork-aktivointi-asennus.sh
# Poisto: launchctl unload ~/Library/LaunchAgents/fi.huumorikauppa.cowork-aktivointi.plist && rm ~/Library/LaunchAgents/fi.huumorikauppa.cowork-aktivointi.plist
set -euo pipefail
NODE="$(command -v node)"
KOHDE="$HOME/Library/LaunchAgents/fi.huumorikauppa.cowork-aktivointi.plist"
mkdir -p "$HOME/huumorikauppa/.cowork" && chmod 700 "$HOME/huumorikauppa/.cowork"
sed -e "s#<string>NODE</string>#<string>$NODE</string>#" -e "s#KOTI#$HOME#g" "$HOME/huumorikauppa/scripts/cowork-aktivointi.plist" > "$KOHDE"
launchctl unload "$KOHDE" 2>/dev/null || true
launchctl load "$KOHDE"
echo "Asennettu: uusi linkki kirjoitetaan tiedostoon ~/huumorikauppa/.cowork/aktivointi.txt joka aamu, kun eväste on vanhenemassa."
