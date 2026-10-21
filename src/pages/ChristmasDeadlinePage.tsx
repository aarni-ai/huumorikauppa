import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { christmasDeadlinePage as page } from "@/data/christmasDeadlinePage";
import { buildFaqJsonLd } from "@/seo/structuredData";
import { SITE_URL } from "@/seo/site";

const ChristmasDeadlinePage = () => {
  usePrerenderReady();
  const canonical = `${SITE_URL}${page.path}`;
  return (
    <div className="container py-8 md:py-12">
      <SEOHead
        title={page.title}
        description={page.description}
        canonical={canonical}
        jsonLd={buildFaqJsonLd(page.faqs)}
        breadcrumbs={[
          { name: "Etusivu", url: `${SITE_URL}/` },
          { name: "Joululahjat", url: `${SITE_URL}/joululahjat` },
          { name: page.name, url: canonical },
        ]}
      />
      <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Etusivu</Link>
        <span className="mx-2">/</span>
        <Link to="/joululahjat" className="hover:text-foreground">Joululahjat</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{page.name}</span>
      </nav>

      <article className="max-w-3xl space-y-6 text-muted-foreground">
        <h1 className="font-display text-3xl md:text-4xl text-foreground">{page.h1}</h1>
        {page.intro.map((p, i) => (
          <p key={i} className={i === 0 ? "text-lg text-foreground font-medium" : undefined}>{p}</p>
        ))}
        {page.sections.map((s) => (
          <section key={s.heading} className="space-y-3">
            <h2 className="font-display text-2xl text-foreground">{s.heading}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ))}
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-foreground">Joululahjaoppaat</h2>
          <div className="flex flex-wrap gap-2">
            {page.links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className="inline-flex items-center px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/50 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-foreground">Usein kysytyt kysymykset</h2>
          <dl className="space-y-4">
            {page.faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-foreground">{f.q}</dt>
                <dd className="mt-1">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </article>
    </div>
  );
};

export default ChristmasDeadlinePage;
