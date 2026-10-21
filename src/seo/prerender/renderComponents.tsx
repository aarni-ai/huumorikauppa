/**
 * Renderöi sisältösivut (ehdot, tietoa meistä, yhteystiedot, listasivut) React-komponenteista
 * staattiseksi HTML:ksi, jotta esirenderöity sisältö on sama kuin sivulla.
 * Ajetaan vain buildissa (scripts/prerender.mjs).
 */
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import type { ComponentType } from "react";
import { cleanComponentHtml } from "./html";
import type { ComponentPagePath } from "./pages";

const LOADERS: Record<ComponentPagePath, () => Promise<{ default: ComponentType }>> = {
  "/toimitusehdot": () => import("@/pages/Terms"),
  "/palautusehdot": () => import("@/pages/ReturnsPolicy"),
  "/tietosuojakaytanto": () => import("@/pages/Privacy"),
  "/saavutettavuusseloste": () => import("@/pages/Accessibility"),
  "/yhteystiedot": () => import("@/pages/ContactPage"),
  "/tietoa-meista": () => import("@/pages/AboutPage"),
  "/suomalaiset-tyopaikkameemit-top-50": () => import("@/pages/WorkplaceMemesPage"),
  "/hauskimmat-tyopaikkalaput-2026": () => import("@/pages/OfficeNotesPage"),
};

export async function renderComponentPages(
  log: (msg: string) => void = console.warn,
): Promise<Partial<Record<ComponentPagePath, string>>> {
  const out: Partial<Record<ComponentPagePath, string>> = {};
  // react-routerin Link käyttää useLayoutEffectiä; palvelinpuolella siitä tulee vain melua.
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("useLayoutEffect does nothing on the server")) return;
    originalError(...args);
  };
  try {
    await renderAll(out, log);
  } finally {
    console.error = originalError;
  }
  return out;
}

async function renderAll(
  out: Partial<Record<ComponentPagePath, string>>,
  log: (msg: string) => void,
): Promise<void> {
  for (const path of Object.keys(LOADERS) as ComponentPagePath[]) {
    try {
      const { default: Page } = await LOADERS[path]();
      const html = renderToString(
        <HelmetProvider>
          <MemoryRouter initialEntries={[path]}>
            <Page />
          </MemoryRouter>
        </HelmetProvider>,
      );
      out[path] = cleanComponentHtml(html);
    } catch (err) {
      log(`${path}: komponentin renderöinti epäonnistui (${(err as Error).message}), käytetään kevyttä runkoa`);
    }
  }
}
