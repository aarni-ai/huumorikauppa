/**
 * Näkyvä esikatselu esirenderöintiin (scripts/prerender.mjs): oikea Header, kampanjabanneri ja sivun
 * ensinäkymä renderöitynä samoilla komponenteilla ja Tailwind-luokilla kuin selaimessa. Käytössä
 * tuotesivuilla (ProductPage previewOnly), etusivulla (Index ilman tuotedataa, kuten selaimen
 * ensimmäinen renderöinti) ja blogiartikkeleissa (BlogPost ilman tuotedataa, tuotekorteissa latausnäkymä).
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
import { AppTarjoajat, AppSisalto, preloadRoute } from "@/App";
import { asetaEsirenderoinninTeema } from "@/components/SeasonalBanner";
import type { ReactNode } from "react";
import { mapProduct } from "@/hooks/use-products";
import type { Tables } from "@/integrations/supabase/types";

/** Merkintä #rootin ensimmäisellä lapsella; src/main.tsx tunnistaa sen. */
export const PREVIEW_ATTR = "data-prerender-visual";

/**
 * Siistii renderToStringin tuloksen esikatseluksi: H1:t <div>:eiksi, koska data-prerender-runko pitää
 * sivun ainoan H1:n. Tuotesivun H1:illä on font-display-luokka, joka määrää fontin, joten ulkoasu ei muutu.
 */
export function toPreviewHtml(html: string, extra = "", { inert = true } = {}): string {
  const body = html.replace(/<(\/?)h1(?=[\s>])/g, "<$1div");
  return `<div ${PREVIEW_ATTR}="true"${inert ? ' inert=""' : ' aria-hidden="true"'}>${body}${extra}</div>`;
}

/**
 * Tuotesivun esikatselu ottaa napautukset talteen (2.11.2026): hitaalla mobiiliyhteydellä sovellus käynnistyy vasta
 * 3-4 s kuluttua, ja ennen sitä värin, koon ja Lisää koriin -napautukset katosivat. Skripti merkitsee valinnan näkyviin
 * ja tallentaa sen window.__hkEsivalinta-olioon, jonka ProductPage käyttää käynnistyessään (Lisää koriin lisää tuotteen
 * valitulla koolla tai korostaa kokovalitsimen). Linkit toimivat esikatselussa tavallisina linkkeinä.
 */
export const ESIVALINTA_SCRIPT = `<script>(function(){var V="${PREVIEW_ATTR}";document.addEventListener("click",function(e){var t=e.target;if(!t||!t.closest)return;var p=t.closest("["+V+"]");if(!p)return;var w=window.__hkEsivalinta=window.__hkEsivalinta||{};var r=t.closest('[role=radio]');var g=r&&r.closest('[role=radiogroup]');if(g){var l=g.getAttribute("aria-label");w[l==="Väri"?"vari":"koko"]=r.textContent.trim();var on=["border-primary","bg-primary","text-primary-foreground"],off=["border-border","text-foreground"];var rs=g.querySelectorAll('[role=radio]');for(var i=0;i<rs.length;i++){var x=rs[i],s=x===r;x.setAttribute("aria-checked",s?"true":"false");for(var j=0;j<on.length;j++)x.classList.toggle(on[j],s);for(var k=0;k<off.length;k++)x.classList.toggle(off[k],!s);}e.preventDefault();return;}var b=t.closest("button");if(b&&/Lisää koriin/.test(b.textContent)){w.lisaa=true;b.setAttribute("aria-busy","true");b.style.opacity="0.75";e.preventDefault();return;}if(b)e.preventDefault();},true);})();</script>`;

/** JSON <script>-elementtiin: "<" escapoidaan, ettei sisältö voi sulkea elementtiä. */
export function productSeedScript(row: unknown): string {
  const json = JSON.stringify(row).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return `<script type="application/json" data-product-seed>${json}</script>`;
}

function renderWithShell(path: string, page: ReactNode, queryClient: QueryClient, nowMs: number, extra = "", inert = true): string {
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
  return toPreviewHtml(html, extra, { inert });
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
    productSeedScript(row) + ESIVALINTA_SCRIPT,
    false,
  );
}

/**
 * Blogiartikkeli hydratoitavana sovelluksena (29.10.2026): koko sovelluspuu (AppSisalto) MemoryRouterilla samalla
 * tavalla kuin selaimen ensimmäinen renderöinti, ilman tuotedataa (tuotekorteissa latausnäkymä). Selain hydratoi
 * merkinnän (src/main.tsx hydrateRoot), joten näkyvä teksti ei vaihdu toiseen solmuun (ennen esikatselun vaihto
 * kirjasi myöhäisen LCP:n, Lighthouse mobiili 4,5 s kahdessa ikävuosiblogissa).
 */
export async function renderBlogApp(slug: string, nowMs = Date.now()): Promise<string> {
  return renderAppHydrated(`/blogi/${slug}`, nowMs);
}

/**
 * Mikä tahansa reitti hydratoitavana sovelluksena (2.11.2026: blogiartikkelit ja kategoriasivut). Kategoriasivulla
 * Lighthouse mobiili 72, LCP 4,6 s ja CLS 0,16, koska React korvasi tyylittömän SEO-rungon vasta laiskan
 * sivukomponentin latauduttua.
 */
export async function renderAppHydrated(path: string, nowMs = Date.now()): Promise<string> {
  await preloadRoute(path);
  asetaEsirenderoinninTeema(activeBannerTheme(nowMs));
  try {
    return renderToString(
      <AppTarjoajat client={new QueryClient()}>
        <MemoryRouter initialEntries={[path]}>
          <AppSisalto />
        </MemoryRouter>
      </AppTarjoajat>,
    );
  } finally {
    asetaEsirenderoinninTeema(null);
  }
}

/** Etusivu ilman tuotedataa: hero (LCP-kuva) ja tuoteosioiden latausnäkymät, kuten selaimessa ennen hakua. */
export function renderHomePreview(nowMs = Date.now()): string {
  return renderWithShell("/", <Index />, previewQueryClient(), nowMs);
}
