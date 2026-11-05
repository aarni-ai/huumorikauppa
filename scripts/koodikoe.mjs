#!/usr/bin/env node
/**
 * Koodien tuotantokoe kassalla (5.11.2026): ERAMAANKULKIJAT, kannan ollessa kiinni luotu kumppanikoodi (kuten
 * kierroksen 3 koodit), uutiskirjeen TERVE-koodi ja lahjakortti. Ei maksa mitään: jokainen Stripe-sessio vanhennetaan
 * heti, ja webhook vapauttaa varaukset. Testikortti ja testikumppani luodaan ja poistetaan cron-reitillä
 * ?tehtava=koodikoe (valmistele, siivoa). Osoite kassatesti@huumorikauppa.fi (rajattu mittareista).
 *
 *   node scripts/koodikoe.mjs [--url https://huumorikauppa-five.vercel.app]
 *
 * Avaimia ei tulosteta: CRON_SECRET .env.cron.local, Stripen avain .env.stripe.local (vain sessioiden vanhennus).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const JUURI = join(dirname(fileURLToPath(import.meta.url)), "..");
const arvo = (n, oletus) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : oletus);
const POHJA = arvo("--url", "https://huumorikauppa-five.vercel.app").replace(/\/$/, "");
const EMAIL = "kassatesti@huumorikauppa.fi";
const env = (tiedosto, nimi) => {
  const p = join(JUURI, tiedosto);
  const m = existsSync(p) ? readFileSync(p, "utf8").match(new RegExp(`^${nimi}=(.*)$`, "m")) : null;
  return m ? m[1].replace(/^"|"$/g, "") : "";
};
const CRON = env(".env.cron.local", "CRON_SECRET");
const STRIPE = env(".env.stripe.local", "STRIPE_SECRET_KEY");

const cron = async (q) => (await fetch(`${POHJA}/api/cron/tilaukset?${q}`, { headers: { Authorization: `Bearer ${CRON}` } })).json();
const post = async (polku, body) => (await fetch(`${POHJA}${polku}`, { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://huumorikauppa.fi" }, body: JSON.stringify(body) })).json();
const tuote = async (slug, koko = "M") => {
  const t = await (await fetch(`${POHJA}/api/products?slug=${slug}`)).json();
  const pois = new Set(t.unavailable_variants || []);
  const [color, size] = Object.keys(t.variants.variant_map).find((k) => k.endsWith(`|${koko}`) && !pois.has(k)).split("|");
  return { id: t.id, slug: t.slug, name: t.name, color, size, quantity: 1 };
};
const kori = async (lisa, slug = "tonnin-seteli-huppari") => post("/api/checkout", {
  items: [await tuote(slug)], customerEmail: EMAIL, customerName: "Kassa Testi",
  shippingAddress: { address: "Testikatu 1", zip: "00100", city: "Helsinki", phone: "0400000000" }, ...lisa,
});
const sessiot = [];
const sessio = (r) => { const m = String(r?.url || "").match(/\/(cs_(?:live|test)_[A-Za-z0-9]+)/); if (m) sessiot.push(m[1]); return m?.[1]; };
async function stripeSession(id, toiminto = "") {
  const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}${toiminto}`, { method: toiminto ? "POST" : "GET", headers: { Authorization: `Bearer ${STRIPE}` } });
  return r.json();
}

let virheita = 0;
const tulos = (nimi, ok, tieto = "") => { if (!ok) virheita++; console.log(`${ok ? "OK  " : "VIRHE"} ${nimi}${tieto ? `: ${tieto}` : ""}`); };

const tila = await cron("tehtava=kanta-tila");
console.log(`kanta vastaa: ${tila.kanta}`);
const v = await cron("tehtava=koodikoe&vaihe=valmistele");
tulos("valmistelu (testikortti 5 €, testikumppani)", v.ok);
try {
  // 1. ERAMAANKULKIJAT
  const k1 = await post("/api/checkout", { action: "kumppanikoodi", code: "ERAMAANKULKIJAT", items: [await tuote("tonnin-seteli-huppari")] });
  tulos("ERAMAANKULKIJAT kassan tarkistus", k1.ok && k1.koodi === "eramaankulkijat", `malli ${k1.malli}, alennus ${k1.prosentti} %`);
  const r1 = await kori({ kumppani: "ERAMAANKULKIJAT" });
  const s1 = sessio(r1) && await stripeSession(sessio(r1));
  tulos("ERAMAANKULKIJAT maksusessio", r1.ok && !!s1?.id, s1 ? `summa ${(s1.amount_total / 100).toFixed(2)} €, puskuri ${s1.metadata?.puskuri || "-"}` : r1.error);

  // 2. Kumppanikoodi luotuna kannan ollessa kiinni (sama polku kuin kierroksen 3 koodit /hallinta/kumppanit)
  const k2 = await (await fetch(`${POHJA}/api/sahkoposti?kumppanisivu=kassatesti-kumppani`)).json();
  tulos("uusi kumppanikoodi /k/-sivu", k2.ok === true, `${k2.nimi || ""} (${k2.malli || "-"})`);
  const r2 = await kori({ kumppani: "kassatesti-kumppani" });
  tulos("uusi kumppanikoodi maksusessio", r2.ok && !!sessio(r2), r2.error || "");

  // 3. Uutiskirjeen koodi
  const u = await post("/api/sahkoposti", { action: "tilaa", email: EMAIL, suostumus: true, lahde: "koodikoe" });
  tulos("uutiskirjeen tilaus ja koodi", !!u.koodi, u.koodi ? `${u.koodi.slice(0, 6)}…, ${u.prosentti} %` : JSON.stringify(u));
  if (u.koodi) {
    const t3 = await post("/api/checkout", { action: "alennuskoodi", code: u.koodi, email: EMAIL });
    tulos("uutiskirjeen koodi kassan tarkistus", t3.ok === true, t3.ok ? `${t3.percent} %` : t3.error);
    const r3 = await kori({ discountCode: u.koodi });
    tulos("uutiskirjeen koodi maksusessio", r3.ok && !!sessio(r3), r3.error || "");
    const r3b = await kori({ discountCode: u.koodi });
    tulos("sama koodi toiseen tilaukseen estetty", r3b.ok === false, r3b.error || "MENI LÄPI");
  }

  // 4. Lahjakortti
  const KORTTI = v.kortti;
  const l = await post("/api/checkout", { action: "lahjakortti", code: KORTTI });
  tulos("lahjakortin saldo", l.ok && l.saldo === 5, `${l.saldo} €`);
  const r4 = await kori({ giftCardCode: KORTTI }, "tonnin-seteli-t-paita");
  const s4 = sessio(r4) && await stripeSession(sessio(r4));
  tulos("lahjakortti maksusessio", r4.ok && !!s4?.id, s4 ? `maksettavaa ${(s4.amount_total / 100).toFixed(2)} € (kortilla 5,00 €)` : r4.error);
  const l2 = await post("/api/checkout", { action: "lahjakortti", code: KORTTI });
  tulos("saldo varattu toiselle tilaukselle", l2.ok === false, l2.error || `saldo ${l2.saldo}`);
  const r4b = await kori({ giftCardCode: KORTTI }, "tonnin-seteli-t-paita");
  tulos("sama kortti toiseen tilaukseen estetty", r4b.ok === false, r4b.error || "MENI LÄPI");
} finally {
  // Sessiot vanhaksi: webhook checkout.session.expired vapauttaa varaukset.
  for (const id of sessiot) await stripeSession(id, "/expire").catch(() => null);
  console.log(`vanhennettu ${sessiot.length} sessiota`);
  if (v.kortti) {
    let vapaa = null;
    for (let i = 0; i < 12 && !(vapaa?.ok); i++) {
      await new Promise((r) => setTimeout(r, 5000));
      vapaa = await post("/api/checkout", { action: "lahjakortti", code: v.kortti });
    }
    tulos("vanhentunut sessio vapautti kortin saldon", vapaa?.ok && vapaa.saldo === 5, vapaa?.ok ? `${vapaa.saldo} €` : vapaa?.error);
  }
  const s = await cron("tehtava=koodikoe&vaihe=siivoa");
  tulos("siivous", s.ok, `poistettu ${s.poistettu} tiedostoa, ${s.tilauksia} testitilausta`);
}
console.log(virheita ? `KOODIKOE: ${virheita} virhettä` : "KOODIKOE: kaikki ok");
process.exit(virheita ? 1 : 0);
