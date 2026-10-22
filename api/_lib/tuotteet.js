/**
 * Tuotteiden lähde palvelimella: oma tietokanta (taulu products), jos DATABASE_URL on asetettu, muuten repon
 * tilannekuva data/products-snapshot.json (kopioitu Lovable Cloudin julkisella avaimella 21.10.2026, 781 tuotetta).
 * Hinta, näkyvyys (is_active) ja Printify-tunnukset (printify_product_id, variants.variant_map) ovat samat kuin
 * vanhassa taustassa.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { onTietokanta, sql } from "./db.js";
import { onPiilotettuTuote } from "./piilotetut.js";
import { heikoinKate } from "./kate.js";
import { kaikkiPoissa, liitaSaatavuusTiedosto } from "./saatavuus.js";

const VALIMUISTI_MS = 5 * 60 * 1000;
let valimuisti = null;

function lueJson(suhteellinen, osat) {
  // Moduulin sijainnista (vercel.json includeFiles säilyttää polun), varalla työhakemisto.
  for (const polku of [fileURLToPath(new URL(suhteellinen, import.meta.url)), join(process.cwd(), ...osat)]) {
    try {
      return JSON.parse(readFileSync(polku, "utf8"));
    } catch { /* seuraava */ }
  }
  return null;
}

function tilannekuva() {
  const rivit = lueJson("../../data/products-snapshot.json", ["data", "products-snapshot.json"]);
  if (!rivit) throw new Error("data/products-snapshot.json puuttuu");
  // Mainin generoima saatavuustiedosto (scripts/printify-saatavuus.mjs), jos se on mukana; muuten ei muutosta.
  return liitaSaatavuusTiedosto(rivit, lueJson("../../src/data/printify-saatavuus.json", ["src", "data", "printify-saatavuus.json"]));
}

/** Kaikki tuoterivit (myös piilotetut ja luonnokset). */
export async function kaikkiTuotteet() {
  if (valimuisti && Date.now() - valimuisti.at < VALIMUISTI_MS) return valimuisti.rivit;
  let rivit = [];
  let mista = "tilannekuva";
  if (onTietokanta()) {
    rivit = (await sql()`select * from products order by created_at desc`).map((r) => ({ ...r, price: Number(r.price) }));
    mista = "tietokanta";
  }
  // Tyhjä tuotetaulu (tietokanta luotu, tuonti ajamatta): kauppa ei tyhjene, vaan käyttää tilannekuvaa.
  if (rivit.length === 0) {
    rivit = tilannekuva();
    mista = "tilannekuva";
  }
  valimuisti = { at: Date.now(), rivit, mista };
  return rivit;
}

/**
 * Myynnissä olevat: ei luonnoksia (is_active false), ei piilotettuja kategorioita (mukit), ei tuotteita, joiden
 * tunnettu kate on alle 40 % (api/_lib/kate.js), eikä tuotteita, joiden yksikään variantti ei ole saatavilla
 * (api/_lib/saatavuus.js). Tuntematon kate ei piilota (kassa estää ostamisen).
 */
export const myynnissa = (p) => p.is_active !== false && !onPiilotettuTuote(p) && heikoinKate(p).sallittu !== false && !kaikkiPoissa(p);

export async function naytettavatTuotteet() {
  return (await kaikkiTuotteet()).filter(myynnissa);
}

/** Mistä viimeisin haku tuli: "tietokanta" tai "tilannekuva". */
export function lahde() {
  return valimuisti?.mista ?? (onTietokanta() ? "tietokanta" : "tilannekuva");
}

/**
 * Printify-variantin tunnus ostoskorin väristä ja koosta (variant_map-avain "Väri|Koko", kuten vanhassa taustassa).
 * Lisäksi täsmäys, kun tuotteella on vain yksi koko tai yksi väri ja kori ei kertonut sitä (vanhan taustan virhe:
 * yksikokoisilla tuotteilla koko jäi tyhjäksi ja tilaus ei mennyt Printifyyn). Palauttaa null, jos yksiselitteistä
 * varianttia ei löydy: silloin kassa ei ota maksua.
 */
export function printifyVariantti(tuote, vari, koko) {
  const kartta = tuote?.variants?.variant_map;
  if (!kartta || typeof kartta !== "object") return null;
  const v = (vari || "").trim();
  const k = (koko || "").trim();
  const suora = kartta[`${v}|${k}`];
  if (typeof suora === "number") return suora;
  const ehdokkaat = Object.entries(kartta).filter(([avain]) => {
    const [av, ak] = avain.split("|");
    return (!v || av === v) && (!k || ak === k);
  });
  return ehdokkaat.length === 1 && typeof ehdokkaat[0][1] === "number" ? ehdokkaat[0][1] : null;
}
