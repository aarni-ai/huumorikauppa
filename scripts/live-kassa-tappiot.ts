#!/usr/bin/env -S npx tsx
/**
 * Live-kassan (Lovable create-checkout) tappiolliset korit, 27.10.2026.
 *
 * Lovablen kassa veloittaa toimitusmaksun 3,90 € ja antaa ilmaisen toimituksen 60 eurosta, vaikka sivusto ja repo
 * käyttävät 6,90 € / 79 € (muutosta ei ole julkaistu Lovablessa). Skripti laskee jokaisen sivustolla näkyvän tuotteen
 * (src/lib/hiddenCategories.ts onPiilotettuTuote, tilattavat variantit src/lib/variantAvailability.ts) heikoimman
 * variantin osuuden korin katteesta ja etsii tappiolliset korit: yksittäiset tuotteet, kaikki tuoteparit (myös sama
 * tuote kahdesti) ja kolmen tuotteen korit, jotka koostuvat heikoimmista tuotteista.
 *
 *   tuotteen osuus = hinta / 1,255 - hinta * 1,5 % - Printifyn tuotekulu - Printifyn toimitus (ensimmäinen kappale,
 *                    saman painotalon lisäkappaleilla lisäkappaleen hinta)
 *   korin kate     = osuuksien summa + (summa < 60 ? 3,90 / 1,255 - 3,90 * 1,5 % : 0) - 0,25 (Stripen kiinteä)
 *
 * Tuotteet ja hinnat Supabasesta (anon, sama taulu jota kassa lukee), kulut Printifystä. Välimuisti: --data <kansio>
 * (supabase.json, printify.json, shipping.json): Supabasen products-rivit (anon REST), Printify-kaupan tuotteet ja
 * /catalog/blueprints/{bp}/print_providers/{pp}/shipping.json avaimella "bp/pp". Tulos JSON-muodossa stdoutiin.
 *
 * --kirjoita <tiedosto>: variantit, jotka ovat tappiollisia jo yksinään (yhden kappaleen tilaus), kirjoitetaan
 * moduuliksi (api/_lib/lovable-kassa-tappio.js), jonka src/lib/variantAvailability.ts piilottaa sivustolta.
 *
 *   npx tsx scripts/live-kassa-tappiot.ts --data <kansio> [--kirjoita api/_lib/lovable-kassa-tappio.js]
 */
import fs from "node:fs";
import { onPiilotettuTuote } from "../src/lib/hiddenCategories";
import { perusSaatavuus, isVariantAvailable as sivustonSaatavuus } from "../src/lib/variantAvailability";

// --sivuston-nakyvyys: laske sivuston nykyisellä näkyvyydellä (tämän skriptin piilotukset mukana), muuten ilman niitä.
const isVariantAvailable = process.argv.includes("--sivuston-nakyvyys") ? sivustonSaatavuus : perusSaatavuus.isVariantAvailable;

const ALV = 1.255;
const STRIPE_P = 0.015;
const STRIPE_K = 0.25;
const arvo = (n: string, oletus?: string) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : oletus);
const MAKSU = Number(arvo("--toimitusmaksu", "3.90"));
const RAJA = Number(arvo("--ilmainen-raja", "60"));
const DATA = arvo("--data");
const KIRJOITA = arvo("--kirjoita");

type Rivi = { slug: string; name: string; category: string; price: number | string; is_active: boolean; printify_product_id: string; variants: { variant_map?: Record<string, number> } | null };
type Profiili = { variant_ids?: number[]; countries?: string[]; first_item: { cost: number }; additional_items: { cost: number } };
type PfTuote = { id: string; blueprint_id: number; print_provider_id: number; variants: { id: number; cost: number; is_enabled: boolean }[] };

const lue = (f: string) => JSON.parse(fs.readFileSync(`${DATA}/${f}`, "utf8"));
const rivit: Rivi[] = lue("supabase.json");
const pf = new Map<string, PfTuote>((lue("printify.json") as PfTuote[]).map((p) => [String(p.id), p]));
const ship: Record<string, { profiles?: Profiili[] } | null> = lue("shipping.json");

function toimitus(p: PfTuote, vid: number): { eka: number; lisa: number } | null {
  const prof = ship[`${p.blueprint_id}/${p.print_provider_id}`]?.profiles || [];
  const omat = prof.filter((x) => (x.variant_ids || []).includes(vid));
  const fi = omat.find((x) => (x.countries || []).includes("FI")) || omat.find((x) => (x.countries || []).includes("REST_OF_THE_WORLD"));
  return fi ? { eka: fi.first_item.cost / 100, lisa: fi.additional_items.cost / 100 } : null;
}

/** Yhden kappaleen tilauksen kate (toimitusmaksu, jos hinta alle rajan). */
const yksinKate = (hinta: number, kulu: number, toimitusEka: number) => {
  const maksettu = hinta + (hinta >= RAJA ? 0 : MAKSU);
  return maksettu / ALV - maksettu * STRIPE_P - STRIPE_K - kulu - toimitusEka;
};
const heikot: { slug: string; kategoria: string; avain: string; hinta: number; painotalo: number; eka: number; yksin: number }[] = [];
const vahvat: { painotalo: number; eka: number }[] = [];

type Osa = { slug: string; kategoria: string; hinta: number; painotalo: number; variantti: string; eka: number; lisa: number };
const osat: Osa[] = [];
const tuntemattomat: string[] = [];
for (const r of rivit) {
  if (!r.is_active || onPiilotettuTuote(r)) continue;
  const p = pf.get(String(r.printify_product_id));
  if (!p) { tuntemattomat.push(r.slug); continue; }
  const hinta = Number(r.price);
  const netto = hinta / ALV - hinta * STRIPE_P;
  let heikoin: Osa | null = null;
  for (const [avain, vid] of Object.entries<number>(r.variants?.variant_map || {})) {
    const [vari, koko] = avain.split("|");
    if (!isVariantAvailable(r, vari, koko)) continue;
    const v = p.variants.find((x) => x.id === Number(vid));
    const t = toimitus(p, Number(vid));
    if (!v || !t) continue;
    const eka = netto - v.cost / 100 - t.eka;
    // Piilotetaan: tappiollinen yksinään, tai ilmaisen toimituksen korissa osuus jää alle Stripen kiinteän maksun
    // (silloin jokin yli rajan menevä kori voi jäädä tappiolle). Kun jokaisen näkyvän variantin osuus on vähintään
    // 0,25 €, jokainen kori on voitollinen: yli rajan osuuksien summa >= 0,25 €, alle rajan lisäksi toimitusmaksu.
    (eka < STRIPE_K ? heikot : vahvat).push({ slug: r.slug, kategoria: r.category, avain, hinta, painotalo: p.print_provider_id, eka, yksin: yksinKate(hinta, v.cost / 100, t.eka) });
    if (!heikoin || eka < heikoin.eka) heikoin = { slug: r.slug, kategoria: r.category, hinta, painotalo: p.print_provider_id, variantti: avain, eka, lisa: netto - v.cost / 100 - t.lisa };
  }
  if (heikoin) osat.push(heikoin); else tuntemattomat.push(r.slug);
}

// Heikko variantti (osuus alle 0,25 €) saa jäädä näkyviin, jos se ei ole tappiollinen yksinään ja sen osuus kattaa
// vajeen jokaisen muun painotalon näkyvän variantin kanssa (osuus + heikoin muun painotalon osuus >= 0,25 €; saman
// painotalon toinen tuote maksaa vain lisäkappaleen toimituksen). Järjestys: ensin tavalliset koot (S-2XL ja kokoa
// vailla olevat paitsi tarrat), sitten isot koot (3XL-5XL) ja tarrat, kunkin sisällä vahvin osuus ensin. Lopputulos
// tarkistetaan alla kaikilla pareilla ja heikoimpien kolmikoilla.
const heikoinPainotalolla = new Map<number, number>();
const kirjaa = (pt: number, eka: number) => heikoinPainotalolla.set(pt, Math.min(heikoinPainotalolla.get(pt) ?? Infinity, eka));
for (const v of vahvat) kirjaa(v.painotalo, v.eka);
const heikoinMuu = (pt: number) => Math.min(...[...heikoinPainotalolla].filter(([p]) => p !== pt).map(([, e]) => e));
const yksinTappio: Record<string, string[]> = {};
const toissijainen = (h: { avain: string; kategoria: string }) => (/\|[3-9]XL$/.test(h.avain) || h.kategoria === "tarrat" ? 1 : 0);
for (const h of heikot.sort((a, b) => toissijainen(a) - toissijainen(b) || b.eka - a.eka)) {
  if (h.yksin >= 0 && h.eka + heikoinMuu(h.painotalo) >= STRIPE_K) kirjaa(h.painotalo, h.eka);
  else (yksinTappio[h.slug] ??= []).push(h.avain);
}

const lisaTulo = MAKSU / ALV - MAKSU * STRIPE_P;
function kori(k: Osa[]): number {
  const summa = k.reduce((a, o) => a + o.hinta, 0);
  const nahty = new Set<number>();
  let kate = summa < RAJA ? lisaTulo : 0;
  for (const o of [...k].sort((a, b) => a.eka - a.lisa - (b.eka - b.lisa))) {
    kate += nahty.has(o.painotalo) ? o.lisa : o.eka;
    nahty.add(o.painotalo);
  }
  return Math.round((kate - STRIPE_K) * 100) / 100;
}

const tappiot: { kori: string[]; summa: number; kate: number }[] = [];
const lisaa = (k: Osa[]) => {
  const kate = kori(k);
  if (kate < 0) tappiot.push({ kori: k.map((o) => `${o.slug} (${o.variantti})`), summa: Math.round(k.reduce((a, o) => a + o.hinta, 0) * 100) / 100, kate });
};
for (const a of osat) lisaa([a]);
for (let i = 0; i < osat.length; i++) for (let j = i; j < osat.length; j++) lisaa([osat[i], osat[j]]);
// Kolmen tuotteen korit: 40 heikointa ensimmäisen kappaleen osuudella (tappiollinen kolmikko vaatii heikkoja osia).
const heikoimmat = [...osat].sort((a, b) => a.eka - b.eka).slice(0, 40);
for (let i = 0; i < heikoimmat.length; i++) for (let j = i; j < heikoimmat.length; j++) for (let k = j; k < heikoimmat.length; k++) lisaa([heikoimmat[i], heikoimmat[j], heikoimmat[k]]);

const tappioTuotteet = new Map<string, number>();
for (const t of tappiot) for (const s of new Set(t.kori.map((x) => x.replace(/ \(.*$/, "")))) tappioTuotteet.set(s, (tappioTuotteet.get(s) || 0) + 1);
const osaSlug = new Map(osat.map((o) => [o.slug, o]));
if (KIRJOITA) {
  const data = Object.fromEntries(Object.entries(yksinTappio).sort().map(([k, v]) => [k, v.sort()]));
  fs.writeFileSync(KIRJOITA, `// GENEROITU: scripts/live-kassa-tappiot.ts --kirjoita. Älä muokkaa käsin.
// Variantit, jotka Lovablen julkaisematon kassa (vanha toimitussääntö, KATTEET.md) myisi tappiolla yksin tai jossakin
// ilmaisen toimituksen korissa. src/lib/variantAvailability.ts piilottaa ne. Oman taustan kassa (api/_lib/vakiot.js,
// katesääntö api/_lib/kate.js) ei tarvitse tätä: oma-tausta-haarassa lista on tyhjä.
/** @type {Record<string, string[]>} */
export const LOVABLE_KASSA_TAPPIO = ${JSON.stringify(data, null, 2)};
`);
}

console.log(JSON.stringify({
  yksinTappiollisetVariantit: yksinTappio,
  saanto: { toimitusmaksu: MAKSU, ilmainenRaja: RAJA },
  nakyviaTuotteita: osat.length,
  tuntemattomat,
  tappiollisiaKoreja: tappiot.length,
  heikoinKori: [...tappiot].sort((a, b) => a.kate - b.kate)[0] || null,
  tappioTuotteet: [...tappioTuotteet].sort((a, b) => b[1] - a[1]).map(([slug, n]) => ({ slug, koreja: n, ...osaSlug.get(slug) })),
  osuudetKategorioittain: Object.fromEntries(
    [...new Set(osat.map((o) => o.kategoria))].map((k) => {
      const os = osat.filter((o) => o.kategoria === k);
      return [k, { tuotteita: os.length, heikoinEka: Math.min(...os.map((o) => Math.round(o.eka * 100) / 100)), heikoinLisa: Math.min(...os.map((o) => Math.round(o.lisa * 100) / 100)) }];
    }),
  ),
  esimerkit: [...tappiot].sort((a, b) => a.kate - b.kate).slice(0, 25),
}, null, 2));
