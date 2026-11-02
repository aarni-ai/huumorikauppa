import { useMemo } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { PersonoituMockup } from "@/components/PersonoituMockup";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { SITE_URL } from "@/seo/site";
import { buildFaqJsonLd } from "@/seo/structuredData";
import { PERSONOIDUT_FAQS, PERSONOIDUT_INTRO, PERSONOIDUT_MALLIT, PERSONOIDUT_PATH, PERSONOIDUT_HINNAT } from "@/data/personoidutPage";

const meta = STATIC_PAGE_META[PERSONOIDUT_PATH];

/** /personoidut: kaikki personoidut mallit kortteina aiheittain, linkki kunkin mallin personointiin, UKK. */
const PersonoidutPage = () => {
  usePrerenderReady();
  const ryhmat = useMemo(() => {
    const m = new Map<string, typeof PERSONOIDUT_MALLIT>();
    for (const k of PERSONOIDUT_MALLIT) m.set(k.aiheNimi, [...(m.get(k.aiheNimi) ?? []), k]);
    return [...m.entries()];
  }, []);
  const jsonLd = useMemo(() => ({ "@context": "https://schema.org", "@graph": [buildFaqJsonLd(PERSONOIDUT_FAQS)].map(({ ["@context"]: _c, ...r }) => r) }), []);

  return (
    <div className="container py-8 md:py-12">
      <SEOHead
        title={meta.title}
        description={meta.description}
        canonical={`${SITE_URL}${PERSONOIDUT_PATH}`}
        jsonLd={jsonLd}
        breadcrumbs={[{ name: "Etusivu", url: `${SITE_URL}/` }, { name: meta.name, url: `${SITE_URL}${PERSONOIDUT_PATH}` }]}
      />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">{meta.h1}</h1>
      <div className="max-w-3xl space-y-3 text-muted-foreground mb-8">
        {PERSONOIDUT_INTRO.map((p) => <p key={p}>{p}</p>)}
      </div>

      {ryhmat.map(([aihe, mallit]) => (
        <section key={aihe} className="mb-8" aria-label={aihe}>
          <h2 className="font-display text-xl text-foreground mb-3">{aihe}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mallit.map((m) => (
              <Link key={m.id} to={m.polku} className="group rounded-xl border border-border bg-card p-3 hover:border-primary transition-colors">
                <PersonoituMockup pers={{ malli: m.id, ...m.esimerkki }} vari="Musta" className="w-full h-auto mb-2" />
                <span className="block font-display text-base text-foreground group-hover:text-primary">{m.nimi}</span>
                <span className="block text-xs text-muted-foreground">{m.kuvaus}</span>
                <span className="block text-sm font-semibold text-primary mt-1">T-paita {PERSONOIDUT_HINNAT.tpaita}, huppari {PERSONOIDUT_HINNAT.huppari}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="max-w-3xl mt-10" aria-label="Usein kysyttyä">
        <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Usein kysyttyä personoiduista lahjoista</h2>
        <div className="space-y-3">
          {PERSONOIDUT_FAQS.map((f) => (
            <details key={f.q} className="rounded-lg border border-border bg-card p-4">
              <summary className="font-semibold text-foreground cursor-pointer">{f.q}</summary>
              <p className="mt-2 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PersonoidutPage;
