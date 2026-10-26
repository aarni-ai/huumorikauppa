/**
 * Tuotesivun näkyvä esikatselu esirenderöintiin (scripts/prerender.mjs): oikea Header, kampanjabanneri
 * ja ProductPage renderöitynä samoilla komponenteilla ja Tailwind-luokilla kuin selaimessa.
 *
 * Selain näyttää esikatselun heti HTML:n ja CSS:n saavuttua (pääkuva on LCP-elementti ja sillä on
 * <head>-preload), kun taas React-sovellus käynnistyy piilotettuun #rootiin. src/main.tsx vaihtaa
 * sovelluksen näkyviin samassa ruudunpäivityksessä, kun tuotesivu on valmis (revealApp), joten
 * esikatselusta Reactiin ei synny asettelun siirtymää: esikatselun solmut poistuvat ja sovelluksen
 * solmut ilmestyvät, mikään olemassa oleva elementti ei liiku.
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

export function renderProductPreview(row: Tables<"products">, nowMs = Date.now()): string {
  const product = mapProduct(row);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } });
  queryClient.setQueryData(["product", product.slug], product);
  const theme = activeBannerTheme(nowMs);
  const path = `/tuote/${product.slug}`;
  const html = renderToString(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CartProvider>
            <MemoryRouter initialEntries={[path]}>
              <Header />
              <SeasonalBannerView theme={theme} />
              <Routes>
                <Route path="/tuote/:slug" element={<ProductPage previewOnly />} />
              </Routes>
            </MemoryRouter>
          </CartProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );
  return toPreviewHtml(html);
}
