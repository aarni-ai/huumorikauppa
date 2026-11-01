import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { poistaAvainOsoitteesta } from "@/lib/hallinta";

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
  liikenne?: Record<"kk" | "p30", { orgaaninen: number; lahjasivut: number; media: number; kumppanisivut: number; kumppanilinkit: number }>;
  konversio: { prosentti: number; lahde: string; oma: { prosentti: number | null; kaynteja: number; tilauksia: number; paivia: number; alkaen: string } | null };
  tarjoukset: { kk: number; p30: number; tilat: Record<string, number>; arvoKk: number; kateKk: number };
  kumppanit: { koodi: string; tilauksia: number; myynti: number; provisio: number }[];
  yritysmyynti: { kk: YSumma; p30: YSumma; paivat: (Record<YKentta, number> & { paiva: string; huom: string | null })[] } | null;
  suppilo?: {
    paivat: (SuppiloRivi & { paiva: string })[];
    yhteensa: SuppiloRivi;
    pudotus: { vaihe: string; jatkoi: number | null; putosi: number | null }[];
    ab: Record<"a" | "b", Omit<SuppiloRivi, "kaynnit">>;
  } | null;
  mainonta?: {
    kulut: number; klikit: number; konversiot: number; tilauksia: number; kustannusPerTilaus: number | null; kateMainonnanJalkeen: number;
    paivat: { paiva: string; kanava: string; kulut: string | number; klikit: number; konversiot: number; huom: string | null }[];
  };
};
type SuppiloRivi = { kaynnit: number; etusivu: number; tuotesivu: number; kori: number; kassa: number; maksu: number; ostot: number; konversio: number | null };
const VAIHE_NIMET: Record<string, string> = { kaynnit: "käynnit", tuotesivu: "tuotesivu", kori: "kori", kassa: "kassa", maksu: "maksu (Stripe)", ostot: "osto" };
type YKentta = "viestit" | "vastaukset" | "tarjouspyynnot" | "tilaukset";
type YSumma = Record<YKentta, number> & { vastausprosentti: number | null; paivia: number };
const Y_KENTAT: { k: YKentta; nimi: string }[] = [
  { k: "viestit", nimi: "Yritysviestejä lähetetty" }, { k: "vastaukset", nimi: "Vastauksia" },
  { k: "tarjouspyynnot", nimi: "Tarjouspyyntöjä" }, { k: "tilaukset", nimi: "Tilauksia" },
];

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

/** Coworkin päivän yritysmyyntiluvut (api/sahkoposti.js action "yritysluvut"); sama päivä uudelleen korvaa luvut. */
const YrityslukuLomake = ({ avain, onTallennettu }: { avain: string; onTallennettu: () => void }) => {
  const tanaan = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  const [arvot, setArvot] = useState<Record<string, string>>({ paiva: tanaan, viestit: "", vastaukset: "", tarjouspyynnot: "", tilaukset: "", huom: "" });
  const [tila, setTila] = useState<string | null>(null);
  const laheta = async (e: React.FormEvent) => {
    e.preventDefault();
    setTila("Tallennetaan...");
    const body = { action: "yritysluvut", avain, paiva: arvot.paiva, huom: arvot.huom, ...Object.fromEntries(Y_KENTAT.map(({ k }) => [k, Number(arvot[k] || 0)])) };
    const j = await fetch("/api/sahkoposti", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);
    setTila(j?.ok ? `Tallennettu ${arvot.paiva}.` : j?.virhe || "Tallennus epäonnistui.");
    if (j?.ok) onTallennettu();
  };
  return (
    <form onSubmit={laheta} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end text-sm" aria-label="Yritysmyynnin päiväluvut">
      <label className="flex flex-col gap-1">Päivä<input type="date" value={arvot.paiva} max={tanaan} onChange={(e) => setArvot({ ...arvot, paiva: e.target.value })} className="h-9 rounded border border-border bg-muted px-2" /></label>
      {Y_KENTAT.map(({ k, nimi }) => (
        <label key={k} className="flex flex-col gap-1">{nimi}<input type="number" min={0} inputMode="numeric" value={arvot[k]} onChange={(e) => setArvot({ ...arvot, [k]: e.target.value })} className="h-9 rounded border border-border bg-muted px-2" /></label>
      ))}
      <button type="submit" className="h-9 rounded bg-primary px-3 font-medium text-primary-foreground">Tallenna</button>
      <label className="col-span-2 md:col-span-6 flex flex-col gap-1">Huomio (valinnainen)<input value={arvot.huom} maxLength={300} onChange={(e) => setArvot({ ...arvot, huom: e.target.value })} className="h-9 rounded border border-border bg-muted px-2" /></label>
      {tila && <p className="col-span-2 md:col-span-6 text-muted-foreground" role="status">{tila}</p>}
    </form>
  );
};

/** Päivän mainoskulut (api/sahkoposti.js action "mainoskulut", api/_lib/mainoskulut.js); sama päivä ja kanava korvaa. */
const MainoskuluLomake = ({ avain, onTallennettu }: { avain: string; onTallennettu: () => void }) => {
  const tanaan = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  const [arvot, setArvot] = useState<Record<string, string>>({ paiva: tanaan, kanava: "google-ads", kulut: "", klikit: "", konversiot: "", huom: "" });
  const [tila, setTila] = useState<string | null>(null);
  const laheta = async (e: React.FormEvent) => {
    e.preventDefault();
    setTila("Tallennetaan...");
    const body = { action: "mainoskulut", avain, paiva: arvot.paiva, kanava: arvot.kanava, kulut: arvot.kulut || "0", klikit: Number(arvot.klikit || 0), konversiot: Number(arvot.konversiot || 0), huom: arvot.huom };
    const j = await fetch("/api/sahkoposti", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);
    setTila(j?.ok ? `Tallennettu ${arvot.paiva} (${arvot.kanava}).` : j?.virhe || "Tallennus epäonnistui.");
    if (j?.ok) onTallennettu();
  };
  const kentta = "h-9 rounded border border-border bg-muted px-2";
  return (
    <form onSubmit={laheta} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end text-sm" aria-label="Mainoskulut">
      <label className="flex flex-col gap-1">Päivä<input type="date" value={arvot.paiva} max={tanaan} onChange={(e) => setArvot({ ...arvot, paiva: e.target.value })} className={kentta} /></label>
      <label className="flex flex-col gap-1">Kanava<select value={arvot.kanava} onChange={(e) => setArvot({ ...arvot, kanava: e.target.value })} className={kentta}>
        {["google-ads", "meta", "tiktok", "pinterest", "muu"].map((k) => <option key={k} value={k}>{k}</option>)}
      </select></label>
      <label className="flex flex-col gap-1">Kulut €<input inputMode="decimal" value={arvot.kulut} onChange={(e) => setArvot({ ...arvot, kulut: e.target.value })} className={kentta} /></label>
      <label className="flex flex-col gap-1">Klikit<input type="number" min={0} value={arvot.klikit} onChange={(e) => setArvot({ ...arvot, klikit: e.target.value })} className={kentta} /></label>
      <label className="flex flex-col gap-1">Konversiot<input type="number" min={0} value={arvot.konversiot} onChange={(e) => setArvot({ ...arvot, konversiot: e.target.value })} className={kentta} /></label>
      <button type="submit" className="h-9 rounded bg-primary px-3 font-medium text-primary-foreground">Tallenna</button>
      {tila && <p className="col-span-2 md:col-span-6 text-muted-foreground" role="status">{tila}</p>}
    </form>
  );
};

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
  const lataa = useCallback(() => {
    fetch(`/api/sahkoposti?mittarit=${encodeURIComponent(avain)}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.ok) { setM(j); poistaAvainOsoitteesta(); } else setVirhe(true); })
      .catch(() => setVirhe(true));
  }, [avain]);
  useEffect(() => { lataa(); }, [lataa]);

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

          {m.liikenne && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kortti otsikko="Hakukoneet (kk)" arvo={luku(m.liikenne.kk.orgaaninen)} ala={`30 pv: ${m.liikenne.p30.orgaaninen}`} />
              <Kortti otsikko="Lahjasivut (kk)" arvo={luku(m.liikenne.kk.lahjasivut)} ala={`30 pv: ${m.liikenne.p30.lahjasivut}`} />
              <Kortti otsikko="Media (kk)" arvo={luku(m.liikenne.kk.media)} ala={`utm_source=media, 30 pv: ${m.liikenne.p30.media}`} />
              <Kortti otsikko="Kumppanisivut (kk)" arvo={luku(m.liikenne.kk.kumppanisivut)} ala={`/k/-sivut; kumppanilinkit ${m.liikenne.kk.kumppanilinkit}`} />
            </div>
          )}

          {m.suppilo && (
            <section className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h2 className="font-semibold text-foreground">Ostosuppilo ja konversio päivittäin (14 pv, oma laskuri)</h2>
              <ul className="text-sm grid gap-1 md:grid-cols-5">
                {m.suppilo.pudotus.map((p) => (
                  <li key={p.vaihe} className="rounded border border-border p-2">
                    <div className="text-xs text-muted-foreground">{p.vaihe.split(" -> ").map((v) => VAIHE_NIMET[v] || v).join(" → ")}</div>
                    <div>jatkoi <strong>{p.jatkoi == null ? "-" : `${luku(p.jatkoi, 1)} %`}</strong>, putosi {p.putosi == null ? "-" : `${luku(p.putosi, 1)} %`}</div>
                  </li>
                ))}
              </ul>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-muted-foreground">{["Päivä", "Käynnit", "Tuotesivu", "Kori", "Kassa", "Maksuun", "Ostot", "Konversio"].map((h) => <th key={h} className="py-1 pr-2 font-medium">{h}</th>)}</tr></thead>
                  <tbody>
                    {m.suppilo.paivat.map((d) => (
                      <tr key={d.paiva} className="border-t border-border/60">
                        <td className="py-1 pr-2">{d.paiva}</td>{[d.kaynnit, d.tuotesivu, d.kori, d.kassa, d.maksu, d.ostot].map((n, i) => <td key={i} className="pr-2">{n}</td>)}
                        <td>{d.konversio == null ? "-" : `${luku(d.konversio, 2)} %`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-sm">
                <div className="font-medium">Etusivun A/B-testi (otsikko)</div>
                {(["a", "b"] as const).map((v) => {
                  const x = m.suppilo!.ab[v];
                  return <div key={v} className="text-muted-foreground">Versio {v.toUpperCase()}: {x.etusivu} näyttöä, {x.tuotesivu} tuotesivulle, {x.kori} koriin, {x.kassa} kassalle, {x.ostot} ostoa{x.konversio != null ? ` (${luku(x.konversio, 2)} % näytöistä)` : ""}</div>;
                })}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Mainonta (kk)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kortti otsikko="Mainoskulut" arvo={eur(m.mainonta?.kulut ?? 0)} ala={`${luku(m.mainonta?.klikit ?? 0)} klikkiä`} />
              <Kortti otsikko="Kustannus per tilaus" arvo={eur(m.mainonta ? m.mainonta.kustannusPerTilaus : 0)} ala={`${m.kk.tilauksia} tilausta tässä kuussa`} />
              <Kortti otsikko="Kate mainosten jälkeen" arvo={eur(m.mainonta?.kateMainonnanJalkeen ?? m.kk.kate)} ala={`kate ${eur(m.kk.kate)}`} />
              <Kortti otsikko="Mainoskonversiot" arvo={luku(m.mainonta?.konversiot ?? 0)} ala="Google Adsin ilmoittamat" />
            </div>
            {!!m.mainonta?.paivat.length && (
              <ul className="text-xs text-muted-foreground">
                {m.mainonta.paivat.map((p) => <li key={`${p.paiva}-${p.kanava}`}>{p.paiva} {p.kanava}: {eur(Number(p.kulut))}, {p.klikit} klikkiä, {p.konversiot} konversiota</li>)}
              </ul>
            )}
            <MainoskuluLomake avain={avain} onTallennettu={lataa} />
          </section>

          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Yritysmyynti: viestejä lähetetty / vastauksia / tarjouspyyntöjä / tilauksia</h2>
            {m.yritysmyynti ? (
              <div className="text-sm space-y-1">
                <div>Tässä kuussa: <strong>{Y_KENTAT.map(({ k }) => m.yritysmyynti!.kk[k]).join(" / ")}</strong>{m.yritysmyynti.kk.vastausprosentti != null ? ` (vastausprosentti ${luku(m.yritysmyynti.kk.vastausprosentti, 1)} %)` : ""}</div>
                <div className="text-muted-foreground">30 päivää: {Y_KENTAT.map(({ k }) => m.yritysmyynti!.p30[k]).join(" / ")}. Lomakkeelta tulleita tarjouspyyntöjä (kanta) tässä kuussa {m.tarjoukset.kk}.</div>
                {m.yritysmyynti.paivat.length > 0 && (
                  <ul className="text-xs text-muted-foreground">
                    {m.yritysmyynti.paivat.map((p) => <li key={p.paiva}>{p.paiva}: {Y_KENTAT.map(({ k }) => p[k]).join(" / ")}{p.huom ? `, ${p.huom}` : ""}</li>)}
                  </ul>
                )}
              </div>
            ) : <p className="text-sm text-muted-foreground">Ei kirjauksia vielä.</p>}
            <YrityslukuLomake avain={avain} onTallennettu={lataa} />
          </section>

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
