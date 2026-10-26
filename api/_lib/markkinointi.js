/**
 * Sähköpostimarkkinointi (Resendin ilmaistaso: 3000 viestiä kuukaudessa, 100 päivässä).
 *
 *  - Uutiskirjeen tilaus suostumuksella (taulu subscribers: suostumuksen aika, teksti ja lähde). Ensitilauksen koodi
 *    (vakiot.js ENSITILAUS_ALENNUS_PROSENTTI, 0 = pois käytöstä) lähetetään sähköpostilla: yksi koodi per osoite,
 *    vain ensimmäiseen maksettuun tilaukseen ja vain samalla osoitteella.
 *  - Keskeneräisen tilauksen muistutus 1 h ja 24 h kuluttua (taulu abandoned_carts): vain, jos asiakas valitsi kassalla
 *    "Lähetä minulle muistutus". Muistutukset loppuvat, kun samalla osoitteella maksetaan tilaus.
 *  - Arviopyyntö kerran per tilaus: 7 päivää toimituksesta (Printifyn delivered_at), tai jos toimituspäivää ei tule,
 *    10 päivää lähetyksestä.
 *  - Jokaisessa viestissä on allekirjoitettu peruutuslinkki ja List-Unsubscribe (yhden klikkauksen peruutus).
 *    Peruutus kirjaa osoitteen tauluun email_optouts, ja siihen osoitteeseen ei lähetetä enää markkinointia.
 *  - Lähetysraja: enintään MARKKINOINTI_RAJA_AJO viestiä ajossa (oletus 20) ja MARKKINOINTI_RAJA_PAIVA päivässä
 *    (oletus 60, jolloin tilausvahvistuksille ja lähetysviesteille jää 40 Resendin päivärajasta).
 *
 * Tietovarasto on rajapinta (api/_lib/markkinointi-db.js pgMarkkinointi), testeissä muistivarasto.
 * Allekirjoitusavain: MARKKINOINTI_SALAISUUS, varalla CRON_SECRET. Ilman avainta markkinointia ei lähetetä.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ENSITILAUS_ALENNUS_PROSENTTI, SUOSTUMUS_UUTISKIRJE, SUOSTUMUS_MUISTUTUS } from "./vakiot.js";
import { tilausnumero } from "./sahkoposti.js";

export { SUOSTUMUS_UUTISKIRJE, SUOSTUMUS_MUISTUTUS };
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MUISTUTUS_1_MIN = 60;
export const MUISTUTUS_2_MIN = 24 * 60;
export const ARVOSTELU_TOIMITUKSESTA_PV = 7;
export const ARVOSTELU_LAHETYKSESTA_PV = 10;
const KORI_VANHENEE_PV = 7;

export const kauppaUrl = () => (process.env.KAUPPA_URL || "https://huumorikauppa.fi").replace(/\/$/, "");
export const normalisoiEmail = (x) => (typeof x === "string" ? x.trim().toLowerCase().slice(0, 254) : "");
export const kelpaaEmail = (x) => EMAIL_RE.test(normalisoiEmail(x));

// ---------- Allekirjoitetut linkit ----------

const salaisuus = () => process.env.MARKKINOINTI_SALAISUUS || process.env.CRON_SECRET || "";
export const onAllekirjoitus = () => !!salaisuus();
const b64 = (x) => Buffer.from(x).toString("base64url");
const mac = (data) => createHmac("sha256", salaisuus()).update(data).digest("base64url");

/** Allekirjoitettu tunniste: tarkoitus ("peru", "kori", "arvostelu") ja arvo (sähköposti tai id). */
export function allekirjoita(tarkoitus, arvo) {
  if (!onAllekirjoitus()) throw new Error("MARKKINOINTI_SALAISUUS tai CRON_SECRET puuttuu");
  const data = b64(JSON.stringify([tarkoitus, String(arvo)]));
  return `${data}.${mac(data)}`;
}

/** Tunnisteen arvo, jos allekirjoitus ja tarkoitus täsmäävät; muuten null. */
export function tarkistaTunniste(tunniste, tarkoitus) {
  if (!onAllekirjoitus() || typeof tunniste !== "string" || tunniste.length > 600) return null;
  const [data, allekirjoitus] = tunniste.split(".");
  if (!data || !allekirjoitus) return null;
  const odotettu = Buffer.from(mac(data));
  const saatu = Buffer.from(allekirjoitus);
  if (odotettu.length !== saatu.length || !timingSafeEqual(odotettu, saatu)) return null;
  try {
    const [t, arvo] = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    return t === tarkoitus ? arvo : null;
  } catch {
    return null;
  }
}

export const peruutusLinkki = (email) => `${kauppaUrl()}/unsubscribe?token=${encodeURIComponent(allekirjoita("peru", normalisoiEmail(email)))}`;
export const koriLinkki = (koriId) => `${kauppaUrl()}/palauta-kori?token=${encodeURIComponent(allekirjoita("kori", koriId))}`;
export const arvosteluLinkki = (tilausId) => `${kauppaUrl()}/arvostele?token=${encodeURIComponent(allekirjoita("arvostelu", tilausId))}`;

/** Yhden klikkauksen peruutus (RFC 8058): posti-ohjelma lähettää POST-pyynnön tähän osoitteeseen. */
export function peruutusOtsakkeet(email) {
  const url = `${kauppaUrl()}/api/sahkoposti?peru=${encodeURIComponent(allekirjoita("peru", normalisoiEmail(email)))}`;
  return { "List-Unsubscribe": `<${url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
}

// ---------- Ensitilauksen koodi ----------

const KOODIMERKIT = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function luoEnsitilausKoodi(tavut = randomBytes) {
  const b = tavut(6);
  return `TERVE-${Array.from(b, (x) => KOODIMERKIT[x % KOODIMERKIT.length]).join("")}`;
}

/**
 * Ensitilauksen koodin tarkistus kassalla. tilaaja = subscribers-rivi, jonka discount_code on koodi.
 * Palauttaa { ok: true, alennus } tai { ok: false, virhe }.
 */
export function tarkistaEnsitilausKoodi({ tilaaja, email, aiempiaTilauksia, koodiKaytetty, prosentti = ENSITILAUS_ALENNUS_PROSENTTI }) {
  if (!tilaaja) return { ok: false, virhe: "Tuntematon alennuskoodi." };
  if (!(prosentti > 0)) return { ok: false, virhe: "Ensitilauksen alennus ei ole tällä hetkellä käytössä." };
  if (normalisoiEmail(email) !== normalisoiEmail(tilaaja.email)) return { ok: false, virhe: "Koodi on henkilökohtainen. Käytä samaa sähköpostiosoitetta, jolla tilasit uutiskirjeen." };
  if (koodiKaytetty || aiempiaTilauksia > 0) return { ok: false, virhe: "Koodi käy vain ensimmäiseen tilaukseen." };
  const arvo = Number(tilaaja.discount_percent) > 0 ? Math.min(Number(tilaaja.discount_percent), prosentti) : prosentti;
  return { ok: true, alennus: { type: "percent", value: arvo, ensitilaus: true } };
}

// ---------- Viestit ----------

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const eur = (x) => `${Number(x).toFixed(2).replace(".", ",")} €`;
const pvm = (d) => new Date(d).toLocaleDateString("fi-FI", { timeZone: "Europe/Helsinki" });

function kehys(sisalto, { peruutus, syy }) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.5">${sisalto}` +
    `<p style="color:#666;font-size:12px;margin-top:28px">${esc(syy)} <a href="${esc(peruutus)}" style="color:#666">Peru viestit</a>.<br>Huumorikauppa.fi, huumorikauppa@gmail.com</p></div>`;
}
const nappi = (url, teksti) => `<p><a href="${esc(url)}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(teksti)}</a></p>`;

export function tervetuloViesti({ email, koodi = null, prosentti = 0 }) {
  const peruutus = peruutusLinkki(email);
  const syy = "Sait tämän viestin, koska tilasit Huumorikaupan uutiskirjeen.";
  const koodiOsa = koodi
    ? `<p>Ensimmäisen tilauksesi alennuskoodi:</p><p style="font-size:22px;letter-spacing:2px"><b>${esc(koodi)}</b></p><p>Koodi antaa ${prosentti} %:n alennuksen. Se toimii kerran, ensimmäisessä tilauksessasi, kun tilaat tällä sähköpostiosoitteella. Kirjoita koodi kassalla kenttään "Alennuskoodi".</p>`
    : "";
  return {
    subject: koodi ? `Ensitilauksen koodisi ${prosentti} % - Huumorikauppa` : "Tervetuloa Huumorikaupan uutiskirjeen tilaajaksi",
    html: kehys(`<h2>Kiitos, että tilasit uutiskirjeen!</h2><p>Kerromme sähköpostilla uusista tuotteista ja tarjouksista.</p>${koodiOsa}${nappi(kauppaUrl(), "Katso tuotteet")}`, { peruutus, syy }),
    text: `Kiitos, että tilasit Huumorikaupan uutiskirjeen.${koodi ? ` Ensimmäisen tilauksesi alennuskoodi: ${koodi} (${prosentti} %). Toimii kerran, ensimmäisessä tilauksessa tällä sähköpostiosoitteella.` : ""} Peru viestit: ${peruutus}`,
    headers: peruutusOtsakkeet(email),
  };
}

function koriRivit(items) {
  return (items || []).slice(0, 10).map((i) => `<li>${Number(i.quantity) || 1} × ${esc(i.name || i.slug)}${i.size ? `, ${esc(i.size)}` : ""}${i.color ? `, ${esc(i.color)}` : ""}</li>`).join("");
}

/** Keskeneräisen tilauksen muistutus (vaihe 1 = tunnin kuluttua, 2 = vuorokauden kuluttua). */
export function koriMuistutusViesti(kori, vaihe) {
  const peruutus = peruutusLinkki(kori.email);
  const linkki = koriLinkki(kori.id);
  const syy = "Sait tämän viestin, koska pyysit kassalla muistutusta keskeneräisestä tilauksesta.";
  const otsikko = vaihe === 1 ? "Tilauksesi jäi kesken" : "Ostoskorisi on yhä tallessa";
  const alku = vaihe === 1
    ? "Tilauksesi jäi kesken. Tallensimme ostoskorisi, joten pääset jatkamaan siitä, mihin jäit."
    : "Tilauksesi jäi eilen kesken. Ostoskorisi on tallessa, ja pääset jatkamaan tilausta alla olevasta linkistä.";
  const summa = Number(kori.total) > 0 ? `<p>Tuotteet yhteensä ${eur(kori.total)}.</p>` : "";
  return {
    subject: `${otsikko} - Huumorikauppa`,
    html: kehys(`<h2>${otsikko}</h2><p>${alku}</p><ul>${koriRivit(kori.items)}</ul>${summa}${nappi(linkki, "Jatka tilausta")}${vaihe === 2 ? "<p>Tämä on viimeinen muistutus tästä ostoskorista.</p>" : ""}`, { peruutus, syy }),
    text: `${alku} Jatka tilausta: ${linkki}${vaihe === 2 ? " Tämä on viimeinen muistutus tästä ostoskorista." : ""} Peru viestit: ${peruutus}`,
    headers: peruutusOtsakkeet(kori.email),
  };
}

/** Arviopyyntö tilauksesta (kerran). */
export function arvostelupyyntoViesti(tilaus) {
  const peruutus = peruutusLinkki(tilaus.customer_email);
  const linkki = arvosteluLinkki(tilaus.id);
  const nro = tilausnumero(tilaus.id);
  const syy = "Sait tämän viestin, koska tilasit Huumorikaupasta. Lähetämme arviopyynnön kerran tilausta kohden.";
  const tila = tilaus.delivered_at ? `Tilauksesi #${nro} toimitettiin ${pvm(tilaus.delivered_at)}.` : `Tilauksesi #${nro} lähti matkaan ${pvm(tilaus.shipped_at)}.`;
  const tuotteet = (tilaus.items || []).filter((i) => i.type !== "giftcard").map((i) => `<li>${esc(i.name)}</li>`).join("");
  return {
    subject: `Miten tilaus #${nro} onnistui? - Huumorikauppa`,
    html: kehys(`<h2>Kerro, mitä pidit</h2><p>${tila}</p><ul>${tuotteet}</ul><p>Arvion antaminen vie minuutin. Luemme jokaisen arvion.</p>${nappi(linkki, "Anna arvio")}`, { peruutus, syy }),
    text: `${tila} Anna arvio: ${linkki} Peru viestit: ${peruutus}`,
    headers: peruutusOtsakkeet(tilaus.customer_email),
  };
}

// ---------- Ajastettu lähetys ----------

const minuuttia = (a, b) => (new Date(a).getTime() - new Date(b).getTime()) / 60000;

/** Muistutuksen vaihe korille hetkellä nyt: 1, 2 tai null. Ajat viimeisimmästä korin muutoksesta. */
export function muistutusVaihe(kori, nyt = new Date()) {
  if (kori.stopped_at || kori.recovered_order_id || kori.reminder2_sent_at) return null;
  const ika = minuuttia(nyt, kori.updated_at || kori.created_at);
  if (ika > KORI_VANHENEE_PV * 24 * 60) return null;
  if (!kori.reminder1_sent_at) return ika >= MUISTUTUS_1_MIN ? 1 : null;
  return ika >= MUISTUTUS_2_MIN && minuuttia(nyt, kori.reminder1_sent_at) >= 60 ? 2 : null;
}

/** Onko arviopyynnön aika: 7 pv toimituksesta tai, jos toimituspäivää ei ole, 10 pv lähetyksestä. */
export function arvosteluAika(tilaus, nyt = new Date()) {
  if (tilaus.review_email_sent_at || tilaus.status !== "maksettu") return false;
  if (tilaus.delivered_at) return minuuttia(nyt, tilaus.delivered_at) >= ARVOSTELU_TOIMITUKSESTA_PV * 24 * 60;
  if (tilaus.shipped_at) return minuuttia(nyt, tilaus.shipped_at) >= ARVOSTELU_LAHETYKSESTA_PV * 24 * 60;
  return false;
}

export const lahetysrajat = () => ({
  ajo: Math.max(0, Number(process.env.MARKKINOINTI_RAJA_AJO ?? 20)),
  paiva: Math.max(0, Number(process.env.MARKKINOINTI_RAJA_PAIVA ?? 60)),
});
const kvAvain = (nyt) => `markkinointi_lahetetty_${new Date(nyt).toISOString().slice(0, 10)}`;

/**
 * Lähettää erääntyneet muistutukset ja arviopyynnöt. store: pgMarkkinointi tai muistivarasto. laheta: sahkoposti.js
 * laheta. Palauttaa { lahetetty, ohitettu, loki }.
 */
export async function ajaMarkkinointi(store, { laheta, nyt = new Date(), rajat = lahetysrajat(), kuiva = false } = {}) {
  const loki = [];
  if (!onAllekirjoitus()) return { lahetetty: 0, ohitettu: 0, loki: ["markkinointi ohitettu: MARKKINOINTI_SALAISUUS tai CRON_SECRET puuttuu"] };
  const avain = kvAvain(nyt);
  let tanaan = Number(await store.lueKv(avain)) || 0;
  let lahetetty = 0;
  let ohitettu = 0;
  const tilaa = () => lahetetty < rajat.ajo && tanaan < rajat.paiva;
  const laheta1 = async (to, viesti) => {
    const r = await laheta({ to, ...viesti });
    if (r.ok) {
      lahetetty++;
      tanaan++;
      await store.kirjoitaKv(avain, String(tanaan));
    }
    return r;
  };

  // Muistutukset (vanhin ensin). Maksettu tilaus samalla osoitteella lopettaa muistutukset.
  for (const kori of await store.muistutettavatKorit(nyt)) {
    const vaihe = muistutusVaihe(kori, nyt);
    if (!vaihe) continue;
    const maksettu = await store.maksettuTilausSitten(kori.email, kori.created_at);
    if (maksettu) {
      loki.push(`kori ${kori.email}: tilaus maksettu, muistutukset lopetettu`);
      if (!kuiva) await store.merkitseKori(kori.id, { recovered_order_id: maksettu });
      continue;
    }
    if (await store.onKielto(kori.email)) {
      if (!kuiva) await store.merkitseKori(kori.id, { stopped_at: nyt });
      continue;
    }
    if (!tilaa()) { ohitettu++; continue; }
    loki.push(`muistutus ${vaihe}: ${kori.email}`);
    if (kuiva) continue;
    const r = await laheta1(kori.email, koriMuistutusViesti(kori, vaihe));
    if (r.ok) await store.merkitseKori(kori.id, vaihe === 1 ? { reminder1_sent_at: nyt } : { reminder2_sent_at: nyt });
    else loki.push(`muistutus epäonnistui ${kori.email}: ${r.virhe}`);
  }

  // Arviopyynnöt.
  for (const t of await store.arvostelupyyntoEhdokkaat(nyt)) {
    if (!arvosteluAika(t, nyt)) continue;
    if (await store.onKielto(t.customer_email)) {
      if (!kuiva) await store.merkitseArvostelupyynto(t.id, nyt);
      continue;
    }
    if (!tilaa()) { ohitettu++; continue; }
    loki.push(`arviopyyntö #${tilausnumero(t.id)}`);
    if (kuiva) continue;
    const r = await laheta1(t.customer_email, arvostelupyyntoViesti(t));
    if (r.ok) await store.merkitseArvostelupyynto(t.id, nyt);
    else loki.push(`arviopyyntö epäonnistui #${tilausnumero(t.id)}: ${r.virhe}`);
  }
  if (ohitettu) loki.push(`lähetysraja täynnä (ajo ${rajat.ajo}, päivä ${rajat.paiva}): ${ohitettu} siirtyy seuraavaan ajoon`);
  return { lahetetty, ohitettu, loki };
}

// ---------- Tilaus, kori ja peruutus (rajapinta /api/sahkoposti) ----------

/** Kassan korista tallennettava tiivis muoto (ei koko tuoteriviä). */
export function tiivistaKori(items) {
  if (!Array.isArray(items)) return [];
  const teksti = (x, max) => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : undefined);
  return items.slice(0, 50).map((i) => {
    const p = i?.product || i || {};
    return {
      slug: teksti(p.slug, 200), name: teksti(p.name, 200), price: Number(p.price) || 0,
      quantity: Math.min(99, Math.max(1, Number(i?.quantity) || 1)),
      size: teksti(i?.selectedSize ?? i?.size, 40), color: teksti(i?.selectedColor ?? i?.color, 40), customText: teksti(i?.customText, 200),
    };
  }).filter((i) => i.slug && !i.slug.startsWith("lahjakortti"));
}

/**
 * Uutiskirjeen tilaus. Tallentaa suostumuksen (aika, teksti, lähde), poistaa aiemman peruutuksen ja lähettää
 * tervetuloviestin (ensitilauksen koodi, jos käytössä eikä osoitteella ole maksettuja tilauksia). Koodi luodaan
 * osoitteelle vain kerran. Palauttaa { ok, koodiLahetetty } tai { ok: false, virhe }.
 */
export async function tilaaUutiskirje(store, { email, suostumus, lahde = "lomake" }, { laheta, nyt = new Date(), prosentti = ENSITILAUS_ALENNUS_PROSENTTI } = {}) {
  const osoite = normalisoiEmail(email);
  if (!EMAIL_RE.test(osoite)) return { ok: false, virhe: "Tarkista sähköpostiosoite." };
  if (suostumus !== true) return { ok: false, virhe: "Tilaus vaatii suostumuksen." };
  const vanha = await store.haeTilaaja(osoite);
  let koodi = vanha?.discount_code || null;
  const saaKoodin = prosentti > 0 && !koodi && (await store.maksettujaTilauksia(osoite)) === 0;
  if (saaKoodin) koodi = luoEnsitilausKoodi();
  await store.tallennaTilaaja({
    email: osoite, consent_at: nyt, consent_text: SUOSTUMUS_UUTISKIRJE, source: String(lahde).slice(0, 40),
    discount_code: koodi, discount_percent: saaKoodin ? prosentti : vanha?.discount_percent ?? null,
  });
  await store.poistaKielto(osoite);
  // Tervetuloviesti kerran (ei uudelleen samalle osoitteelle, ettei lomaketta voi käyttää viestien lähettämiseen).
  if (vanha?.welcome_sent_at) return { ok: true, koodiLahetetty: false, jo: true };
  if (!onAllekirjoitus()) return { ok: true, koodiLahetetty: false };
  const r = await laheta({ to: osoite, ...tervetuloViesti({ email: osoite, koodi: saaKoodin ? koodi : null, prosentti }) });
  if (r.ok) await store.merkitseTervetulo(osoite, nyt);
  return { ok: true, koodiLahetetty: r.ok && saaKoodin };
}

/** Kassan muistutuspyyntö: suostumus true tallentaa korin, false poistaa sen. */
export async function tallennaKori(store, { email, items, suostumus, lahde = "kassa" }, { nyt = new Date() } = {}) {
  const osoite = normalisoiEmail(email);
  if (!EMAIL_RE.test(osoite)) return { ok: false, virhe: "Tarkista sähköpostiosoite." };
  if (suostumus !== true) {
    await store.poistaKori(osoite);
    return { ok: true, poistettu: true };
  }
  const rivit = tiivistaKori(items);
  if (!rivit.length) return { ok: false, virhe: "Ostoskori on tyhjä." };
  const total = Math.round(rivit.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
  await store.tallennaKori({ email: osoite, items: rivit, total, consent_at: nyt, consent_text: SUOSTUMUS_MUISTUTUS, source: String(lahde).slice(0, 40) });
  return { ok: true };
}

/** Peruutus: kaikki markkinointi tähän osoitteeseen loppuu (uutiskirje, muistutukset, arviopyynnöt). */
export async function peruViestit(store, email, { lahde = "linkki", nyt = new Date() } = {}) {
  const osoite = normalisoiEmail(email);
  if (!EMAIL_RE.test(osoite)) return { ok: false };
  const jo = await store.onKielto(osoite);
  await store.lisaaKielto(osoite, lahde, nyt);
  return { ok: true, jo };
}
