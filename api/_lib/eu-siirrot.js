/**
 * EU-siirrot omaan kantaan Vercel-funktiosta (api/cron/tilaukset.js ?tehtava=eu-siirrot). Sama kirjastokoodi kuin
 * scripts/printify-eu-painotalot.mjs --paivita-kanta (scripts/lib/eu-kanta.mjs): rivit, joiden printify_product_id on
 * kirjatun siirron (data/eu-siirto-*.json) vanhaId, siirretään EU-kopioon (printify_product_id, variantit, kulut,
 * kuvat); slug, nimi, hinta, näkyvyys ja kuvaus säilyvät. Idempotentti: jo siirretyt ohitetaan ilman Printify-hakuja.
 * Funktiona, koska kannan DATABASE_URL on Vercelissä Sensitive eikä sitä ole koneella.
 *
 * Palauttaa myös tarkistuksen: EU-reitityksen piilottamat rivit (api/_lib/eu-reititys-data.js EU_PIILOTETUT) ja
 * osoittavatko ne EU-kopioon. Rivi, joka osoittaa EU-kopioon, näkyy kaupassa (api/_lib/eu-reititys.js onEuReititetty).
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { lueEuSiirrot, paivitaSiirrotKantaan } from "../../scripts/lib/eu-kanta.mjs";
import { EU_PIILOTETUT } from "./eu-reititys-data.js";

/** data-kansio, jossa on eu-siirto-*.json (vercel.json includeFiles säilyttää polun; varalla työhakemisto). */
export function euSiirtoKansio() {
  for (const k of [fileURLToPath(new URL("../../data", import.meta.url)), join(process.cwd(), "data")]) {
    if (existsSync(k) && readdirSync(k).some((f) => /^eu-siirto-.*\.json$/.test(f))) return k;
  }
  return null;
}

/**
 * EU-reitityksen piilottamien rivien tila: { yhteensa, euKopiossa, vanhassa: [{ slug, printify_product_id }],
 * eiRivia: [slug] }. rivit: [{ slug, printify_product_id }].
 */
export function euReitityksenTila(rivit, siirrot, piilotetut = EU_PIILOTETUT) {
  const slugille = new Map(rivit.map((r) => [r.slug, String(r.printify_product_id ?? "")]));
  const tila = { yhteensa: 0, euKopiossa: 0, vanhassa: [], eiRivia: [] };
  for (const [slug, vanhaId] of Object.entries(piilotetut)) {
    tila.yhteensa++;
    if (!slugille.has(slug)) { tila.eiRivia.push(slug); continue; }
    const id = slugille.get(slug);
    if (id !== String(vanhaId) && siirrot.uuteen.has(id)) tila.euKopiossa++;
    else tila.vanhassa.push({ slug, printify_product_id: id });
  }
  return tila;
}

/**
 * kanta: scripts/lib/eu-kanta.mjs postgresKanta (tai muistikanta testissä). haut: printifyHaut({ apiKey, shopId }).
 * kuiva: ei kirjoita, kertoo vain mitä tehtäisiin.
 */
export async function ajaEuSiirrot({ kanta, dataKansio = euSiirtoKansio(), haut, buildProductRow, kuiva = false, aikaa = () => true }) {
  if (!dataKansio) return { ok: false, virhe: "data/eu-siirto-*.json puuttuu funktiosta (vercel.json includeFiles)" };
  const loki = [];
  const siirrot = lueEuSiirrot(dataKansio, { varoita: (v) => loki.push(v) });
  const ennen = await kanta.rivit();
  const tehtavat = [...siirrot.vanhaan.values()].filter((s) => ennen.some((r) => String(r.printify_product_id ?? "") === String(s.vanhaId)));
  let tulos = { paivitetty: 0, jo: 0, eiRivia: 0, kesken: 0, poistetut: [], virheet: [] };
  if (!kuiva) {
    tulos = await paivitaSiirrotKantaan({
      kanta, siirrot, buildProductRow, haeTuote: haut.haeTuote, toimitus: haut.toimitus, kulutRivi: haut.kulutRivi,
      loki: (r) => loki.push(r.trim()), aikaa,
    });
  }
  const jalkeen = kuiva ? ennen : await kanta.rivit();
  return {
    ok: tulos.virheet.length === 0,
    kuiva,
    tiedostot: siirrot.tiedostot,
    kirjattuja: siirrot.vanhaan.size,
    siirrettavia: tehtavat.length,
    ...tulos,
    euReititys: euReitityksenTila(jalkeen, siirrot),
    loki: loki.slice(0, 100),
  };
}
