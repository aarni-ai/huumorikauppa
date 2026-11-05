/**
 * Koodit ilman tietokantaa (5.11.2026, Neonin kiintiö): kumppanikoodit, alennuskoodit, uutiskirjeen TERVE-koodit,
 * asiakaskoodit (KIITOS/YSTAVA/PALKKIO) ja lahjakorttien saldot samalla mallilla kuin katalogi ja tilauspuskuri.
 *
 * Määrittelyt:
 *  - data/koodit.json (repo, julkiset kentät): kumppanit { koodi, nimi, malli, aktiivinen, kautta_nimi } ja
 *    alennuskoodit { code, discount_type, discount_value, is_active }. scripts/katalogi.mjs päivittää kannasta.
 *  - Blob koodit/tilannekuva.json (salattu): kannan vienti valvonnasta, kun kanta vastaa: kumppanit, alennuskoodit,
 *    tilaajat (TERVE), asiakaskoodit, lahjakorttien saldot, maksaneet osoitteet ja käytetyt koodit.
 *  - Blob koodit/kumppanit/<koodi>.json ja koodit/tilaajat/<tiiviste>.json (salattu): kannan ollessa kiinni luodut
 *    kumppanit (/hallinta/kumppanit) ja uutiskirjeen tilaajat.
 * Käytöt (Blob, salattu), siirretään kantaan valvonnassa (siirraKoodit):
 *  - Lahjakortti: koodit/lahjakortti/<KOODI>/<n>.json { id, tilaus, summa, tila: varattu | veloitettu | vapautettu }.
 *    Numero n luodaan ilman ylikirjoitusta (allowOverwrite false): kaksi samanaikaista käyttöä eivät voi saada samaa
 *    numeroa, ja jälkimmäinen laskee saldon uudelleen ensimmäisen varauksen jälkeen. Saldo = tilannekuvan saldo -
 *    kirjaamattomat varaukset ja veloitukset. Varaus kassalla, veloitus maksun jälkeen, vapautus session vanhetessa.
 *  - Kertakäyttöiset (TERVE, KIITOS, PALKKIO): koodit/kaytto/<KOODI>.json luodaan ilman ylikirjoitusta (varaus);
 *    toinen tilaus ei saa samaa koodia. Vanhentunut sessio poistaa varauksen.
 *  - Maksaneet: koodit/maksaneet/<tiiviste>.json (ensitilauksen koodi vain ensimmäiseen tilaukseen).
 */
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { kirjoitaBlob, lueBlob, listaaBlob, poistaBlob, salaa, pura, onBlob } from "./puskuri.js";

export const ETULIITE = "koodit/";
const TILANNEKUVA = "koodit/tilannekuva.json";
const MUISTI_MS = 60 * 1000;
export const tiiviste = (x) => createHash("sha256").update(String(x || "").trim().toLowerCase()).digest("hex").slice(0, 24);
const email = (e) => String(e || "").trim().toLowerCase();

// ---------- Blob-apurit (testi voi vaihtaa) ----------

let B = {
  lue: lueBlob,
  kirjoita: kirjoitaBlob,
  /** Luo vain, jos polkua ei ole: true = luotu, false = oli jo (atominen varaus). */
  luo: async (polku, arvo) => {
    const { put } = await import("@vercel/blob");
    try {
      await put(polku, JSON.stringify(salaa(arvo)), { access: "public", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json", cacheControlMaxAge: 60 });
      return true;
    } catch (e) {
      if (/exist/i.test(String(e?.message || e))) return false;
      throw e;
    }
  },
  listaa: listaaBlob,
  lueUrl: async (url) => {
    const r = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    return r.ok ? pura(await r.json()) : null;
  },
  poista: poistaBlob,
};
export const asetaBlob = (x) => { B = { ...B, ...x }; nollaaMuisti(); };

// ---------- Määrittelyt ----------

let tiedostoMuisti = null;
export function koodiTiedosto() {
  if (tiedostoMuisti) return tiedostoMuisti;
  for (const polku of [fileURLToPath(new URL("../../data/koodit.json", import.meta.url)), join(process.cwd(), "data", "koodit.json")]) {
    try { tiedostoMuisti = JSON.parse(readFileSync(polku, "utf8")); return tiedostoMuisti; } catch { /* seuraava */ }
  }
  tiedostoMuisti = { kumppanit: [], alennuskoodit: [] };
  return tiedostoMuisti;
}

let kuvaMuisti = { at: 0, arvo: undefined };
export const nollaaMuisti = () => { kuvaMuisti = { at: 0, arvo: undefined }; kumppaniMuisti.clear(); };

/** Kannan viimeisin vienti Blobissa tai null. */
export async function tilannekuva() {
  if (kuvaMuisti.arvo !== undefined && Date.now() - kuvaMuisti.at < MUISTI_MS) return kuvaMuisti.arvo;
  let arvo = null;
  if (onBlob() || B.lue !== lueBlob) {
    try { arvo = await B.lue(TILANNEKUVA); } catch (e) { console.error("koodien tilannekuva:", e?.message || e); }
  }
  kuvaMuisti = { at: Date.now(), arvo };
  return arvo;
}

// ---------- Kumppanit ----------

const kumppaniMuisti = new Map();

/** Kumppani koodilla: Blobiin luotu (uusin), tilannekuva tai repon tiedosto. { koodi, nimi, malli, aktiivinen, kautta_nimi } tai null. */
export async function kumppaniMaaritys(koodi) {
  const k = String(koodi || "").trim().toLowerCase();
  if (!k) return null;
  const m = kumppaniMuisti.get(k);
  if (m && Date.now() - m.at < MUISTI_MS) return m.arvo;
  let arvo = null;
  try { arvo = await B.lue(`${ETULIITE}kumppanit/${k}.json`); } catch { arvo = null; }
  if (!arvo) arvo = (await tilannekuva())?.kumppanit?.find((x) => x.koodi === k) || null;
  if (!arvo) arvo = koodiTiedosto().kumppanit?.find((x) => x.koodi === k) || null;
  kumppaniMuisti.set(k, { at: Date.now(), arvo });
  return arvo;
}

/** Kaikki kumppanit (hallinta ilman kantaa): tiedosto, tilannekuva ja Blobiin luodut yhdistettynä koodin mukaan. */
export async function kumppaniLista() {
  const kaikki = new Map();
  for (const k of koodiTiedosto().kumppanit || []) kaikki.set(k.koodi, { ...k, lahde: "tiedosto" });
  for (const k of (await tilannekuva())?.kumppanit || []) kaikki.set(k.koodi, { ...kaikki.get(k.koodi), ...k, lahde: "kanta" });
  for (const b of await B.listaa(`${ETULIITE}kumppanit/`)) {
    const k = await B.lueUrl(b.url).catch(() => null);
    if (k?.koodi) kaikki.set(k.koodi, { ...kaikki.get(k.koodi), ...k, lahde: "blob" });
  }
  return [...kaikki.values()];
}

/** Luo tai päivittää kumppanin Blobiin (kanta kiinni). Sama rajapinta kuin kumppanihallinnan pg-varastolla. */
export const blobKumppaniVarasto = () => ({
  kaikki: async () => (await kumppaniLista()).map((k) => ({ koodi: k.koodi, nimi: k.nimi, malli: k.malli })),
  tallenna: async ({ koodi, nimi, email: e, malli }) => {
    const vanha = await kumppaniMaaritys(koodi);
    const rivi = { ...(vanha || {}), koodi, nimi, email: e || vanha?.email || null, malli: malli || vanha?.malli || "provisio", aktiivinen: true, luotu: vanha?.luotu || new Date().toISOString(), muutettu: new Date().toISOString() };
    await B.kirjoita(`${ETULIITE}kumppanit/${koodi}.json`, rivi);
    kumppaniMuisti.set(koodi, { at: Date.now(), arvo: rivi });
  },
  asetaTila: async (koodi, aktiivinen) => {
    const vanha = await kumppaniMaaritys(koodi);
    if (!vanha) return false;
    const rivi = { ...vanha, aktiivinen: !!aktiivinen, muutettu: new Date().toISOString() };
    await B.kirjoita(`${ETULIITE}kumppanit/${koodi}.json`, rivi);
    kumppaniMuisti.set(koodi, { at: Date.now(), arvo: rivi });
    return true;
  },
});

// ---------- Alennuskoodit ----------

/**
 * Kassan alennus ilman kantaa: { type, value[, ensitilaus] }, { virhe } tai null (tuntematon). Tarkistus samoilla
 * säännöillä kuin kannassa: alennuskoodit, asiakaskoodit (KIITOS/YSTAVA/PALKKIO) ja uutiskirjeen TERVE-koodit.
 */
export async function alennusIlmanKantaa(koodi, ostajanEmail, { prosentti = 5, nyt = new Date() } = {}) {
  const k = String(koodi || "").trim().toUpperCase();
  if (!k) return null;
  const kuva = await tilannekuva();
  const alennus = [...(koodiTiedosto().alennuskoodit || []), ...(kuva?.alennuskoodit || [])].find((r) => String(r.code).toUpperCase() === k);
  if (alennus) return alennus.is_active === false ? null : { type: alennus.discount_type, value: Number(alennus.discount_value) };
  if (/^(KIITOS|YSTAVA|PALKKIO)-[A-Z2-9]{6}$/.test(k)) {
    const r = kuva?.asiakaskoodit?.find((x) => x.koodi === k);
    if (!r) return { virhe: "Koodia ei löytynyt." };
    if (r.voimassa && new Date(r.voimassa) < nyt) return { virhe: "Koodi on vanhentunut." };
    if (r.tyyppi === "ystava") {
      if (email(ostajanEmail) && email(ostajanEmail) === r.email) return { virhe: "Ystäväkoodi on tarkoitettu ystävällesi. Käytä omaa kiitoskoodiasi." };
      return { type: "percent", value: Number(r.prosentti) };
    }
    if (r.kaytetty || (await kaytossa(k))) return { virhe: "Koodi on jo käytetty." };
    if (r.email && email(ostajanEmail) && r.email !== email(ostajanEmail)) return { virhe: "Koodi toimii samalla sähköpostiosoitteella kuin tilaus, josta sen sait." };
    return { type: "percent", value: Number(r.prosentti), kertakaytto: true };
  }
  if (k.startsWith("TERVE-")) {
    const t = await tilaaja(ostajanEmail);
    if (!t || String(t.discount_code || "").toUpperCase() !== k) {
      // Koodi on olemassa, mutta toisella osoitteella: sama viesti kuin kannan tarkistuksessa.
      const muu = (kuva?.tilaajat || []).some((x) => String(x.discount_code || "").toUpperCase() === k)
        || !!(await B.lue(`${ETULIITE}terve/${k}.json`).catch(() => null));
      return { virhe: muu ? "Koodi on henkilökohtainen. Käytä samaa sähköpostiosoitetta, jolla tilasit uutiskirjeen." : "Tuntematon alennuskoodi." };
    }
    if (!(prosentti > 0)) return { virhe: "Ensitilauksen alennus ei ole tällä hetkellä käytössä." };
    if ((kuva?.kaytetyt || []).includes(k) || (await kaytossa(k)) || (await onMaksanut(ostajanEmail))) return { virhe: "Koodi käy vain ensimmäiseen tilaukseen." };
    const arvo = Number(t.discount_percent) > 0 ? Math.min(Number(t.discount_percent), prosentti) : prosentti;
    return { type: "percent", value: arvo, ensitilaus: true, kertakaytto: true };
  }
  return null;
}

/** Uutiskirjeen tilaaja osoitteella: Blobiin (kanta kiinni) tallennettu tai tilannekuvan. */
export async function tilaaja(osoite) {
  const e = email(osoite);
  if (!e) return null;
  const blob = await B.lue(`${ETULIITE}tilaajat/${tiiviste(e)}.json`).catch(() => null);
  return blob || (await tilannekuva())?.tilaajat?.find((t) => t.email === e) || null;
}

/** Onko osoitteella maksettu tilaus (tilannekuva tai kannan ollessa kiinni maksettu puskuritilaus). */
export async function onMaksanut(osoite) {
  const e = email(osoite);
  if (!e) return false;
  if ((await tilannekuva())?.maksaneet?.includes(tiiviste(e))) return true;
  return !!(await B.lue(`${ETULIITE}maksaneet/${tiiviste(e)}.json`).catch(() => null));
}

export async function merkitseMaksanut(osoite, tilausId) {
  const e = email(osoite);
  if (e) await B.kirjoita(`${ETULIITE}maksaneet/${tiiviste(e)}.json`, { tilaus: tilausId, aika: new Date().toISOString() });
}

/**
 * Uutiskirjeen tilaus ilman kantaa (api/sahkoposti.js "tilaa"): sama rajapinta kuin pgMarkkinointi-varaston
 * tilaajafunktiot, joten api/_lib/markkinointi.js tilaaUutiskirje toimii sellaisenaan.
 */
export const blobMarkkinointi = () => ({
  haeTilaaja: (e) => tilaaja(e),
  tallennaTilaaja: async (t) => {
    const vanha = await tilaaja(t.email);
    // Koodihakemisto (vain olemassaolo): toisella osoitteella kirjoitettu koodi saa saman viestin kuin kannassa.
    if (!vanha?.discount_code && t.discount_code) await B.kirjoita(`${ETULIITE}terve/${String(t.discount_code).toUpperCase()}.json`, { tiiviste: tiiviste(t.email) });
    await B.kirjoita(`${ETULIITE}tilaajat/${tiiviste(t.email)}.json`, {
      ...(vanha || {}), ...t, discount_code: vanha?.discount_code || t.discount_code, discount_percent: vanha?.discount_percent ?? t.discount_percent,
      consent_at: t.consent_at instanceof Date ? t.consent_at.toISOString() : t.consent_at,
    });
  },
  merkitseTervetulo: async (e, aika) => {
    const vanha = await tilaaja(e);
    if (vanha) await B.kirjoita(`${ETULIITE}tilaajat/${tiiviste(e)}.json`, { ...vanha, welcome_sent_at: aika instanceof Date ? aika.toISOString() : aika });
  },
  maksettujaTilauksia: async (e) => ((await onMaksanut(e)) ? 1 : 0),
  koodiKaytetty: async (k) => ((await tilannekuva())?.kaytetyt || []).includes(String(k).toUpperCase()) || (await kaytossa(k)),
  poistaKielto: async () => {},
  onKielto: async () => false,
});

// ---------- Kertakäyttöiset koodit ----------

const kayttoPolku = (k) => `${ETULIITE}kaytto/${String(k).toUpperCase()}.json`;
async function kaytossa(k) {
  const r = await B.lue(kayttoPolku(k)).catch(() => null);
  return !!r && r.tila !== "vapautettu";
}

/** Varaa kertakäyttöisen koodin tilaukselle. false = toinen tilaus on jo varannut tai käyttänyt sen. */
export async function varaaKoodi(k, tilausId) {
  if (await B.luo(kayttoPolku(k), { koodi: String(k).toUpperCase(), tilaus: tilausId, tila: "varattu", aika: new Date().toISOString() })) return true;
  const r = await B.lue(kayttoPolku(k)).catch(() => null);
  if (r?.tilaus === tilausId) return true;
  if (r?.tila === "vapautettu") {
    await B.kirjoita(kayttoPolku(k), { koodi: String(k).toUpperCase(), tilaus: tilausId, tila: "varattu", aika: new Date().toISOString() });
    return true;
  }
  return false;
}

export async function paivitaKoodi(k, tilausId, tila) {
  const r = await B.lue(kayttoPolku(k)).catch(() => null);
  if (r?.tilaus === tilausId) await B.kirjoita(kayttoPolku(k), { ...r, tila, aika: new Date().toISOString() });
}

// ---------- Lahjakortit ----------

const korttiPolku = (koodi) => `${ETULIITE}lahjakortti/${koodi}/`;

async function korttiKirjaukset(koodi) {
  const blobit = await B.listaa(korttiPolku(koodi));
  const rivit = [];
  for (const b of blobit) {
    const n = Number(String(b.pathname).slice(korttiPolku(koodi).length).replace(/\.json$/, ""));
    const r = await B.lueUrl(b.url).catch(() => null);
    if (r && Number.isInteger(n)) rivit.push({ ...r, n, url: b.url });
  }
  return rivit.sort((a, b) => a.n - b.n);
}

/** Kortti ilman kantaa: { code, balance, initial_value, expires_at } (balance = tilannekuva - kirjaamattomat käytöt) tai null. */
export async function lahjakorttiIlmanKantaa(koodi) {
  const kuva = await tilannekuva();
  const k = kuva?.lahjakortit?.find((x) => x.code === koodi);
  if (!k) return null;
  const sovelletut = new Set(kuva.sovelletut || []);
  const kaytetty = (await korttiKirjaukset(koodi)).filter((r) => r.tila !== "vapautettu" && !sovelletut.has(r.id)).reduce((s, r) => s + Number(r.summa), 0);
  return { ...k, balance: Math.round((Number(k.balance) - kaytetty) * 100) / 100, kirjaamatta: kaytetty };
}

/**
 * Varaa summa kortilta tilaukselle. Seuraava numero luodaan ilman ylikirjoitusta, ja saldo tarkistetaan vasta
 * varauksen jälkeen kaikista sitä edeltävistä kirjauksista: jos saldo ei riittänyt, oma varaus vapautetaan.
 * Palauttaa { ok, id } tai { ok: false, virhe }.
 */
export async function varaaLahjakortti(koodi, summa, tilausId) {
  for (let yritys = 0; yritys < 6; yritys++) {
    const kirjaukset = await korttiKirjaukset(koodi);
    const kuva = await tilannekuva();
    const n = Math.max(Number(kuva?.lahjakorttiN?.[koodi] ?? -1), ...kirjaukset.map((r) => r.n), -1) + 1;
    const id = `${koodi}-${n}-${randomBytes(4).toString("hex")}`;
    const rivi = { id, tilaus: tilausId, summa: Number(summa), tila: "varattu", aika: new Date().toISOString() };
    if (!(await B.luo(`${korttiPolku(koodi)}${n}.json`, rivi))) continue; // toinen ehti: lasketaan uudelleen
    const kortti = await lahjakorttiIlmanKantaa(koodi);
    const vanhentunut = kortti?.expires_at && new Date(kortti.expires_at) <= new Date();
    if (!kortti || vanhentunut || kortti.balance < -0.004) {
      await B.kirjoita(`${korttiPolku(koodi)}${n}.json`, { ...rivi, summa: 0, tila: "vapautettu" });
      return { ok: false, virhe: "Lahjakortin saldo ei riitä." };
    }
    return { ok: true, id, n };
  }
  return { ok: false, virhe: "Lahjakortin käyttö ei juuri nyt onnistu. Yritä hetken kuluttua uudelleen." };
}

/** Varauksen tila tilaukselle: "veloitettu" (maksun jälkeen) tai "vapautettu" (sessio vanheni, summa 0). */
export async function paivitaLahjakortti(koodi, tilausId, tila) {
  for (const r of await korttiKirjaukset(koodi)) {
    if (r.tilaus !== tilausId || r.tila === tila) continue;
    const { url: _u, n, ...rivi } = r;
    await B.kirjoita(`${korttiPolku(koodi)}${n}.json`, { ...rivi, tila, ...(tila === "vapautettu" ? { summa: 0 } : {}), aika: new Date().toISOString() });
  }
}

// ---------- Kanta: vienti ja siirto ----------

/** Kannan koodit tilannekuvaksi (valvonta, kun kanta vastaa). */
export async function koodienVienti(db) {
  const t = async (f) => { try { return await f(); } catch { return []; } };
  const kumppanit = await t(() => db`select koodi, nimi, email, malli, aktiivinen, kautta_nimi from kumppanit`);
  const alennuskoodit = (await t(() => db`select code, discount_type, discount_value::float as discount_value, is_active from discount_codes`));
  const tilaajat = await t(() => db`select email, discount_code, discount_percent::float as discount_percent, welcome_sent_at from subscribers where discount_code is not null`);
  const asiakaskoodit = await t(() => db`select koodi, tyyppi, prosentti::float as prosentti, email, voimassa, kaytetty from asiakaskoodit`);
  const lahjakortit = await t(() => db`select code, balance::float as balance, initial_value::float as initial_value, expires_at from gift_cards`);
  const maksaneet = (await t(() => db`select distinct lower(customer_email) as e from orders where status = 'maksettu'`)).map((r) => tiiviste(r.e));
  const kaytetyt = (await t(() => db`select distinct upper(discount_code) as k from orders where status = 'maksettu' and discount_code is not null`)).map((r) => r.k);
  return { kumppanit, alennuskoodit, tilaajat, asiakaskoodit, lahjakortit, maksaneet, kaytetyt };
}

/**
 * Blobin koodikirjaukset kantaan (valvonta, puskuritilausten siirron jälkeen) ja uusi tilannekuva:
 *  1. Blobiin luodut kumppanit ja tilaajat kantaan.
 *  2. Veloitetut lahjakorttikäytöt: gift_card_redemptions (yksi per tilaus) ja saldo; vapautetut pois.
 *  3. Käytetyt asiakaskoodit merkitään kantaan.
 *  4. Tilannekuva kirjoitetaan vain, jos se muuttui (Blobin kirjoituskiintiö); sovelletut lahjakorttikirjaukset ja
 *     käyttövaraukset poistetaan vasta tilannekuvan jälkeen.
 */
export async function siirraKoodit(db, { aikaa = () => true } = {}) {
  const tulos = { kumppanit: 0, tilaajat: 0, lahjakortit: 0, kaytot: 0, tilannekuva: false, virheita: 0 };
  const yrita = async (f) => { try { await f(); } catch (e) { tulos.virheita++; console.error("koodit kantaan:", e?.message || e); } };
  for (const b of await B.listaa(`${ETULIITE}kumppanit/`)) {
    if (!aikaa()) break;
    await yrita(async () => {
      const k = await B.lueUrl(b.url);
      if (!k?.koodi) return;
      await db`alter table kumppanit add column if not exists malli text not null default 'provisio'`.catch(() => {});
      await db`insert into kumppanit (koodi, nimi, email, malli, aktiivinen) values (${k.koodi}, ${k.nimi}, ${k.email || null}, ${k.malli || "provisio"}, ${k.aktiivinen !== false})
        on conflict (koodi) do update set nimi = excluded.nimi, email = coalesce(excluded.email, kumppanit.email), malli = excluded.malli, aktiivinen = excluded.aktiivinen`;
      await B.poista([b.url]);
      tulos.kumppanit++;
    });
  }
  for (const b of await B.listaa(`${ETULIITE}tilaajat/`)) {
    if (!aikaa()) break;
    await yrita(async () => {
      const t = await B.lueUrl(b.url);
      if (!t?.email) return;
      await db`insert into subscribers (email, consent_at, consent_text, source, discount_code, discount_percent, welcome_sent_at)
        values (${t.email}, ${t.consent_at || new Date()}, ${t.consent_text || ""}, ${t.source || "blob"}, ${t.discount_code || null}, ${t.discount_percent ?? null}, ${t.welcome_sent_at || null})
        on conflict (email) do update set discount_code = coalesce(subscribers.discount_code, excluded.discount_code),
          discount_percent = coalesce(subscribers.discount_percent, excluded.discount_percent),
          welcome_sent_at = coalesce(subscribers.welcome_sent_at, excluded.welcome_sent_at), updated_at = now()`;
      await B.poista([b.url]);
      tulos.tilaajat++;
    });
  }
  // TERVE-hakemisto pois, kun tilaajat ovat kannassa ja tilannekuvassa.
  const terve = await B.listaa(`${ETULIITE}terve/`);
  const sovelletut = [];
  const poistettavat = [];
  const korttiN = {};
  for (const b of await B.listaa(`${ETULIITE}lahjakortti/`)) {
    if (!aikaa()) break;
    await yrita(async () => {
      const r = await B.lueUrl(b.url);
      const [, koodi, n] = String(b.pathname).match(/^koodit\/lahjakortti\/([^/]+)\/(\d+)\.json$/) || [];
      if (!r || !koodi) return;
      korttiN[koodi] = Math.max(korttiN[koodi] ?? -1, Number(n));
      if (r.tila === "vapautettu") { poistettavat.push(b.url); return; }
      if (r.tila !== "veloitettu") return; // varaus odottaa maksua
      // Tilaus siirtyy kantaan ennen tätä (api/_lib/puskuri-siirto.js); gift_card_redemptions estää kaksoisveloituksen.
      await db.begin(async (tx) => {
        const kirjattu = await tx`insert into gift_card_redemptions (code, order_id, amount) values (${koodi}, ${r.tilaus}, ${r.summa})
          on conflict (order_id) do nothing returning id`;
        if (kirjattu.length) {
          await tx`update gift_cards set balance = greatest(0, balance - ${r.summa}), updated_at = now() where code = ${koodi}`;
          await tx`update orders set gift_card_charged_at = coalesce(gift_card_charged_at, now()) where id = ${r.tilaus}`;
        }
      });
      sovelletut.push(r.id);
      poistettavat.push(b.url);
      tulos.lahjakortit++;
    });
  }
  for (const b of await B.listaa(`${ETULIITE}kaytto/`)) {
    if (!aikaa()) break;
    await yrita(async () => {
      const r = await B.lueUrl(b.url);
      if (!r) return;
      if (r.tila === "vapautettu") { poistettavat.push(b.url); return; }
      if (r.tila !== "kaytetty") return;
      if (/^(KIITOS|PALKKIO)-/.test(r.koodi)) {
        await db`update asiakaskoodit set kaytetty = coalesce(kaytetty, now()), kaytetty_order_id = coalesce(kaytetty_order_id, ${r.tilaus}::uuid) where koodi = ${r.koodi}`;
      }
      poistettavat.push(b.url);
      tulos.kaytot++;
    });
  }
  // Uusi tilannekuva vain muutoksesta; viimeisimmän tiiviste kannan kv-taulussa.
  const vienti = { ...(await koodienVienti(db)), lahjakorttiN: { ...((await tilannekuva())?.lahjakorttiN || {}), ...korttiN } };
  const h = createHash("sha256").update(JSON.stringify(vienti)).digest("hex");
  const vanha = (await db`select value from kv where key = 'koodit_tilannekuva'`.catch(() => []))[0]?.value;
  if (h !== vanha || sovelletut.length) {
    await B.kirjoita(TILANNEKUVA, { ...vienti, sovelletut, luotu: new Date().toISOString() });
    await db`insert into kv (key, value) values ('koodit_tilannekuva', ${h}) on conflict (key) do update set value = excluded.value, updated_at = now()`.catch(() => {});
    tulos.tilannekuva = true;
    nollaaMuisti();
  }
  // Maksaneet: kanta tuntee nyt puskuritilaukset, merkinnät pois tilannekuvan jälkeen.
  const maksaneet = await B.listaa(`${ETULIITE}maksaneet/`);
  if (tulos.tilannekuva || !vanha) poistettavat.push(...maksaneet.map((b) => b.url), ...terve.map((b) => b.url));
  if (poistettavat.length) await B.poista(poistettavat);
  return tulos;
}

/** Onko Blobissa kantaan siirtämättömiä koodikirjauksia (kassa siirtää ne ennen kannan käyttöä). */
export async function koodejaOdottaa() {
  const [l, k, t, u] = await Promise.all(["lahjakortti/", "kaytto/", "tilaajat/", "kumppanit/"].map((p) => B.listaa(`${ETULIITE}${p}`).catch(() => [])));
  return l.length + k.length + t.length + u.length > 0;
}
