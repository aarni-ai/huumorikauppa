import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { SUOSTUMUS_UUTISKIRJE } from "../../api/_lib/vakiot.js";
import { UUTISKIRJE_LAATIKKO_LUOKKA, UUTISKIRJE_OTSIKKO, UUTISKIRJE_TEKSTI } from "./newsletterBoxShell";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Kevyt uutiskirjeen tilauslaatikko etusivulle ja blogiartikkeleihin. Sama tausta ja suostumusteksti kuin
 * NewsletterPopupissa (/api/sahkoposti, SUOSTUMUS_UUTISKIRJE): suostumus annetaan erillisellä valintaruudulla,
 * jota ei ole valittu valmiiksi. Ei alennuskoodia. Natiivi valintaruutu ja lomake, ei raskaita riippuvuuksia.
 * Sivut lataavat tämän laiskasti; varattu korkeus (newsletterBoxShell.ts) estää asettelun siirtymän.
 */
export function NewsletterBox({ lahde }: { lahde: string }) {
  const [email, setEmail] = useState("");
  const [suostumus, setSuostumus] = useState(false);
  const [lahettaa, setLahettaa] = useState(false);
  const [valmis, setValmis] = useState(false);
  const [virhe, setVirhe] = useState("");
  const id = `uutiskirje-${lahde}`;

  const tilaa = async (e: FormEvent) => {
    e.preventDefault();
    const osoite = email.trim().toLowerCase();
    if (!EMAIL_RE.test(osoite)) {
      setVirhe("Tarkista sähköpostiosoite.");
      return;
    }
    if (!suostumus) {
      setVirhe("Hyväksy uutiskirjeen tilaus valintaruudulla.");
      return;
    }
    setVirhe("");
    setLahettaa(true);
    try {
      const vastaus = await fetch("/api/sahkoposti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tilaa", email: osoite, suostumus: true, lahde }),
      });
      const data = await vastaus.json().catch(() => null);
      if (!vastaus.ok || !data?.ok) throw new Error(data?.error || "Tilaus epäonnistui.");
      setValmis(true);
    } catch (err) {
      setVirhe(err instanceof Error && err.message ? err.message : "Tilaus epäonnistui.");
    } finally {
      setLahettaa(false);
    }
  };

  return (
    <section aria-labelledby={`${id}-otsikko`} className={UUTISKIRJE_LAATIKKO_LUOKKA}>
      <h2 id={`${id}-otsikko`} className="font-display text-xl md:text-2xl text-foreground mb-2">
        {UUTISKIRJE_OTSIKKO}
      </h2>
      <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{UUTISKIRJE_TEKSTI}</p>
      {valmis ? (
        <p role="status" className="text-foreground font-semibold">
          Kiitos! Tilaus on vastaanotettu. Lähetimme vahvistuksen sähköpostiisi.
        </p>
      ) : (
        <form onSubmit={tilaa} noValidate className="space-y-3 max-w-sm mx-auto text-left">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              name="email"
              autoComplete="email"
              aria-label="Sähköpostiosoite"
              placeholder="anna@sahkoposti.fi"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              disabled={!suostumus || lahettaa}
              className="h-11 px-6 shrink-0 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tilaa uutiskirje
            </button>
          </div>
          <div className="flex items-start gap-2">
            <input
              id={`${id}-suostumus`}
              type="checkbox"
              checked={suostumus}
              onChange={(e) => setSuostumus(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
            />
            <label htmlFor={`${id}-suostumus`} className="text-xs text-muted-foreground leading-snug">
              {SUOSTUMUS_UUTISKIRJE}{" "}
              <Link to="/tietosuojakaytanto" className="underline underline-offset-2 hover:text-foreground">
                Tietosuojakäytäntö
              </Link>
            </label>
          </div>
          {virhe && (
            <p role="alert" className="text-xs text-destructive">
              {virhe}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

export default NewsletterBox;
