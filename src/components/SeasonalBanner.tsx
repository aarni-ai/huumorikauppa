import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import {
  activeBannerTheme,
  nextBannerChangeMs,
  type BannerTheme,
} from "@/data/campaignSchedule";
import { isanpaivaLause, jouluPalkkiLause } from "@/data/tilauspaivat";
import { CHRISTMAS_DEADLINE_PATH } from "@/data/christmas";
import { JOULU_MYOHAISIN_END_UTC_MS } from "@/data/jouluAikataulu";
import { useLahjakortitMyynnissa } from "@/hooks/use-lahjakortit";

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
      return `Joulutilaukset: ${jouluPalkkiLause()}`;
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
    const next = nextBannerChangeMs(Date.now());
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
/** Palvelin- ja esirenderöinnissä ei banneria: staattiseen HTML:ään ei jää vanhentunutta tilaa. */
const serverTheme = () => null;

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
  const lahjakortit = useLahjakortitMyynnissa();
  const viimeHetki = useSyncExternalStore(subscribe, () => lahjakorttiAika(Date.now()), () => false);
  if (!theme && lahjakortit && viimeHetki) return <LahjakorttiBanneri />;
  return <SeasonalBannerView theme={theme} />;
}

/** Jouluaatto 24.12.2026 klo 23.59.59 Suomen aikaa (UTC+2). */
const JOULUAATTO_LOPPU_UTC_MS = Date.UTC(2026, 11, 24, 21, 59, 59);

/** Joulun viimeisten tilauspäivien jälkeen jouluaattoon asti: lahjakortti ehtii, paketit eivät. */
export const lahjakorttiAika = (nyt: number) => nyt > JOULU_MYOHAISIN_END_UTC_MS && nyt <= JOULUAATTO_LOPPU_UTC_MS;

/** Viime hetken lahjakortti -banneri (vain kun lahjakortit ovat myynnissä, useLahjakortitMyynnissa). */
export function LahjakorttiBanneri() {
  return (
    <aside aria-label="Viime hetken lahja" data-banner="lahjakortti" className="bg-red-900 text-white text-center text-xs md:text-sm px-4 py-2">
      <span>Joulupaketit eivät enää ehdi, mutta lahjakortti tulee sähköpostilla heti maksun jälkeen. </span>
      <Link
        to="/lahjakortti"
        className="underline underline-offset-2 font-semibold whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Osta lahjakortti
      </Link>
    </aside>
  );
}

/** Bannerin merkintä annetulle teemalle (myös tuotesivun esirenderöity esikatselu). */
export function SeasonalBannerView({ theme }: { theme: BannerTheme | null }) {
  if (!theme) return null;
  const c = BANNER_CONTENT[theme];
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
    </aside>
  );
}
