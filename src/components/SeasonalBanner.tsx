import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import {
  activeBannerTheme,
  nextBannerChangeMs,
  type BannerTheme,
} from "@/data/campaignSchedule";
import { isanpaivaLause, jouluPalkkiLause } from "@/data/tilauspaivat";
import { CHRISTMAS_DEADLINE_PATH } from "@/data/christmas";

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
  return <SeasonalBannerView theme={theme} />;
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
