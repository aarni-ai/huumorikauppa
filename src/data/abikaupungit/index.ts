/**
 * Abipaitojen kaupunkisivut /abipaidat/<slug> (3.11.2026): 20 kaupunkia, jokaisella oma 200-350 sanan teksti,
 * suunnittelutyökalu (sama kuin /abipaidat), penkkaripäivä ja tilauksen takaraja vakioista (src/data/ryhmapaidat.ts),
 * UKK (FAQPage) ja sisäiset linkit: takaisin /abipaidat-sivulle ja 2-3 lähikaupunkiin. /abipaidat linkittää kaikkiin
 * kaupunkisivuihin. React-sivu src/pages/AbiKaupunkiPage.tsx, esirenderöinti src/seo/prerender/pages.ts, sivukartta
 * api/sitemap.js. Malli sama kuin ammattisivuilla (src/data/ammattisivut/).
 */
import {
  ABI_AIKATAULU, ABI_VIIMEINEN_TILAUSPAIVA, KOKOTAULUKKO_FAQ, PENKKARIT_2027, RYHMA_HINTALAUSE, RYHMA_SAANNOT, type RyhmaSivu,
} from "../ryhmapaidat";
import type { AbiKaupunkiSisalto } from "./tyypit";
import { ABIKAUPUNKI_SLUGIT, ABIKAUPUNKI_POLKU } from "./polut";
import { KAUPUNGIT_A } from "./osaA";
import { KAUPUNGIT_B } from "./osaB";

export type { AbiKaupunkiSisalto } from "./tyypit";
export { ABIKAUPUNKI_SLUGIT, ABIKAUPUNKI_POLKU } from "./polut";

type Linkki = { href: string; label: string };

export interface AbiKaupunkiSivu extends AbiKaupunkiSisalto {
  path: string;
  title: string;
  description: string;
  /** Lyhyt nimi linkkeihin ja murupolkuun, esim. "Abipaidat Jyväskylä". */
  name: string;
  /** Suunnittelutyökalun asetukset (src/components/RyhmaSuunnittelija.tsx). */
  ryhma: Pick<RyhmaSivu, "tyyppi" | "esimerkki" | "takaraja">;
  /** Yhteinen osio oman tekstin jälkeen: aikataulu, hinta ja maksusääntö vakioista. */
  yhteinen: { heading: string; paragraphs: string[] };
  faqs: { q: string; a: string }[];
  lahellaLinkit: Linkki[];
  /** Sivun oma teksti (intro + osiot) testejä varten. */
  omaTeksti: string;
}

const BY_SLUG = new Map([...KAUPUNGIT_A, ...KAUPUNGIT_B].map((s) => [s.slug, s]));
const VUOSI = PENKKARIT_2027.slice(0, 4);

/** Ryhmätyökalu: /abipaidat-sivun suunnittelutyökalu (ankkuri src/pages/RyhmaPaitaPage.tsx). */
export const ABI_TYOKALU: Linkki = { href: "/abipaidat#suunnittele", label: "Abipaitojen suunnittelutyökalu" };
export const ABI_PAASIVU: Linkki = { href: "/abipaidat", label: "Kaikki abipaidat" };

const linkki = (s: AbiKaupunkiSisalto): Linkki => ({ href: ABIKAUPUNKI_POLKU(s.slug), label: `Abipaidat ${s.kaupunki}` });

export const ABIKAUPUNKI_SIVUT: AbiKaupunkiSivu[] = ABIKAUPUNKI_SLUGIT.flatMap((slug) => {
  const s = BY_SLUG.get(slug);
  if (!s) return [];
  const faqs = [
    { q: `Milloin abipaidat pitää tilata, jotta ne ehtivät penkkareihin ${s.inessiivi}?`, a: ABI_AIKATAULU },
    ...s.ukk,
    { q: "Paljonko abipaita maksaa?", a: RYHMA_HINTALAUSE },
    KOKOTAULUKKO_FAQ,
  ];
  return [{
    ...s,
    path: ABIKAUPUNKI_POLKU(slug),
    title: `${s.otsikko} | Huumorikauppa`,
    description: s.kuvaus,
    name: `Abipaidat ${s.kaupunki}`,
    ryhma: { tyyppi: "abi", esimerkki: { ...s.esimerkki, vuosi: VUOSI }, takaraja: ABI_VIIMEINEN_TILAUSPAIVA },
    yhteinen: { heading: "Aikataulu ja hinta", paragraphs: [ABI_AIKATAULU, RYHMA_HINTALAUSE, RYHMA_SAANNOT[3]] },
    faqs,
    lahellaLinkit: s.lahella.flatMap((l) => {
      const k = BY_SLUG.get(l);
      return k ? [linkki(k)] : [];
    }),
    omaTeksti: [...s.intro, ...s.osiot.flatMap((o) => o.teksti)].join("\n"),
  }];
});

const SIVU_POLULLA = new Map(ABIKAUPUNKI_SIVUT.map((s) => [s.path, s]));
export const abiKaupunkiSivu = (slug: string | undefined) => (slug ? SIVU_POLULLA.get(ABIKAUPUNKI_POLKU(slug)) : undefined);

/** /abipaidat-sivun linkit kaupunkisivuille. */
export const ABIKAUPUNKI_LINKIT: Linkki[] = ABIKAUPUNKI_SIVUT.map((s) => ({ href: s.path, label: s.name }));
