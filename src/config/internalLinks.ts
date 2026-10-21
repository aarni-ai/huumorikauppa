import { situationGifts } from "@/data/situationGifts";
import { LANDING_REDIRECTS } from "@/data/landingRoutes";

export interface SiteLink {
  path: string;
  label: string;
  emoji: string;
  tags: string[];
}

/** GiftCategoryPage routes — single source of truth for footer + cross-linking */
export const giftHubLinks: SiteLink[] = [
  { path: "/hauskat-lahjat-miehelle",  label: "Hauskat lahjat miehelle",  emoji: "🎁", tags: ["miehelle", "lahjat"] },
  { path: "/hauskat-lahjat-naiselle",  label: "Hauskat lahjat naiselle",  emoji: "💝", tags: ["naiselle", "lahjat"] },
  { path: "/polttari-lahjat",          label: "Polttarilahjat",            emoji: "🎉", tags: ["polttari", "lahjat"] },
  { path: "/isanpaiva-lahjat",         label: "Isänpäivälahjat",          emoji: "👨", tags: ["isänpäivä", "miehelle", "lahjat"] },
  { path: "/aitienpaiva",              label: "Äitienpäivälahjat",        emoji: "💐", tags: ["äitienpäivä", "naiselle", "lahjat"] },
  { path: "/joululahjat",              label: "Joululahjat",              emoji: "🎄", tags: ["joulu", "lahjat"] },
  { path: "/syntymapaivalahjat",        label: "Syntymäpäivälahjat",      emoji: "🎂", tags: ["synttäri", "lahjat"] },
  { path: "/elakelahjat",              label: "Eläkelahjat",              emoji: "🎓", tags: ["eläke", "lahjat"] },
  { path: "/lahja-kaverille",          label: "Lahja kaverille",          emoji: "🤝", tags: ["kaveri", "lahjat"] },
  { path: "/hauskat-t-paidat",         label: "Hauskat t-paidat",         emoji: "👕", tags: ["t-paita"] },
  { path: "/hauskat-hupparit",         label: "Hauskat hupparit",         emoji: "🧥", tags: ["huppari"] },
  { path: "/lahja-miehelle",           label: "Lahja miehelle",           emoji: "🎯", tags: ["miehelle", "lahjat"] },
  { path: "/haalarimerkit",            label: "Haalarimerkit",            emoji: "📌", tags: ["opiskelija"] },
];

/** /lahjat/:slug routes built from the shared situationGifts data (yhdistetyt sivut ohjautuvat uuteen polkuun) */
export const situationGiftLinks: SiteLink[] = situationGifts
  .filter((s) => !LANDING_REDIRECTS[`/lahjat/${s.slug}`])
  .map((s) => ({
  path: `/lahjat/${s.slug}`,
  label: s.h1,
  emoji: s.emoji,
  tags: [s.slug],
}));

/** Extra content hubs worth linking to */
export const contentHubLinks: SiteLink[] = [
  { path: "/blogi",                               label: "Lahjaopas-blogi",                    emoji: "📰", tags: [] },
  { path: "/suomalaiset-tyopaikkameemit-top-50",  label: "Suomalaiset työpaikkameemit – TOP 50", emoji: "😂", tags: ["työ"] },
  { path: "/hauskimmat-tyopaikkalaput-2026",       label: "Hauskimmat työpaikkalaput 2026",      emoji: "📋", tags: ["työ"] },
];

/** Footer-visible gift links — curated subset that covers all non-linked hub pages */
export const footerGiftLinks: SiteLink[] = [
  ...giftHubLinks,
  { path: "/lahjat/miehelle",             label: "Lahjat miehelle",           emoji: "🧔", tags: [] },
  { path: "/lahjat/naiselle",             label: "Lahjat naiselle",           emoji: "💁‍♀️", tags: [] },
  { path: "/lahjat/alle-30-euroa",        label: "Lahjat alle 30 €",          emoji: "🪙", tags: [] },
  { path: "/lahjat/valmistujaisiin",      label: "Valmistujaislahjat",        emoji: "🎓", tags: [] },
  { path: "/lahjat/polttareihin",         label: "Lahjat polttareihin",       emoji: "🎉", tags: [] },
  { path: "/lahjat/tyokaverille",         label: "Lahjat työkavereille",      emoji: "💼", tags: [] },
  { path: "/lahjat/syntymapaivasankarille", label: "Synttärilahjat",          emoji: "🎂", tags: [] },
  { path: "/lahjat/50-vuotiaalle-miehelle", label: "Lahjat 50v miehelle",    emoji: "🎂", tags: [] },
  { path: "/lahjat/60-vuotiaalle-miehelle", label: "Lahjat 60v miehelle",    emoji: "🥳", tags: [] },
  { path: "/lahjat/harrastajalle",        label: "Lahjat harrastajalle",      emoji: "🎣", tags: [] },
  { path: "/joululahja-tyokaverille",     label: "Joululahja työkaverille",   emoji: "🎄", tags: [] },
  { path: "/suomalainen-huumori-paidat", label: "Suomalainen huumori",       emoji: "🇫🇮", tags: [] },
  { path: "/ammattipaidat",              label: "Ammattipaidat",             emoji: "🛠️", tags: [] },
];

/**
 * Returns up to `limit` links related to `currentPath` by tag overlap.
 * Used for "Katso myös" sections in GiftCategoryPage and BlogPost.
 */
export function getRelatedGiftLinks(
  currentPath: string,
  tags: string[],
  limit = 6,
): SiteLink[] {
  if (tags.length === 0) return giftHubLinks.filter((l) => l.path !== currentPath).slice(0, limit);
  return [...giftHubLinks, ...situationGiftLinks]
    .filter((l) => l.path !== currentPath && tags.some((t) => l.tags.includes(t)))
    .slice(0, limit);
}
