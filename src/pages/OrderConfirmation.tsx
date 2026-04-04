import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { CheckCircle, ShoppingBag, Share2 } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCartContext();

  useEffect(() => {
    // Clear cart after successful payment
    if (sessionId) {
      clearCart();
    }
  }, [sessionId, clearCart]);

  const handleShare = async () => {
    const text = "Tilasin just Huumorikaupasta! 😂🛒 Käy katsomassa: https://huumorikauppa.lovable.app";
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: "Kopioitu leikepöydälle! 📋" });
    }
  };

  return (
    <div className="container py-16 md:py-24 text-center max-w-2xl mx-auto space-y-8">
      <SEOHead title="Tilaus vahvistettu! – Huumorikauppa" description="Kiitos tilauksestasi Huumorikaupassa!" />
      
      <div className="animate-bounce-once">
        <CheckCircle className="h-20 w-20 text-primary mx-auto" />
      </div>

      <h1 className="font-display text-4xl md:text-5xl text-foreground">
        Tilaus vahvistettu! 🎉
      </h1>

      <p className="text-lg text-muted-foreground leading-relaxed">
        Kiitos tilauksestasi! Saat vahvistusviestin sähköpostiisi hetken kuluttua. 
        Pakettisi lähtee matkaan 1–3 arkipäivän kuluessa. 📦
      </p>

      <div className="bg-card border border-border rounded-lg p-6 space-y-3 text-left">
        <h3 className="font-display text-lg text-foreground">Mitä seuraavaksi?</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>📧 Saat tilausvahvistuksen sähköpostiin</li>
          <li>📦 Toimitus 3–10 arkipäivää</li>
          <li>🔄 14 päivän vaihto- ja palautusoikeus</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg" className="bg-primary text-primary-foreground font-bold">
          <Link to="/kaikki-tuotteet">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Jatka shoppailua
          </Link>
        </Button>
        <Button variant="outline" size="lg" onClick={handleShare} className="border-border">
          <Share2 className="h-4 w-4 mr-2" />
          Jaa kaverille 😂
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Ongelmia tilauksesi kanssa? Ota yhteyttä: info@huumorikauppa.fi
      </p>
    </div>
  );
};

export default OrderConfirmation;
