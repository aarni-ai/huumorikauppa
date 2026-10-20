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
  return {
    subject: `Tilausvahvistus #${nro} - Huumorikauppa`,
    html: kehys(`<h2>Kiitos tilauksestasi!</h2><p>Tilausnumero: <b>#${nro}</b></p><table style="width:100%;border-collapse:collapse">${rivit}<tr><td>Toimitus</td><td style="text-align:right">${eur(tilaus.shipping)}</td></tr>${Number(tilaus.discount) > 0 ? `<tr><td>Alennus</td><td style="text-align:right">-${eur(tilaus.discount)}</td></tr>` : ""}<tr><td><b>Yhteensä</b></td><td style="text-align:right"><b>${eur(tilaus.total)}</b></td></tr></table><p>Tuotteet painetaan tilauksesta. Saat seurantalinkin sähköpostiisi, kun paketti lähtee.</p>`),
    text: `Kiitos tilauksestasi! Tilausnumero #${nro}. Yhteensä ${eur(tilaus.total)}. Saat seurantalinkin, kun paketti lähtee.`,
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
