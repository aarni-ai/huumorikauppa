import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

// Lazy: all other routes
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const AllProducts = lazy(() => import("./pages/AllProducts"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));
const ReturnsPolicy = lazy(() => import("./pages/ReturnsPolicy"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const BlogIndex = lazy(() => import("./pages/BlogIndex"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const GiftCategoryPage = lazy(() => import("./pages/GiftCategoryPage"));
const MothersDayPage = lazy(() => import("./pages/MothersDayPage"));
const MothersDayRedirect = lazy(() => import("./pages/MothersDayRedirect"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const UnsubscribePage = lazy(() => import("./pages/UnsubscribePage"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));

// Lazy: popups (not needed at initial load)
const NewsletterPopup = lazy(() => import("./components/NewsletterPopup").then(m => ({ default: m.NewsletterPopup })));
const ExitIntentPopup = lazy(() => import("./components/ExitIntentPopup").then(m => ({ default: m.ExitIntentPopup })));

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
              <Route path="/syntymapaivaLahjat" element={<GiftCategoryPage />} />
              <Route path="/elakelahjat" element={<GiftCategoryPage />} />
              <Route path="/lahja-kaverille" element={<GiftCategoryPage />} />
              <Route path="/lahja-tyokaverille" element={<GiftCategoryPage />} />
              <Route path="/yhteystiedot" element={<ContactPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
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
