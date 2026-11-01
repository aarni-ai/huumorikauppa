import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

type Lahde = { nimi: string; kaynnit: number; osuus: number };
type Kaynnit = { yhteensa: number; paivia: number; ensimmainen: string | null; lahteet: Lahde[]; osiot: Lahde[] };
type Summat = { tilauksia: number; myynti: number; keskiostos: number; kateEnnenProvisioita: number; provisiot: number; kate: number; kuluTiedossa: number };
type Mittarit = {
  paiva: string; kuukausi: string; paivia: number; kulunut: number; jaljella: number;
  tavoite: {
    tavoite: number; kate: number; prosentti: number; matka: number; ennuste: number; ennusteTapa: string;
    tarve: { katePaivassa: number; tilauksiaPaivassa: number | null; kaynteja_paivassa: number | null; jaljellaKatePaivassa: number; jaljellaTilauksiaPaivassa: number | null; jaljellaKaynteja_paivassa: number | null };
  };
  kk: Summat; p30: Summat & { katePerTilaus: number | null; katePerTilausLahde: string }; edellinen: Summat & { kuukausi: string };
  kaynnit: { kk: Kaynnit; p30: Kaynnit };
  konversio: { prosentti: number; lahde: string; oma: { prosentti: number | null; kaynteja: number; tilauksia: number; paivia: number; alkaen: string } | null };
  tarjoukset: { kk: number; p30: number; tilat: Record<string, number>; arvoKk: number; kateKk: number };
  kumppanit: { koodi: string; tilauksia: number; myynti: number; provisio: number }[];
};

const eur = (x: number | null | undefined) => (x == null ? "-" : `${x.toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);
const luku = (x: number | null | undefined, d = 0) => (x == null ? "-" : x.toLocaleString("fi-FI", { maximumFractionDigits: d }));

const Kortti = ({ otsikko, arvo, ala }: { otsikko: string; arvo: string; ala?: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{otsikko}</div>
    <div className="font-display text-2xl text-foreground mt-1">{arvo}</div>
    {ala && <div className="text-xs text-muted-foreground mt-1">{ala}</div>}
  </div>
);

const Lista = ({ otsikko, rivit, tyhja }: { otsikko: string; rivit: { nimi: string; arvo: string }[]; tyhja: string }) => (
  <section className="rounded-xl border border-border bg-card p-4">
    <h2 className="font-semibold text-foreground mb-2">{otsikko}</h2>
    {rivit.length === 0 ? <p className="text-sm text-muted-foreground">{tyhja}</p> : (
      <ul className="text-sm divide-y divide-border/60">
        {rivit.map((r) => <li key={r.nimi} className="flex justify-between py-1.5"><span>{r.nimi}</span><span className="font-medium">{r.arvo}</span></li>)}
      </ul>
    )}
  </section>
);

/**
 * /hallinta/mittarit?avain=...: tavoitemittari (api/sahkoposti.js ?mittarit=, api/_lib/mittarit.js). Avain on
 * allekirjoitettu (cron ?tehtava=hallinta-linkki, linkki myös päivän yhteenvetoviestissä); sivu on noindex ja
 * robots.txt:ssä Disallow /hallinta.
 */
const MetricsAdminPage = () => {
  const [params] = useSearchParams();
  const avain = params.get("avain") || "";
  const [m, setM] = useState<Mittarit | null>(null);
  const [virhe, setVirhe] = useState(false);
  useEffect(() => {
    if (!avain) { setVirhe(true); return; }
    fetch(`/api/sahkoposti?mittarit=${encodeURIComponent(avain)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j?.ok ? setM(j) : setVirhe(true)))
      .catch(() => setVirhe(true));
  }, [avain]);

  const t = m?.tavoite;
  return (
    <div className="container py-8 max-w-5xl">
      <SEOHead title="Tavoitemittari | Hallinta" description="Tavoitemittari" noindex={true} />
      <h1 className="font-display text-2xl text-foreground mb-1">Tavoitemittari</h1>
      {m && <p className="text-sm text-muted-foreground mb-5">{m.kuukausi}, päivä {luku(m.kulunut, 1)} / {m.paivia}. Kate = myynti alv 0 miinus Printify, Stripe ja kumppaniprovisiot.</p>}
      {virhe && <p className="text-muted-foreground">Ei pääsyä. Avaa koko hallintalinkki.</p>}
      {!virhe && !m && <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ladataan...</p>}
      {m && t && (
        <div className="space-y-5">
          <section className="rounded-xl border border-primary/40 bg-primary/5 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-display text-3xl text-foreground">{eur(t.kate)} <span className="text-base text-muted-foreground">/ {eur(t.tavoite)}</span></div>
              <div className="text-sm text-muted-foreground">matka tavoitteeseen {eur(t.matka)}</div>
            </div>
            <div className="h-3 rounded-full bg-muted mt-3 overflow-hidden" role="progressbar" aria-valuenow={t.prosentti} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-primary" style={{ width: `${Math.min(100, t.prosentti)}%` }} />
            </div>
            <p className="text-sm mt-2">Ennuste kuun lopulle <strong>{eur(t.ennuste)}</strong> <span className="text-muted-foreground">({t.ennusteTapa})</span></p>
          </section>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kortti otsikko="Tilaukset (kk)" arvo={luku(m.kk.tilauksia)} ala={`30 pv: ${m.p30.tilauksia}`} />
            <Kortti otsikko="Keskiostos (kk)" arvo={eur(m.kk.keskiostos)} ala={`30 pv: ${eur(m.p30.keskiostos)}`} />
            <Kortti otsikko="Käynnit (kk)" arvo={luku(m.kaynnit.kk.yhteensa)} ala={`30 pv: ${luku(m.kaynnit.p30.yhteensa)}${m.kaynnit.p30.ensimmainen ? `, laskuri alkaen ${m.kaynnit.p30.ensimmainen}` : ""}`} />
            <Kortti otsikko="Konversio" arvo={`${luku(m.konversio.prosentti, 2)} %`} ala={m.konversio.lahde} />
          </div>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold text-foreground mb-2">Mitä 3000 € vaatii</h2>
            <p className="text-sm text-muted-foreground mb-3">Kate {eur(m.p30.katePerTilaus)} tilausta kohden ({m.p30.katePerTilausLahde}) ja konversio {luku(m.konversio.prosentti, 2)} % ({m.konversio.lahde}).</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="font-medium">Koko kuukausi tasaisesti</div>
                <div>{eur(t.tarve.katePaivassa)} katetta päivässä</div>
                <div><strong>{luku(t.tarve.tilauksiaPaivassa, 1)}</strong> tilausta päivässä</div>
                <div><strong>{luku(t.tarve.kaynteja_paivassa)}</strong> käyntiä päivässä</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="font-medium">Tämän kuun loppuun ({luku(m.jaljella, 1)} pv)</div>
                <div>{eur(t.tarve.jaljellaKatePaivassa)} katetta päivässä</div>
                <div><strong>{luku(t.tarve.jaljellaTilauksiaPaivassa, 1)}</strong> tilausta päivässä</div>
                <div><strong>{luku(t.tarve.jaljellaKaynteja_paivassa)}</strong> käyntiä päivässä</div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Lista otsikko="Liikenteen lähteet (30 pv)" tyhja="Laskuri kerää vielä käyntejä."
              rivit={m.kaynnit.p30.lahteet.map((l) => ({ nimi: l.nimi, arvo: `${luku(l.kaynnit)} (${luku(l.osuus, 1)} %)` }))} />
            <Lista otsikko="Saapumissivut (30 pv)" tyhja="Laskuri kerää vielä käyntejä."
              rivit={m.kaynnit.p30.osiot.slice(0, 10).map((l) => ({ nimi: l.nimi, arvo: luku(l.kaynnit) }))} />
            <Lista otsikko="Yritysten tarjouspyynnöt" tyhja="-"
              rivit={[{ nimi: "Tässä kuussa", arvo: `${m.tarjoukset.kk} kpl, ${eur(m.tarjoukset.arvoKk)}` }, { nimi: "Kate tarjouksista (kk)", arvo: eur(m.tarjoukset.kateKk) },
                { nimi: "30 päivää", arvo: `${m.tarjoukset.p30} kpl` }, ...Object.entries(m.tarjoukset.tilat).map(([k, n]) => ({ nimi: `  tila ${k}`, arvo: String(n) }))]} />
            <Lista otsikko="Kumppanien myynti (kk)" tyhja="Ei kumppanitilauksia tässä kuussa."
              rivit={m.kumppanit.map((k) => ({ nimi: k.koodi, arvo: `${k.tilauksia} kpl, ${eur(k.myynti)}, provisio ${eur(k.provisio)}` }))} />
          </div>

          <Lista otsikko="Vertailu" tyhja="-" rivit={[
            { nimi: `Tämä kuu (${m.kuukausi})`, arvo: `${m.kk.tilauksia} tilausta, myynti ${eur(m.kk.myynti)}, kate ${eur(m.kk.kate)}` },
            { nimi: "30 päivää", arvo: `${m.p30.tilauksia} tilausta, myynti ${eur(m.p30.myynti)}, kate ${eur(m.p30.kate)}` },
            { nimi: `Edellinen kuukausi (${m.edellinen.kuukausi})`, arvo: `${m.edellinen.tilauksia} tilausta, myynti ${eur(m.edellinen.myynti)}, kate ${eur(m.edellinen.kate)}` },
          ]} />
        </div>
      )}
    </div>
  );
};

export default MetricsAdminPage;
