#!/usr/bin/env node
/**
 * Kassan savutesti (27.10.2026): luo oman taustan kassalla (/api/checkout) Stripe Checkout -session kahdelle korille
 * ja tarkistaa vastauksen. Ei maksa mitään: maksu tehdään selaimessa Stripen sivulla (testitilassa kortti
 * 4242 4242 4242 4242). Session summa ja toimitusmaksu tarkistetaan Stripen sivulta tai Stripen hallinnasta.
 *
 *   node scripts/kassatesti.mjs [--url https://huumorikauppa-five.vercel.app] [--email osoite]
 *
 * Korit: yksi t-paita (alle ilmaisen toimituksen rajan, toimitusmaksu peritään), neljä t-paitaa (yli rajan,
 * ilmainen toimitus) ja huppari 3XL (koon mukainen hinta). Tulostaa jokaisesta session tunnuksen alun (cs_test_ / cs_live_). Live-avaimella ajo
 * päättyy virheeseen, ellei mukana ole --salli-live.
 */
const arvo = (n, oletus) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : oletus);
const POHJA = arvo("--url", "https://huumorikauppa-five.vercel.app").replace(/\/$/, "");
const EMAIL = arvo("--email", "kassatesti@huumorikauppa.fi");
const SALLI_LIVE = process.argv.includes("--salli-live");

const tuote = await (await fetch(`${POHJA}/api/products?slug=tonnin-seteli-t-paita`)).json().then((d) => (Array.isArray(d) ? d[0] : d));
if (!tuote?.id) throw new Error("Testituotetta tonnin-seteli-t-paita ei löytynyt");
const [color, size] = (Object.keys(tuote.variants?.variant_map || {}).find((k) => k.endsWith("|M")) || "Musta|M").split("|");
const rivi = (quantity) => ({ id: tuote.id, slug: tuote.slug, name: tuote.name, color, size, quantity });
const pyynto = (items) => ({
  items,
  customerEmail: EMAIL,
  customerName: "Kassa Testi",
  shippingAddress: { address: "Testikatu 1", zip: "00100", city: "Helsinki", phone: "0400000000" },
});

// Huppari koossa 3XL (koon mukainen hinta, api/_lib/kokohinnat.js). Ajetaan viimeisenä: käyttöönottotesti tekee
// viimeisimmästä tilauksesta Printify-testitilauksen (EU-painotalo) ja perii sen.
const huppari = await (await fetch(`${POHJA}/api/products?slug=tonnin-seteli-huppari`)).json().catch(() => null);
const hupparinAvain = Object.keys(huppari?.variants?.variant_map || {}).find((k) => k.endsWith("|3XL"));
const korit = [["1 t-paita (toimitusmaksu)", [rivi(1)]], ["4 t-paitaa (ilmainen toimitus)", [rivi(4)]]];
if (hupparinAvain) {
  const [hv, hk] = hupparinAvain.split("|");
  korit.push([`1 huppari ${hk} (${huppari.variants.size_prices?.[hk] ?? huppari.price} €)`, [{ id: huppari.id, slug: huppari.slug, name: huppari.name, color: hv, size: hk, quantity: 1 }]]);
}

let virheita = 0;
for (const [nimi, items] of korit) {
  const r = await fetch(`${POHJA}/api/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pyynto(items)) });
  const j = await r.json().catch(() => ({}));
  const url = String(j.url || "");
  const tila = /\/[cg]\/pay\/cs_test_/.test(url) ? "testi" : /\/[cg]\/pay\/cs_live_/.test(url) ? "live" : null;
  const ok = r.status === 200 && j.ok && /^https:\/\/checkout\.stripe\.com\//.test(url) && (tila === "testi" || (tila === "live" && SALLI_LIVE));
  if (!ok) virheita++;
  console.log(`${ok ? "OK " : "VIRHE"} ${nimi}: HTTP ${r.status}, ${j.ok ? `Stripe-sessio (${tila ?? "tuntematon tila"})` : j.error || "ei vastausta"}${ok ? `\n    ${url.slice(0, 80)}...` : ""}`);
}
process.exit(virheita ? 1 : 0);
