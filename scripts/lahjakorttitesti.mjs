/**
 * Lahjakorttipolun testi tuotantoa vasten (1.11.2026): testitilaus (TESTI, kassatesti@) -> kiitossivun koodi ja PDF ->
 * koodin tarkistus kassalla -> kassa koodilla (kori yli lahjakortin arvon: Stripe-istunto, ei maksua) -> lahjakortin osto
 * (Stripe-istunto, ei maksua) -> siivous samassa ajossa (koodit nollaan, tilaukset perutaan, istunnot vanhennetaan,
 * Printifyn testitilaukset perutaan). Koodit peitetään tulosteessa.
 *   node scripts/lahjakorttitesti.mjs   (CRON_SECRET tiedostosta .env.cron.local)
 */
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.cron.local", "utf8").split("\n").filter((r) => r.includes("=")).map((r) => [r.slice(0, r.indexOf("=")), r.slice(r.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const K = "https://huumorikauppa.fi";
const cron = (q) => fetch(`${K}/api/cron/tilaukset?${q}`, { headers: { Authorization: `Bearer ${env.CRON_SECRET}` } }).then((r) => r.json());
const peita = (k) => String(k).replace(/^(HK-....)-....-..../, "$1-****-****");
const post = (body) => fetch(`${K}/api/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
const tulos = {};
try {
  const luo = await cron("tehtava=lahjakorttitesti&vaihe=luo");
  tulos.luo = { ok: luo.ok, istunto: luo.istunto?.slice(0, 26) };
  const o = await fetch(`${K}/api/order?session_id=${luo.istunto}`).then((r) => r.json());
  const kortti = o.lahjakortit?.[0];
  tulos.kiitossivu = { found: o.found, status: o.order?.status, lahjakortteja: o.lahjakortit?.length, koodi: kortti && peita(kortti.code), arvo: kortti?.value, voimassa: kortti?.expires_at?.slice(0, 10), saaja: kortti?.recipient_name };
  const pdf = await fetch(`${K}/api/order?session_id=${luo.istunto}&lahjakortti=${encodeURIComponent(kortti.code)}`);
  const pdfData = Buffer.from(await pdf.arrayBuffer());
  tulos.pdf = { status: pdf.status, tyyppi: pdf.headers.get("content-type"), tiedosto: pdf.headers.get("content-disposition")?.replace(kortti.code, peita(kortti.code)), alku: pdfData.subarray(0, 8).toString(), tavuja: pdfData.length, koodiPdfssa: pdfData.toString("latin1").includes(`(${kortti.code}) Tj`) };
  const vaara = await fetch(`${K}/api/order?session_id=${luo.istunto}&lahjakortti=HK-AAAA-BBBB-CCCC`);
  tulos.vaaraKoodi = vaara.status;
  tulos.tarkistus = await post({ action: "lahjakortti", code: kortti.code.toLowerCase().replace(/-/g, " ") }).then((j) => ({ ok: j.ok, saldo: j.saldo }));
  // Kassa koodilla: kaksi t-paitaa (yli 35 €), joten loppu jää Stripeen eikä tilausta makseta. Koko summan kattava
  // lahjakortti merkitsisi tilauksen maksetuksi ja lähettäisi sen Printifyyn.
  const tuote = await fetch(`${K}/api/products?slug=tonnin-seteli-t-paita`).then((r) => r.json()).then((d) => (Array.isArray(d) ? d[0] : d));
  const [color, size] = Object.keys(tuote.variants.variant_map).find((k) => k.endsWith("|M")).split("|");
  const osoite = { address: "Testikatu 1", zip: "00100", city: "Helsinki", phone: "0400000000" };
  const kassa = await post({ items: [{ id: tuote.id, slug: tuote.slug, name: tuote.name, color, size, quantity: 2 }], customerEmail: "kassatesti@huumorikauppa.fi", customerName: "TESTI Lahjakortti (perutaan)", shippingAddress: osoite, giftCardCode: kortti.code });
  tulos.kassaKoodilla = { ok: kassa.ok, stripeen: /checkout\.stripe\.com/.test(String(kassa.url || "")), virhe: kassa.error };
  // Lahjakortin osto: kori pelkkä lahjakortti 25 €.
  const osto = await post({ items: [{ id: "lahjakortti-25", slug: "lahjakortti-25", name: "Lahjakortti 25 €", type: "giftcard", quantity: 1, giftCard: { recipientName: "TESTI" } }], customerEmail: "kassatesti@huumorikauppa.fi", customerName: "TESTI Lahjakortti (perutaan)" });
  tulos.lahjakortinOsto = { ok: osto.ok, stripeen: /checkout\.stripe\.com/.test(String(osto.url || "")), virhe: osto.error };
} finally {
  tulos.siivous = await cron("tehtava=lahjakorttitesti&vaihe=siivoa");
}
console.log(JSON.stringify(tulos, null, 1));
