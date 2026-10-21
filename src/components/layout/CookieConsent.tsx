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

  // Ei peittävää taustaa eikä modaalia: sivu (hinta, koko, Lisää koriin) pysyy käytettävänä.
  // Mobiilissa kapea palkki ylälaidassa, jotta ostopainike ensinäkymän alaosassa jää näkyviin;
  // isommilla näytöillä kortti vasemmassa alakulmassa.
  return (
    <div
      role="region"
      aria-label="Evästeasetukset"
      className="fixed inset-x-0 top-0 z-[60] border-b border-border bg-card shadow-lg sm:inset-x-auto sm:top-auto sm:bottom-4 sm:left-4 sm:max-w-md sm:rounded-xl sm:border"
    >
      <div className="px-4 py-2.5 sm:p-4 space-y-2">
        <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
          Käytämme evästeitä käyttökokemuksen parantamiseen ja liikenteen analysointiin.{" "}
          <a href="/tietosuojakaytanto" className="text-primary underline font-medium">
            Lue lisää
          </a>
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={accept} className="flex-1 h-9 bg-primary text-primary-foreground font-bold">
            Hyväksy kaikki
          </Button>
          <Button size="sm" onClick={acceptNecessary} variant="outline" className="flex-1 h-9 border-border text-foreground">
            Vain välttämättömät
          </Button>
        </div>
      </div>
    </div>
  );
}
