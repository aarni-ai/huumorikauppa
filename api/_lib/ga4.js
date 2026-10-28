/**
 * GA4 Data API viikkomittareihin (KASVU-RAPORTTI.md): kävijät, istunnot ja ostot ISO-viikoittain. Ilmainen API,
 * ei laskutustiliä: palvelutili omassa Google Cloud -projektissa, lukuoikeus GA4-propertyyn. Käyttöönotto
 * KAYTTOONOTTO.md "GA4 Data API". Ilman ympäristömuuttujia palauttaa null (taulukko jää Coworkin varaan).
 *
 * GA4_PROPERTY_ID   propertyn numerotunnus (Ylläpito > Propertyn tiedot), ei mittaustunnus G-...
 * GA4_PALVELUTILI   palvelutilin JSON-avain kokonaisena
 */
import { createSign } from "node:crypto";

export const onGa4 = () => Boolean(process.env.GA4_PROPERTY_ID && process.env.GA4_PALVELUTILI);

const b64url = (s) => Buffer.from(s).toString("base64url");

async function haeToken() {
  const tili = JSON.parse(process.env.GA4_PALVELUTILI);
  const nyt = Math.floor(Date.now() / 1000);
  const runko = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({
    iss: tili.client_email, scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token", iat: nyt, exp: nyt + 3600,
  }))}`;
  const allekirjoitus = createSign("RSA-SHA256").update(runko).sign(tili.private_key, "base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${runko}.${allekirjoitus}` }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`GA4-token: ${j.error || r.status}`);
  return j.access_token;
}

/** ISO-viikoittain { "2026-W44": { kavijat, istunnot, ostot, konversio } } alkupäivästä tähän päivään. */
export async function ga4Viikot(alku) {
  if (!onGa4()) return null;
  const token = await haeToken();
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      dateRanges: [{ startDate: alku, endDate: "today" }],
      dimensions: [{ name: "isoYearIsoWeek" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "ecommercePurchases" }],
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`GA4-raportti: ${j.error?.message || r.status}`);
  const tulos = {};
  for (const rivi of j.rows || []) {
    const v = rivi.dimensionValues[0].value; // "202644"
    const [kavijat, istunnot, ostot] = rivi.metricValues.map((m) => Number(m.value) || 0);
    tulos[`${v.slice(0, 4)}-W${v.slice(4)}`] = { kavijat, istunnot, ostot, konversio: istunnot ? Math.round((ostot / istunnot) * 10000) / 100 : 0 };
  }
  return tulos;
}

/** Ostosuppilon tapahtumat (src/lib/analytics.ts). */
export const SUPPILO = ["view_item", "add_to_cart", "begin_checkout", "purchase"];

/**
 * Ostosuppilo ISO-viikoittain: { "2026-W44": { view_item, add_to_cart, begin_checkout, purchase } } tapahtumien
 * määrinä alkupäivästä tähän päivään. null ilman ympäristömuuttujia.
 */
export async function ga4Suppilo(alku) {
  if (!onGa4()) return null;
  const token = await haeToken();
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      dateRanges: [{ startDate: alku, endDate: "today" }],
      dimensions: [{ name: "isoYearIsoWeek" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: SUPPILO } } },
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`GA4-suppilo: ${j.error?.message || r.status}`);
  const tulos = {};
  for (const rivi of j.rows || []) {
    const v = rivi.dimensionValues[0].value;
    const viikko = `${v.slice(0, 4)}-W${v.slice(4)}`;
    tulos[viikko] ??= Object.fromEntries(SUPPILO.map((e) => [e, 0]));
    tulos[viikko][rivi.dimensionValues[1].value] = Number(rivi.metricValues[0].value) || 0;
  }
  return tulos;
}
