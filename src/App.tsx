import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { ScrollToTop } from "./components/ScrollToTop";
import { AddToCartDrawer } from "./components/AddToCartDrawer";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HelmetProvider } from "react-helmet-async";

// Eager: homepage (LCP critical)
import Index from "./pages/Index";

// Retry dynamic import once, then hard-reload to recover from stale chunks after deploys
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const KEY = "lovable-chunk-reloaded";
    try {
      return await factory();
    } catch (err) {
      try {
        await new Promise((r) => setTimeout(r, 300));
        return await factory();
      } catch (err2) {
        if (typeof window !== "undefined" && !sessionStorage.getItem(KEY)) {
          sessionStorage.setItem(KEY, "1");
          window.location.reload();
        }
        throw err2;
      }
    }
  });
}

// For non-critical lazy components (popups, etc.) — never reload the page on failure;
// just render nothing. A failed popup must NOT take down the whole app.
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

// Lazy: all other routes
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
const BlogIndex = lazyWithRetry(() => import("./pages/BlogIndex"));
const BlogPost = lazyWithRetry(() => import("./pages/BlogPost"));
const GiftCategoryPage = lazyWithRetry(() => import("./pages/GiftCategoryPage"));
const MothersDayPage = lazyWithRetry(() => import("./pages/MothersDayPage"));
const MothersDayRedirect = lazyWithRetry(() => import("./pages/MothersDayRedirect"));
const ContactPage = lazyWithRetry(() => import("./pages/ContactPage"));
const AboutPage = lazyWithRetry(() => import("./pages/AboutPage"));
const UnsubscribePage = lazyWithRetry(() => import("./pages/UnsubscribePage"));
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

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Header />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/kaikki-tuotteet" element={<AllProducts />} />
              <Route path="/kategoria/:slug" element={<CategoryPage />} />
              <Route path="/tuote/:slug" element={<ProductPage />} />
              <Route path="/ostoskori" element={<CartPage />} />
              <Route path="/kassa" element={<CheckoutPage />} />
              <Route path="/usein-kysytyt-kysymykset" element={<FAQ />} />
              <Route path="/faq" element={<Navigate to="/usein-kysytyt-kysymykset" replace />} />
              <Route path="/toimitusehdot" element={<Terms />} />
              <Route path="/palautusehdot" element={<ReturnsPolicy />} />
              <Route path="/tietosuojakaytanto" element={<Privacy />} />
              <Route path="/saavutettavuusseloste" element={<Accessibility />} />
              <Route path="/haku" element={<SearchPage />} />
              <Route path="/tilaus-vahvistettu" element={<OrderConfirmation />} />
              <Route path="/blogi" element={<BlogIndex />} />
              <Route path="/blogi/:slug" element={<BlogPost />} />
              <Route path="/aitienpaiva" element={<MothersDayPage />} />
              <Route path="/hauskat-lahjat-miehelle" element={<GiftCategoryPage />} />
              <Route path="/hauskat-lahjat-naiselle" element={<GiftCategoryPage />} />
              <Route path="/polttari-lahjat" element={<GiftCategoryPage />} />
              <Route path="/isanpaiva-lahjat" element={<GiftCategoryPage />} />
              {/* 301-redirect: vanha äitienpäiväsivu → uusi /aitienpaiva */}
              <Route path="/aitienpaiva-lahjat" element={<MothersDayRedirect />} />
              <Route path="/joululahjat" element={<GiftCategoryPage />} />
              <Route path="/syntymapaivalahjat" element={<GiftCategoryPage />} />
              <Route path="/elakelahjat" element={<GiftCategoryPage />} />
              <Route path="/lahja-kaverille" element={<GiftCategoryPage />} />
              <Route path="/lahja-tyokaverille" element={<GiftCategoryPage />} />
              <Route path="/hauskat-t-paidat" element={<GiftCategoryPage />} />
              <Route path="/hauskat-hupparit" element={<GiftCategoryPage />} />
              <Route path="/lahja-miehelle" element={<GiftCategoryPage />} />
              <Route path="/lahjat/:slug" element={<SituationGiftPage />} />
              <Route path="/haalarimerkit" element={<HaalarimerkkiPage />} />
              <Route path="/opiskelijan-haalarimerkit" element={<HaalarimerkkiPage />} />
              <Route path="/suomalaiset-tyopaikkameemit-top-50" element={<WorkplaceMemesPage />} />
              <Route path="/hauskimmat-tyopaikkalaput-2026" element={<OfficeNotesPage />} />
              <Route path="/yhteystiedot" element={<ContactPage />} />
              <Route path="/tietoa-meista" element={<AboutPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />
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

export default App;
