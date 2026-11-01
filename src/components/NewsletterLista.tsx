import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ENSITILAUS_ALENNUS_PROSENTTI, SUOSTUMUS_UUTISKIRJE } from "../../api/_lib/vakiot.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LISTA_OTSIKKO = ENSITILAUS_ALENNUS_PROSENTTI > 0
  ? `Liity listalle ja saat ${ENSITILAUS_ALENNUS_PROSENTTI} % ensimmäisestä tilauksesta`
  : "Liity listalle";
export const LISTA_EHDOT = "Koodi toimii kerran, ensimmäisessä tilauksessasi samalla sähköpostiosoitteella. Kassa kertoo heti, jos koodi ei käy valittuihin tuotteisiin.";

/**
 * Kevyt uutiskirjeen tilauslaatikko tuotesivulle ja alatunnisteeseen (2.11.2026). Ei ponnahdusikkunaa: laatikko on
 * sivun omassa kohdassa. Suostumus erillisellä valintaruudulla, jota ei ole valittu valmiiksi (sama teksti
 * tallentuu suostumuksen kanssa, lähteenä lahde ja sivun polku). Ensitilauksen koodi (TERVE-xxxxxx) näytetään heti
 * onnistumisviestissä, koska sähköpostit lähtevät vasta, kun lähetysdomain on vahvistettu (api/_lib/uutiskirje.js).
 * Piilokenttä "kotisivu" on bottiansa. Varattu vähimmäiskorkeus pitää asettelun paikallaan.
 */
export function NewsletterLista({ lahde, tumma = false }: { lahde: "tuotesivu" | "alatunniste"; tumma?: boolean }) {
  const { pathname } = useLocation();
  const [email, setEmail] = useState("");
  const [kotisivu, setKotisivu] = useState("");
  const [suostumus, setSuostumus] = useState(false);
  const [lahettaa, setLahettaa] = useState(false);
  const [valmis, setValmis] = useState<{ koodi: string | null; prosentti: number | null } | null>(null);
  const [virhe, setVirhe] = useState("");
  const id = `lista-${lahde}`;

  const tilaa = async (e: FormEvent) => {
    e.preventDefault();
    const osoite = email.trim().toLowerCase();
    if (!EMAIL_RE.test(osoite)) { setVirhe("Tarkista sähköpostiosoite."); return; }
    if (!suostumus) { setVirhe("Hyväksy uutiskirjeen tilaus valintaruudulla."); return; }
    setVirhe("");
    setLahettaa(true);
    try {
      const vastaus = await fetch("/api/sahkoposti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tilaa", email: osoite, suostumus: true, lahde, polku: pathname, kotisivu }),
      });
      const data = await vastaus.json().catch(() => null);
      if (!vastaus.ok || !data?.ok) throw new Error(data?.error || data?.virhe || "Tilaus epäonnistui.");
      setValmis({ koodi: data.koodi || null, prosentti: data.prosentti || null });
    } catch (err) {
      setVirhe(err instanceof Error && err.message ? err.message : "Tilaus epäonnistui.");
    } finally {
      setLahettaa(false);
    }
  };

  return (
    <section aria-labelledby={`${id}-otsikko`} className={`rounded-xl border border-border ${tumma ? "bg-muted/40" : "bg-card"} p-4 min-h-[188px]`}>
      <h2 id={`${id}-otsikko`} className="font-semibold text-foreground text-sm md:text-base mb-2">{LISTA_OTSIKKO}</h2>
      {valmis ? (
        <div role="status" className="space-y-1 text-sm">
          <p className="font-semibold text-foreground">Kiitos, olet listalla!</p>
          {valmis.koodi ? (
            <>
              <p className="text-muted-foreground">Ensimmäisen tilauksesi koodi ({valmis.prosentti} %):</p>
              <p className="font-mono text-lg font-bold tracking-wider text-foreground select-all">{valmis.koodi}</p>
              <p className="text-xs text-muted-foreground">Kirjoita koodi kassalla kenttään Alennuskoodi. {LISTA_EHDOT}</p>
            </>
          ) : (
            <p className="text-muted-foreground">Kerromme uusista tuotteista ja joulun tilauspäivistä sähköpostilla.</p>
          )}
        </div>
      ) : (
        <form onSubmit={tilaa} noValidate className="space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              name="email"
              autoComplete="email"
              aria-label="Sähköpostiosoite"
              placeholder="anna@sahkoposti.fi"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full min-w-0 rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              disabled={!suostumus || lahettaa}
              className="h-10 px-4 shrink-0 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Liity
            </button>
          </div>
          <input type="text" name="kotisivu" tabIndex={-1} autoComplete="off" aria-hidden="true" value={kotisivu} onChange={(e) => setKotisivu(e.target.value)} className="hidden" />
          <div className="flex items-start gap-2">
            <input id={`${id}-suostumus`} type="checkbox" checked={suostumus} onChange={(e) => setSuostumus(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
            <label htmlFor={`${id}-suostumus`} className="text-xs text-muted-foreground leading-snug">
              {SUOSTUMUS_UUTISKIRJE}{" "}
              <Link to="/tietosuojakaytanto" className="underline underline-offset-2 hover:text-foreground">Tietosuojakäytäntö</Link>
            </label>
          </div>
          {ENSITILAUS_ALENNUS_PROSENTTI > 0 && <p className="text-[11px] text-muted-foreground leading-snug">{LISTA_EHDOT}</p>}
          {virhe && <p role="alert" className="text-xs text-destructive">{virhe}</p>}
        </form>
      )}
    </section>
  );
}

export default NewsletterLista;
