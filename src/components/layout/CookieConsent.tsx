import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("huumorikauppa-cookies");
    if (!accepted) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem("huumorikauppa-cookies", "accepted");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-4 md:p-6 animate-slide-in-right">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Käytämme evästeitä.{" "}
          <a href="/tietosuojakaytanto" className="text-primary hover:underline">Lue lisää</a>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button onClick={accept} size="sm" className="bg-primary text-primary-foreground font-bold">
            Hyväksy evästeet
          </Button>
          <Button onClick={() => setShow(false)} variant="ghost" size="sm" className="text-muted-foreground">
            Vain välttämättömät
          </Button>
        </div>
      </div>
    </div>
  );
}
