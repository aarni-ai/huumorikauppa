import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Copy, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { poistaAvainOsoitteesta } from "@/lib/hallinta";
import { KUMPPANUUS } from "../../api/_lib/vakiot.js";

type Malli = "provisio" | "alennus";
type Kumppani = {
  koodi: string; nimi: string; email: string | null; malli: Malli; aktiivinen: boolean; created_at: string;
  ensimmainen_kaynti: string | null; klikit: number; ensimmainen_klikki: string | null; tilaukset: number; linkki: string; raportti: string;
};
type Tulos = { rivi: number; nimi: string; koodi?: string; malli?: Malli; email?: string | null; uusi?: boolean; linkki?: string; raportti?: string; virhe?: string };
type Vastaus = { ok: boolean; virhe?: string; virheet?: { rivi: number; virhe: string }[]; tulokset?: Tulos[] };

const MALLIT: Record<Malli, string> = {
  provisio: `Malli 1: provisio ${KUMPPANUUS.provisioProsentti} %`,
  alennus: `Malli 2: ostaja −${KUMPPANUUS.alennusmalli.alennusProsentti} %, kumppani ${KUMPPANUUS.alennusmalli.provisioProsentti} %`,
};
const lyhytMalli = (m?: Malli) => (m === "alennus" ? "2" : m === "provisio" ? "1" : "");
const aika = (s: string | null) => (s ? new Date(s).toLocaleString("fi-FI", { timeZone: "Europe/Helsinki", dateStyle: "short", timeStyle: "short" }) : "");
const pvm = (s: string | null) => (s ? new Date(s).toLocaleDateString("fi-FI", { timeZone: "Europe/Helsinki" }) : "");
const kentta = "h-10 rounded border border-border bg-muted px-3 text-sm";

const Kopioi = ({ teksti, nimi }: { teksti: string; nimi: string }) => {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(teksti).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); }).catch(() => undefined); }}
      className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:border-primary" aria-label={`Kopioi ${nimi}`}>
      <Copy className="h-3 w-3" aria-hidden="true" /> {ok ? "Kopioitu" : `Kopioi ${nimi}`}
    </button>
  );
};

/** Tulostaulukko sarkaimin eroteltuna: liitetään suoraan takaisin Google Sheetiin. */
const tulosTsv = (rivit: Tulos[]) =>
  ["nimi\tkoodi\tmalli\tlinkki\traportti", ...rivit.filter((t) => !t.virhe).map((t) => [t.nimi, t.koodi, lyhytMalli(t.malli), t.linkki, t.raportti].join("\t"))].join("\n");

const Tulokset = ({ rivit, esikatselu }: { rivit: Tulos[]; esikatselu: boolean }) => (
  <div className="space-y-2">
    {!esikatselu && <Kopioi teksti={tulosTsv(rivit)} nimi="taulukko" />}
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-muted-foreground border-b border-border">
          {["Rivi", "Nimi", "Koodi", "Malli", esikatselu ? "Tila" : "/k/-linkki", esikatselu ? "" : "Raportti"].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}
        </tr></thead>
        <tbody>
          {rivit.map((t) => (
            <tr key={`${t.rivi}-${t.koodi || t.nimi}`} className="border-b border-border/60 align-top">
              <td className="py-2 pr-3">{t.rivi}</td>
              <td className="py-2 pr-3">{t.nimi}</td>
              {t.virhe ? <td colSpan={4} className="py-2 text-destructive">{t.virhe}</td> : (
                <>
                  <td className="py-2 pr-3 font-mono">{t.koodi}</td>
                  <td className="py-2 pr-3">{lyhytMalli(t.malli)}</td>
                  {esikatselu ? <td className="py-2 pr-3">{t.uusi ? "uusi" : "päivitetään"}</td> : (
                    <>
                      <td className="py-2 pr-3"><span className="break-all">{t.linkki}</span> {t.linkki && <Kopioi teksti={t.linkki} nimi="linkki" />}</td>
                      <td className="py-2 pr-3">{t.raportti && <Kopioi teksti={t.raportti} nimi="raporttilinkki" />}</td>
                    </>
                  )}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/**
 * /hallinta/kumppanit?avain=... (4.11.2026): Cowork luo kumppanikoodit ja /k/-linkit itse (api/sahkoposti.js
 * ?kumppanit= ja POST "kumppani-luo" / "kumppani-tila", api/_lib/kumppanihallinta.js). Avain on allekirjoitettu
 * (päivän yhteenveto, cron ?tehtava=hallintalinkit-viesti tai aktivointilinkki); noindex, robots Disallow /hallinta.
 */
const PartnerAdminPage = () => {
  const [params] = useSearchParams();
  const avain = params.get("avain") || "";
  const [lista, setLista] = useState<Kumppani[] | null>(null);
  const [eiPaasya, setEiPaasya] = useState(false);
  const [lomake, setLomake] = useState({ nimi: "", koodi: "", malli: "provisio" as Malli, email: "" });
  const [yksi, setYksi] = useState<Vastaus | null>(null);
  const [teksti, setTeksti] = useState("");
  const [esikatselu, setEsikatselu] = useState<Vastaus | null>(null);
  const [massa, setMassa] = useState<Vastaus | null>(null);
  const [kaynnissa, setKaynnissa] = useState(false);

  const lataa = useCallback(() => {
    fetch(`/api/sahkoposti?kumppanit=${encodeURIComponent(avain)}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.ok) { setLista(j.kumppanit); poistaAvainOsoitteesta(); } else setEiPaasya(true); })
      .catch(() => setEiPaasya(true));
  }, [avain]);
  useEffect(() => { lataa(); }, [lataa]);

  const laheta = async (data: Record<string, unknown>): Promise<Vastaus> => {
    setKaynnissa(true);
    try {
      const r = await fetch("/api/sahkoposti", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avain, ...data }) });
      if (r.status === 404) return { ok: false, virhe: "Ei pääsyä. Avaa hallintalinkki uudelleen." };
      return await r.json().catch(() => ({ ok: false, virhe: "Tallennus epäonnistui." }));
    } catch {
      return { ok: false, virhe: "Yhteys katkesi. Yritä uudelleen." };
    } finally {
      setKaynnissa(false);
    }
  };

  const luoYksi = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = await laheta({ action: "kumppani-luo", kumppani: lomake });
    setYksi(v);
    if (v.ok) { setLomake({ nimi: "", koodi: "", malli: lomake.malli, email: "" }); lataa(); }
  };
  const esikatsele = async () => { setMassa(null); setEsikatselu(await laheta({ action: "kumppani-luo", teksti, esikatselu: true })); };
  const luoKaikki = async () => {
    const v = await laheta({ action: "kumppani-luo", teksti });
    setMassa(v);
    if (v.tulokset) { setEsikatselu(null); lataa(); }
  };
  const asetaTila = async (koodi: string, aktiivinen: boolean) => { await laheta({ action: "kumppani-tila", koodi, aktiivinen }); lataa(); };

  const yksiTulos = yksi?.tulokset?.[0];

  return (
    <div className="container py-8 max-w-6xl space-y-10">
      <SEOHead title="Kumppanikoodit | Hallinta" description="Kumppanikoodit" noindex={true} />
      <h1 className="font-display text-2xl text-foreground">Kumppanikoodit</h1>
      {eiPaasya && <p className="text-muted-foreground">Ei pääsyä. Avaa koko hallintalinkki päivän yhteenvetoviestistä.</p>}

      {!eiPaasya && (
        <>
          <section className="space-y-3" aria-labelledby="yksi">
            <h2 id="yksi" className="text-lg font-semibold">Uusi kumppani</h2>
            <form onSubmit={luoYksi} className="grid gap-3 sm:grid-cols-2 max-w-3xl">
              <label className="flex flex-col gap-1 text-sm">Nimi
                <input required value={lomake.nimi} onChange={(e) => setLomake({ ...lomake, nimi: e.target.value })} className={kentta} />
              </label>
              <label className="flex flex-col gap-1 text-sm">Koodi (valinnainen, muuten nimestä)
                <input value={lomake.koodi} onChange={(e) => setLomake({ ...lomake, koodi: e.target.value })} placeholder="esim. antsa" className={`${kentta} font-mono`} />
              </label>
              <fieldset className="flex flex-col gap-1 text-sm">
                <legend className="mb-1">Malli</legend>
                {(Object.keys(MALLIT) as Malli[]).map((m) => (
                  <label key={m} className="flex items-center gap-2">
                    <input type="radio" name="malli" value={m} checked={lomake.malli === m} onChange={() => setLomake({ ...lomake, malli: m })} /> {MALLIT[m]}
                  </label>
                ))}
              </fieldset>
              <label className="flex flex-col gap-1 text-sm">Sähköposti (valinnainen)
                <input type="email" value={lomake.email} onChange={(e) => setLomake({ ...lomake, email: e.target.value })} className={kentta} />
              </label>
              <div><button type="submit" disabled={kaynnissa || !lomake.nimi.trim()} className="h-10 rounded bg-primary px-5 font-medium text-primary-foreground disabled:opacity-50">Luo kumppani</button></div>
            </form>
            {yksi && !yksi.ok && <p className="text-sm text-destructive" role="alert">{yksiTulos?.virhe || yksi.virhe}</p>}
            {yksiTulos && !yksiTulos.virhe && (
              <div className="rounded border border-border p-3 text-sm space-y-2" role="status">
                <p>{yksiTulos.uusi ? "Luotu" : "Päivitetty"}: {yksiTulos.nimi}, koodi <span className="font-mono">{yksiTulos.koodi}</span>, {MALLIT[yksiTulos.malli || "provisio"]}</p>
                <p className="flex flex-wrap items-center gap-2"><span className="font-mono break-all">{yksiTulos.koodi}</span> <Kopioi teksti={yksiTulos.koodi || ""} nimi="koodi" /></p>
                <p className="flex flex-wrap items-center gap-2"><span className="break-all">{yksiTulos.linkki}</span> <Kopioi teksti={yksiTulos.linkki || ""} nimi="linkki" /></p>
                <p className="flex flex-wrap items-center gap-2"><span>Kumppanin raportti</span> <Kopioi teksti={yksiTulos.raportti || ""} nimi="raporttilinkki" /></p>
              </div>
            )}
          </section>

          <section className="space-y-3" aria-labelledby="massa">
            <h2 id="massa" className="text-lg font-semibold">Monta kerralla</h2>
            <p className="text-sm text-muted-foreground">Yksi kumppani per rivi: <span className="font-mono">Nimi; malli</span> tai <span className="font-mono">Nimi; koodi; malli</span>. Malli on 1 tai 2. Sarakkeet voi liittää suoraan Google Sheetistä. Enintään 100 riviä kerralla.</p>
            <textarea value={teksti} onChange={(e) => { setTeksti(e.target.value); setEsikatselu(null); }} rows={8} aria-label="Kumppanirivit"
              placeholder={"Antti Heinonen; 1\nKeisarit ry; keisarit; 2"} className="w-full rounded border border-border bg-muted p-3 font-mono text-sm" />
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={esikatsele} disabled={kaynnissa || !teksti.trim()} className="h-10 rounded border border-border px-5 font-medium disabled:opacity-50">Esikatsele</button>
              <button type="button" onClick={luoKaikki} disabled={kaynnissa || !esikatselu?.ok} className="h-10 rounded bg-primary px-5 font-medium text-primary-foreground disabled:opacity-50">Luo kaikki</button>
              {kaynnissa && <Loader2 className="h-5 w-5 animate-spin self-center" aria-label="Käsitellään" />}
            </div>
            {esikatselu && !esikatselu.ok && (
              <div className="text-sm text-destructive" role="alert">
                <p>{esikatselu.virhe || "Korjaa punaisella merkityt rivit."}</p>
                {esikatselu.virheet?.map((v) => <p key={v.rivi}>Rivi {v.rivi}: {v.virhe}</p>)}
              </div>
            )}
            {esikatselu?.tulokset && <Tulokset rivit={esikatselu.tulokset} esikatselu />}
            {massa && !massa.tulokset && <p className="text-sm text-destructive" role="alert">{massa.virhe}</p>}
            {massa?.tulokset && (
              <div className="space-y-2" role="status">
                <p className="text-sm">Valmis: {massa.tulokset.filter((t) => !t.virhe).length} kumppania. Kopioi taulukko ja liitä se Google Sheetiin.</p>
                <Tulokset rivit={massa.tulokset} esikatselu={false} />
              </div>
            )}
          </section>

          <section className="space-y-3" aria-labelledby="lista">
            <h2 id="lista" className="text-lg font-semibold">Kumppanit</h2>
            {!lista && <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ladataan...</p>}
            {lista && lista.length === 0 && <p className="text-muted-foreground">Ei kumppaneita.</p>}
            {lista && lista.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground border-b border-border">
                    {["Koodi", "Nimi", "Malli", "Luotu", "Ensimmäinen käynti", "Klikit", "Tilaukset", "Linkit", "Tila"].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {lista.map((k) => (
                      <tr key={k.koodi} className={`border-b border-border/60 align-top ${k.aktiivinen ? "" : "opacity-60"}`}>
                        <td className="py-2 pr-3 font-mono">{k.koodi}</td>
                        <td className="py-2 pr-3">{k.nimi}{k.email && <div className="text-xs text-muted-foreground">{k.email}</div>}</td>
                        <td className="py-2 pr-3">{lyhytMalli(k.malli)}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{pvm(k.created_at)}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{k.ensimmainen_kaynti ? aika(k.ensimmainen_kaynti) : <span className="text-muted-foreground">ei vielä</span>}</td>
                        <td className="py-2 pr-3">{k.klikit}</td>
                        <td className="py-2 pr-3">{k.tilaukset}</td>
                        <td className="py-2 pr-3"><div className="flex flex-wrap gap-1"><Kopioi teksti={k.linkki} nimi="linkki" /><Kopioi teksti={k.raportti} nimi="raporttilinkki" /></div></td>
                        <td className="py-2">
                          <span className="mr-2">{k.aktiivinen ? "aktiivinen" : "pois käytöstä"}</span>
                          <button type="button" disabled={kaynnissa} onClick={() => asetaTila(k.koodi, !k.aktiivinen)} className="rounded border border-border px-2 py-1 text-xs hover:border-primary disabled:opacity-50">
                            {k.aktiivinen ? "Poista käytöstä" : "Aktivoi"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default PartnerAdminPage;
