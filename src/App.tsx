import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { ScrollToTop } from "./components/ScrollToTop";
import { AddToCartDrawer } from "./components/AddToCartDrawer";
import { lazy, Suspense, useEffect, useState } from "react";
import { REVEAL_AFTER_MOUNT_MS, revealApp } from "@/lib/prerenderPreview";
import { reloadOnceForStaleChunk } from "@/lib/chunkReload";
import { Skeleton } from "@/components/ui/skeleton";
import { HelmetProvider } from "react-helmet-async";
import { SeasonalBanner } from "@/components/SeasonalBanner";
import { LANDING_PATHS, LANDING_REDIRECTS, redirectWithQuery } from "@/data/landingRoutes";
import { CHRISTMAS_DEADLINE_PATH } from "@/data/christmas";

// Retry dynamic import once, then hard-reload to recover from stale chunks after deploys
// (src/lib/chunkReload.ts: enintään kerran minuutissa, ei silmukkaa).
//
// Reitin chunk voidaan ladata etukäteen (preload): src/main.tsx odottaa etusivun, ostoskorin ja kassan chunkin
// ennen ensimmäistä renderöintiä (HTML esilataa ne entryn rinnalla, scripts/prerender.mjs). Valmiiksi ladattu
// sivu renderöidään suoraan ilman Suspense-varanäkymää, joten alatunniste ei hyppää (CLS) eikä etusivun
// esikatselun tilalle välähdä luurankoa. Valinta tehdään kerran komponentin asennuksessa (ei uudelleenasennusta).
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- reittikomponenttien propsit vaihtelevat
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  let loaded: T | null = null;
  const load = () =>
    factory().then((m) => {
      loaded = m.default;
      return m;
    });
  const Lazy = lazy(async () => {
    try {
      return await load();
    } catch (err) {
      try {
        await new Promise((r) => setTimeout(r, 300));
        return await load();
      } catch (err2) {
        if (reloadOnceForStaleChunk()) {
          // Sivu latautuu uudelleen: pidetään Suspense-tila, ei virhenäkymää.
          return new Promise<never>(() => {});
        }
        throw err2;
      }
    }
  });
  function RoutePage(props: React.ComponentProps<T>) {
    const [Valmis] = useState<T | null>(() => loaded);
    return Valmis ? <Valmis {...props} /> : <Lazy {...props} />;
  }
  return Object.assign(RoutePage, { preload: load });
}

// For non-critical lazy components (popups, etc.) — never reload the page on failure;
// just render nothing. A failed popup must NOT take down the whole app.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ponnahdusikkunoiden propsit vaihtelevat
function lazySafe<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch {
      return { default: (() => null) as unknown as T };
    }
  });
}

// Lazy: all routes. Etusivu ladataan rinnakkain entryn kanssa (src/main.tsx + modulepreload), jotta sen
// blogi- ja kaupunkidata ei kasvata jokaisen sivun pääpakettia.
const Index = lazyWithRetry(() => import("./pages/Index"));
const CategoryPage = lazyWithRetry(() => import("./pages/CategoryPage"));
const ProductPage = lazyWithRetry(() => import("./pages/ProductPage"));
const CartPage = lazyWithRetry(() => import("./pages/CartPage"));
const CheckoutPage = lazyWithRetry(() => import("./pages/CheckoutPage"));
const AllProducts = lazyWithRetry(() => import("./pages/AllProducts"));
const FAQ = lazyWithRetry(() => import("./pages/FAQ"));
const Terms = lazyWithRetry(() => import("./pages/Terms"));
const ReturnsPolicy = lazyWithRetry(() => import("./pages/ReturnsPolicy"));
const Privacy = lazyWithRetry(() => import("./pages/Privacy"));
const Accessibility = lazyWithRetry(() => import("./pages/Accessibility"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const SearchPage = lazyWithRetry(() => import("./pages/SearchPage"));
const OrderConfirmation = lazyWithRetry(() => import("./pages/OrderConfirmation"));
const GiftCardPage = lazyWithRetry(() => import("./pages/GiftCardPage"));
const BundlesPage = lazyWithRetry(() => import("./pages/BundlesPage"));
const BundlePage = lazyWithRetry(() => import("./pages/BundlesPage").then((m) => ({ default: m.BundlePage })));
const BlogIndex = lazyWithRetry(() => import("./pages/BlogIndex"));
const BlogPost = lazyWithRetry(() => import("./pages/BlogPost"));
const GiftCategoryPage = lazyWithRetry(() => import("./pages/GiftCategoryPage"));
const MothersDayPage = lazyWithRetry(() => import("./pages/MothersDayPage"));
const MothersDayRedirect = lazyWithRetry(() => import("./pages/MothersDayRedirect"));
const ContactPage = lazyWithRetry(() => import("./pages/ContactPage"));
const AboutPage = lazyWithRetry(() => import("./pages/AboutPage"));
const UnsubscribePage = lazyWithRetry(() => import("./pages/UnsubscribePage"));
const RestoreCartPage = lazyWithRetry(() => import("./pages/RestoreCartPage"));
const ReviewPage = lazyWithRetry(() => import("./pages/ReviewPage"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const AdminLogin = lazyWithRetry(() => import("./pages/AdminLogin"));
const SituationGiftPage = lazyWithRetry(() => import("./pages/SituationGiftPage"));
const WorkplaceMemesPage = lazyWithRetry(() => import("./pages/WorkplaceMemesPage"));
const OfficeNotesPage = lazyWithRetry(() => import("./pages/OfficeNotesPage"));
const HaalarimerkkiPage = lazyWithRetry(() => import("./pages/GiftCategoryPage"));
const ProfessionPage = lazyWithRetry(() => import("./pages/ProfessionPage"));
const MunicipalityPage = lazyWithRetry(() => import("./pages/MunicipalityPage"));
const HobbyPage = lazyWithRetry(() => import("./pages/HobbyPage"));
const DialectPage = lazyWithRetry(() => import("./pages/DialectPage"));
const LandingPage = lazyWithRetry(() => import("./pages/LandingPage"));
const ChristmasDeadlinePage = lazyWithRetry(() => import("./pages/ChristmasDeadlinePage"));
const GroupOrderPage = lazyWithRetry(() => import("./pages/GroupOrderPage"));

// Lazy: popups (not needed at initial load) — use safe loader so a fetch failure
// doesn't trigger a full-page reload loop that blanks the site.
const NewsletterPopup = lazySafe(() => import("./components/NewsletterPopup").then(m => ({ default: m.NewsletterPopup })));
const ExitIntentPopup = lazySafe(() => import("./components/ExitIntentPopup").then(m => ({ default: m.ExitIntentPopup })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function PageFallback() {
  return (
    <div className="container py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/**
 * Kova varmistus esirenderöidylle esikatselulle: sovellus näytetään viimeistään pian asennuksen
 * jälkeen riippumatta datasta tai sivun latauksesta, jottei inert-esikatselu jää näkyviin.
 */
function PreviewRevealFallback() {
  useEffect(() => {
    const t = window.setTimeout(revealApp, REVEAL_AFTER_MOUNT_MS);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}

/** Client-side-uudelleenohjaus, joka säilyttää kyselymerkkijonon (utm-parametrit) ja hashin. */
const RedirectKeepQuery = ({ to }: { to: string }) => {
  const { search, hash } = useLocation();
  return <Navigate to={redirectWithQuery(to, search, hash)} replace />;
};

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PreviewRevealFallback />
          <ScrollToTop />
          <Header />
          <SeasonalBanner />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/kaikki-tuotteet" element={<AllProducts />} />
              <Route path="/kategoria/:slug" element={<CategoryPage />} />
              <Route path="/tuote/:slug" element={<ProductPage />} />
              <Route path="/ostoskori" element={<CartPage />} />
              <Route path="/kassa" element={<CheckoutPage />} />
              <Route path="/usein-kysytyt-kysymykset" element={<FAQ />} />
              <Route path="/faq" element={<RedirectKeepQuery to="/usein-kysytyt-kysymykset" />} />
              <Route path="/toimitusehdot" element={<Terms />} />
              <Route path="/palautusehdot" element={<ReturnsPolicy />} />
              <Route path="/tietosuojakaytanto" element={<Privacy />} />
              <Route path="/saavutettavuusseloste" element={<Accessibility />} />
              <Route path="/haku" element={<SearchPage />} />
              <Route path="/tilaus-vahvistettu" element={<OrderConfirmation />} />
              <Route path="/lahjakortti" element={<GiftCardPage />} />
              <Route path="/paketit" element={<BundlesPage />} />
              <Route path="/paketit/:slug" element={<BundlePage />} />
              <Route path="/blogi" element={<BlogIndex />} />
              <Route path="/blogi/:slug" element={<BlogPost />} />
              <Route path="/aitienpaiva" element={<MothersDayPage />} />
              <Route path="/polttari-lahjat" element={<GiftCategoryPage />} />
              {/* 301-redirect: vanha äitienpäiväsivu → uusi /aitienpaiva */}
              <Route path="/aitienpaiva-lahjat" element={<MothersDayRedirect />} />
              {/* Laskeutumissivut (src/data/landingPages.ts): staattiset polut voittavat /lahjat/:slug-reitin */}
              {LANDING_PATHS.map((path) => (
                <Route key={path} path={path} element={<LandingPage />} />
              ))}
              <Route path={CHRISTMAS_DEADLINE_PATH} element={<ChristmasDeadlinePage />} />
              <Route path="/ryhmatilaukset" element={<GroupOrderPage />} />
              {/* Yhdistetyt sivut ja ääkkösslugit (301 myös vercel.json:ssa) */}
              {Object.entries(LANDING_REDIRECTS).map(([from, to]) => (
                <Route key={from} path={from} element={<RedirectKeepQuery to={to} />} />
              ))}
              <Route path="/lahjat/:slug" element={<SituationGiftPage />} />
              <Route path="/haalarimerkit" element={<HaalarimerkkiPage />} />
              <Route path="/suomalaiset-tyopaikkameemit-top-50" element={<WorkplaceMemesPage />} />
              <Route path="/hauskimmat-tyopaikkalaput-2026" element={<OfficeNotesPage />} />
              <Route path="/yhteystiedot" element={<ContactPage />} />
              <Route path="/tietoa-meista" element={<AboutPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />
              <Route path="/palauta-kori" element={<RestoreCartPage />} />
              <Route path="/arvostele" element={<ReviewPage />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              {/* Content graph routes: professions, municipalities, hobbies, dialects */}
              <Route path="/ammatti/:slug" element={<ProfessionPage />} />
              <Route path="/kaupunki/:slug" element={<MunicipalityPage />} />
              <Route path="/harrastus/:slug" element={<HobbyPage />} />
              <Route path="/murre/:slug" element={<DialectPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Footer />
          <CookieConsent />
          <AddToCartDrawer />
          <Suspense fallback={null}>
            <NewsletterPopup />
            <ExitIntentPopup />
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

/** Reitit, joiden chunk ladataan ennen ensimmäistä renderöintiä (src/main.tsx, spa-shell.html:n esilataus). */
const ESILADATTAVAT: Record<string, { preload: () => Promise<unknown> }> = {
  "/": Index,
  "/ostoskori": CartPage,
  "/kassa": CheckoutPage,
};

/** Lataa polun sivun chunkin, jos se kuuluu esiladattaviin; muuten heti valmis. Ei koskaan hylätä. */
// eslint-disable-next-line react-refresh/only-export-components
export function preloadRoute(pathname: string): Promise<void> {
  const sivu = ESILADATTAVAT[pathname.replace(/(.)\/$/, "$1")];
  return sivu ? sivu.preload().then(() => undefined, () => undefined) : Promise.resolve();
}

export default App;
