import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import {
  activeBannerTheme,
  CHRISTMAS_ORDER_END_UTC_MS,
  nextBannerChangeMs,
  joulukalenteriNosto,
  seuraavaKalenteriVaihtoMs,
  JOULUKALENTERI_ALKU_TEKSTI,
  type BannerTheme,
  type JoulukalenteriNosto,
} from "@/data/campaignSchedule";
import { JOULUKALENTERI_POLKU } from "../../api/_lib/joulukalenteri.js";
import { isanpaivaLause, jouluPalkkiLause, jouluTpaidatPalkkiLause, joulunLahjakorttiAika, JOULU_LAHJAKORTTI_TEKSTI, JOULUN_JALKEEN_NORMAALI_UTC_MS } from "@/data/tilauspaivat";
import { CHRISTMAS_DEADLINE_PATH } from "@/data/christmas";
import { BLACK_FRIDAY_PALKKI } from "@/data/kampanjat";
import { useLahjakortitMyynnissa, useLahjakorttiSahkoposti } from "@/hooks/use-lahjakortit";

export const FATHERS_DAY_LANDING_PATH = "/isanpaivalahja";

interface BannerContent {
  text: string;
  /** Linkin teksti kertoo itsessään, minne linkki vie (ei "Lue lisää"). */
  linkText: string;
  href: string;
  /** Tumma tausta ja valkoinen teksti: kontrasti yli 9:1 (WCAG AAA pienellekin tekstille). */
  className: string;
}

export const BANNER_CONTENT: Record<BannerTheme, BannerContent> = {
  isanpaiva: {
    // Getter: lause lasketaan näyttöhetkellä (ei moduulin latauksessa).
    get text() {
      return isanpaivaLause();
    },
    linkText: "Katso isänpäivälahjat",
    href: FATHERS_DAY_LANDING_PATH,
    className: "bg-blue-950 text-white",
  },
  joulu: {
    get text() {
      // Sama lähde kuin tuotesivu, ostoskori ja artikkelit (src/data/tilauspaivat.ts).
      return jouluPalkkiLause();
    },
    linkText: "Joulun viimeiset tilauspäivät",
    href: CHRISTMAS_DEADLINE_PATH,
    className: "bg-red-900 text-white",
  },
  // Black Friday -viikko (src/data/kampanjat.ts): parihinta ja kuluttajansuojalain 30 päivän alin hinta.
  "black-friday": {
    text: BLACK_FRIDAY_PALKKI,
    linkText: "Katso Black Friday -tarjous",
    href: "/black-friday",
    className: "bg-red-950 text-white",
  },
  // 2.-4.12.2026: hupparien ja muiden tilauspäivä meni, t-paidat ehtivät vielä (src/data/campaignSchedule.ts).
  "joulu-tpaidat": {
    get text() {
      return jouluTpaidatPalkkiLause();
    },
    linkText: "Joulun viimeiset tilauspäivät",
    href: CHRISTMAS_DEADLINE_PATH,
    className: "bg-red-900 text-white",
  },
};

/** setTimeoutin yläraja (noin 24,8 vrk). */
const MAX_TIMEOUT_MS = 2_147_483_647;

/** Herättää komponentin seuraavalla aikataulun vaihtohetkellä, jos sivu on silloin auki. */
function subscribe(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    const nyt = Date.now();
    // Joulun lahjakorttiaika alkaa ke 2.12. klo 23.59 jälkeen ja päättyy 27.12. (src/data/tilauspaivat.ts).
    const lahjakorttiVaihdot = [CHRISTMAS_ORDER_END_UTC_MS + 1, JOULUN_JALKEEN_NORMAALI_UTC_MS].filter((t) => t > nyt);
    const vaihdot = [nextBannerChangeMs(nyt), seuraavaKalenteriVaihtoMs(nyt), lahjakorttiVaihdot[0] ?? null].filter((t): t is number => t !== null);
    const next = vaihdot.length ? Math.min(...vaihdot) : null;
    if (next === null) return;
    timer = setTimeout(() => {
      onChange();
      arm();
    }, Math.min(Math.max(next - Date.now(), 0), MAX_TIMEOUT_MS));
  };
  arm();
  return () => clearTimeout(timer);
}

const clientTheme = () => activeBannerTheme(Date.now());
/**
 * Palvelin- ja esirenderöinnissä ei banneria (staattiseen HTML:ään ei jää vanhentunutta tilaa), paitsi hydratoitavissa
 * blogiartikkeleissa: esirenderöinti asettaa teeman (asetaEsirenderoinninTeema), ja selain lukee hydratoinnissa saman
 * arvon HTML:stä (#root [data-banner]), jottei banneri ilmesty hydratoinnin jälkeen ja siirrä sisältöä (CLS).
 */
let esirenderoinninTeema: BannerTheme | null = null;
export function asetaEsirenderoinninTeema(teema: BannerTheme | null) {
  esirenderoinninTeema = teema;
}
const serverTheme = (): BannerTheme | null => {
  if (typeof document === "undefined") return esirenderoinninTeema;
  const el = document.querySelector<HTMLElement>("#root [data-banner]");
  const t = el?.dataset.banner;
  return t && t in BANNER_CONTENT ? (t as BannerTheme) : null;
};

/**
 * Sivuston yläbanneri (myös etusivulla). Teema ja näkyvyys tulevat vain aikataulusta
 * (src/data/campaignSchedule.ts, Suomen aika, päivät toimitusajoista): isänpäivän viimeisen tilauspäivän loppuun,
 * sitten joulun viimeisen tilauspäivän loppuun, sen jälkeen ei mitään.
 *
 * Selaimessa teema luetaan jo ensimmäisessä renderöinnissä (useSyncExternalStore), joten banneri
 * on paikallaan heti ensimmäisessä maalauksessa eikä työnnä sisältöä alaspäin jälkikäteen.
 */
export function SeasonalBanner() {
  const theme = useSyncExternalStore(subscribe, clientTheme, serverTheme);
  const kalenteri = useSyncExternalStore(subscribe, clientKalenteri, serverKalenteri);
  const lahjakortit = useLahjakortitMyynnissa();
  const sahkoposti = useLahjakorttiSahkoposti();
  const viimeHetki = useSyncExternalStore(subscribe, () => lahjakorttiAika(Date.now()), () => false);
  // Lahjakortti ohittaa teeman; 3.-4.12. t-paitojen tilauspäivä jää lahjakortin perään (joulu-tpaidat).
  if (lahjakortit && sahkoposti && viimeHetki) return <LahjakorttiBanneri kalenteri={kalenteri} tpaidat={theme === "joulu-tpaidat"} />;
  if (!theme && kalenteri) return <JoulukalenteriBanneri tila={kalenteri} />;
  return <SeasonalBannerView theme={theme} kalenteri={kalenteri} />;
}

const clientKalenteri = () => joulukalenteriNosto(Date.now());
/** Esirenderöity HTML ei sisällä kalenterin linkkiä; hydratoinnissa sama arvo HTML:stä (kuten teema). */
const serverKalenteri = (): JoulukalenteriNosto | null => {
  if (typeof document === "undefined") return null;
  const t = document.querySelector<HTMLElement>("#root [data-kalenteri]")?.dataset.kalenteri;
  return t === "tulossa" || t === "auki" ? t : null;
};

/** Joulukalenterin linkki bannerin perään (src/data/campaignSchedule.ts joulukalenteriNosto). */
export function KalenteriLinkki({ tila }: { tila: JoulukalenteriNosto }) {
  return (
    <>
      {" "}
      <Link
        to={JOULUKALENTERI_POLKU}
        data-kalenteri={tila}
        className="underline underline-offset-2 font-semibold whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {tila === "auki" ? "Joulukalenteri: päivän luukku auki" : `Joulukalenteri aukeaa ${JOULUKALENTERI_ALKU_TEKSTI}`}
      </Link>
    </>
  );
}

/** Pelkkä joulukalenterin banneri, kun muuta teemaa ei ole (joulun tilauspäivien jälkeen ilman lahjakorttia). */
export function JoulukalenteriBanneri({ tila }: { tila: JoulukalenteriNosto }) {
  return (
    <aside aria-label="Joulukalenteri" data-banner="joulukalenteri" className="bg-red-900 text-white text-center text-xs md:text-sm px-4 py-2">
      <span>{tila === "auki" ? "Joka päivä uusi luukku ja päivän tarjous jouluaattoon asti." : `Joka päivä uusi luukku ja päivän tarjous ${JOULUKALENTERI_ALKU_TEKSTI} alkaen.`}</span>
      <KalenteriLinkki tila={tila} />
    </aside>
  );
}

/**
 * Joulun lahjakorttiaika (ke 2.12. klo 23.59 jälkeen, 27.12. alkaen normaali): banneri kertoo, että lahjakortti ehtii
 * jouluksi sähköpostilla (src/data/tilauspaivat.ts joulunLahjakorttiAika). Fyysiset tuotteet pysyvät myynnissä, ja
 * niiden toimitusaika näkyy tuotesivulla sellaisenaan.
 */
export const lahjakorttiAika = (nyt: number) => joulunLahjakorttiAika(nyt);

/** Joulun lahjakorttibanneri (vain kun lahjakortit ovat myynnissä, useLahjakortitMyynnissa). */
export function LahjakorttiBanneri({ kalenteri = null, tpaidat = false }: { kalenteri?: JoulukalenteriNosto | null; tpaidat?: boolean } = {}) {
  const tpaitaLause = tpaidat ? jouluTpaidatPalkkiLause() : "";
  return (
    <aside aria-label="Lahjakortti ehtii jouluksi" data-banner="lahjakortti" className="bg-red-900 text-white text-center text-xs md:text-sm px-4 py-2">
      <span>{JOULU_LAHJAKORTTI_TEKSTI}. </span>
      <Link
        to="/lahjakortti"
        className="underline underline-offset-2 font-semibold whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Osta lahjakortti
      </Link>
      {tpaitaLause && <span> {tpaitaLause}</span>}
      {kalenteri && <KalenteriLinkki tila={kalenteri} />}
    </aside>
  );
}

/** Bannerin merkintä annetulle teemalle (myös tuotesivun esirenderöity esikatselu). */
export function SeasonalBannerView({ theme, kalenteri = null }: { theme: BannerTheme | null; kalenteri?: JoulukalenteriNosto | null }) {
  if (!theme) return null;
  const c = BANNER_CONTENT[theme];
  // Black Friday -viikon banneri ennallaan (kampanjan teksti ja 30 päivän alin hinta).
  const lisa = kalenteri && theme !== "black-friday" ? kalenteri : null;
  return (
    <aside
      aria-label="Tilausmuistutus"
      data-banner={theme}
      className={`${c.className} text-center text-xs md:text-sm px-4 py-2`}
    >
      <span>{c.text} </span>
      <Link
        to={c.href}
        className="underline underline-offset-2 font-semibold whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {c.linkText}
      </Link>
      {lisa && <KalenteriLinkki tila={lisa} />}
    </aside>
  );
}
