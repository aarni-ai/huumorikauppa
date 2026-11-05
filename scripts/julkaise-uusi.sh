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
# Medialle-sivun zipit eivät ole gitissä (public/media/*.zip, .gitignore): luodaan, jos puuttuvat.
ls public/media/*.zip >/dev/null 2>&1 || node scripts/media-zip.mjs

# Julkaisun esitestaus (3.11.2026, katko 2.11. MIDDLEWARE_INVOCATION_FAILED): ensin paikalliset tarkistukset, sitten
# tuotantoversio ilman domainia (--skip-domain), savutesti sen omaan osoitteeseen ja vasta sitten promote. Jos yksikin
# sivu ei vastaa 200, tuotanto pysyy edellisessä versiossa. SKIP_ESITESTI=1 ohittaa (vain hätätilanteessa).
if [ "${SKIP_ESITESTI:-}" != "1" ]; then
  echo "Esitestaus 1/3: ajonaikaiset importit ja tyypit"
  npx vitest run src/test/ajonaikaisetImportit.test.ts --reporter=dot >/dev/null
  # Kauppa ilman tietokantaa (5.11.2026): tuotteet, sivukartta, syöte, kassa Blob-puskuriin ja maksu Printifyyn,
  # kun DATABASE_URL osoittaa suljettuun porttiin.
  npx vitest run src/test/ilmanKantaa.test.ts src/test/kooditIlmanKantaa.test.ts --reporter=dot >/dev/null
  npx tsc --noEmit -p tsconfig.app.json
fi
echo "Esitestaus 2/3: tuotantoversio ilman domainia"
LOKI=$(mktemp)
npx vercel deploy --prod --skip-domain --yes --local-config .vercel/vercel.uusi.json "$@" | tee "$LOKI"
URL=$(grep -oE 'https://huumorikauppa-[a-z0-9]+-flyapeg-2135s-projects\.vercel\.app' "$LOKI" | tail -1)
[ -n "$URL" ] || { echo "Julkaisun osoitetta ei löytynyt"; exit 1; }
echo "Esitestaus 3/3: savutesti $URL"
# Kolme User-Agentia (Googlebot, työpöytä-Chrome, iPhone Safari): etusivu, kategoriat, tuotesivut, kori, kassa, syöte,
# sivukartta ja tuoterajapinta. Tuotteiden on tultava staattisesta katalogista (X-Tuotelahde: katalogi), jolloin sivut
# eivät riipu tietokannasta (5.11.2026: Neonin kiintiön loppuminen kaatoi tuotelistat, syötteen ja sivukartan).
VIRHEET=0
UAT=("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1")
SIVUT=(/ /kategoria/t-paidat /kategoria/hupparit /tuote/tonnin-seteli-t-paita /tuote/kalju-t-paita /ostoskori /kassa /toimitusehdot /abipaidat /paidat/opettaja /joululahjat /api/products "/api/products?slug=tonnin-seteli-t-paita" /product-feed.xml /sitemap.xml)
for UA in "${UAT[@]}"; do
  echo "  UA: ${UA:0:40}"
  for P in "${SIVUT[@]}"; do
    KOODI=$(npx vercel curl "$P" --deployment "$URL" --yes -- -s -m 300 -o /dev/null -w "%{http_code}" -A "$UA" 2>/dev/null | tail -1 || true)
    echo "    $KOODI $P"
    [ "$KOODI" = "200" ] || VIRHEET=$((VIRHEET + 1))
  done
done
LAHDE=$(npx vercel curl "/api/products?slug=tonnin-seteli-t-paita" --deployment "$URL" --yes -- -s -m 120 -D - -o /dev/null 2>/dev/null | grep -i '^x-tuotelahde:' | tr -d '\r' | awk '{print $2}' || true)
echo "  tuotelähde: ${LAHDE:-?}"
[ "$LAHDE" = "katalogi" ] || VIRHEET=$((VIRHEET + 1))
if [ "$VIRHEET" -gt 0 ]; then
  echo "SAVUTESTI EPÄONNISTUI ($VIRHEET sivua): tuotanto pysyy edellisessä versiossa. Versio: $URL"
  exit 1
fi
npx vercel promote "$URL" --yes --local-config .vercel/vercel.uusi.json
