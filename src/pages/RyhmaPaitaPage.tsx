import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { RyhmaSuunnittelija } from "@/components/RyhmaSuunnittelija";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { buildFaqJsonLd } from "@/seo/structuredData";
import { SITE_URL } from "@/seo/site";
import { RYHMA_SIVUT, RYHMA_POLUT, type RyhmaPolku } from "@/data/ryhmapaidat";
import { ABIKAUPUNKI_LINKIT } from "@/data/abikaupungit";

/** /abipaidat, /polttarit, /joukkueet, /yhdistykset: SEO-teksti, suunnittelutyökalu ja UKK (src/data/ryhmapaidat.ts). */
const RyhmaPaitaPage = () => {
  usePrerenderReady();
  const { pathname } = useLocation();
  const sivu = RYHMA_SIVUT[(RYHMA_POLUT.includes(pathname as RyhmaPolku) ? pathname : "/abipaidat") as RyhmaPolku];
  const canonical = `${SITE_URL}${sivu.path}`;
  const jsonLd = useMemo(() => buildFaqJsonLd(sivu.faqs), [sivu]);

  return (
    <div className="container py-8 md:py-12">
      <SEOHead
        title={sivu.title}
        description={sivu.description}
        canonical={canonical}
        jsonLd={jsonLd}
        breadcrumbs={[{ name: "Etusivu", url: `${SITE_URL}/` }, { name: sivu.name, url: canonical }]}
      />
      <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Etusivu</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{sivu.name}</span>
      </nav>

      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">{sivu.h1}</h1>
      <div className="max-w-3xl space-y-3 text-muted-foreground mb-8">
        {sivu.intro.map((p, i) => <p key={p} className={i === 0 ? "text-lg text-foreground font-medium" : undefined}>{p}</p>)}
      </div>

      <section id="suunnittele" aria-label="Suunnittele ryhmäpaita" className="mb-12 scroll-mt-24">
        <RyhmaSuunnittelija key={sivu.path} sivu={sivu} />
      </section>

      <article className="max-w-3xl space-y-6 text-muted-foreground">
        {sivu.sections.map((s) => (
          <section key={s.heading} className="space-y-3">
            <h2 className="font-display text-2xl text-foreground">{s.heading}</h2>
            {s.paragraphs.map((p) => <p key={p}>{p}</p>)}
            {s.items && (
              <ul className="space-y-2 ml-1">
                {s.items.map((item) => (
                  <li key={item} className="flex items-start gap-2"><span className="text-primary mt-0.5 shrink-0" aria-hidden="true">•</span><span>{item}</span></li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="space-y-3" aria-label="Usein kysyttyä">
          <h2 className="font-display text-2xl text-foreground">Usein kysytyt kysymykset</h2>
          <div className="space-y-3">
            {sivu.faqs.map((f) => (
              <details key={f.q} className="rounded-lg border border-border bg-card p-4">
                <summary className="font-semibold text-foreground cursor-pointer">{f.q}</summary>
                <p className="mt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {sivu.path === "/abipaidat" && (
          <section className="space-y-3">
            <h2 className="font-display text-2xl text-foreground">Abipaidat kaupungeittain</h2>
            <div className="flex flex-wrap gap-2">
              {ABIKAUPUNKI_LINKIT.map((l) => (
                <Link key={l.href} to={l.href} className="inline-flex items-center px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/50">{l.label}</Link>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-foreground">Muut ryhmäpaidat</h2>
          <div className="flex flex-wrap gap-2">
            {RYHMA_POLUT.filter((p) => p !== sivu.path).map((p) => (
              <Link key={p} to={p} className="inline-flex items-center px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/50">{RYHMA_SIVUT[p].name}</Link>
            ))}
            <Link to="/yritykset" className="inline-flex items-center px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/50">Yritysten paidat omalla logolla</Link>
          </div>
        </section>
      </article>
    </div>
  );
};

export default RyhmaPaitaPage;
