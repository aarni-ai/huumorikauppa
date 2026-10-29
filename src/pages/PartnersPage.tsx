import { Link } from "react-router-dom";
import { Handshake } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { kumppanitPage as page } from "@/data/kumppanitPage";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { buildFaqJsonLd } from "@/seo/structuredData";
import { SITE_URL } from "@/seo/site";

const meta = STATIC_PAGE_META["/kumppanit"];

/** /kumppanit: kumppanuusohjelma sisällöntuottajille (sisältö src/data/kumppanitPage.ts). */
const PartnersPage = () => {
  usePrerenderReady();
  const canonical = `${SITE_URL}${page.path}`;
  return (
    <div className="container py-8 md:py-12 max-w-3xl">
      <SEOHead
        title={meta.title}
        description={meta.description}
        canonical={canonical}
        breadcrumbs={[{ name: "Etusivu", url: `${SITE_URL}/` }, { name: meta.name, url: canonical }]}
        jsonLd={buildFaqJsonLd(page.faqs)}
      />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4 flex items-center gap-3">
        <Handshake className="h-8 w-8 text-primary shrink-0" aria-hidden="true" /> {meta.h1}
      </h1>
      <div className="space-y-3 text-muted-foreground mb-6">{page.intro.map((p) => <p key={p}>{p}</p>)}</div>

      <section className="mb-8 rounded-xl border border-primary/40 bg-primary/5 p-4 md:p-5" aria-labelledby="esimerkit">
        <h2 id="esimerkit" className="font-display text-xl text-foreground mb-3">Esimerkkejä provisiosta</h2>
        <ul className="space-y-1.5 text-sm">
          {page.esimerkit.map((e) => (
            <li key={e.kori} className="flex justify-between gap-4"><span className="text-muted-foreground">{e.kori}</span><span className="font-semibold text-foreground whitespace-nowrap">{e.provisio}</span></li>
          ))}
        </ul>
      </section>

      {page.sections.map((s) => (
        <section key={s.heading} className="mb-6">
          <h2 className="font-display text-xl text-foreground mb-2">{s.heading}</h2>
          {"items" in s && s.items && <ul className="list-disc pl-5 space-y-1 text-muted-foreground">{s.items.map((i) => <li key={i}>{i}</li>)}</ul>}
          {"paragraphs" in s && s.paragraphs?.map((p) => <p key={p} className="text-muted-foreground mb-2">{p}</p>)}
        </section>
      ))}

      <a href="mailto:huumorikauppa@gmail.com?subject=Kumppanuus" className="inline-flex items-center min-h-[44px] px-5 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
        Hae kumppaniksi: huumorikauppa@gmail.com
      </a>

      <section className="mt-10">
        <h2 className="font-display text-xl text-foreground mb-3">Usein kysyttyä</h2>
        <div className="space-y-4">
          {page.faqs.map((f) => (
            <div key={f.q}><h3 className="font-medium text-foreground text-sm">{f.q}</h3><p className="text-sm text-muted-foreground mt-1">{f.a}</p></div>
          ))}
        </div>
      </section>
      <p className="mt-8 text-sm"><Link to="/yritykset" className="text-primary underline">Yritysten joululahjat ja tiimipaidat</Link></p>
    </div>
  );
};

export default PartnersPage;
