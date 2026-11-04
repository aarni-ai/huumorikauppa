import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { yrityksetPage, YRITYS_JOULU_TEKSTI } from "@/data/yrityksetPage";
import { laskeTarjous, aikataulu, esimerkkiHinnat, joulutilausLaskuriTeksti, MALLIT, KOOT } from "../../../api/_lib/yritysmyynti.js";
import { TILAUKSEN_MIN_KATE_EUROA } from "../../../api/_lib/vakiot.js";
import { LOGOPAITA_HINTA, LOGOPAITA_MIN_KPL } from "../../../api/_lib/logopaita.js";
import { LogoEditori, logoTarkistus, tallennaLogoValinta, type LogoValinta } from "@/components/LogoEditori";
import { PIKKUJOULU_OLETUSHINNAT, PIKKUJOULU_POLKU } from "@/data/pikkujoulutYrityksetPage";

/**
 * Yritysmyynnin jaetut osat: /yritykset (src/pages/BusinessPage.tsx) ja alakohtaiset sivut /yritykset/<ala>
 * (src/pages/BusinessVerticalPage.tsx, 2.11.2026).
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;
const pvm = (iso: string) => { const [v, k, p] = iso.split("-"); return `${Number(p)}.${Number(k)}.${v}`; };
export type Malli = "meemipaita" | "tpaita" | "logopaita" | "huppari";
type ArvioRivi = { malli: string; nimi: string; kpl: number; yhteensa: number; perKpl: number; alennusProsentti: number; toimitus: number };

/**
 * Yritysten joulutilausten laskuri (takaraja api/_lib/yritysmyynti.js YRITYS_JOULU_TAKARAJA_ISO, Helsingin päivä).
 * Esirenderöinnissä rakennushetken luku, selaimessa päivitetään heti ja tunnin välein. Takarajan jälkeen ei näy.
 */
export function YritysJouluLaskuri({ className = "" }: { className?: string }) {
  const [teksti, setTeksti] = useState(() => joulutilausLaskuriTeksti());
  useEffect(() => {
    setTeksti(joulutilausLaskuriTeksti());
    const id = window.setInterval(() => setTeksti(joulutilausLaskuriTeksti()), 3600e3);
    return () => window.clearInterval(id);
  }, []);
  if (!teksti) return null;
  return (
    <p className={`rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm font-medium text-foreground ${className}`} role="status" data-yritys-laskuri>
      {teksti} (takaraja {YRITYS_JOULU_TEKSTI})
    </p>
  );
}

/**
 * Tarjouspyyntölomake ja laskuri: /api/sahkoposti action "tarjouspyynto" (tallennus kantaan, ilmoitus omistajalle).
 * Hinta lasketaan api/_lib/yritysmyynti.js laskeTarjous; kate lasketaan vain palvelimella (/hallinta/tarjoukset).
 */
export function Tarjouspyynto({ paketti, malli, setMalli, logo, setLogo, ala = "" }: {
  paketti: string; malli: Malli; setMalli: (m: Malli) => void; logo: LogoValinta; setLogo: (v: LogoValinta) => void;
  /** Alakohtaisella sivulla esitäytetty ala (tallennetaan tarjouspyyntöön). */
  ala?: string;
}) {
  const [lomake, setLomake] = useState({ ala, yritys: "", ytunnus: "", nimi: "", email: "", puhelin: "", viesti: "", kotisivu: "", toimituspaiva: "" });
  const [koot, setKoot] = useState<Record<string, string>>({});
  const [maara, setMaara] = useState("");
  const [arvio, setArvio] = useState<ArvioRivi[]>([]);
  const [tila, setTila] = useState<"lomake" | "lahetetaan" | "valmis" | "virhe">("lomake");
  const [virhe, setVirhe] = useState("");
  const aseta = (k: keyof typeof lomake, v: string) => setLomake((l) => ({ ...l, [k]: v }));
  const kootLuvut = useMemo(() => Object.fromEntries(KOOT.map((k) => [k, Number(koot[k]) || 0])), [koot]);
  const laskettu = useMemo(() => laskeTarjous({ malli, koot: kootLuvut }, { minKatePerKpl: TILAUKSEN_MIN_KATE_EUROA }), [malli, kootLuvut]);
  const at = useMemo(() => aikataulu(lomake.toimituspaiva), [lomake.toimituspaiva]);

  const laheta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lomake.yritys.trim() || !lomake.nimi.trim() || !EMAIL_RE.test(lomake.email.trim())) {
      setVirhe("Täytä yritys, nimi ja toimiva sähköpostiosoite.");
      return;
    }
    const lt = logoTarkistus(logo);
    if (malli === "logopaita" && !lt.ok) { setVirhe(lt.virhe); return; }
    setVirhe("");
    setTila("lahetetaan");
    const logoKentat = malli === "logopaita" && lt.ok ? { logo: { id: lt.logo, rivit: lt.rivit, design: lt.design, vari: logo.vari } } : {};
    try {
      const r = await fetch("/api/sahkoposti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tarjouspyynto", ...lomake, paketti, malli, koot: kootLuvut, maara: laskettu?.kpl || Number(maara) || "", ...logoKentat }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok) { setArvio(Array.isArray(j.arvio) ? j.arvio : []); setTila("valmis"); }
      else { setTila("virhe"); setVirhe(j?.error || "Lähetys epäonnistui. Lähetä pyyntö sähköpostilla huumorikauppa@gmail.com."); }
    } catch {
      setTila("virhe");
      setVirhe("Lähetys epäonnistui. Lähetä pyyntö sähköpostilla huumorikauppa@gmail.com.");
    }
  };

  if (tila === "valmis") {
    return (
      <div className="space-y-3" role="status">
        <p className="flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm text-foreground">
          <Check className="h-5 w-5 text-primary shrink-0" aria-hidden="true" /> Kiitos! Tarjouspyyntö on vastaanotettu, ja vastaamme sähköpostiin {lomake.email}.
        </p>
        {arvio.length > 0 && (
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">Hinta-arvio {arvio[0].kpl} kappaleelle</h3>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="font-normal pb-1">Malli</th><th className="font-normal pb-1 text-right">€/kpl</th><th className="font-normal pb-1 text-right">Yhteensä</th></tr></thead>
              <tbody>
                {arvio.map((a) => (
                  <tr key={a.malli} className="border-t border-border">
                    <td className="py-1.5 pr-2">{a.nimi}{a.alennusProsentti ? ` (määräalennus -${a.alennusProsentti} %)` : ""}</td>
                    <td className="py-1.5 text-right whitespace-nowrap">{eur(a.perKpl)}</td>
                    <td className="py-1.5 text-right whitespace-nowrap font-medium">{eur(a.yhteensa)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-2">Hinnat sisältävät ALV:n. Arvio olettaa koot M, L ja XL; koot 3XL ja suuremmat maksavat enemmän. Lopullinen hinta vahvistetaan tarjouksessa.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={laheta} className="space-y-4" autoComplete="on">
      <fieldset className="rounded-lg border border-border p-3 space-y-3">
        <legend className="px-1 text-sm font-medium text-foreground">Laskuri</legend>
        <div>
          <Label htmlFor="ty-malli">Malli</Label>
          <select id="ty-malli" value={malli} onChange={(e) => setMalli(e.target.value as Malli)} className="mt-1 h-10 w-full rounded-md border border-border bg-muted px-2 text-sm">
            {(Object.keys(MALLIT) as Malli[]).map((m) => <option key={m} value={m}>{MALLIT[m].nimi}</option>)}
          </select>
        </div>
        {malli === "logopaita" && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground block">Oma logo tai teksti</span>
            <LogoEditori arvo={logo} setArvo={setLogo} tunniste="ty-logo" />
          </div>
        )}
        <div>
          <span className="text-sm font-medium text-foreground">Määrät koon mukaan</span>
          <div className="mt-1 grid grid-cols-4 sm:grid-cols-8 gap-2">
            {KOOT.map((k) => (
              <label key={k} className="text-xs text-muted-foreground">
                {k}
                <Input inputMode="numeric" value={koot[k] || ""} onChange={(e) => setKoot((x) => ({ ...x, [k]: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) }))}
                  className="bg-muted border-border mt-0.5 h-9 px-2" aria-label={`${k} kpl`} />
              </label>
            ))}
          </div>
        </div>
        {!(laskettu && laskettu.kpl > 0) && (
          <div>
            <Label htmlFor="ty-maara">Kappalemäärä, jos koot eivät ole vielä tiedossa</Label>
            <Input id="ty-maara" inputMode="numeric" value={maara} onChange={(e) => setMaara(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
              placeholder="esim. 25" className="bg-muted border-border mt-1 max-w-[140px]" />
            <p className="text-xs mt-1 text-muted-foreground">Saat hinta-arvion heti lähetyksen jälkeen.</p>
          </div>
        )}
        {laskettu && laskettu.kpl > 0 && (
          <p className="text-sm text-foreground" role="status">
            {laskettu.kpl} kpl: <span className="font-bold text-primary">{eur(laskettu.yhteensa)}</span> ({eur(laskettu.yhteensa / laskettu.kpl)}/kpl
            {laskettu.alennusProsentti ? `, määräalennus -${laskettu.alennusProsentti} %` : ""}{laskettu.toimitus ? `, sis. toimitus ${eur(laskettu.toimitus)}` : ", toimitus ilmainen"}).
          </p>
        )}
        <div>
          <Label htmlFor="ty-paiva">Toivottu toimituspäivä</Label>
          <Input id="ty-paiva" type="date" value={lomake.toimituspaiva} onChange={(e) => aseta("toimituspaiva", e.target.value)} className="bg-muted border-border mt-1 max-w-[200px]" />
          <p className="text-xs mt-1 text-muted-foreground" role="status">
            {at.toivottu
              ? at.ehtii ? <span className="text-primary font-medium">Ehtii: tänään tehty tilaus on perillä viimeistään {pvm(at.perilla)}.</span>
                : <span className="text-destructive">Toivottu päivä on liian aikaisin. Tänään tehty tilaus on perillä viimeistään {pvm(at.perilla)}.</span>
              : at.jouluun ? `Jouluksi: tilaa ja maksa viimeistään ${YRITYS_JOULU_TEKSTI}` : `Toimitus on perillä viimeistään ${pvm(at.perilla)}.`}
          </p>
        </div>
      </fieldset>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ala && (
          <div className="sm:col-span-2">
            <Label htmlFor="ty-ala">Ala</Label>
            <Input id="ty-ala" value={lomake.ala} onChange={(e) => aseta("ala", e.target.value)} maxLength={60} className="bg-muted border-border mt-1" />
          </div>
        )}
        <div>
          <Label htmlFor="ty-yritys">Yritys *</Label>
          <Input id="ty-yritys" autoComplete="organization" value={lomake.yritys} onChange={(e) => aseta("yritys", e.target.value)} maxLength={120} className="bg-muted border-border mt-1" />
        </div>
        <div>
          <Label htmlFor="ty-ytunnus">Y-tunnus</Label>
          <Input id="ty-ytunnus" value={lomake.ytunnus} onChange={(e) => aseta("ytunnus", e.target.value)} maxLength={12} placeholder="1234567-8" className="bg-muted border-border mt-1" />
        </div>
        <div>
          <Label htmlFor="ty-nimi">Yhteyshenkilö *</Label>
          <Input id="ty-nimi" autoComplete="name" value={lomake.nimi} onChange={(e) => aseta("nimi", e.target.value)} maxLength={100} className="bg-muted border-border mt-1" />
        </div>
        <div>
          <Label htmlFor="ty-email">Sähköposti *</Label>
          <Input id="ty-email" type="email" inputMode="email" autoComplete="email" value={lomake.email} onChange={(e) => aseta("email", e.target.value)} maxLength={200} className="bg-muted border-border mt-1" />
        </div>
        <div>
          <Label htmlFor="ty-puhelin">Puhelin</Label>
          <Input id="ty-puhelin" type="tel" inputMode="tel" autoComplete="tel" value={lomake.puhelin} onChange={(e) => aseta("puhelin", e.target.value)} maxLength={40} className="bg-muted border-border mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="ty-viesti">Mitä tarvitsette?</Label>
        <Textarea id="ty-viesti" value={lomake.viesti} onChange={(e) => aseta("viesti", e.target.value)} maxLength={2000} rows={4} placeholder="Esimerkiksi designit, värit ja laskutustiedot" className="bg-muted border-border mt-1" />
      </div>
      {/* Roskapostisuoja: ihmiset eivät näe kenttää. */}
      <input type="text" name="kotisivu" tabIndex={-1} autoComplete="off" value={lomake.kotisivu} onChange={(e) => aseta("kotisivu", e.target.value)} className="hidden" aria-hidden="true" />
      {virhe && <p className="text-sm text-destructive" role="alert">{virhe}</p>}
      <Button type="submit" disabled={tila === "lahetetaan"} className="bg-primary text-primary-foreground font-bold">
        {tila === "lahetetaan" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Lähetetään...</> : "Lähetä tarjouspyyntö"}
      </Button>
      <p className="text-xs text-muted-foreground">Tietoja käytetään vain tarjouspyyntöön vastaamiseen. <Link to="/tietosuojakaytanto" className="underline">Tietosuojakäytäntö</Link></p>
    </form>
  );
}


/** Oma logo tai teksti: editori, porrashinnat ja polut tilaukseen tai tarjouspyyntöön (api/_lib/logopaita.js). */
export function OmaLogo({ logo, setLogo, pyydaTarjous }: { logo: LogoValinta; setLogo: (v: LogoValinta) => void; pyydaTarjous: () => void }) {
  const navigate = useNavigate();
  const hinnat = useMemo(() => esimerkkiHinnat("logopaita"), []);
  const ok = logoTarkistus(logo).ok;
  return (
    <section id="oma-logo" aria-labelledby="oma-logo-otsikko" className="mb-8 rounded-xl border border-primary/40 bg-card p-4 md:p-5 scroll-mt-24">
      <h2 id="oma-logo-otsikko" className="font-display text-xl text-foreground mb-1">Oma logo tai teksti</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Lataa yrityksen logo tai kirjoita teksti ja valitse, tuleeko huumoridesign mukaan. Esikatselu näyttää painatuksen paidan etupuolella.
        T-paita {eur(LOGOPAITA_HINTA)}/kpl, vähintään {LOGOPAITA_MIN_KPL} paitaa, määräalennus kuten muissa t-paidoissa. Painetaan EU:ssa.
      </p>
      <LogoEditori arvo={logo} setArvo={setLogo} tunniste="oma-logo" />
      <ul className="mt-4 grid grid-cols-3 gap-2 text-center">
        {hinnat.map((h) => (
          <li key={h.kpl} className="rounded-lg border border-border p-2">
            <span className="block text-xs text-muted-foreground">{h.kpl} paitaa</span>
            <span className="block font-bold text-foreground">{eur(h.perKpl)}/kpl</span>
            <span className="block text-xs text-muted-foreground">yht. {eur(h.yhteensa)}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground mt-1">Hinnat sisältävät ALV:n ja määräalennuksen, toimitus ilmainen.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" disabled={!ok} onClick={() => { tallennaLogoValinta(logo); navigate("/yritykset/tilaus?logo=1"); }} className="bg-primary text-primary-foreground font-bold">Valitse koot ja tilaa</Button>
        <Button type="button" variant="outline" onClick={pyydaTarjous}>Pyydä tarjous</Button>
      </div>
    </section>
  );
}


/** Määräalennustaulukko t-paidoista (portaat api/_lib/vakiot.js MAARAALENNUS) ja esimerkit 10, 25 ja 50 paidalle. */
export function Maaraalennus() {
  return (
    <section aria-labelledby="portaat" className="mb-8">
      <h2 id="portaat" className="font-display text-xl text-foreground mb-3">Määräalennus t-paidoista</h2>
      <div className="grid grid-cols-3 gap-3">
        {yrityksetPage.portaat.map((p) => (
          <div key={p.teksti} className="rounded-xl border border-primary/40 bg-primary/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">{p.teksti}</p>
            <p className="text-2xl font-bold text-primary">-{p.prosentti} %</p>
          </div>
        ))}
      </div>
      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
        {yrityksetPage.esimerkit.map((e) => (
          <li key={e.kpl}>{e.kpl} t-paitaa: {e.ennen}, määräalennus -{e.prosentti} % = <span className="font-semibold text-foreground">{e.jalkeen}</span>, toimitus ilmainen</li>
        ))}
      </ul>
    </section>
  );
}


/**
 * Nosto pikkujoulupaketteihin (/pikkujoulut-yritykset, api/_lib/pikkujoulut.js): /yritykset, /yritykset/<ala> ja
 * /yritykset/tilaus. Hinta "alkaen" on pakettien oletusvalintojen edullisin paitakohtainen hinta.
 */
export function PikkujouluNosto({ className = "" }: { className?: string }) {
  const alkaen = Math.min(...PIKKUJOULU_OLETUSHINNAT.map((h) => h.perKpl));
  return (
    <aside className={`rounded-xl border border-primary/40 bg-primary/5 p-4 ${className}`} data-pikkujoulu-nosto>
      <p className="font-semibold text-foreground">Valmiit pikkujoulupaketit: 10, 25 tai 50 paitaa</p>
      <p className="text-sm text-muted-foreground mt-1">
        Eri pikkujoulu- ja työpaikkavitsit samassa paketissa, oma kokojakauma ja hinta heti näkyvissä, alkaen {eur(alkaen)}/paita toimitus mukaan lukien.
      </p>
      <Link to={PIKKUJOULU_POLKU} className="mt-2 inline-block text-sm font-medium text-primary underline">Katso pikkujoulupaketit</Link>
    </aside>
  );
}

