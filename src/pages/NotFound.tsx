import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="container py-20 text-center">
      <SEOHead title="Sivua ei löydy – Huumorikauppa" description="Etsimääsi sivua ei löytynyt. Palaa etusivulle ja selaa tuotteita." />
      <h1 className="font-display text-5xl text-foreground mb-4">404 😅</h1>
      <p className="text-xl text-muted-foreground mb-6">Sivua ei löytynyt – ehkä se myytiin loppuun?</p>
      <Link to="/" className="text-primary hover:underline font-medium text-lg">
        Takaisin etusivulle →
      </Link>
    </div>
  );
};

export default NotFound;
