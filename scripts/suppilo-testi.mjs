#!/usr/bin/env node
/**
 * Ostosuppilon selaintesti (2.11.2026): koko polku oikealla selaimella (Playwright, työpöytä ja mobiili) tuotantoa
 * vasten. Tuotesivu -> Lisää koriin -> Siirry kassalle (ostoskori) -> Jatka kassalle (kassa) -> Siirry maksamaan.
 *
 * - Oma laskuri: kirjaukset menevät oikeaan palvelimeen merkinnällä testi (window.__suppiloTesti), jolloin ne
 *   tallentuvat versioon "testi" eivätkä näy mittarin summissa (api/_lib/suppilo.js). Testi tarkistaa myös, että
 *   palvelin vastasi ok: true.
 * - GA4: collect-pyynnöt kaapataan (ei lähetetä Googlelle) ja niistä luetaan tapahtumien nimet.
 * - Käyntilaskuri ja /api/checkout kaapataan: ei käyntiä, ei tilausta eikä Stripe-istuntoa. Maksuun siirtyminen
 *   pysähtyy kaapattuun Stripe-osoitteeseen.
 * Odotus: jokainen vaihe (tuotesivu, kori, kassa, maksu) kerran omassa laskurissa ja view_item, add_to_cart,
 * begin_checkout kerran GA4:ssä.
 *
 * Ajo: PLAYWRIGHT=/polku/node_modules/playwright/index.mjs node scripts/suppilo-testi.mjs [tuotepolku]
 */
const pw = await import(process.env.PLAYWRIGHT || "playwright");
const { chromium, devices } = pw.default ?? pw;
const BASE = process.env.KAUPPA || "https://huumorikauppa.fi";
const TUOTE = process.argv[2] || "/tuote/elakkeella-kello-on-vain-koru-t-paita-elakelaiselle";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const ODOTUS = { oma: { tuotesivu: 1, kori: 1, kassa: 1, maksu: 1 }, ga4: { view_item: 1, add_to_cart: 1, begin_checkout: 1 } };

async function polku(nimi, asetukset) {
  const selain = await chromium.launch();
  const ctx = await selain.newContext({ ...asetukset, locale: "fi-FI" });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    window.__suppiloTesti = true;
  });
  const oma = [], vastaukset = [], ga = [];
  await ctx.route("**/api/sahkoposti", async (r) => {
    const b = JSON.parse(r.request().postData() || "{}");
    if (b.action === "kaynti") return r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    if (b.action === "suppilo") {
      oma.push(b.vaihe);
      if (b.testi !== true) vastaukset.push(`${b.vaihe}: ilman testimerkintää`);
      const v = await r.fetch();
      const j = await v.json().catch(() => ({}));
      if (j.ok !== true) vastaukset.push(`${b.vaihe}: palvelin ${v.status()} ${JSON.stringify(j)}`);
      return r.fulfill({ response: v });
    }
    return r.continue();
  });
  await ctx.route(/\/g\/collect/, async (r) => {
    const q = [r.request().url().split("?")[1] || "", ...(r.request().postData() || "").split("\n")].join("\n");
    for (const m of q.matchAll(/(?:^|[&\n])en=([a-z_]+)/g)) ga.push(m[1]);
    return r.fulfill({ status: 204, body: "" });
  });
  await ctx.route("**/api/checkout", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, url: "https://checkout.stripe.com/c/pay/suppilotesti" }) }));
  await ctx.route("https://checkout.stripe.com/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<p>stripe (testi)</p>" }));

  const s = await ctx.newPage();
  await s.goto(BASE + TUOTE, { waitUntil: "load", timeout: 60000 });
  await s.locator("[data-lisaa-koriin]").first().waitFor();
  await s.getByRole("button", { name: /^Hyväksy$/ }).first().click().catch(() => undefined);
  await s.waitForTimeout(1500);
  await s.locator("button", { hasText: /^M$/ }).first().click();
  await s.locator("[data-lisaa-koriin]").first().click();
  await s.getByRole("link", { name: /Siirry kassalle/ }).first().click();
  await s.waitForURL(/\/ostoskori/);
  await s.getByRole("link", { name: /Jatka kassalle/ }).first().click();
  await s.waitForURL(/\/kassa/);
  await s.waitForTimeout(1000);
  const tayta = { firstName: "TESTI", lastName: "Suppilo", email: "kassatesti@huumorikauppa.fi", phone: "0401234567", address: "Testikatu 1", zip: "00100", city: "Helsinki" };
  for (const [id, arvo] of Object.entries(tayta)) {
    const k = s.locator(`#${id}`);
    if (await k.count()) await k.fill(arvo);
  }
  await s.locator("form:has(#firstName) button[type=submit]").first().click();
  await s.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 }).catch(() => undefined);
  await s.waitForTimeout(1500);
  const loppu = s.url();
  await selain.close();

  const laske = (a) => a.reduce((o, x) => ((o[x] = (o[x] || 0) + 1), o), {});
  const tulos = { oma: laske(oma), ga4: laske(ga.filter((e) => e in ODOTUS.ga4 || e === "purchase")) };
  const virheet = [...vastaukset];
  for (const [lahde, odotus] of Object.entries(ODOTUS)) {
    for (const [k, n] of Object.entries(odotus)) if ((tulos[lahde][k] || 0) !== n) virheet.push(`${lahde} ${k}: ${tulos[lahde][k] || 0} (odotus ${n})`);
  }
  if (!/checkout\.stripe\.com/.test(loppu)) virheet.push(`maksuun siirtyminen ei tapahtunut (${loppu})`);
  console.log(`${nimi}: oma ${JSON.stringify(tulos.oma)}, GA4 ${JSON.stringify(tulos.ga4)}${virheet.length ? `\n  VIRHEET: ${virheet.join("; ")}` : " OK"}`);
  return virheet.length === 0;
}

const ok = [
  await polku("työpöytä", { viewport: { width: 1366, height: 900 }, userAgent: UA }),
  await polku("mobiili", { ...devices["iPhone 13"] }),
];
process.exit(ok.every(Boolean) ? 0 : 1);
