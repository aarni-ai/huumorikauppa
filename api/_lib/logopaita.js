/**
 * Oma logo -paita (1.11.2026, /yritykset ja /yritykset/tilaus): yritys lataa logon (PNG tai SVG) tai kirjoittaa
 * tekstin, valitsee halutessaan huumoridesignin (api/_lib/logodesignit.generated.js) ja näkee esikatselun. Maksun tai
 * maksetun laskun jälkeen Printifyyn luodaan tilaus lennosta luotavalla tuotteella ja tilauskohtaisella painokuvalla
 * (api/painokuva.js, kuva api/_lib/logopaita-kuva.js). Pohja Gildan Softstyle 64000, OPT OnDemand (Tšekki, pp 30),
 * sama kuin personoidussa paidassa (variantit ja kulut api/_lib/personoitu.js).
 *
 * Kassalle tuote on virtuaalinen tuoterivi (LOGOPAITA_TUOTE), joten hinta, määräalennus (t-paidat, 10/25/50 kpl),
 * katevahti (yritystilaus 5 €/paita) ja toimitus lasketaan kuten muillekin. Valinnat kulkevat ostoskorin
 * customText-kentässä muodossa "Logo: <id> | Teksti: Rivi 1 / Rivi 2 | Design: <slug>", ja palvelin tarkistaa ne.
 *
 * Ei palvelinriippuvuuksia: selain (esikatselu, lomakkeet) ja palvelin käyttävät samoja tarkistuksia.
 */
import { HINNASTO } from "./vakiot.js";
import { PERSONOITU_POHJA, PERSONOITU_TUOTE, PAINOALUE, sallittuTeksti, tekstinVari } from "./personoitu.js";
import { LOGODESIGNIT } from "./logodesignit.generated.js";

export { PAINOALUE, tekstinVari };
export const LOGOPAITA_SLUG = "oma-logo-t-paita";
export const LOGOPAITA_PRINTIFY = "LOGOPAITA";
export const LOGOPAITA_POHJA = PERSONOITU_POHJA;
export const LOGOPAITA_HINTA = HINNASTO.personoitu;
export const LOGOPAITA_MIN_KPL = 10;
export const TEKSTI_MAX = 28;

/** Logotiedosto: PNG vähintään 1000 px pidemmältä sivulta (suositus 2000 px), enintään 3 Mt; SVG enintään 1 Mt. */
export const LOGO_RAJAT = { minPx: 1000, suositusPx: 2000, maxPx: 10000, pngTavua: 3 * 1024 * 1024, svgTavua: 1024 * 1024 };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const onLogoId = (s) => UUID.test(String(s || ""));

const designit = new Map(LOGODESIGNIT.map((d) => [d.slug, d]));
export const logoDesign = (slug) => designit.get(slug) || null;
export { LOGODESIGNIT };

/**
 * Tekstirivi: kirjaimet, numerot, välilyönti ja tavalliset välimerkit, enintään 28 merkkiä. Verkko-osoite on sallittu
 * (yrityksen kotisivu), kirosanat ja solvaukset eivät (api/_lib/personoitu.js sallittuTeksti).
 */
export function tarkistaRivi(s) {
  const r = String(s ?? "").trim().replace(/\s+/g, " ");
  if (!r) return { ok: true, rivi: "" };
  if (r.length > TEKSTI_MAX) return { ok: false, virhe: `Tekstirivillä voi olla enintään ${TEKSTI_MAX} merkkiä.` };
  if (!/^[\p{L}\p{N} &.,:;!?'+#%€()/-]+$/u.test(r)) return { ok: false, virhe: "Tekstissä voi olla kirjaimia, numeroita ja tavallisia välimerkkejä." };
  if (!sallittuTeksti(r.replace(/[.@/:]/g, " "))) return { ok: false, virhe: "Tätä tekstiä ei voi painaa. Kirjoita toinen teksti." };
  return { ok: true, rivi: r };
}

/**
 * { logo, rivit: [r1, r2], design } -> { ok: true, logo, rivit, design } tai { ok: false, virhe }.
 * Logo tai teksti on pakollinen; design on vapaaehtoinen (slug listalta).
 */
export function tarkistaLogopaita({ logo, rivit, design } = {}) {
  const l = logo ? String(logo).toLowerCase() : null;
  if (l && !onLogoId(l)) return { ok: false, virhe: "Lataa logo uudelleen." };
  const tarkistetut = [];
  for (const r of (Array.isArray(rivit) ? rivit : []).slice(0, 2)) {
    const t = tarkistaRivi(r);
    if (!t.ok) return t;
    if (t.rivi) tarkistetut.push(t.rivi);
  }
  if (!l && !tarkistetut.length) return { ok: false, virhe: "Lataa logo tai kirjoita teksti." };
  const d = design ? String(design) : null;
  if (d && !logoDesign(d)) return { ok: false, virhe: "Valitse huumoridesign listalta uudelleen." };
  return { ok: true, logo: l, rivit: tarkistetut, design: d };
}

/** Ostoskorin customText: "Logo: <id> | Teksti: Firma Oy / Tiimi | Design: <slug>" (puuttuvat osat jätetään pois). */
export function logopaitaTeksti({ logo, rivit, design }) {
  return [logo ? `Logo: ${logo}` : null, rivit?.length ? `Teksti: ${rivit.join(" / ")}` : null, design ? `Design: ${design}` : null].filter(Boolean).join(" | ");
}

/** customText -> tarkistettu valinta tai { ok: false }. */
export function jasennaLogopaita(teksti) {
  const osat = Object.fromEntries(String(teksti ?? "").split(" | ").map((o) => {
    const i = o.indexOf(": ");
    return i > 0 ? [o.slice(0, i).trim(), o.slice(i + 2).trim()] : [o, ""];
  }));
  return tarkistaLogopaita({ logo: osat.Logo || null, rivit: osat.Teksti ? osat.Teksti.split(" / ") : [], design: osat.Design || null });
}

/** Lyhyt kuvaus tilausriveille ja laskulle: "logo, teksti Firma Oy, design 50 vuotta nuori". */
export function logopaitaKuvaus({ logo, rivit, design }) {
  return [logo ? "oma logo" : null, rivit?.length ? `teksti ${rivit.join(" / ")}` : null, design ? `design ${logoDesign(design)?.nimi || design}` : null].filter(Boolean).join(", ");
}

export const LOGOPAITA_VARIT = ["Musta", "Valkoinen", "Vaaleanharmaa", "Tummansininen"];
/** Paidan värit valinnalle: designin kanssa designin omat värit (tumma painatus ei näy tummassa paidassa). */
export const sallitutVarit = (design) => (design && logoDesign(design)?.varit) || LOGOPAITA_VARIT;

/** Virtuaalinen tuoterivi kassalle (variantit ja kulut personoidun paidan pohjalta: sama tuote ja painotalo). */
export const LOGOPAITA_TUOTE = {
  ...PERSONOITU_TUOTE,
  id: "oma-logo-t-paita",
  slug: LOGOPAITA_SLUG,
  name: "Oma logo -paita | T-Paita",
  price: LOGOPAITA_HINTA,
  description: "T-paita, johon painetaan yrityksen logo tai teksti ja halutessa huumoridesign. Gildan Softstyle 64000, painetaan tilauksesta EU:ssa.",
  printify_product_id: LOGOPAITA_PRINTIFY,
  variants: { ...PERSONOITU_TUOTE.variants, personoitu: false, logopaita: true },
};

export const onLogopaita = (p) => p?.slug === LOGOPAITA_SLUG || p?.printify_product_id === LOGOPAITA_PRINTIFY;

/**
 * Painokuvan asettelu (3461 x 3955): design ylhäällä, logo ja teksti sen alla; ilman designia logo ja teksti
 * rinnan yläosaan. Laatikot ovat enimmäiskokoja, kuva skaalataan laatikkoon kuvasuhde säilyttäen.
 */
export function asettelu({ design, logo, rivit }) {
  const t = rivit?.length || 0;
  if (design) return { ylin: 120, vali: 140, design: { w: 3100, h: logo || t ? 2350 : 3600 }, logo: { w: 1700, h: t ? 650 : 900 }, teksti: { w: 2900, h: 260 * t } };
  if (logo) return { ylin: 260, vali: 160, logo: { w: 2600, h: t ? 1600 : 2000 }, teksti: { w: 2700, h: 340 * t } };
  return { ylin: 300, vali: 0, teksti: { w: 2700, h: t === 1 ? 650 : 1150 } };
}

/** Korissa, kassalla ja Stripessä näytettävä teksti: logopaidan valinnat luettavassa muodossa, muut ennallaan. */
export function naytettavaTeksti(customText) {
  const s = String(customText ?? "");
  if (!/^(Logo|Teksti|Design): /.test(s)) return s;
  const v = jasennaLogopaita(s);
  return v.ok ? logopaitaKuvaus(v).replace(/^./, (c) => c.toUpperCase()) : s;
}
