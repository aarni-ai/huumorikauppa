import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEOHead } from "@/components/SEOHead";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { SITE_FAQS } from "@/seo/pageFaqs";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";

const faqs = SITE_FAQS;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(f => ({
    "@type": "Question",
    "name": f.q,
    "acceptedAnswer": { "@type": "Answer", "text": f.a }
  }))
};

const FAQ = () => {
  usePrerenderReady();
  return (
    <div className="container py-8 md:py-12 max-w-3xl">
      <SEOHead
        title={STATIC_PAGE_META["/usein-kysytyt-kysymykset"].title}
        description={STATIC_PAGE_META["/usein-kysytyt-kysymykset"].description}
        canonical="https://huumorikauppa.fi/usein-kysytyt-kysymykset"
        jsonLd={faqJsonLd}
        breadcrumbs={[
          { name: "Etusivu", url: "https://huumorikauppa.fi/" },
          { name: "Usein kysytyt kysymykset", url: "https://huumorikauppa.fi/usein-kysytyt-kysymykset" },
        ]}
      />

      <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Etusivu</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Usein kysytyt kysymykset</span>
      </nav>

      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">Usein kysytyt kysymykset</h1>
      <p className="text-muted-foreground mb-8">Vastaukset yleisimpiin kysymyksiin.</p>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4 bg-card">
            <AccordionTrigger className="text-foreground text-left font-medium hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-10 text-center">
        <p className="text-muted-foreground mb-4">Etkö löytänyt vastausta? Ota yhteyttä!</p>
        <p className="text-sm text-muted-foreground">📧 huumorikauppa@gmail.com</p>
      </div>
    </div>
  );
};

export default FAQ;
