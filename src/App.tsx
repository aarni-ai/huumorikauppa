import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/layout/CookieConsent";
import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import AllProducts from "./pages/AllProducts";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import SearchPage from "./pages/SearchPage";
import OrderConfirmation from "./pages/OrderConfirmation";
import { ScrollToTop } from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/kaikki-tuotteet" element={<AllProducts />} />
            <Route path="/kategoria/:slug" element={<CategoryPage />} />
            <Route path="/tuote/:slug" element={<ProductPage />} />
            <Route path="/ostoskori" element={<CartPage />} />
            <Route path="/kassa" element={<CheckoutPage />} />
            <Route path="/usein-kysytyt-kysymykset" element={<FAQ />} />
            <Route path="/toimitusehdot" element={<Terms />} />
            <Route path="/tietosuojakaytanto" element={<Privacy />} />
            <Route path="/haku" element={<SearchPage />} />
            <Route path="/tilaus-vahvistettu" element={<OrderConfirmation />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
          <CookieConsent />
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
