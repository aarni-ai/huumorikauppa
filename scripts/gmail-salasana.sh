#!/usr/bin/env bash
# Gmailin sovellussalasana Huumorikaupan väliaikaiselle lähetysreitille (3.11.2026, api/_lib/sahkoposti.js).
# Ajo: bash ~/huumorikauppa/scripts/gmail-salasana.sh
#
# 1. Kysyy salasanan piilotettuna (ei näy ruudulla, chatissa eikä komentohistoriassa) ja poistaa välilyönnit.
# 2. Kokeilee kirjautumista smtp.gmail.com:iin (ei lähetä viestiä).
# 3. Tallentaa sen Verceliin (projekti huumorikauppa, production, salaisena muuttujana GMAIL_APP_PASSWORD) ja
#    paikallisesti tiedostoon .env.gmail.local (gitignoroitu, vain omistajan luettavissa).
# Salasanaa ei tulosteta. Seuraava julkaisu (scripts/julkaise-uusi.sh) ottaa sen käyttöön.
set -euo pipefail
cd "$(dirname "$0")/.."

TILI=huumorikauppa@gmail.com
echo "Gmailin sovellussalasana tilille $TILI"
echo "Luo se osoitteessa https://myaccount.google.com/apppasswords (vaatii kaksivaiheisen tunnistuksen),"
echo "kirjautuneena tilille $TILI. Nimeksi esimerkiksi Huumorikauppa. Google näyttää 16 kirjainta."
printf "Liitä salasana ja paina Enter (ei näy ruudulla): "
IFS= read -rs SALASANA
echo
SALASANA=$(printf '%s' "$SALASANA" | tr -d '[:space:]')
if ! printf '%s' "$SALASANA" | grep -Eq '^[A-Za-z]{16}$'; then
  unset SALASANA
  echo "Salasanassa pitää olla 16 kirjainta (välilyönneillä tai ilman). Mitään ei tallennettu."
  exit 1
fi

echo "Tarkistetaan kirjautuminen Gmailiin..."
if ! GMAIL_APP_PASSWORD="$SALASANA" GMAIL_USER="$TILI" node -e '
  import("nodemailer").then(async ({ default: nm }) => {
    const t = nm.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
    await t.verify();
  }).catch((e) => { console.error("Kirjautuminen epäonnistui: " + String(e && e.message || e).slice(0, 200)); process.exit(1); });
'; then
  unset SALASANA
  echo "Tarkista, että salasana on luotu tilille $TILI. Mitään ei tallennettu."
  exit 1
fi
echo "Kirjautuminen onnistui."

echo "Tallennetaan Verceliin (production)..."
printf '%s' "$SALASANA" | npx vercel env add GMAIL_APP_PASSWORD --environment production --sensitive --force --yes >/dev/null

umask 077
printf 'GMAIL_APP_PASSWORD=%s\n' "$SALASANA" > .env.gmail.local
unset SALASANA
git check-ignore -q .env.gmail.local || echo "VAROITUS: .env.gmail.local ei ole gitignoroitu, älä commitoi sitä."

echo "Valmis. Salasana on Vercelissä ja tiedostossa .env.gmail.local."
echo "Seuraava julkaisu (scripts/julkaise-uusi.sh) ottaa Gmail-reitin käyttöön. Tarkistus julkaisun jälkeen:"
echo "  /api/cron/tilaukset?tehtava=sahkopostireitti näyttää reitti gmail."
