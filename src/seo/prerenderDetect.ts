import { SITE_URL } from "./site.js";

/**
 * Onko HTML build-vaiheessa esirenderöity juuri tälle polulle? Esirenderöidyssä sivussa on
 * data-prerender-runko ja canonical, joka osoittaa polkuun itseensä. SPA-kuoressa
 * (spa-shell.html) canonicalia ei ole. Käytössä middleware.ts:ssä.
 */
export function isPrerenderedHtml(html: string, path: string): boolean {
  const normalized = path === "/" ? "/" : path.replace(/\/+$/, "") || "/";
  const canonical = normalized === "/" ? `${SITE_URL}/` : `${SITE_URL}${normalized}`;
  return html.includes("data-prerender") && html.includes(`<link rel="canonical" href="${canonical}"`);
}
