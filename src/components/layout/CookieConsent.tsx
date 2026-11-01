import { useState, useEffect, useRef } from "react";
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

  // Palkin korkeus muuttujaan --hk-evaste: mobiilin kiinteät ostopalkit (ProductPage, CartPage) nousevat sen
  // yläpuolelle CSS:n translate-ominaisuudella (ei asettelumuutosta, CLS 0), ja sivun alaosa saa saman verran tilaa.
  const palkki = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const juuri = document.documentElement;
    const el = palkki.current;
    if (!show || !el) return;
    const aseta = () => {
      const h = `${Math.ceil(el.getBoundingClientRect().height)}px`;
      juuri.style.setProperty("--hk-evaste", h);
      document.body.style.paddingBottom = h;
    };
    aseta();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(aseta) : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      juuri.style.removeProperty("--hk-evaste");
      document.body.style.paddingBottom = "";
    };
  }, [show, details]);

  const choose = (choice: ConsentChoice) => {
    saveConsent(choice);
    setShow(false);
    setDetails(false);
  };

  if (!show) return null;

  // Ei peittävää taustaa eikä modaalia: sivu (hinta, koko, Lisää koriin) pysyy käytettävänä. Matala palkki alareunassa
  // (2.11.2026: ylälaidan palkki peitti ostoskorin sulkemispainikkeen). Kiinteä sijainti, joten sisältö ei siirry (CLS 0).
  // z-45: mobiilin ostopalkkien (z-40) päällä, ostoskorin paneelin ja dialogien (z-50) alla, joten niiden painikkeet
  // jäävät aina näkyviin. Hyväksy ja Vain välttämättömät ovat samankokoiset ja samannäköiset.
  const painike = "h-9 flex-1 sm:flex-none sm:min-w-[11rem] border-border text-foreground font-semibold";
  return (
    <div
      ref={palkki}
      role="region"
      aria-label="Evästeasetukset"
      className="fixed inset-x-0 bottom-0 z-[45] border-t border-border bg-card shadow-[0_-4px_16px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="container py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-xs sm:text-sm text-muted-foreground leading-snug sm:flex-1">
          Käytämme välttämättömiä evästeitä kaupan toimintaan. Analytiikka- ja markkinointievästeet vain suostumuksellasi.{" "}
          <a href="/tietosuojakaytanto" className="text-primary underline font-medium">
            Lue lisää
          </a>
          {!details && (
            <>
              {" · "}
              <button type="button" onClick={() => setDetails(true)} className="underline">
                Valitse itse
              </button>
            </>
          )}
        </p>
        {details && (
          <fieldset className="flex flex-col gap-1 text-xs sm:text-sm text-foreground">
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
        <div className="flex gap-2">
          {details ? (
            <Button size="sm" variant="outline" onClick={() => choose({ analytics, marketing })} className={painike}>
              Tallenna valinnat
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => choose({ analytics: true, marketing: true })} className={painike}>
                Hyväksy
              </Button>
              <Button size="sm" variant="outline" onClick={() => choose({ analytics: false, marketing: false })} className={painike}>
                Vain välttämättömät
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
