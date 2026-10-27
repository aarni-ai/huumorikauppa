#!/usr/bin/env bash
# Uuden Vercel-projektin (huumorikauppa, tiimi flyapeg-2135s-projects) tuotantojulkaisu: vercel.json + ajastukset
# (vercel.crons.json). Ajastukset ovat erillään, koska vanha projekti (huumorikauppa.fi, tiimi aarni-ais-projects)
# rakentaa saman mainin GitHubista ja vain välittää pyynnöt uuteen projektiin (middleware.ts); tunnin välein ajettavat
# ajastukset voisivat estää sen julkaisun, jos tiimi on Hobby-tasolla. Kun domain on uudessa projektissa, ajastukset
# voi palauttaa vercel.json-tiedostoon.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .vercel
node -e 'const fs=require("fs");const v=JSON.parse(fs.readFileSync("vercel.json","utf8"));v.crons=JSON.parse(fs.readFileSync("vercel.crons.json","utf8")).crons;fs.writeFileSync(".vercel/vercel.uusi.json",JSON.stringify(v,null,2))'
exec npx vercel deploy --prod --yes --local-config .vercel/vercel.uusi.json "$@"
