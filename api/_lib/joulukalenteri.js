/**
 * Joulukalenteri /joulukalenteri (4.11.2026): 1.-24.12.2026 joka päivä yksi luukku, jonka tuote (tai kahden kappaleen
 * sarja) on tarjoushintaan vain sen päivän Suomen aikaa (00.00-23.59). Puhdas moduuli ilman luukkujen tietoja: selain
 * (ostoskorin arvio) ja palvelin käyttävät samaa laskentaa. Luukkujen tuotteet ja hinnat ovat vain palvelimella
 * (api/_lib/joulukalenteri-data.js, ei koskaan selaimen pakettiin), ja /api/products?joulukalenteri=1 palauttaa vain
 * menneet ja tämän päivän luukut (julkisetLuukut).
 *
 * Hinta (kassa, api/_lib/kassa.js):
 * - Tarjous koskee riviä, jonka tuote on tämän päivän luukun tuote (kaikki koot ja värit, ellei luukku rajaa koot tai
 *   värit). Sarjaluukussa (kpl 2) tarjous koskee jokaista täyttä kahden kappaleen sarjaa.
 * - Luukun hinta on perushinnan (pienin koko) tarjous; muut koot saavat saman euromääräisen alennuksen (3XL+ huppari
 *   59,90 € -> 56,90 €, kun perushinta 52,90 € -> 49,90 €).
 * - Ei yhdisty muihin alennuksiin: alennuskoodi (myös TERVE ja kumppani) vie tarjouksen, eikä paketti-, kahden tuotteen,
 *   määrä-, ensitilauksen tai Black Fridayn alennusta anneta tilaukselle, jossa luukun hinta on käytössä. Ilmaisen
 *   toimituksen hintatestin B-hinta ei koske tilausta (toimitustesti.js).
 * - Kate (api/_lib/katesaanto.js): tilauksen nettokate vähintään 7 € jokaista tilauksen kappaletta kohden. Toimitus on
 *   pienin porras (kate.js TOIMITUS_PORTAAT, enintään tavallinen toimitusmaksu), jolla raja täyttyy; jos ei millään,
 *   tarjousta ei anneta ja tilaus lasketaan tavallisin säännöin. Luukun hinta valitaan niin, että yhden kappaleen tilaus
 *   täyttää rajan jokaisella myytävällä variantilla (luukunHinta, src/test/joulukalenteri.test.ts).
 * - Kuluttajansuojalaki 2:6 a §: tarjouksen vieressä 30 päivän alin hinta (alinHinta30pv).
 */
import { laskeTilauksenNettokate, TOIMITUS_PORTAAT, myytavatVariantit } from "./kate.js";
import { rivinHinta } from "./kokohinnat.js";
import { KAMPANJAPAIVAT, LISATUOTE_KATEGORIAT, toimitusmaksu } from "./vakiot.js";
import { katePerKpl, MIN_KATE_PER_KPL } from "./katesaanto.js";

export const JOULUKALENTERI_POLKU = "/joulukalenteri";
export const JOULUKALENTERI_ALKU = KAMPANJAPAIVAT.joulukalenteri.alku;
export const JOULUKALENTERI_LOPPU = KAMPANJAPAIVAT.joulukalenteri.loppu;
export const JOULUKALENTERI_ESITTELY = KAMPANJAPAIVAT.joulukalenteri.esittely;
export const LUUKKUJA = 24;
/** Luukun hinnan valinta: alennus euroina vähintään ja enintään (luukunHinta). */
export const LUUKKU_MIN_ALENNUS = 2;
export const LUUKKU_MAX_ALENNUS = 8;
/** Varmuusvara katteeseen hinnan valinnassa (Printifyn kulut voivat nousta ennen joulukuuta). */
export const LUUKKU_KATEVARA = 0.2;

const HKI = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" });
/** Päivä Suomen aikaa (YYYY-MM-DD). */
export const helsinginPaiva = (nyt = new Date()) => HKI.format(nyt instanceof Date ? nyt : new Date(nyt));

/** Luukun numero 1-24 -> päivämäärä (YYYY-MM-DD). */
export const luukunPvm = (n) => `${JOULUKALENTERI_ALKU.slice(0, 8)}${String(n).padStart(2, "0")}`;

/** Päivämäärä -> luukun numero 1-24, tai null kalenterin ulkopuolella. */
export function luukunNumero(iso) {
  if (typeof iso !== "string" || iso < JOULUKALENTERI_ALKU || iso > JOULUKALENTERI_LOPPU) return null;
  return Number(iso.slice(8, 10)) - Number(JOULUKALENTERI_ALKU.slice(8, 10)) + 1;
}

/** Kalenterin tila hetkellä nyt: "tulossa" (ennen 1.12.), "auki" (1.-24.12.) tai "paattynyt". */
export function kalenterinTila(nyt = new Date()) {
  const p = helsinginPaiva(nyt);
  if (p < JOULUKALENTERI_ALKU) return "tulossa";
  if (p > JOULUKALENTERI_LOPPU) return "paattynyt";
  return "auki";
}

/** Luukun n tila hetkellä nyt: "tuleva" (ei voi avata), "auki" (tämän päivän luukku) tai "mennyt". */
export function luukunTila(n, nyt = new Date()) {
  const p = helsinginPaiva(nyt);
  const pvm = luukunPvm(n);
  if (p < pvm) return "tuleva";
  if (p === pvm) return "auki";
  return "mennyt";
}

/** Tämän päivän luukku (luukut: joulukalenteri-data.js) tai null. Muina päivinä ei koskaan mitään. */
export function avoinLuukku(luukut, nyt = new Date()) {
  const n = luukunNumero(helsinginPaiva(nyt));
  if (!n || !Array.isArray(luukut)) return null;
  const l = luukut.find((x) => Number(x?.paiva) === n);
  return l ? { ...l, kpl: Number(l.kpl) > 1 ? Number(l.kpl) : 1, pvm: luukunPvm(n) } : null;
}

/**
 * Julkinen luukkulista: vain menneet ja tämän päivän luukku (numero, päivä ja tila), ei koskaan tulevia eikä tuotteita.
 * Tuotteen ja hinnan liittää /api/products?joulukalenteri=1 vain tämän päivän luukulle; sivu piirtää tulevat suljettuina.
 */
export function julkisetLuukut(nyt = new Date()) {
  return Array.from({ length: LUUKKUJA }, (_, i) => ({ paiva: i + 1, pvm: luukunPvm(i + 1), tila: luukunTila(i + 1, nyt) }))
    .filter((l) => l.tila !== "tuleva");
}

/** Rivi kelpaa luukun tarjoukseen (tuote, sallitut koot ja värit). */
export function kelpaaLuukkuun(rivi, luukku) {
  if (!rivi || !luukku || rivi.slug !== luukku.slug) return false;
  if (Array.isArray(luukku.koot) && luukku.koot.length && !luukku.koot.includes(rivi.size)) return false;
  if (Array.isArray(luukku.varit) && luukku.varit.length && !luukku.varit.includes(rivi.color)) return false;
  return true;
}

/** Sarjan alennus sentteinä kappaletta kohden: (perushinta x kpl - luukun hinta) / kpl. null, jos ei alennusta. */
export function luukunAlennusSentit(tuote, luukku) {
  const kpl = Number(luukku?.kpl) > 1 ? Number(luukku.kpl) : 1;
  const perus = Math.round(Number(tuote?.price) * 100);
  const hinta = Math.round(Number(luukku?.hinta) * 100);
  if (!Number.isFinite(perus) || !Number.isFinite(hinta) || hinta <= 0) return null;
  const yhteensa = perus * kpl - hinta;
  if (yhteensa <= 0 || yhteensa % kpl !== 0) return null;
  return yhteensa / kpl;
}

/** Koon tarjoushinta kappaleelta euroina (perushinnan alennus samana euromääränä kaikille koille). */
export function luukunKappalehinta(tuote, koko, luukku) {
  const a = luukunAlennusSentit(tuote, luukku);
  if (a === null) return null;
  return (Math.round(Number(rivinHinta(tuote, koko)) * 100) - a) / 100;
}

/**
 * Kassan rivit luukun hinnalla. rivit: kassan fyysiset rivit ({ slug, size, color, quantity, unit_cents }),
 * tuoteSlugilla: Map slug -> tuoterivi. Sarjaluukussa vain täydet sarjat; rivi jaetaan tarvittaessa kahdeksi.
 * Palauttaa { rivit, alennusSentit, kpl (tarjouksen kappaleet) } tai null.
 */
export function sovellaLuukku(rivit, luukku, tuoteSlugilla) {
  const tuote = tuoteSlugilla.get(luukku?.slug);
  if (!tuote) return null;
  const perYksikko = luukunAlennusSentit(tuote, luukku);
  if (perYksikko === null) return null;
  const kpl = Number(luukku.kpl) > 1 ? Number(luukku.kpl) : 1;
  const kelpaavat = rivit.filter((r) => kelpaaLuukkuun(r, luukku)).reduce((s, r) => s + r.quantity, 0);
  let jaljella = Math.floor(kelpaavat / kpl) * kpl;
  if (jaljella < 1) return null;
  const uudet = [];
  let alennusSentit = 0;
  for (const r of rivit) {
    if (!jaljella || !kelpaaLuukkuun(r, luukku)) { uudet.push(r); continue; }
    const maara = Math.min(r.quantity, jaljella);
    const hinta = r.unit_cents - perYksikko;
    if (hinta <= 0) return null;
    uudet.push({ ...r, quantity: maara, unit_cents: hinta, joulukalenteri: luukku.pvm ?? null, joulukalenteri_alennus: perYksikko / 100 });
    if (r.quantity > maara) uudet.push({ ...r, quantity: r.quantity - maara });
    alennusSentit += perYksikko * maara;
    jaljella -= maara;
  }
  return { rivit: uudet, alennusSentit, kpl: Math.floor(kelpaavat / kpl) * kpl };
}

/**
 * Toimitusmaksu tilaukselle, jossa luukun hinta on käytössä: tavallinen sääntö (raja tai kaksi tuotetta) ja sen päälle
 * pienin porras, jolla nettokate on vähintään 7 € kappaletta kohden. osat [{ tuote, varianttiId, maara, yksikkohinta }],
 * summa (euroa, tarjouksen jälkeen), toimitusKpl (tarrat eivät lasketa), kpl (kaikki fyysiset kappaleet).
 * Palauttaa { maksu, tavallinen, rajattu, nettokate } tai null (raja ei täyty millään portaalla tai kulu tuntematon).
 */
export function luukunToimitus({ osat, summa, toimitusKpl, kpl, min = MIN_KATE_PER_KPL }) {
  const tavallinen = toimitusmaksu({ summa, kpl: toimitusKpl, alennus: false });
  for (const maksu of TOIMITUS_PORTAAT) {
    if (maksu < tavallinen) continue;
    const k = laskeTilauksenNettokate(osat, maksu);
    if (!k.tunnettu) return null;
    if (katePerKpl(k.nettokate, kpl) >= min) return { maksu, tavallinen, rajattu: maksu !== tavallinen, nettokate: k.nettokate };
  }
  return null;
}

/**
 * Yhden kappaleen (tai sarjan) tilauksen heikoin nettokate kappaletta kohden luukun hinnalla kaikilla myytävillä
 * varianteilla (sama kaava kuin kassalla: luukunToimitus). null, jos jonkin variantin kulu on tuntematon.
 */
export function luukunHeikoinKate(tuote, luukku) {
  const kpl = Number(luukku?.kpl) > 1 ? Number(luukku.kpl) : 1;
  let heikoin = Infinity;
  const variantit = myytavatVariantit(tuote).filter(([avain]) => {
    const [vari, koko] = avain.split("|");
    return kelpaaLuukkuun({ slug: tuote.slug, size: koko, color: vari }, { ...luukku, slug: tuote.slug });
  });
  if (!variantit.length) return null;
  for (const [avain, id] of variantit) {
    const koko = avain.split("|")[1];
    const hinta = luukunKappalehinta(tuote, koko, luukku);
    if (hinta === null) return null;
    const osat = [{ tuote, varianttiId: id, maara: kpl, yksikkohinta: hinta }];
    const toimitusKpl = LISATUOTE_KATEGORIAT.includes(tuote.category) ? 0 : kpl;
    const t = luukunToimitus({ osat, summa: hinta * kpl, toimitusKpl, kpl, min: -Infinity });
    if (!t) return null;
    heikoin = Math.min(heikoin, katePerKpl(t.nettokate, kpl));
  }
  return Math.round(heikoin * 100) / 100;
}

/**
 * Luukun hinta tuotteelle: suurin tasaeuroinen alennus perushinnasta (hinta päättyy samoihin sentteihin, esim. 27,90 ->
 * 24,90), jolla jokaisen myytävän variantin kate on vähintään 7 € + varmuusvara kappaletta kohden. kpl 2 = kahden
 * kappaleen sarjan hinta. Palauttaa { hinta, alennus, heikoinKate } tai null (alennus jäisi alle LUUKKU_MIN_ALENNUS).
 */
export function luukunHinta(tuote, { kpl = 1, minKate = MIN_KATE_PER_KPL + LUUKKU_KATEVARA, maxAlennus = LUUKKU_MAX_ALENNUS, minAlennus = LUUKKU_MIN_ALENNUS } = {}) {
  const perus = Number(tuote?.price);
  if (!Number.isFinite(perus) || perus <= 0) return null;
  for (let a = maxAlennus * kpl; a >= minAlennus * kpl; a -= kpl) {
    const hinta = Math.round((perus * kpl - a) * 100) / 100;
    if (hinta <= 0) continue;
    const k = luukunHeikoinKate(tuote, { slug: tuote.slug, hinta, kpl });
    if (k !== null && k >= minKate) return { hinta, alennus: a, heikoinKate: k };
  }
  return null;
}

/**
 * Kuluttajansuojalaki 2:6 a §: alin hinta 30 päivän aikana ennen tarjousta. nykyinen = perushinta nyt, historia =
 * hintahistorian hinnat (api/cron/tilaukset.js hintatarkistus) tarjousta edeltäneiltä 30 päivältä.
 */
export function alinHinta30pv(nykyinen, historia = []) {
  const hinnat = [Number(nykyinen), ...historia.map(Number)].filter((x) => Number.isFinite(x) && x > 0);
  return hinnat.length ? Math.min(...hinnat) : null;
}

/** "24,90 €" */
export const eur = (x) => `${Number(x).toFixed(2).replace(".", ",")} €`;

/** Luukun lyhyt hintateksti: "24,90 €" tai "2 kpl yhteensä 46,90 €". */
export const luukunHintaTeksti = (luukku) => (Number(luukku?.kpl) > 1 ? `${luukku.kpl} kpl yhteensä ${eur(luukku.hinta)}` : eur(luukku.hinta));

/** Seuraava keskiyö Suomen aikaa (ms) hetkestä nyt: välimuistin enimmäisikä luukun rajapinnalle. */
export function sekuntejaKeskiyohon(nyt = new Date()) {
  const ms = nyt instanceof Date ? nyt.getTime() : Number(nyt);
  const p = helsinginPaiva(ms);
  // Ensimmäinen tunti, jonka päivä vaihtuu (Suomen aika on tasatunnein UTC:stä).
  let t = Math.floor(ms / 3600000) * 3600000;
  while (helsinginPaiva(t) === p) t += 3600000;
  return Math.max(0, Math.floor((t - ms) / 1000));
}
