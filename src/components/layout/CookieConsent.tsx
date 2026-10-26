import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  OPEN_CONSENT_SETTINGS_EVENT,
  getStoredConsent,
  saveConsent,
  type ConsentChoice,
} from "@/lib/consent";

/**
 * Evästebanneri (Google Consent Mode v2, src/lib/consent.ts). Analytiikka- ja markkinointiskriptejä
 * ei ladata ennen suostumusta. Alatunnisteen "Evästeasetukset" avaa tämän uudelleen, jolloin
 * suostumuksen voi muuttaa tai perua.
 */
export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!getStoredConsent()) timer = setTimeout(() => setShow(true), 500);
    const open = () => {
      const current = getStoredConsent();
      setAnalytics(current?.analytics ?? false);
      setMarketing(current?.marketing ?? false);
      setDetails(true);
      setShow(true);
    };
    window.addEventListener(OPEN_CONSENT_SETTINGS_EVENT, open);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(OPEN_CONSENT_SETTINGS_EVENT, open);
    };
  }, []);

  const choose = (choice: ConsentChoice) => {
    saveConsent(choice);
    setShow(false);
    setDetails(false);
  };

  if (!show) return null;

  // Ei peittävää taustaa eikä modaalia: sivu (hinta, koko, Lisää koriin) pysyy käytettävänä.
  // Kiinteä sijainti (fixed), joten banneri ei siirrä sivun sisältöä (CLS 0).
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
          Käytämme välttämättömiä evästeitä kaupan toimintaan. Analytiikka- ja markkinointievästeet otamme käyttöön vain suostumuksellasi.{" "}
          <a href="/tietosuojakaytanto" className="text-primary underline font-medium">
            Lue lisää
          </a>
        </p>
        {details && (
          <fieldset className="space-y-1.5 text-xs sm:text-sm text-foreground">
            <legend className="sr-only">Valitse evästeet</legend>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked disabled className="mt-0.5" />
              <span>Välttämättömät: ostoskori ja kassa</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-0.5" />
              <span>Analytiikka: Google Analytics, kävijämäärät ja ostopolku</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5" />
              <span>Markkinointi: Google-asiakasarvostelujen merkki ja kysely</span>
            </label>
          </fieldset>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => choose({ analytics: true, marketing: true })} className="flex-1 h-9 bg-primary text-primary-foreground font-bold">
            Hyväksy kaikki
          </Button>
          <Button size="sm" onClick={() => choose({ analytics: false, marketing: false })} variant="outline" className="flex-1 h-9 border-border text-foreground">
            Vain välttämättömät
          </Button>
          {details ? (
            <Button size="sm" onClick={() => choose({ analytics, marketing })} variant="outline" className="basis-full h-9 border-border text-foreground">
              Tallenna valinnat
            </Button>
          ) : (
            <button type="button" onClick={() => setDetails(true)} className="basis-full text-xs text-muted-foreground underline">
              Valitse itse
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
