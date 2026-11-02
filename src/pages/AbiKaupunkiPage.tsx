import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { RyhmaSuunnittelija } from "@/components/RyhmaSuunnittelija";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { buildFaqJsonLd } from "@/seo/structuredData";
import { SITE_URL } from "@/seo/site";
import { ABI_PAASIVU, ABI_TYOKALU, abiKaupunkiSivu, type AbiKaupunkiSivu } from "@/data/abikaupungit";
import NotFound from "./NotFound";

const pilleri = "inline-flex items-center px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/50";

/**
 * /abipaidat/<kaupunki> (3.11.2026): kaupungin oma teksti, suunnittelutyökalu (sama kuin /abipaidat), aikataulu ja
 * hinta vakioista, UKK ja linkit lähikaupunkeihin (src/data/abikaupungit). Esirenderöinti: src/seo/prerender/pages.ts.
 */
function KaupunkiSivu({ sivu }: { sivu: AbiKaupunkiSivu }) {
  usePrerenderReady();
  const canonical = `${SITE_URL}${sivu.path}`;
  const jsonLd = useMemo(() => buildFaqJsonLd(sivu.faqs), [sivu]);

  return (
    <div className="container py-8 md:py-12">
      <SEOHead
        title={sivu.title}
        description={sivu.description}
        canonical={canonical}
        jsonLd={jsonLd}
        breadcrumbs={[
          { name: "Etusivu", url: `${SITE_URL}/` },
          { name: "Abipaidat", url: `${SITE_URL}${ABI_PAASIVU.href}` },
          { name: sivu.kaupunki, url: canonical },
        ]}
      />
      <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Etusivu</Link>
        <span className="mx-2">/</span>
        <Link to={ABI_PAASIVU.href} className="hover:text-foreground">Abipaidat</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{sivu.kaupunki}</span>
      </nav>

      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">{sivu.h1}</h1>
      <div className="max-w-3xl space-y-3 text-muted-foreground mb-4">
        {sivu.intro.map((p, i) => <p key={p} className={i === 0 ? "text-lg text-foreground font-medium" : undefined}>{p}</p>)}
      </div>
      <p className="max-w-3xl text-sm text-muted-foreground mb-8">
        Suunnittelutyökalu on alla. Sama työkalu, hinnasto ja kaikki ohjeet ovat myös sivulla{" "}
        <Link to={ABI_TYOKALU.href} className="text-primary hover:underline">{ABI_TYOKALU.label}</Link>.
      </p>

      <section aria-label="Suunnittele abipaita" className="mb-12">
        <RyhmaSuunnittelija key={sivu.path} sivu={sivu.ryhma} />
      </section>

      <article className="max-w-3xl space-y-6 text-muted-foreground">
        {sivu.osiot.map((o) => (
          <section key={o.otsikko} className="space-y-3">
            <h2 className="font-display text-2xl text-foreground">{o.otsikko}</h2>
            {o.teksti.map((p) => <p key={p}>{p}</p>)}
          </section>
        ))}

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-foreground">{sivu.yhteinen.heading}</h2>
          {sivu.yhteinen.paragraphs.map((p) => <p key={p}>{p}</p>)}
        </section>

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

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-foreground">Abipaidat lähikaupungeissa</h2>
          <div className="flex flex-wrap gap-2">
            {sivu.lahellaLinkit.map((l) => <Link key={l.href} to={l.href} className={pilleri}>{l.label}</Link>)}
            <Link to={ABI_PAASIVU.href} className={pilleri}>{ABI_PAASIVU.label}</Link>
          </div>
        </section>
      </article>
    </div>
  );
}

const AbiKaupunkiPage = () => {
  const { kaupunki } = useParams();
  const sivu = abiKaupunkiSivu(kaupunki);
  return sivu ? <KaupunkiSivu sivu={sivu} /> : <NotFound />;
};

export default AbiKaupunkiPage;
