import { Link } from "react-router-dom";
import { PersonoituMockup } from "@/components/PersonoituMockup";
import { MALLIT, mallinPolku } from "../../api/_lib/personoitu.js";
import { HINTA } from "@/data/hintatekstit";

/**
 * Personoitujen lahjojen nosto (2.11.2026): neljä sivun aiheeseen sopivaa mallia esikatselukuvina ja linkki
 * kategoriasivulle /personoidut. Etusivu, lahjasivut (LandingPage, GiftCategoryPage) ja /joulu. Valinta polusta,
 * ei satunnaisuutta (esirenderöity ja hydratoitu sivu näyttää saman).
 */
const SAANNOT: [RegExp, string[]][] = [
  [/pikkujoul|joulu|tonttu/, ["tonttu", "pikkujoulu", "paras-isa", "paras-aiti"]],
  [/isa|isi|iska|faija|mies/, ["paras-isa", "isa-legenda", "saunan-vanhin", "mokkimestari"]],
  [/aiti|aidi|nainen|naise|vaimo/, ["paras-aiti", "aiti-pomo", "mummo", "naimisissa"]],
  [/pappa|vaari|ukki|isoisa/, ["pappa", "saunan-vanhin", "kalastaja", "vuosikerta"]],
  [/mummo|mummi|isoaiti/, ["mummo", "paras-aiti", "vuosikerta", "elakelainen"]],
  [/sauna|loyly/, ["saunan-vanhin", "loylymestari", "mokkimestari", "paras-isa"]],
  [/mokki|kesa/, ["mokkimestari", "saunan-vanhin", "kalastaja", "loylymestari"]],
  [/kala|kalastaj|onki/, ["kalastaja", "mokkimestari", "jahtimestari", "pappa"]],
  [/metsast|jahti|metsa/, ["jahtimestari", "kalastaja", "mokkimestari", "saunan-vanhin"]],
  [/elake|elakk/, ["elakkeella-vuodesta", "elakelainen", "golfari", "mokkimestari"]],
  [/golf/, ["golfari", "elakelainen", "paras-isa", "tyokaveri"]],
  [/tyo|kollega|ammat|yritys/, ["tyokaveri", "amatimies", "elakkeella-vuodesta", "pikkujoulu"]],
  [/haalahj|haat|haapaiva|naimisi|vuosipaiva|parisuh|ystavanpaiva/, ["naimisissa", "paras-aiti", "paras-isa", "vuosikerta"]],
  [/synttar|syntymapaiva|vuotia|\d0v|ika/, ["synttarisankari", "vuosikerta", "kokenut", "takuu"]],
];
const OLETUS = ["paras-isa", "naimisissa", "saunan-vanhin", "elakkeella-vuodesta"];

const perusmuoto = (s: string) => s.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/å/g, "a");

// eslint-disable-next-line react-refresh/only-export-components
export function nostonMallit(polku = "/"): string[] {
  const p = perusmuoto(polku);
  return SAANNOT.find(([r]) => r.test(p))?.[1] ?? OLETUS;
}

export function PersonoidutNosto({ polku = "/", className = "" }: { polku?: string; className?: string }) {
  const mallit = nostonMallit(polku).map((id) => MALLIT.find((m) => m.id === id)).filter(Boolean);
  return (
    <section className={`rounded-xl border border-primary/30 bg-primary/5 p-4 md:p-5 ${className}`} aria-label="Personoidut lahjat">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h2 className="font-display text-lg md:text-xl text-foreground">Saajan nimi paitaan</h2>
        <Link to="/personoidut" className="text-sm text-primary underline">Kaikki personoidut mallit</Link>
      </div>
      <p className="text-sm text-muted-foreground mb-3">Kirjoita nimi, vuosiluku tai ikä ja katso esikatselu. T-paita {HINTA.personoitu}, huppari {HINTA.personoituHuppari}.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {mallit.map((m) => (
          <Link key={m.id} to={mallinPolku(m.id)} className="group rounded-lg border border-border bg-card p-2 hover:border-primary transition-colors">
            <PersonoituMockup pers={{ malli: m.id, ...m.esimerkki }} vari="Musta" className="w-full h-auto" />
            <span className="block text-sm font-semibold text-foreground group-hover:text-primary mt-1">{m.nimi}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default PersonoidutNosto;
