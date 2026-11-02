/**
 * Ammatti- ja harrastussivut /paidat/<slug> (2.11.2026): 40 laskeutumissivua, valinta hakumäärän perusteella
 * (seo/ammattisivut.md). Jokaisella sivulla on oma 250-400 sanan teksti, aiheen tuotteet, viisi uutta mallia
 * t-paitana ja hupparina (AMMATTIMALLISTO), personoitu vaihtoehto esitäytetyllä tekstillä, UKK (FAQPage) ja
 * sisäiset linkit. Sivut kootaan laskeutumissivuiksi (src/data/landingPages.ts), joten reitit, esirenderöinti ja
 * JSON-LD tulevat samasta putkesta kuin muilla laskeutumissivuilla.
 *
 * Uudet mallit: data/uudet-tuotteet/ammattisivut-2026-11-02.json (Printify-lista, generoidaan tästä tiedostosta:
 * npx tsx scripts/generoi-ammattimallisto.mjs). Nimi ja slug samalla säännöllä kuin tuonti (otsikkoTeksti ja
 * printify-sync slugify), joten sivu tunnistaa tuotteet heti tuonnin jälkeen.
 */
import type { LandingPageDef, LandingProduct } from "../landingPages";
import { theme } from "../themes";
import { HINTA } from "../hintatekstit";
import { jouluVastaus } from "../tilauspaivat";
import { TOIMITUSAIKA_LAUSE, TOIMITUSMAKSU_LAUSE } from "@/config/toimitus";
import type { AmmattiSivuSisalto } from "./tyypit";
import { AMMATTISIVU_SLUGIT } from "./polut";
import { SIVUT_A } from "./osaA";
import { SIVUT_B } from "./osaB";
import { SIVUT_C } from "./osaC";
import { SIVUT_D } from "./osaD";

export type { AmmattiSivuSisalto } from "./tyypit";
export { AMMATTISIVU_SLUGIT } from "./polut";

const KAIKKI = [...SIVUT_A, ...SIVUT_B, ...SIVUT_C, ...SIVUT_D];
const BY_SLUG = new Map(KAIKKI.map((s) => [s.slug, s]));

/**
 * Sivut polkulistan järjestyksessä (src/data/ammattisivut/polut.ts, sama järjestys kuin LANDING_PATHS). Testi
 * (src/test/ammattisivut.test.ts) varmistaa, että jokaisella polulla on sisältö.
 */
export const AMMATTISIVUT: AmmattiSivuSisalto[] = AMMATTISIVU_SLUGIT.flatMap((slug) => BY_SLUG.get(slug) ?? []);

/** Painorivit tuotenimen tekstiksi kuten tuonti (scripts/lib/uudet-tuotteet.mjs otsikkoTeksti). */
export function otsikkoTeksti(rivit: readonly string[]): string {
  const t = rivit.map((r) => r.trim()).join(" ").replace(/\s+/g, " ").toLocaleLowerCase("fi");
  return t.replace(/(^|[.!?]\s+)(\p{L})/gu, (_, a: string, b: string) => a + b.toLocaleUpperCase("fi")).replace(/[.]+$/, "");
}

/** Tuotteen slug kuten Printify-synkronointi (supabase/functions/_shared/printify-sync.ts slugify). */
export function tuoteSlug(nimi: string): string {
  return nimi
    .toLowerCase()
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/å/g, "a")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export interface AmmattiMalliTuote {
  /** Sivun slug (/paidat/<sivu>). */
  sivu: string;
  rivit: readonly string[];
  tyyppi: "t-paita" | "huppari";
  category: "t-paidat" | "hupparit";
  name: string;
  slug: string;
}

/** Uudet mallit tuotteina: jokainen malli t-paitana ja hupparina. */
export const AMMATTIMALLISTO: readonly AmmattiMalliTuote[] = AMMATTISIVUT.flatMap((s) =>
  s.mallit.flatMap((rivit) =>
    (["t-paita", "huppari"] as const).map((tyyppi) => {
      const name = `${otsikkoTeksti(rivit)} | ${tyyppi === "t-paita" ? "T-paita" : "Huppari"} ${s.kohde}`;
      return { sivu: s.slug, rivit, tyyppi, category: tyyppi === "t-paita" ? "t-paidat" : "hupparit", name, slug: tuoteSlug(name) } as const;
    }),
  ),
);

const UUDET_SIVUITTAIN = new Map<string, Set<string>>();
for (const t of AMMATTIMALLISTO) {
  if (!UUDET_SIVUITTAIN.has(t.sivu)) UUDET_SIVUITTAIN.set(t.sivu, new Set());
  UUDET_SIVUITTAIN.get(t.sivu)!.add(t.slug);
}

/** Sivun uudet mallit (slugit). */
export const sivunUudet = (slug: string): ReadonlySet<string> => UUDET_SIVUITTAIN.get(slug) ?? new Set();

/** Sivun tuotesuodatin: uudet mallit ja aiheen aiemmat tuotteet. */
export function sivunSuodatin(s: AmmattiSivuSisalto): (p: LandingProduct) => boolean {
  const uudet = sivunUudet(s.slug);
  const aiemmat = theme(...s.tuotteet);
  return (p) => uudet.has(p.slug) || aiemmat(p);
}

const HINTA_UKK = {
  q: "Paljonko paita maksaa ja milloin se on perillä?",
  a: `T-paidat maksavat ${HINTA.tpaitaHaarukka} ja hupparit alkaen ${HINTA.huppariAlkaen}. ${TOIMITUSAIKA_LAUSE} ${TOIMITUSMAKSU_LAUSE}`,
};

const JOULU_UKK = { q: "Ehtiikö paita jouluksi?", a: jouluVastaus() };

export const AMMATTISIVU_POLKU = (slug: string) => `/paidat/${slug}`;

/** Laskeutumissivut (src/data/landingPages.ts). */
export const AMMATTI_SIVUT: LandingPageDef[] = AMMATTISIVUT.map((s) => {
  const uudet = sivunUudet(s.slug);
  return {
    path: AMMATTISIVU_POLKU(s.slug),
    name: s.nimi,
    group: "tuotteet",
    title: `${s.otsikko} | Huumorikauppa`,
    description: s.kuvaus,
    h1: s.h1,
    intro: s.intro,
    opas: s.opas,
    faqs: [...s.ukk, HINTA_UKK, JOULU_UKK],
    related: s.liittyvat,
    categories: ["t-paidat", "hupparit"],
    extraLinks: s.lisalinkit,
    filter: sivunSuodatin(s),
    featured: (p) => uudet.has(p.slug),
    spotlight: {
      heading: "Personoitu paita omalla tekstillä",
      text: s.personoitu.teksti,
      links: [
        { href: s.personoitu.href, label: s.personoitu.label },
        { href: "/personoidut", label: "Kaikki personoidut lahjat" },
      ],
    },
    maxTuotteita: 24,
  };
});

/** Hub-sivujen linkit: ammatit sivulle /ammatit ja harrastukset sivulle /lahjat/harrastajalle. */
export const AMMATTISIVU_LINKIT = {
  ammatti: AMMATTISIVUT.filter((s) => s.ryhma === "ammatti").map((s) => ({ href: AMMATTISIVU_POLKU(s.slug), label: s.nimi })),
  harrastus: AMMATTISIVUT.filter((s) => s.ryhma === "harrastus").map((s) => ({ href: AMMATTISIVU_POLKU(s.slug), label: s.nimi })),
};
