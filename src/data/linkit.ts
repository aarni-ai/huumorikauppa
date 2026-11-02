import type { KampanjaVaiheId } from "./kampanjat";

/**
 * /linkit-sivun linkit (somen bio-linkki). utm-parametrit kulkevat saapumisosoitteesta linkkeihin, jotta GA4 liittää
 * oston somelähteeseen; käyntilaskuri (src/lib/kaynti.ts) kirjaa lähteen jo /linkit-sivulle saavuttaessa.
 */
export type BioLinkki = { otsikko: string; kuvaus: string; polku: string; korostus?: boolean };

export const BIO_LINKIT: BioLinkki[] = [
  { otsikko: "Joululahjat", kuvaus: "Hauskat joululahjat koko perheelle", polku: "/joululahjat" },
  { otsikko: "Yrityksille", kuvaus: "Tiimipaidat ja oma logo, lasku yritykselle", polku: "/yritykset" },
  { otsikko: "Personoitu paita", kuvaus: "Nimi ja ikä paitaan, esikatselu heti", polku: "/personoitu-paita" },
  { otsikko: "Suosituimmat", kuvaus: "Myydyimmät meemipaidat ja synttäripaidat", polku: "/suosituimmat" },
  { otsikko: "Harrastussarjat", kuvaus: "Metsästäjille, kalastajille, mökkeilijöille", polku: "/lahjat/harrastajalle" },
];
export const BLACK_FRIDAY_LINKKI: BioLinkki = { otsikko: "Black Friday", kuvaus: "Kaksi t-paitaa tarjoushintaan", polku: "/black-friday", korostus: true };
export const LAHJAKORTTI_LINKKI: BioLinkki = { otsikko: "Lahjakortti", kuvaus: "Perillä heti, koodi ja PDF maksun jälkeen", polku: "/lahjakortti", korostus: true };

const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];

/** Saapumisosoitteen utm-parametrit linkin perään. */
export function utmPerään(polku: string, search: string): string {
  const p = new URLSearchParams(search);
  const q = new URLSearchParams();
  for (const k of UTM) { const v = p.get(k); if (v) q.set(k, v.slice(0, 60)); }
  const s = q.toString();
  return s ? `${polku}${polku.includes("?") ? "&" : "?"}${s}` : polku;
}

/**
 * Sivulla näytettävät linkit kampanjakalenterin vaiheen mukaan (src/data/kampanjat.ts kampanjaVaihe; null palvelimella):
 * Black Friday -viikolla Black Friday ensimmäisenä, joulun tilauspäivien jälkeen lahjakortti ensimmäisenä.
 * bfKaytossa: TPAITAPARI_KAMPANJA.kaytossa (kytkin pois: ei Black Friday -linkkiä).
 */
export function linkitSivulla(vaihe: KampanjaVaiheId | null, search = "", { bfKaytossa = true }: { bfKaytossa?: boolean } = {}) {
  const ensin = vaihe === "black-friday" && bfKaytossa ? [BLACK_FRIDAY_LINKKI] : vaihe === "lahjakortti" ? [LAHJAKORTTI_LINKKI] : [];
  return [...ensin, ...BIO_LINKIT].map((l) => ({ ...l, href: utmPerään(l.polku, search) }));
}
