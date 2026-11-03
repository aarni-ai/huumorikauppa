import { Download, FileText, Mail } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { ORGANIZATION } from "@/seo/site";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "@/config/toimitus";
import { MEDIA_LAHJAIDEAT, MEDIA_LAHJAOPAS_PDF } from "@/data/lahjaopasMedia.generated";
import { KUVIEN_KAYTTO } from "@/data/lahjaopasMediaTeksti";

export const LAHJAOPAS_MEDIA_PATH = "/lahjaopas-media";
const hinta = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;
// Sivulla pienennetty kuva (api/img.js, 2.11.2026: LCP 4 s täysikokoisella 1000 x 1500 -kuvalla); latauslinkit alkuperäisiin.
const pieni = (url: string, w: number) => `/api/img?u=${encodeURIComponent(url)}&w=${w}`;

/**
 * /lahjaopas-media (2.11.2026): 20 lahjaideaa toimittajille ja bloggaajille. Pysty- (1000 x 1500) ja vaakakuvat
 * (1500 x 1000) ladattavina, hinnat, lyhyet kuvaukset ja yhteystiedot sekä sama sisältö PDF:nä. Data:
 * src/data/lahjaopasMedia.generated.ts (scripts/lahjaopas-media.mjs, PDF scripts/lahjaopas-media-pdf.mjs).
 * Tuotelinkeissä utm_source=media, joten mediasta tulleet käynnit näkyvät mittarissa.
 */
const MediaGuidePage = () => {
  usePrerenderReady();
  const ryhmat = [...new Set(MEDIA_LAHJAIDEAT.map((i) => i.ryhma))];
  return (
    <div className="container py-8 md:py-12 max-w-5xl">
      <SEOHead
        title="Lahjaopas medialle 2026 | Huumorikauppa"
        description="Huumorikaupan lahjaopas toimittajille ja bloggaajille: 20 hauskaa lahjaideaa, hinnat ja ladattavat pysty- ja vaakakuvat sekä PDF."
        canonical={`https://huumorikauppa.fi${LAHJAOPAS_MEDIA_PATH}`}
      />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-3">Lahjaopas medialle 2026</h1>
      <p className="text-muted-foreground max-w-3xl mb-4">
        20 hauskaa lahjaideaa suomalaisella huumorilla: kymmenen klassikkoa ja kymmenen joulumalliston 2026 mallia. Jokaisesta
        on ladattava pystykuva (1000 x 1500) ja vaakakuva (1500 x 1000).
      </p>
      <p className="font-semibold text-foreground max-w-3xl mb-4">{KUVIEN_KAYTTO}</p>
      <ul className="text-sm text-muted-foreground mb-6 space-y-1">
        <li>Tuotteet painetaan tilauksesta EU:ssa ja toimitetaan Suomeen. Ilmainen toimitus kahdesta tuotteesta tai {ILMAINEN_RAJA_TEKSTI} eurosta, muuten {TOIMITUSMAKSU_TEKSTI} €.</li>
        <li>14 päivän palautusoikeus (ei personoiduilla tuotteilla). Digitaalinen lahjakortti 25, 35 tai 50 € toimitetaan heti.</li>
      </ul>
      <div className="flex flex-wrap gap-3 mb-10">
        {MEDIA_LAHJAOPAS_PDF && (
          <a href={`${MEDIA_LAHJAOPAS_PDF}?download=1`} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">
            <FileText className="h-4 w-4" /> Lataa lahjaopas PDF:nä
          </a>
        )}
        <a href="mailto:huumorikauppa@gmail.com?subject=Lahjaopas%20medialle" className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 font-semibold text-foreground">
          <Mail className="h-4 w-4" /> huumorikauppa@gmail.com
        </a>
      </div>

      {ryhmat.map((ryhma) => (
        <section key={ryhma} className="mb-12" aria-labelledby={`ryhma-${ryhma}`}>
          <h2 id={`ryhma-${ryhma}`} className="font-display text-2xl text-foreground mb-4">{ryhma}</h2>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MEDIA_LAHJAIDEAT.filter((i) => i.ryhma === ryhma).map((i) => {
              const ensimmainen = i.slug === MEDIA_LAHJAIDEAT[0].slug;
              return (
              <li key={i.slug} className="rounded-xl border border-border bg-card overflow-hidden">
                <img
                  src={pieni(i.pysty, 640)}
                  srcSet={`${pieni(i.pysty, 480)} 320w, ${pieni(i.pysty, 640)} 427w, ${pieni(i.pysty, 1200)} 800w`}
                  sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, calc(100vw - 32px)"
                  alt={`${i.nimi}, ${i.tuote.toLowerCase()}`}
                  width={1000}
                  height={1500}
                  loading={ensimmainen ? "eager" : "lazy"}
                  fetchPriority={ensimmainen ? "high" : "auto"}
                  decoding="async"
                  className="w-full aspect-[2/3] object-cover bg-muted"
                />
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-foreground">{i.nimi}</h3>
                  <p className="text-sm text-muted-foreground">{i.tuote} · {hinta(i.hinta)}</p>
                  <p className="text-sm text-muted-foreground">{i.kuvaus}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm pt-1">
                    <a href={`${i.pysty}?download=1`} className="inline-flex items-center gap-1 text-primary underline"><Download className="h-3.5 w-3.5" /> Pystykuva</a>
                    <a href={`${i.vaaka}?download=1`} className="inline-flex items-center gap-1 text-primary underline"><Download className="h-3.5 w-3.5" /> Vaakakuva</a>
                    <a href={i.linkki} className="text-primary underline">Tuotesivu</a>
                  </div>
                </div>
              </li>
              );
            })}
          </ol>
        </section>
      ))}

      <section className="rounded-xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        <h2 className="font-display text-xl text-foreground mb-2">Yhteystiedot</h2>
        <p>{ORGANIZATION.name} ({ORGANIZATION.legalName}), Y-tunnus {ORGANIZATION.legalId}, {ORGANIZATION.postalAddress}.</p>
        <p>Medialle: <a href="mailto:huumorikauppa@gmail.com" className="text-primary underline">huumorikauppa@gmail.com</a>. Lisää kuvia ja tietoja kaupasta: <a href="/media" className="text-primary underline">huumorikauppa.fi/media</a>.</p>
      </section>
    </div>
  );
};

export default MediaGuidePage;
