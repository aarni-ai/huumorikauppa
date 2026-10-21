#!/usr/bin/env node
/**
 * Uudet tekstituotteet (t-paita, huppari, tarra, koriste) Printifyyn EU-painotaloille tekstilistasta.
 * Oletuksena KUIVA-AJO: näyttää jokaisesta tuotteesta painotalon, blueprintin, hinnan, kate-arvion ja kuvat, ei
 * kirjoita Printifyyn eikä kantaan. Ilman avainta käytetään välimuistia tai esimerkkikatalogia (keksitty, kerrotaan).
 *
 *   node scripts/printify-uudet-tuotteet.mjs [valinnat]          (tai npx tsx scripts/printify-uudet-tuotteet.mjs)
 *
 *   --lista <tiedosto>        käsiteltävä lista (voi toistaa). Oletus: kaikki data/uudet-tuotteet/*.json, joissa on tuotteet.
 *   --toteuta                 luo tuotteet Printifyyn (vaatii PRINTIFY_API_KEY ja PRINTIFY_SHOP_ID). Ei julkaise.
 *   --raja N                  luo / suunnittele enintään N tuotetta (koeajo: --toteuta --raja 1).
 *   --tuo                     (--toteuta kanssa) tuo luodut tuotteet kauppaan PIILOTETTUINA (is_active false), DATABASE_URL.
 *   --hyvaksy <id,...|kaikki> julkaise kaupassa aiemmin tuodut (is_active true), jos kate on tunnettu ja >= 40 %.
 *   --toimitusmaksu 5,90      asiakkaan toimitusmaksu hinnoittelussa (oletus suunniteltu 5,90 €; kauppa perii nyt 6,90 €).
 *   --ilmainen-raja 60        ilmainen toimitus tästä tilaussummasta (oletus suunniteltu 60 €; kaupassa nyt 79 €).
 *   --blueprint tyyppi=id     pakota blueprint (esim. koriste=1234). --painotalo tyyppi=id|nimi pakota painotalo.
 *   --katalogi <tiedosto>     käytä katalogitiedostoa Printifyn sijaan (myös avaimen kanssa).
 *   --ei-kuvia                kuiva-ajossa ei renderöidä kuvia (vain tiedostonimet).
 *
 * Kuvat: promptaa.py render (Pillow, Anton-fontti tools/printify-merkkipaiva/renderer/fonts), painoalueen koossa,
 * kansioon data/uudet-tuotteet/kuvat/ (ei commitoida). Luodut kirjataan data/uudet-tuotteet/luotu-<pvm>.json, ja jo
 * luodut tekstit ohitetaan. Logiikka: scripts/lib/uudet-tuotteet.mjs.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

globalThis.Deno ??= { env: { get: (k) => process.env[k] } };
const {
  parseLista, kasitteleTuote, kirjausRivi, lueKirjaukset, joLuodut, TiedostoKatalogi, LiveKatalogi, teeApi, lukuEuroina,
  euroa, prosenttia, TUOTETYYPIT, SUUNNITELTU_TOIMITUSMAKSU, SUUNNITELTU_ILMAINEN_RAJA,
} = await import("./lib/uudet-tuotteet.mjs");

const argv = process.argv.slice(2);
const lippu = (n) => argv.includes(n);
const arvo = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const arvot = (n) => argv.flatMap((a, i) => (a === n && argv[i + 1] ? [argv[i + 1]] : []));
const toteuta = lippu("--toteuta");
const tuo = lippu("--tuo");
const hyvaksy = arvo("--hyvaksy");
const raja = arvo("--raja") ? Number(arvo("--raja")) : Infinity;
const toimitusmaksu = arvo("--toimitusmaksu") != null ? lukuEuroina(arvo("--toimitusmaksu")) : SUUNNITELTU_TOIMITUSMAKSU;
const ilmainenRaja = arvo("--ilmainen-raja") != null ? lukuEuroina(arvo("--ilmainen-raja")) : SUUNNITELTU_ILMAINEN_RAJA;
if (!Number.isFinite(toimitusmaksu) || !Number.isFinite(ilmainenRaja)) { console.error("--toimitusmaksu / --ilmainen-raja: anna luku, esim. 5,90"); process.exit(1); }
if (tuo && !toteuta) { console.error("--tuo toimii vain --toteuta kanssa (tuo juuri luodut)."); process.exit(1); }

const ohitukset = {};
for (const [lippuNimi, kentta] of [["--blueprint", "blueprint"], ["--painotalo", "painotalo"]]) {
  for (const a of arvot(lippuNimi)) {
    const [t, v] = a.split("=");
    if (!TUOTETYYPIT[t] || !v) { console.error(`${lippuNimi} ${a}: muoto tyyppi=arvo (${Object.keys(TUOTETYYPIT).join(", ")})`); process.exit(1); }
    (ohitukset[t] ??= {})[kentta] = v;
  }
}

const juuri = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kansio = path.join(juuri, "data", "uudet-tuotteet");
const kuvaKansio = path.join(kansio, "kuvat");
const valimuistiPolku = path.join(kansio, ".katalogi-valimuisti.json");
const esimerkkiPolku = path.join(kansio, "katalogi-esimerkki.json");
const fontti = path.join(juuri, "tools", "printify-merkkipaiva", "renderer", "fonts", "Anton-Regular.ttf");
const suht = (p) => path.relative(juuri, p);

const KEY = process.env.PRINTIFY_API_KEY;
const SHOP = process.env.PRINTIFY_SHOP_ID;
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function kanta() {
  if (!dbUrl) { console.error("DATABASE_URL (tai POSTGRES_URL) puuttuu."); process.exit(1); }
  const { default: postgres } = await import("postgres");
  return postgres(dbUrl, { ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(dbUrl) ? false : "require", max: 1, prepare: false });
}

// ---------- --hyvaksy: piilotetut tuotteet myyntiin ----------
if (hyvaksy) {
  const { heikoinKate } = await import("../api/_lib/kate.js");
  const sql = await kanta();
  const idt = hyvaksy === "kaikki"
    ? lueKirjaukset(kansio).filter((r) => r.tuotu && r.printify_id).map((r) => r.printify_id)
    : hyvaksy.split(",").map((s) => s.trim()).filter(Boolean);
  let ok = 0;
  for (const id of idt) {
    const [rivi] = await sql`select * from products where printify_product_id = ${id}`;
    if (!rivi) { console.log(`${id}: ei kannassa`); continue; }
    if (rivi.is_active) { console.log(`${id}: jo myynnissä (${rivi.name})`); continue; }
    const k = heikoinKate({ ...rivi, price: Number(rivi.price) });
    if (k.sallittu !== true) { console.log(`${id}: EI hyväksytty, kate ${k.tunnettu ? prosenttia(k.kate) : "tuntematon (aja printify-tuonti.mjs --kulut)"} (${rivi.name})`); continue; }
    if (!(rivi.images || []).length) { console.log(`${id}: EI hyväksytty, ei kuvia vielä (aja printify-tuonti.mjs --kulut, joka päivittää kuvat) (${rivi.name})`); continue; }
    await sql`update products set is_active = true, updated_at = now() where printify_product_id = ${id}`;
    console.log(`${id}: myynnissä, ${euroa(Number(rivi.price))}, kate ${prosenttia(k.kate)} (${rivi.name})`);
    ok++;
  }
  console.log(`Hyväksytty ${ok}/${idt.length}.`);
  await sql.end();
  process.exit(0);
}

// ---------- Listat ----------
const listaPolut = arvot("--lista").length
  ? arvot("--lista").map((p) => path.resolve(p))
  : (existsSync(kansio) ? readdirSync(kansio) : []).filter((f) => f.endsWith(".json") && !f.startsWith(".")).map((f) => path.join(kansio, f))
    .filter((p) => { try { return Array.isArray(JSON.parse(readFileSync(p, "utf8")).tuotteet); } catch { return false; } });
if (!listaPolut.length) { console.error(`Ei listoja (${suht(kansio)}/*.json tai --lista).`); process.exit(1); }

// ---------- Katalogi ----------
let api = null;
let katalogi;
const esimerkki = existsSync(esimerkkiPolku) ? JSON.parse(readFileSync(esimerkkiPolku, "utf8")) : {};
const valimuisti = existsSync(valimuistiPolku) ? JSON.parse(readFileSync(valimuistiPolku, "utf8")) : null;
if (toteuta && (!KEY || !SHOP)) { console.error("--toteuta tarvitsee PRINTIFY_API_KEY ja PRINTIFY_SHOP_ID."); process.exit(1); }
if (toteuta && arvo("--katalogi")) { console.error("--katalogi on vain kuiva-ajoon: toteutus käyttää aina Printifyn katalogia."); process.exit(1); }
if (arvo("--katalogi")) {
  katalogi = new TiedostoKatalogi({ kuluarviot: esimerkki.kuluarviot, ...JSON.parse(readFileSync(path.resolve(arvo("--katalogi")), "utf8")) }, `tiedosto ${arvo("--katalogi")}`);
} else if (KEY) {
  api = teeApi({ key: KEY });
  katalogi = new LiveKatalogi(api, { arviot: esimerkki.kuluarviot || {}, opitut: valimuisti?.kulut || {} });
} else if (valimuisti) {
  katalogi = new TiedostoKatalogi({ kuluarviot: esimerkki.kuluarviot, ...valimuisti }, `VÄLIMUISTI ${suht(valimuistiPolku)} (haettu ${valimuisti.haettu ?? "?"}), ei avainta`);
} else {
  katalogi = new TiedostoKatalogi(esimerkki, `ESIMERKKIKATALOGI ${suht(esimerkkiPolku)}: ei avainta, painotalot, maat, tunnukset, painoalueet ja kulut ovat KEKSITTYJÄ`);
}
if (toteuta && !api) api = teeApi({ key: KEY });

// ---------- Renderöinti (promptaa.py render) ----------
const python = process.env.PYTHON || "python3";
async function renderoi(rivit, { width, height, vari, asettelu }, polku) {
  const args = [path.join(juuri, "promptaa.py"), "render", "--lines-json", JSON.stringify(rivit), "--w", String(width), "--h", String(height),
    "--out", polku, "--color", vari, "--font", fontti, "--width-ratio", String(asettelu.leveys), "--height-ratio", String(asettelu.korkeus)];
  if (asettelu.yla != null) args.push("--top-ratio", String(asettelu.yla));
  execFileSync(python, args, { stdio: ["ignore", "ignore", "inherit"] });
}

// ---------- Kirjaus ----------
const pvm = new Date().toISOString().slice(0, 10);
const kirjausPolku = path.join(kansio, `luotu-${pvm}.json`);
const kirjaus = existsSync(kirjausPolku) ? JSON.parse(readFileSync(kirjausPolku, "utf8")) : { paiva: pvm, tuotteet: [] };
const tallennaKirjaus = () => { mkdirSync(kansio, { recursive: true }); writeFileSync(kirjausPolku, JSON.stringify(kirjaus, null, 2) + "\n"); };
const tallennaValimuisti = () => {
  if (!(katalogi instanceof LiveKatalogi)) return;
  const d = katalogi.vienti();
  // Täydennetään vanhaa välimuistia (eri ajoissa haetut blueprintit ja painotalot säilyvät).
  const vanha = valimuisti || {};
  const yhd = {
    haettu: d.haettu, blueprints: d.blueprints || vanha.blueprints || [],
    blueprint_providers: { ...vanha.blueprint_providers, ...d.blueprint_providers },
    print_providers: [...new Map([...(vanha.print_providers || []), ...d.print_providers].map((p) => [String(p.id), p])).values()],
    variants: { ...vanha.variants, ...d.variants }, shipping: { ...vanha.shipping, ...d.shipping }, kulut: { ...vanha.kulut, ...d.kulut },
  };
  mkdirSync(kansio, { recursive: true });
  writeFileSync(valimuistiPolku, JSON.stringify(yhd) + "\n");
};

let sql = null;
if (tuo) sql = await kanta();

/** Luotu tuote kauppaan piilotettuna (kuten printify-tuonti.mjs, mutta hinta = laskettu hinta). */
async function tuoKantaan(r) {
  const { buildProductRow } = await import("../supabase/functions/_shared/printify-sync.ts");
  const [olemassa] = await sql`select slug from products where printify_product_id = ${r.printify_id}`;
  if (olemassa) return `jo kannassa (${olemassa.slug})`;
  const slugit = (await sql`select slug from products`).map((x) => x.slug);
  const rivi = buildProductRow(r.tuote, slugit);
  if (!rivi) return "buildProductRow ei tunnistanut tuotetta, ei tuotu";
  rivi.variants.costs = r.oikeatKulut;
  rivi.variants.shipping_cents = r.toimitusSentit;
  await sql`insert into products (name, slug, category, humor_type, price, stock, description, images, variants, printify_product_id, supplier, is_active)
    values (${rivi.name}, ${rivi.slug}, ${rivi.category}, ${rivi.humor_type ?? null}, ${r.hinta}, ${rivi.stock ?? 99}, ${rivi.description ?? null},
      ${sql.json(rivi.images)}, ${sql.json(rivi.variants)}, ${rivi.printify_product_id}, 'printify', false) on conflict (slug) do nothing`;
  return `tuotu piilotettuna (${rivi.slug}${rivi.images.length ? "" : ", ei vielä kuvia"})`;
}

// ---------- Ajo ----------
console.log(`Uudet tuotteet ${toteuta ? "(TOTEUTUS: luo Printifyyn, ei julkaise)" : "(kuiva-ajo, ei kirjoita Printifyyn eikä kantaan)"}`);
console.log(`Katalogi: ${katalogi.lahde}`);
console.log(`Hinnoittelu: toimitusmaksu ${euroa(toimitusmaksu)}, ilmainen ${euroa(ilmainenRaja)} alkaen, kate >= 40 %, ei alle kategorian pohjahinnan.`);
console.log(`  (kauppa perii nyt 6,90 € ja ilmainen alkaa 79 €:sta; kate näytetään myös niillä)`);

const luodut = joLuodut(lueKirjaukset(kansio));
const yhteenveto = { suunniteltu: 0, luotu: 0, "yli-enimmaishinnan": 0, ohitettu: 0, jo: 0, virhe: 0 };
const eiToteutettavissa = [];
let kasitelty = 0;

for (const polku of listaPolut) {
  const lista = parseLista(JSON.parse(readFileSync(polku, "utf8")), { tiedosto: path.basename(polku, ".json") });
  console.log(`\n=== ${lista.nimi} (${suht(polku)})${lista.enimmaishinta ? `, enintään ${euroa(lista.enimmaishinta)}` : ""}: ${lista.tuotteet.length} tuotetta ===`);
  for (const v of lista.virheet) console.log(`  VIRHE listassa: ${v}`);
  yhteenveto.virhe += lista.virheet.length;
  for (const tuote of lista.tuotteet) {
    if (luodut.has(tuote.avain)) { yhteenveto.jo++; console.log(`\n- ${tuote.tyyppi} "${tuote.teksti}": jo luotu aiemmin, ohitetaan`); continue; }
    if (kasitelty >= raja) break;
    kasitelty++;
    console.log(`\n[${kasitelty}] ${tuote.tyyppi}  "${tuote.teksti}"`);
    console.log(`  otsikko:   ${tuote.otsikko}`);
    let r;
    try {
      r = await kasitteleTuote(tuote, {
        katalogi, enimmaishinta: lista.enimmaishinta, toimitusmaksu, ilmainenRaja, ohitukset, renderoi, kuvaKansio,
        luoKuvat: !lippu("--ei-kuvia"), toteuta, api, shopId: SHOP, lueTiedosto: (p) => readFileSync(p),
      });
    } catch (e) {
      console.log(`  VIRHE: ${e?.message || e}`);
      yhteenveto.virhe++;
      continue;
    }
    if (r.painotalo) {
      console.log(`  kohde:     ${r.painotalo}, blueprint ${r.blueprint} (${r.blueprint_id}), peruste: ${r.peruste}`);
      if (r.muut?.length) console.log(`             muut EU-vaihtoehdot: ${r.muut.join("; ")}`);
      const puuttuu = [...r.puuttuvatVarit, ...r.puuttuvatKoot];
      console.log(`  variantit: ${r.variantit} käytössä${puuttuu.length ? `, painotalolla ei ole: ${puuttuu.join(", ")}` : ""}`);
    }
    const h = r.hinnoittelu;
    if (h?.kulu != null) {
      const kulut = r.kulut.length ? `${euroa(Math.min(...r.kulut) / 100)}${Math.min(...r.kulut) !== Math.max(...r.kulut) ? `...${euroa(Math.max(...r.kulut) / 100)}` : ""}` : "?";
      console.log(`  kulut:     tuote ${kulut}${r.kulutArvio ? " (ARVIO)" : " (Printify)"}, toimitus Suomeen ${euroa(r.toimitusSentit / 100)}`);
    }
    if (h?.hinta != null) {
      console.log(`  hinta:     ${euroa(h.hinta)} (${h.peruste}${h.pohja ? `, pohja ${euroa(h.pohja)}` : ""}), kate ${prosenttia(h.kate)} / nettokate ${euroa(h.nettokate)}; nykyisellä 6,90 €/79 €: ${prosenttia(h.kateNyt)}`);
      if (h.varoitus) console.log(`  HUOM:      ${h.varoitus}`);
    }
    for (const k of r.kuvat || []) console.log(`  kuva:      ${suht(k.polku)} (${r.painoalue.width}×${r.painoalue.height}${r.painoalue.katalogista ? "" : ", oletuskoko"}, ${r.painoalue.position}, teksti ${k.vari}${k.tuotevarit.length ? ` ${k.tuotevarit.join(", ")}` : ""})${lippu("--ei-kuvia") && !toteuta ? " [ei renderöity]" : ""}`);
    if (r.hintaPaivitetty) console.log(`  hinta päivitetty Printifyn oikeilla kuluilla: ${euroa(r.hintaPaivitetty.arvio)} -> ${euroa(r.hintaPaivitetty.oikea)}`);
    if (r.syy) console.log(`  ${r.tila === "ohitettu" ? "OHITETAAN" : "HUOM"}: ${r.syy}`);
    if (r.syy?.startsWith("ei toteutettavissa") || r.tila === "yli-enimmaishinnan") eiToteutettavissa.push(`${r.teksti} (${r.tyyppi}): ${r.syy}`);
    yhteenveto[r.tila]++;
    if (r.printify_id) {
      console.log(`  LUOTU Printifyyn: ${r.printify_id}`);
      const rivi = kirjausRivi(r);
      kirjaus.tuotteet.push(rivi);
      // Opitut oikeat kulut välimuistiin seuraavien ajojen hinta-arvioita varten.
      if (katalogi instanceof LiveKatalogi) Object.assign((katalogi.d.kulut[`${r.blueprint_id}/${r.print_provider_id}`] ??= {}), r.oikeatKulut);
      tallennaKirjaus();
      if (sql && r.tila === "luotu") {
        rivi.tuotu = (rivi.kanta = await tuoKantaan(r)).startsWith("tuotu");
        console.log(`  kanta:     ${rivi.kanta}`);
        tallennaKirjaus();
      }
      await new Promise((ok) => setTimeout(ok, 1500)); // luonti on rajoitettu, pidetään väliä
    }
  }
}
tallennaValimuisti();

console.log(`\nYhteenveto: ${Object.entries(yhteenveto).filter(([, n]) => n).map(([k, n]) => `${k} ${n}`).join(", ") || "ei mitään"}${kasitelty >= raja ? ` (raja ${raja})` : ""}.`);
if (eiToteutettavissa.length) { console.log("Ei toteutettavissa listan hintarajalla:"); for (const e of eiToteutettavissa) console.log(`  - ${e}`); }
if (!toteuta) console.log(`Kuiva-ajo: mitään ei luotu.${katalogi instanceof TiedostoKatalogi ? " Hinnat ja painotalot ovat suuntaa antavia (ei Printify-avainta)." : " Kulut ovat arvioita, kunnes tuote on luotu; --toteuta tarkistaa hinnan oikeilla kuluilla."}`);
else console.log(`Kirjaus: ${suht(kirjausPolku)}. Tuotteita EI julkaistu. ${tuo ? "Kauppaan tuodut ovat piilossa: hyväksy --hyvaksy." : "Tuo kauppaan piilotettuina: --tuo (tai printify-tuonti.mjs)."}`);
if (sql) await sql.end();
