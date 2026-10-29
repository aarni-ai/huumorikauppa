/**
 * Sähköposti Resendillä (RESEND_API_KEY, lähettäjä EMAIL_FROM, esim. "Huumorikauppa <tilaukset@huumorikauppa.fi>",
 * domain vahvistettava Resendissä). Omistajan hälytykset osoitteeseen OMISTAJA_EMAIL (Vercelin ympäristömuuttuja; oletus huumorikauppa@gmail.com).
 * Ilman avainta viesti kirjataan lokiin eikä mitään lähetetä.
 */
import { yritystiedot, postiosoite } from "./yritys.js";

export const OMISTAJA = () => process.env.OMISTAJA_EMAIL || "huumorikauppa@gmail.com";
export const onSahkoposti = () => !!process.env.RESEND_API_KEY;
/**
 * Oma tilausvahvistus korvaa Stripen kuitin vasta, kun Resend-domain on vahvistettu (DNS) ja Vercelissä on
 * SAHKOPOSTI_VAHVISTETTU=1. Siihen asti kassa pyytää Stripen kuitin (api/checkout.js receipt_email).
 */
export const omaVahvistusKaytossa = () => onSahkoposti() && process.env.SAHKOPOSTI_VAHVISTETTU === "1";

/** headers: lisäotsakkeet (markkinointiviesteissä List-Unsubscribe ja List-Unsubscribe-Post). */
export async function laheta({ to, subject, html, text, replyTo, headers, from }) {
  if (!onSahkoposti()) {
    console.warn(`[sahkoposti] RESEND_API_KEY puuttuu, ei lähetetty: ${subject}`);
    return { ok: false, virhe: "RESEND_API_KEY puuttuu" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: from || process.env.EMAIL_FROM || "Huumorikauppa <tilaukset@huumorikauppa.fi>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        reply_to: replyTo || "huumorikauppa@gmail.com",
        ...(headers && Object.keys(headers).length ? { headers } : {}),
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { ok: false, virhe: `Resend ${res.status}: ${(await res.text()).slice(0, 300)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, virhe: String(e?.message || e) };
  }
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const eur = (x) => `${Number(x).toFixed(2).replace(".", ",")} €`;
export const tilausnumero = (id) => String(id).slice(0, 8).toUpperCase();

/** Myyjän tiedot viestin alatunnisteeseen (src/config/yritys.ts: 1.11.2026 alkaen Uusiku Oy). */
export function myyjaRivi(nyt = new Date()) {
  const y = yritystiedot(nyt);
  return `${y.legalName}, Y-tunnus ${y.businessId}, ALV-numero ${y.vatId}, ${postiosoite(y)}, ${y.email}`;
}

function kehys(sisalto) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.5">${sisalto}<p style="color:#666;font-size:13px;margin-top:28px">Kysyttävää? Vastaa tähän viestiin, niin autamme.<br>Huumorikauppa.fi</p><p style="color:#888;font-size:12px">${esc(myyjaRivi())}</p></div>`;
}

const designAvain = (nimi) => {
  const osat = String(nimi ?? "").split(/\s+[|｜]\s+|\s*｜\s*/);
  return osat.length < 2 ? null : osat[0].toLowerCase().replace(/[–—-]/g, " ").replace(/[^\p{L}\p{N}%\s]/gu, " ").replace(/\s+/g, " ").trim() || null;
};

/**
 * "Seuraava tilaus" -suositukset kiitosviestiin: sama aihe (design) toisena tuotetyyppinä kuin ostettu tuote,
 * enintään 3, vain näkyvät tuotteet. Ei alennuskoodia (katesääntö: ensitilauksen koodi on pois käytöstä).
 */
export function seuraavaTilausSuositukset(tilaus, tuotteet, { piilotettu = () => false } = {}) {
  const ostetut = (tilaus.items || []).filter((i) => i.type !== "giftcard");
  const ostetutSlugit = new Set(ostetut.map((i) => i.slug));
  const ostetutKategoriat = new Map();
  for (const i of ostetut) {
    const p = tuotteet.find((t) => t.slug === i.slug);
    const k = designAvain(i.name);
    if (p && k) ostetutKategoriat.set(k, new Set([...(ostetutKategoriat.get(k) || []), p.category]));
  }
  const tulos = [];
  for (const p of tuotteet) {
    if (tulos.length >= 3) break;
    if (!p.is_active || ostetutSlugit.has(p.slug) || piilotettu(p)) continue;
    const k = designAvain(p.name);
    if (!k || !ostetutKategoriat.has(k) || ostetutKategoriat.get(k).has(p.category)) continue;
    if (tulos.some((t) => t.category === p.category && designAvain(t.name) === k)) continue;
    tulos.push(p);
  }
  return tulos.map((p) => ({ nimi: p.name, slug: p.slug, hinta: Number(p.price), category: p.category }));
}

/** Kiitosviestin "Seuraava tilaus" -osio (tyhjä, jos suosituksia ei ole). */
function suositusHtml(suositukset) {
  if (!suositukset?.length) return "";
  const rivit = suositukset.map((s) => `<li><a href="https://huumorikauppa.fi/tuote/${encodeURIComponent(s.slug)}">${esc(s.nimi)}</a>, ${eur(s.hinta)}</li>`).join("");
  return `<h3>Seuraava tilaus: sama aihe muina tuotteina</h3><ul>${rivit}</ul>`;
}

export function vahvistusViesti(tilaus, suositukset = []) {
  const rivit = (tilaus.items || [])
    .map((i) => `<tr><td style="padding:4px 0">${i.quantity} × ${esc(i.name)}${i.size ? `, ${esc(i.size)}` : ""}${i.color ? `, ${esc(i.color)}` : ""}</td><td style="text-align:right">${eur(i.unit_price * i.quantity)}</td></tr>`)
    .join("");
  const nro = tilausnumero(tilaus.id);
  const fyysisia = (tilaus.items || []).some((i) => i.type !== "giftcard");
  const lahjakortilla = Number(tilaus.gift_card_amount) > 0
    ? `<tr><td>Maksettu lahjakortilla</td><td style="text-align:right">-${eur(tilaus.gift_card_amount)}</td></tr>`
    : "";
  const loppu = fyysisia
    ? "Tuotteet painetaan tilauksesta. Saat seurantalinkin sähköpostiisi, kun paketti lähtee."
    : "Lahjakorttien koodit tulevat erillisessä viestissä.";
  return {
    subject: `Tilausvahvistus #${nro} - Huumorikauppa`,
    html: kehys(`<h2>Kiitos tilauksestasi!</h2><p>Tilausnumero: <b>#${nro}</b></p><table style="width:100%;border-collapse:collapse">${rivit}<tr><td>Toimitus</td><td style="text-align:right">${eur(tilaus.shipping)}</td></tr>${Number(tilaus.discount) > 0 ? `<tr><td>Alennus</td><td style="text-align:right">-${eur(tilaus.discount)}</td></tr>` : ""}<tr><td><b>Yhteensä</b></td><td style="text-align:right"><b>${eur(tilaus.total)}</b></td></tr><tr><td style="color:#666">Sisältää ALV 25,5 %</td><td style="text-align:right;color:#666">${eur(Number(tilaus.total) - Number(tilaus.total) / 1.255)}</td></tr>${lahjakortilla}</table><p>${loppu}</p>${suositusHtml(suositukset)}`),
    text: `Kiitos tilauksestasi! Tilausnumero #${nro}. Yhteensä ${eur(tilaus.total)} (sisältää ALV 25,5 % ${eur(Number(tilaus.total) - Number(tilaus.total) / 1.255)}). ${loppu}\n\n${myyjaRivi()}`,
  };
}

/** Lahjakortin viesti ostajalle tai saajalle (kortti: { code, initial_value, expires_at, recipient_email, recipient_name, message }). */
export function lahjakorttiViesti(kortti, { saajalle = false, ostaja = "" } = {}) {
  const voimassa = new Date(kortti.expires_at).toLocaleDateString("fi-FI", { timeZone: "Europe/Helsinki" });
  const alku = saajalle
    ? `<h2>Sait lahjakortin Huumorikauppaan${kortti.recipient_name ? `, ${esc(kortti.recipient_name)}` : ""}!</h2>${ostaja ? `<p>Lähettäjä: ${esc(ostaja)}</p>` : ""}`
    : `<h2>Lahjakorttisi on valmis</h2><p>Tässä ostamasi lahjakortin koodi.${kortti.recipient_email ? ` Lähetimme sen myös osoitteeseen ${esc(kortti.recipient_email)}.` : ""}</p>`;
  const viesti = kortti.message ? `<p style="padding:12px;background:#f4f4f0;border-radius:8px">${esc(kortti.message)}</p>` : "";
  return {
    subject: saajalle ? "Sait lahjakortin Huumorikauppaan" : `Lahjakorttisi ${eur(kortti.initial_value)} - Huumorikauppa`,
    html: kehys(`${alku}${viesti}<p style="font-size:22px;letter-spacing:2px"><b>${esc(kortti.code)}</b></p><p>Arvo: <b>${eur(kortti.initial_value)}</b><br>Voimassa ${voimassa} asti.</p><p>Näin käytät: valitse tuotteet osoitteessa <a href="https://huumorikauppa.fi">huumorikauppa.fi</a> ja kirjoita koodi kassalla kenttään "Lahjakortin koodi". Lahjakorttia voi käyttää useaan tilaukseen, kunnes saldo on käytetty. Sitä ei voi vaihtaa rahaksi.</p>`),
    text: `Lahjakortti Huumorikauppaan: ${kortti.code}. Arvo ${eur(kortti.initial_value)}, voimassa ${voimassa} asti. Kirjoita koodi kassalla kenttään "Lahjakortin koodi". Voi käyttää useaan tilaukseen, ei vaihdeta rahaksi.`,
  };
}

export function lahetysViesti(tilaus) {
  const nro = tilausnumero(tilaus.id);
  return {
    subject: `Tilauksesi #${nro} on matkalla - Huumorikauppa`,
    html: kehys(`<h2>Pakettisi on matkalla</h2><p>Tilaus #${nro} on lähtenyt${tilaus.carrier ? ` (${esc(tilaus.carrier)})` : ""}.</p>${tilaus.tracking_url ? `<p>Seuranta: <a href="${esc(tilaus.tracking_url)}">${esc(tilaus.tracking_url)}</a></p>` : ""}${tilaus.tracking_number ? `<p>Seurantakoodi: ${esc(tilaus.tracking_number)}</p>` : ""}`),
    text: `Tilaus #${nro} on matkalla. ${tilaus.tracking_url || tilaus.tracking_number || ""}`,
  };
}

/** Omistajan hälytys heti (Printify-virhe, puuttuva variantti, maksu ilman tilausta). */
export async function halytys(otsikko, rivit) {
  const viesti = {
    to: OMISTAJA(),
    subject: `[Huumorikauppa] ${otsikko}`,
    html: kehys(`<h3>${esc(otsikko)}</h3><ul>${rivit.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`),
    text: `${otsikko}\n${rivit.join("\n")}`,
  };
  const r = await laheta(viesti);
  // Ennen kuin huumorikauppa.fi on vahvistettu Resendissä (DNS), omistajan viestit Resendin testilähettäjältä
  // (toimii vain Resend-tilin omaan osoitteeseen; muuten virhe kirjataan kuten ennen).
  if (!r.ok && /domain is not verified/i.test(r.virhe || "")) {
    const from = "Huumorikauppa <onboarding@resend.dev>";
    let varalla = await laheta({ ...viesti, from });
    // Testilähettäjä toimii vain Resend-tilin omaan osoitteeseen, jonka Resend kertoo virheessä.
    const oma = /own email address \(([^)\s]+@[^)\s]+)\)/.exec(varalla.virhe || "")?.[1];
    if (!varalla.ok && oma) varalla = await laheta({ ...viesti, from, to: oma, subject: `${viesti.subject} (huumorikauppa@gmail.com, kunnes domain vahvistetaan)` });
    return varalla.ok ? { ...varalla, vastaanottaja: oma || viesti.to } : { ok: false, virhe: `${r.virhe}; testilähettäjä: ${varalla.virhe}` };
  }
  return r;
}
