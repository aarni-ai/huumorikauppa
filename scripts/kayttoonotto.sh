#!/usr/bin/env bash
# Oman taustan käyttöönotto yhdellä julkaisulla (KAYTTOONOTTO.md, "Go-live").
#   cd ~/huumorikauppa && git checkout oma-tausta && git pull && scripts/kayttoonotto.sh
#
# 1. Tarkistaa, että Vercel-projektissa huumorikauppa (production) on STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
#    RESEND_API_KEY, MYYJA, CRON_SECRET, DATABASE_URL, PRINTIFY_API_KEY ja PRINTIFY_SHOP_ID. Puuttuva: lopettaa.
# 2. Ajaa testit ja julkaisee (npx vercel deploy --prod): uusi tausta, kassa 6,90 € / ilmainen toimitus 79 eurosta
#    (api/_lib/vakiot.js), MYYJA=uusiku ja Vercel Cron samassa julkaisussa.
# 3. Tarkistaa testiosoitteen curlilla kolmella User-Agentilla (200, Uusiku Oy, tuotelähde tietokanta), kassan
#    (scripts/kassatesti.mjs), valvonnan kuiva-ajon, Resend-domainin tilan ja käyttöönottotestin (Neon, Stripe-webhook,
#    Printify-testitilaus perutaan, vahvistusviesti).
# Ei koske domainiin: huumorikauppa.fi siirretään projektiin erikseen (KAYTTOONOTTO.md kohta 9).
set -euo pipefail
cd "$(dirname "$0")/.."
POHJA="${KAUPPA_TESTI_URL:-https://huumorikauppa-five.vercel.app}"

echo "1/4 Ympäristömuuttujat (production)"
nimet=$(npx vercel env ls production 2>/dev/null | awk '{print $1}')
puuttuu=0
for k in STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET MYYJA CRON_SECRET DATABASE_URL PRINTIFY_API_KEY PRINTIFY_SHOP_ID UUSI_TAUSTA; do
  if grep -qx "$k" <<<"$nimet"; then echo "  ok      $k"; else echo "  PUUTTUU $k"; puuttuu=1; fi
done
# Resend ei ole pakollinen: ilman sitä Stripe lähettää asiakkaalle kuitin (api/checkout.js receipt_email).
grep -qx RESEND_API_KEY <<<"$nimet" && echo "  ok      RESEND_API_KEY" || echo "  (ei)    RESEND_API_KEY: tilausvahvistus Stripen kuittina"
[ "$puuttuu" = 0 ] || { echo "Lisää puuttuvat Verceliin (KAYTTOONOTTO.md) ja aja uudelleen."; exit 1; }

echo "2/4 Testit"
npx vitest run >/dev/null && echo "  testit ok"

echo "3/4 Julkaisu"
scripts/julkaise-uusi.sh >/dev/null && echo "  julkaistu $POHJA"

echo "4/4 Tarkistukset"
virhe=0
for ua in "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36" \
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1" \
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"; do
  for u in / /tuote/tonnin-seteli-t-paita /toimitusehdot /kassa; do
    koodi=$(curl -s -o /tmp/hk-kayttoonotto.html -w '%{http_code}' -A "$ua" "$POHJA$u")
    grep -q "Uusiku Oy" /tmp/hk-kayttoonotto.html && myyja=Uusiku || myyja="EI Uusiku"
    printf '  %-9s %-28s %s %s\n' "${ua:13:9}" "$u" "$koodi" "$myyja"
    { [ "$koodi" = 200 ] && [ "$myyja" = Uusiku ]; } || virhe=1
  done
done
lahde=$(curl -s -D - -o /dev/null "$POHJA/api/products?slug=tonnin-seteli-t-paita" | tr -d '\r' | awk -F': ' 'tolower($1)=="x-tuotelahde"{print $2}')
echo "  tuotelähde: $lahde"; [ "$lahde" = tietokanta ] || virhe=1
node scripts/kassatesti.mjs --url "$POHJA" --salli-live || virhe=1
S=$(cut -d= -f2- .env.cron.local)
echo "  valvonta: $(curl -s -m 90 -H "Authorization: Bearer $S" "$POHJA/api/cron/tilaukset?kuiva=1" | head -c 300)"
echo "  resend:   $(curl -s -m 60 -H "Authorization: Bearer $S" "$POHJA/api/cron/tilaukset?tehtava=resend-domain" | head -c 300)"
# Neon-tallennus, Stripe-sessioiden vanhennus (webhook checkout.session.expired), Printify-testitilaus EU-painotalolle
# (perutaan ennen tuotantoa) ja tilausvahvistus Resendillä omistajalle.
echo "  käyttöönottotesti:"
curl -s -m 90 -H "Authorization: Bearer $S" "$POHJA/api/cron/tilaukset?tehtava=kayttoonottotesti" | python3 -m json.tool | sed 's/^/    /'
echo "  webhook-tarkistus 30 s myöhemmin:"
sleep 30
curl -s -m 90 -H "Authorization: Bearer $S" "$POHJA/api/cron/tilaukset?tehtava=kayttoonottotesti&kuiva=1" | python3 -c 'import json,sys; d=json.load(sys.stdin); [print("    ", w["id"], w["status"], ", ".join(w["tapahtumat"])) for w in d.get("webhook", [])]' 
unset S
[ "$virhe" = 0 ] && echo "Valmis. Seuraavaksi domain (KAYTTOONOTTO.md kohta 9)." || { echo "Tarkistuksissa virheitä, katso yllä."; exit 1; }
