/**
 * Näkyvä esikatselu esirenderöintiin (scripts/prerender.mjs): oikea Header, kampanjabanneri ja sivun
 * ensinäkymä renderöitynä samoilla komponenteilla ja Tailwind-luokilla kuin selaimessa. Käytössä
 * tuotesivuilla (ProductPage previewOnly) ja etusivulla (Index ilman tuotedataa, kuten selaimen
 * ensimmäinen renderöinti).
 *
 * Selain näyttää esikatselun heti HTML:n ja CSS:n saavuttua (LCP-kuvalla on <head>-preload), kun
 * taas React-sovellus käynnistyy piilotettuun #rootiin. src/main.tsx vaihtaa sovelluksen näkyviin
 * samassa ruudunpäivityksessä, kun sivu on valmis (revealApp), joten esikatselusta Reactiin ei synny
 * asettelun siirtymää: esikatselun solmut poistuvat ja sovelluksen solmut ilmestyvät, mikään
 * olemassa oleva elementti ei liiku.
 *
 * Esikatselu on inert: sen painikkeet ja linkit eivät ole vielä toiminnassa, eikä se näy
 * avustaville teknologioille (data-prerender-runko pysyy niille ja hakukoneille ennallaan).
 */
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/layout/Header";
import { SeasonalBannerView } from "@/components/SeasonalBanner";
import { activeBannerTheme } from "@/data/campaignSchedule";
import ProductPage from "@/pages/ProductPage";
import Index from "@/pages/Index";
import type { ReactNode } from "react";
import { mapProduct } from "@/hooks/use-products";
import type { Tables } from "@/integrations/supabase/types";

/** Merkintä #rootin ensimmäisellä lapsella; src/main.tsx tunnistaa sen. */
export const PREVIEW_ATTR = "data-prerender-visual";

/**
 * Siistii renderToStringin tuloksen esikatseluksi: H1:t <div>:eiksi, koska data-prerender-runko pitää
 * sivun ainoan H1:n. Tuotesivun H1:illä on font-display-luokka, joka määrää fontin, joten ulkoasu ei muutu.
 */
export function toPreviewHtml(html: string): string {
  const body = html.replace(/<(\/?)h1(?=[\s>])/g, "<$1div");
  return `<div ${PREVIEW_ATTR}="true" inert="">${body}</div>`;
}

function renderWithShell(path: string, page: ReactNode, queryClient: QueryClient, nowMs: number): string {
  const html = renderToString(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CartProvider>
            <MemoryRouter initialEntries={[path]}>
              <Header />
              <SeasonalBannerView theme={activeBannerTheme(nowMs)} />
              {page}
            </MemoryRouter>
          </CartProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );
  return toPreviewHtml(html);
}

/** Ei hakuja palvelimella: vain annettu data tai latausnäkymä, kuten selaimen ensimmäisessä renderöinnissä. */
function previewQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } });
}

export function renderProductPreview(row: Tables<"products">, nowMs = Date.now()): string {
  const product = mapProduct(row);
  const queryClient = previewQueryClient();
  queryClient.setQueryData(["product", product.slug], product);
  return renderWithShell(
    `/tuote/${product.slug}`,
    <Routes>
      <Route path="/tuote/:slug" element={<ProductPage previewOnly />} />
    </Routes>,
    queryClient,
    nowMs,
  );
}

/** Etusivu ilman tuotedataa: hero (LCP-kuva) ja tuoteosioiden latausnäkymät, kuten selaimessa ennen hakua. */
export function renderHomePreview(nowMs = Date.now()): string {
  return renderWithShell("/", <Index />, previewQueryClient(), nowMs);
}
