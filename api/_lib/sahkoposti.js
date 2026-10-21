/**
 * Sähköposti Resendillä (RESEND_API_KEY, lähettäjä EMAIL_FROM, esim. "Huumorikauppa <tilaukset@huumorikauppa.fi>",
 * domain vahvistettava Resendissä). Omistajan hälytykset osoitteeseen OMISTAJA_EMAIL (oletus info@seniorituki.fi).
 * Ilman avainta viesti kirjataan lokiin eikä mitään lähetetä.
 */
export const OMISTAJA = () => process.env.OMISTAJA_EMAIL || "info@seniorituki.fi";
export const onSahkoposti = () => !!process.env.RESEND_API_KEY;

export async function laheta({ to, subject, html, text, replyTo }) {
  if (!onSahkoposti()) {
    console.warn(`[sahkoposti] RESEND_API_KEY puuttuu, ei lähetetty: ${subject}`);
    return { ok: false, virhe: "RESEND_API_KEY puuttuu" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Huumorikauppa <tilaukset@huumorikauppa.fi>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        reply_to: replyTo || "huumorikauppa@gmail.com",
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

function kehys(sisalto) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.5">${sisalto}<p style="color:#666;font-size:13px;margin-top:28px">Kysyttävää? Vastaa tähän viestiin, niin autamme.<br>Huumorikauppa.fi</p></div>`;
}

export function vahvistusViesti(tilaus) {
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
    html: kehys(`<h2>Kiitos tilauksestasi!</h2><p>Tilausnumero: <b>#${nro}</b></p><table style="width:100%;border-collapse:collapse">${rivit}<tr><td>Toimitus</td><td style="text-align:right">${eur(tilaus.shipping)}</td></tr>${Number(tilaus.discount) > 0 ? `<tr><td>Alennus</td><td style="text-align:right">-${eur(tilaus.discount)}</td></tr>` : ""}<tr><td><b>Yhteensä</b></td><td style="text-align:right"><b>${eur(tilaus.total)}</b></td></tr>${lahjakortilla}</table><p>${loppu}</p>`),
    text: `Kiitos tilauksestasi! Tilausnumero #${nro}. Yhteensä ${eur(tilaus.total)}. ${loppu}`,
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
export function halytys(otsikko, rivit) {
  return laheta({
    to: OMISTAJA(),
    subject: `[Huumorikauppa] ${otsikko}`,
    html: kehys(`<h3>${esc(otsikko)}</h3><ul>${rivit.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`),
    text: `${otsikko}\n${rivit.join("\n")}`,
  });
}
