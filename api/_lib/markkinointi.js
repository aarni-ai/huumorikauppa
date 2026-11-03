/**
 * Sähköpostimarkkinointi (Resendin ilmaistaso: 3000 viestiä kuukaudessa, 100 päivässä).
 *
 *  - Uutiskirjeen tilaus suostumuksella (taulu subscribers: suostumuksen aika, teksti ja lähde). Ensitilauksen koodi
 *    (vakiot.js ENSITILAUS_ALENNUS_PROSENTTI, 0 = pois käytöstä) lähetetään sähköpostilla: yksi koodi per osoite,
 *    vain ensimmäiseen maksettuun tilaukseen ja vain samalla osoitteella.
 *  - Keskeneräisen tilauksen muistutus kerran 24 h kuluttua (taulu abandoned_carts): vain, jos asiakas valitsi kassalla
 *    "Lähetä minulle muistutus". Muistutukset loppuvat, kun samalla osoitteella maksetaan tilaus.
 *  - Arviopyyntö kerran per tilaus, vain varmistetun perillemenon jälkeen: 7 päivää Printifyn delivered_at-päivästä.
 *    Ilman toimituspäivää pyyntöä ei lähetetä. Viestissä on suora arviolinkki jokaiselle tuotteelle.
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
/** Arviosivu; rivi = tuotteen järjestysnumero tilauksen tuotteissa (ilman lahjakortteja), jolloin sivu avaa sen ensin. */
export const arvosteluLinkki = (tilausId, rivi) =>
  `${kauppaUrl()}/arvostele?token=${encodeURIComponent(allekirjoita("arvostelu", tilausId))}${Number.isInteger(rivi) ? `&t=${rivi}` : ""}`;

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
    ? `<p>Ensimmäisen tilauksesi alennuskoodi:</p><p style="font-size:22px;letter-spacing:2px"><b>${esc(koodi)}</b></p><p>Koodi antaa ${prosentti} %:n alennuksen. Se toimii kerran, ensimmäisessä tilauksessasi, kun tilaat tällä sähköpostiosoitteella. Kirjoita koodi kassalla kenttään "Alennuskoodi". Kassa kertoo heti, jos koodi ei käy valittuihin tuotteisiin.</p>`
    : "";
  return {
    subject: koodi ? `Ensitilauksen koodisi: ${prosentti} % alennus | Huumorikauppa` : "Tervetuloa Huumorikaupan uutiskirjeen tilaajaksi",
    html: kehys(`<h2>Kiitos, että tilasit uutiskirjeen!</h2><p>Kerromme sähköpostilla uusista tuotteista ja sesongin lahjaideoista.</p>${koodiOsa}${nappi(`${kauppaUrl()}/?utm_source=uutiskirje&utm_medium=email&utm_campaign=tervetuloa`, "Katso tuotteet")}`, { peruutus, syy }),
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
    html: kehys(`<h2>${otsikko}</h2><p>${alku}</p><ul>${koriRivit(kori.items)}</ul>${summa}${nappi(linkki, "Jatka tilausta")}${vaihe === 2 ? "<p>Tämä on ainoa muistutus tästä ostoskorista.</p>" : ""}`, { peruutus, syy }),
    text: `${alku} Jatka tilausta: ${linkki}${vaihe === 2 ? " Tämä on ainoa muistutus tästä ostoskorista." : ""} Peru viestit: ${peruutus}`,
    headers: peruutusOtsakkeet(kori.email),
  };
}

/** Arviopyyntö tilauksesta (kerran). */
export function arvostelupyyntoViesti(tilaus) {
  const peruutus = peruutusLinkki(tilaus.customer_email);
  const linkki = arvosteluLinkki(tilaus.id);
  const nro = tilausnumero(tilaus.id);
  const syy = "Sait tämän viestin, koska tilasit Huumorikaupasta. Lähetämme arviopyynnön kerran tilausta kohden.";
  const tila = `Tilauksesi #${nro} toimitettiin ${pvm(tilaus.delivered_at)}.`;
  const rivit = (tilaus.items || []).filter((i) => i.type !== "giftcard");
  // Suora linkki jokaisen tuotteen arvioon (arviosivu avaa linkin tuotteen ensin).
  const tuotteet = rivit.map((i, n) => `<li style="margin-bottom:8px">${esc(i.name)}<br><a href="${esc(arvosteluLinkki(tilaus.id, n))}">Arvioi tämä tuote</a></li>`).join("");
  return {
    subject: `Miten tilaus #${nro} onnistui? - Huumorikauppa`,
    html: kehys(`<h2>Kerro, mitä pidit</h2><p>${tila}</p><ul>${tuotteet}</ul><p>Arvion antaminen vie minuutin. Luemme jokaisen arvion.</p>${nappi(rivit.length === 1 ? arvosteluLinkki(tilaus.id, 0) : linkki, "Anna arvio")}`, { peruutus, syy }),
    text: `${tila} ${rivit.map((i, n) => `Arvioi ${i.name}: ${arvosteluLinkki(tilaus.id, n)}`).join(" ")} Peru viestit: ${peruutus}`,
    headers: peruutusOtsakkeet(tilaus.customer_email),
  };
}

// ---------- Ajastettu lähetys ----------

const minuuttia = (a, b) => (new Date(a).getTime() - new Date(b).getTime()) / 60000;

/** Muistutuksen vaihe korille hetkellä nyt: 1, 2 tai null. Ajat viimeisimmästä korin muutoksesta. */
export function muistutusVaihe(kori, nyt = new Date()) {
  // Yksi muistutus vuorokauden kuluttua (vaihe 2), ei tunnin muistutusta eikä alennuskoodia.
  if (kori.stopped_at || kori.recovered_order_id || kori.reminder1_sent_at || kori.reminder2_sent_at) return null;
  const ika = minuuttia(nyt, kori.updated_at || kori.created_at);
  if (ika > KORI_VANHENEE_PV * 24 * 60) return null;
  return ika >= MUISTUTUS_2_MIN ? 2 : null;
}

/** Onko arviopyynnön aika: 7 pv toimituksesta tai, jos toimituspäivää ei ole, 10 pv lähetyksestä. */
export function arvosteluAika(tilaus, nyt = new Date()) {
  if (tilaus.review_email_sent_at || tilaus.status !== "maksettu") return false;
  // Vain varmistettu perillemeno (Printifyn delivered_at); pelkkä lähetyspäivä ei riitä.
  if (!tilaus.delivered_at) return false;
  return minuuttia(nyt, tilaus.delivered_at) >= ARVOSTELU_TOIMITUKSESTA_PV * 24 * 60;
}

/**
 * Markkinointiviestien päiväkatto (3.11.2026, Gmailin väliaikaisreitti): korimuistutukset, arviopyynnöt ja uutiskirje
 * yhteensä enintään 100 viestiä Helsingin päivässä. Laskuri on tietokannan kv-taulussa (kvAvain), ja ympäristömuuttuja
 * MARKKINOINTI_RAJA_PAIVA voi vain laskea rajaa.
 */
export const MARKKINOINTI_PAIVAKATTO = 100;
const katto = (rajat) => ({ ...rajat, paiva: Math.min(MARKKINOINTI_PAIVAKATTO, Math.max(0, Number(rajat.paiva) || 0)) });
export const lahetysrajat = () => katto({
  ajo: Math.max(0, Number(process.env.MARKKINOINTI_RAJA_AJO ?? 20)),
  paiva: Number(process.env.MARKKINOINTI_RAJA_PAIVA ?? MARKKINOINTI_PAIVAKATTO),
});
export { katto as rajatKatolla };
const helsinginPaiva = (nyt) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date(nyt));
/** Yhteinen päivälaskuri (Helsingin päivä): markkinointi ja uutiskirje kasvattavat samaa avainta. */
export const kvAvain = (nyt) => `markkinointi_lahetetty_${helsinginPaiva(nyt)}`;

/**
 * Lähettää erääntyneet muistutukset ja arviopyynnöt. store: pgMarkkinointi tai muistivarasto. laheta: sahkoposti.js
 * laheta. Palauttaa { lahetetty, ohitettu, loki }.
 */
export async function ajaMarkkinointi(store, { laheta, nyt = new Date(), rajat: annetut = lahetysrajat(), kuiva = false } = {}) {
  const loki = [];
  const rajat = katto(annetut);
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
    // Ei koskaan kahdesti samalle asiakkaalle (2.11.2026): jos osoitteelle on jo lähetetty arviopyyntö, tämä tilaus
    // merkitään käsitellyksi ilman viestiä.
    if (await store.onKielto(t.customer_email) || (store.arviopyyntoLahetetty && await store.arviopyyntoLahetetty(t.customer_email, t.id))) {
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
 * osoitteelle vain kerran, ja se palautetaan heti näytettäväksi lomakkeella (2.11.2026: viestit lähtevät vasta, kun
 * lähetysdomain on vahvistettu; voiLahettaa = api/_lib/uutiskirje.js domainVahvistettu). Ilman lähetystä
 * tervetuloviesti jää jonoon (welcome_sent_at tyhjä), ja cron lähettää sen myöhemmin (uutiskirje.js ajaUutiskirje).
 * Palauttaa { ok, koodiLahetetty, koodi, prosentti } tai { ok: false, virhe }.
 */
export async function tilaaUutiskirje(store, { email, suostumus, lahde = "lomake" }, { laheta, nyt = new Date(), prosentti = ENSITILAUS_ALENNUS_PROSENTTI, voiLahettaa = true } = {}) {
  const osoite = normalisoiEmail(email);
  if (!EMAIL_RE.test(osoite)) return { ok: false, virhe: "Tarkista sähköpostiosoite." };
  if (suostumus !== true) return { ok: false, virhe: "Tilaus vaatii suostumuksen." };
  const vanha = await store.haeTilaaja(osoite);
  let koodi = vanha?.discount_code || null;
  const ensimmainen = prosentti > 0 && (await store.maksettujaTilauksia(osoite)) === 0;
  const saaKoodin = ensimmainen && !koodi;
  if (saaKoodin) koodi = luoEnsitilausKoodi();
  await store.tallennaTilaaja({
    email: osoite, consent_at: nyt, consent_text: SUOSTUMUS_UUTISKIRJE, source: String(lahde).slice(0, 120),
    discount_code: koodi, discount_percent: saaKoodin ? prosentti : vanha?.discount_percent ?? null,
  });
  await store.poistaKielto(osoite);
  // Näytettävä koodi: osoitteen oma koodi, jos sillä ei ole maksettuja tilauksia eikä koodia ole käytetty.
  const naytettava = ensimmainen && koodi && !(await store.koodiKaytetty(koodi)) ? koodi : null;
  const nayta = naytettava ? { koodi: naytettava, prosentti: Number(vanha?.discount_percent) > 0 && !saaKoodin ? Math.min(Number(vanha.discount_percent), prosentti) : prosentti } : {};
  // Tervetuloviesti kerran (ei uudelleen samalle osoitteelle, ettei lomaketta voi käyttää viestien lähettämiseen).
  if (vanha?.welcome_sent_at) return { ok: true, koodiLahetetty: false, jo: true, ...nayta };
  if (!onAllekirjoitus() || !voiLahettaa) return { ok: true, koodiLahetetty: false, ...nayta };
  const r = await laheta({ to: osoite, ...tervetuloViesti({ email: osoite, koodi: naytettava, prosentti: nayta.prosentti || prosentti }) });
  if (r.ok) await store.merkitseTervetulo(osoite, nyt);
  return { ok: true, koodiLahetetty: r.ok && !!naytettava, ...nayta };
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
