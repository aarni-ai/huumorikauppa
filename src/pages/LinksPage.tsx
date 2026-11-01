import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { TPAITAPARI_KAMPANJA } from "../../api/_lib/vakiot.js";
import { linkitSivulla } from "@/data/linkit";

/**
 * /linkit: somen bio-linkki (TikTok, Instagram, YouTube). Kuusi tärkeintä linkkiä; Black Friday näkyy kampanjan
 * alusta (27.11.) loppuun. Saapuminen kirjataan käyntilaskuriin somen utm_source-lähteellä (src/lib/kaynti.ts), ja
 * linkkeihin lisätään sama utm_source, jotta GA4 yhdistää ostot somelähteeseen.
 */
const LinksPage = () => {
  const { search } = useLocation();
  const [paiva, setPaiva] = useState<string | null>(null);
  useEffect(() => setPaiva(new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date())), []);
  const linkit = linkitSivulla(paiva, TPAITAPARI_KAMPANJA, search);
  return (
    <div className="container max-w-md py-10">
      <SEOHead title="Linkit | Huumorikauppa" description="Huumorikaupan tärkeimmät linkit: joululahjat, yrityksille, personoitu paita, suosituimmat ja harrastussarjat." noindex={true} />
      <div className="text-center mb-6">
        <h1 className="font-display text-3xl text-foreground">Huumorikauppa</h1>
        <p className="text-muted-foreground mt-1">Hauskat paidat ja lahjat suomeksi</p>
      </div>
      <ul className="space-y-3">
        {linkit.map((l) => (
          <li key={l.otsikko}>
            <Link to={l.href} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-4 min-h-[56px] transition-colors ${l.korostus ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/60"}`}>
              <span>
                <span className="block font-semibold text-foreground">{l.otsikko}</span>
                <span className="block text-sm text-muted-foreground">{l.kuvaus}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LinksPage;
