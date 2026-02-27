import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("huumorikauppa-cookies");
    if (!accepted) {
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("huumorikauppa-cookies", "accepted");
    setShow(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem("huumorikauppa-cookies", "necessary");
    setShow(false);
  };

  if (!show) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" />

      {/* Cookie popup */}
      <div className="fixed bottom-6 left-4 right-4 z-50 mx-auto max-w-lg animate-slide-in-right">
        <div className="rounded-xl border border-border bg-card p-6 shadow-2xl shadow-primary/10">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-3xl">🍪</span>
            <div>
              <h3 className="font-display text-lg text-foreground mb-1">Käytämme evästeitä</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Käytämme evästeitä parantaaksemme käyttökokemustasi ja analysoidaksemme liikennettä.{" "}
                <a href="/tietosuojakaytanto" className="text-primary hover:underline font-medium">
                  Lue lisää →
                </a>
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={accept}
              className="flex-1 bg-primary text-primary-foreground font-bold shadow-glow-lime hover:scale-[1.02] transition-transform"
            >
              Hyväksy kaikki 🍪
            </Button>
            <Button
              onClick={acceptNecessary}
              variant="outline"
              className="flex-1 border-border text-muted-foreground hover:text-foreground"
            >
              Vain välttämättömät
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
