import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Copy, Download, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

type Video = {
  nro: string; nimi: string; muoto: string; paiva: string; paivaFi: string; aika: string; hook: string; kuvateksti: string; tagit: string[];
  tuote: string; utm: { youtube: string; instagram: string; tiktok: string }; video: string; lataus: string; kansi: string;
};
type Pinni = { slug: string; nimi: string; kuva: string; lataus: string; otsikko: string; kuvaus: string; linkki: string };
type Manifest = { paivitetty: string; julkaisut: string; videot: Video[]; pinterest: Pinni[] };

const MUODOT: Record<string, string> = { perus: "Tuote", pov: "POV", dialogi: "Pariskunta", aanestys: "Äänestys" };

const Kopioi = ({ teksti, nimi }: { teksti: string; nimi: string }) => {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(teksti).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); }).catch(() => undefined); }}
      className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:border-primary" aria-label={`Kopioi ${nimi}`}>
      <Copy className="h-3 w-3" aria-hidden="true" /> {ok ? "Kopioitu" : `Kopioi ${nimi}`}
    </button>
  );
};

/**
 * /hallinta/some?avain=...: somevideot julkaisujärjestyksessä latauslinkkeineen, kuvateksteineen, hashtageineen ja
 * UTM-linkkeineen sekä Pinterest-kuvat (api/sahkoposti.js ?some=, Vercel Blob, scripts/some-blob.mjs). Avain on
 * allekirjoitettu (cron ?tehtava=hallinta-linkki, linkki myös päivän yhteenvetoviestissä); noindex, robots Disallow /hallinta.
 */
const SomeAdminPage = () => {
  const [params] = useSearchParams();
  const avain = params.get("avain") || "";
  const [m, setM] = useState<Manifest | null>(null);
  const [virhe, setVirhe] = useState(false);
  const [tanaan, setTanaan] = useState("");
  useEffect(() => {
    setTanaan(new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date()));
    if (!avain) { setVirhe(true); return; }
    fetch(`/api/sahkoposti?some=${encodeURIComponent(avain)}`).then((r) => (r.ok ? r.json() : null)).then((j) => (j?.ok ? setM(j) : setVirhe(true))).catch(() => setVirhe(true));
  }, [avain]);

  return (
    <div className="container py-8 max-w-4xl">
      <SEOHead title="Somevideot | Hallinta" description="Somevideot" noindex={true} />
      <h1 className="font-display text-2xl text-foreground mb-1">Somevideot ja Pinterest-kuvat</h1>
      {virhe && <p className="text-muted-foreground">Ei pääsyä. Avaa koko hallintalinkki.</p>}
      {!virhe && !m && <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ladataan...</p>}
      {m && (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {m.videot.length} videota, {m.pinterest.length} Pinterest-kuvaa. TikTokissa lisää sovelluksen oma musiikki; videoissa ei ole musiikkia.{" "}
            <a href={`${m.julkaisut}?download=1`} className="text-primary underline">Lataa JULKAISUT.md</a>
          </p>
          <nav className="flex gap-3 text-sm mb-4"><a href="#videot" className="text-primary underline">Videot</a><a href="#pinterest" className="text-primary underline">Pinterest</a></nav>
          <h2 id="videot" className="font-semibold text-lg mb-2">Videot julkaisujärjestyksessä</h2>
          <ol className="space-y-3">
            {m.videot.map((v) => (
              <li key={v.nro} className={`rounded-xl border p-3 flex gap-3 ${v.paiva === tanaan ? "border-primary bg-primary/5" : v.paiva < tanaan ? "border-border opacity-60" : "border-border bg-card"}`}>
                <img src={v.kansi} alt="" width={90} height={160} loading="lazy" className="w-[90px] h-[160px] rounded object-cover shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="text-xs text-muted-foreground">{v.paivaFi} klo {v.aika} · video {v.nro} · {MUODOT[v.muoto] || v.muoto}{v.paiva === tanaan ? " · TÄNÄÄN" : ""}</div>
                  <div className="font-semibold">{v.hook}</div>
                  <p className="text-sm whitespace-pre-wrap break-words">{v.kuvateksti}</p>
                  <div className="flex flex-wrap gap-2">
                    <a href={v.lataus} className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"><Download className="h-3 w-3" aria-hidden="true" /> Lataa video</a>
                    <Kopioi teksti={v.kuvateksti} nimi="kuvateksti" />
                    <Kopioi teksti={v.tagit.join(" ")} nimi="hashtagit" />
                    <Kopioi teksti={v.utm.youtube} nimi="YouTube-linkki" />
                    <Kopioi teksti={v.utm.instagram} nimi="Instagram-linkki" />
                    <Kopioi teksti={v.utm.tiktok} nimi="TikTok-linkki" />
                  </div>
                  <div className="text-xs text-muted-foreground break-all">UTM (YouTube): {v.utm.youtube}</div>
                </div>
              </li>
            ))}
          </ol>
          <h2 id="pinterest" className="font-semibold text-lg mt-8 mb-2">Pinterest-kuvat (1000 x 1500)</h2>
          <p className="text-sm text-muted-foreground mb-3">Pinnin linkki vie tuotesivulle utm_source=pinterest-merkinnällä.</p>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {m.pinterest.map((p) => (
              <li key={p.slug} className="rounded-xl border border-border bg-card p-2 space-y-1.5 text-xs">
                <img src={p.kuva} alt={p.otsikko} width={300} height={450} loading="lazy" className="w-full rounded" />
                <div className="font-semibold text-sm">{p.otsikko}</div>
                <div className="flex flex-wrap gap-1.5">
                  <a href={p.lataus} className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 font-medium text-primary-foreground"><Download className="h-3 w-3" aria-hidden="true" /> Lataa</a>
                  <Kopioi teksti={p.otsikko} nimi="otsikko" />
                  <Kopioi teksti={p.kuvaus} nimi="kuvaus" />
                  <Kopioi teksti={p.linkki} nimi="linkki" />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default SomeAdminPage;
