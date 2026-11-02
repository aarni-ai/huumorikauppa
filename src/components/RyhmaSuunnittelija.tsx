import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RyhmaMockup } from "@/components/RyhmaMockup";
import { lataaLogo, VARIKOODIT } from "@/components/LogoEditori";
import { ryhmaKutsu, hallintaPolku, jasenPolku, euro } from "@/lib/ryhmatilaus";
import { RYHMA_PORTAAT, RYHMA_SAANNOT, type RyhmaSivu } from "@/data/ryhmapaidat";
import {
  RYHMA_VARIT, RYHMA_MIN_KPL, RYHMA_MAX_KPL, RYHMA_NIMI_MAX, SELKA_NIMI_MAX, tarkistaDesign, tarkistaJasen, kappalehinta,
} from "../../api/_lib/ryhmatilaus.js";

type Logo = { id: string; nimi: string; leveys: number; korkeus: number; huomio: string | null } | null;

/** Kopioi -painike linkille. */
export function KopioiLinkki({ url, nimi }: { url: string; nimi: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="flex gap-2 items-center">
      <Input readOnly value={url} aria-label={nimi} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
      <Button type="button" variant="outline" onClick={() => { navigator.clipboard?.writeText(url).then(() => setOk(true)).catch(() => {}); }} aria-label={`Kopioi ${nimi}`}>
        <Copy className="h-4 w-4 mr-1" aria-hidden="true" />{ok ? "Kopioitu" : "Kopioi"}
      </Button>
    </div>
  );
}

/** Hintaportaat taulukkona. */
export function Hintataulukko() {
  return (
    <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
      <thead className="bg-muted text-foreground"><tr><th className="text-left p-2">Paitoja</th><th className="text-right p-2">S-2XL</th><th className="text-right p-2">3XL-5XL</th></tr></thead>
      <tbody>
        {RYHMA_PORTAAT.map((p) => (
          <tr key={p.min} className="border-t border-border"><td className="p-2">{p.teksti}</td><td className="p-2 text-right font-semibold">{p.hintaTeksti}</td><td className="p-2 text-right">{p.isoTeksti}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Ryhmäpaidan suunnittelutyökalu ja ryhmän luonti (/abipaidat, /abipaidat/<kaupunki>, /polttarit, /joukkueet, /yhdistykset): etupuoli
 * (nimi, vuosi, teksti tai logo), väri, esikatselu edestä ja takaa, maksutapa, paitamäärä ja vetäjän tiedot. Luonnin
 * jälkeen näytetään jäsenlinkki ja vetäjän hallintalinkki.
 */
export function RyhmaSuunnittelija({ sivu }: { sivu: Pick<RyhmaSivu, "tyyppi" | "esimerkki" | "takaraja"> }) {
  const [nimi, setNimi] = useState(sivu.esimerkki.nimi);
  const [vuosi, setVuosi] = useState(sivu.esimerkki.vuosi);
  const [teksti, setTeksti] = useState(sivu.esimerkki.teksti);
  const [logo, setLogo] = useState<Logo>(null);
  const [vari, setVari] = useState("Musta");
  const [selka, setSelka] = useState(sivu.esimerkki.jasenet[0]);
  const [numero, setNumero] = useState(sivu.tyyppi === "joukkue" ? "10" : "");
  const [lataus, setLataus] = useState("");
  const [maksutapa, setMaksutapa] = useState<"jasenet" | "vetaja">("jasenet");
  const [paikat, setPaikat] = useState("15");
  const [vetaja, setVetaja] = useState({ nimi: "", email: "", puhelin: "", osoite: "", postinumero: "", kaupunki: "" });
  const [tila, setTila] = useState<"" | "lahetetaan">("");
  const [virhe, setVirhe] = useState("");
  const [valmis, setValmis] = useState<{ hallinta: string; jasenTunnus: string; sahkoposti: boolean } | null>(null);
  const tiedosto = useRef<HTMLInputElement>(null);

  const design = useMemo(() => ({ nimi, vuosi, teksti, logo: logo?.id ?? null }), [nimi, vuosi, teksti, logo]);
  const d = tarkistaDesign(design);
  const s = tarkistaJasen({ nimi: selka, numero, koko: "M" }, vari);
  const n = Number(paikat);
  const arvioHinta = Number.isInteger(n) && n >= RYHMA_MIN_KPL ? kappalehinta(n, "M") : null;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://huumorikauppa.fi";

  const valitseLogo = async (f: File | undefined) => {
    if (!f) return;
    setLataus("ladataan");
    const r = await lataaLogo(f);
    if (tiedosto.current) tiedosto.current.value = "";
    if (!r.ok) { setLataus(r.virhe); return; }
    setLataus("");
    setLogo(r.logo);
  };

  const luo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVirhe("");
    if (!d.ok) { setVirhe(d.virhe); return; }
    setTila("lahetetaan");
    const r = await ryhmaKutsu<{ hallinta: string; jasenTunnus: string; sahkoposti: boolean }>("ryhma-luo", {
      tyyppi: sivu.tyyppi, design, vari, maksutapa, paikat: n, takaraja: sivu.takaraja ?? null, vetaja,
    });
    setTila("");
    if (!r.ok) { setVirhe(r.error); return; }
    setValmis({ hallinta: r.hallinta, jasenTunnus: r.jasenTunnus, sahkoposti: r.sahkoposti });
  };

  const kentta = (k: keyof typeof vetaja, otsikko: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <Label htmlFor={`ryhma-${k}`}>{otsikko}</Label>
      <Input id={`ryhma-${k}`} value={vetaja[k]} onChange={(e) => setVetaja({ ...vetaja, [k]: e.target.value })} {...props} />
    </div>
  );

  if (valmis) {
    return (
      <section className="rounded-xl border-2 border-primary bg-card p-5 space-y-4" aria-live="polite">
        <h2 className="font-display text-2xl text-foreground">Ryhmä on luotu</h2>
        <div className="space-y-2">
          <p className="font-semibold text-foreground">1. Jakakaa tämä linkki ryhmälle</p>
          <p className="text-sm text-muted-foreground">Jokainen kirjoittaa linkistä oman selkänimensä ja kokonsa{maksutapa === "jasenet" ? " ja maksaa oman paitansa" : ""}.</p>
          <KopioiLinkki url={`${origin}${jasenPolku(valmis.jasenTunnus)}`} nimi="jäsenlinkki" />
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-foreground">2. Tallenna oma hallintalinkkisi</p>
          <p className="text-sm text-muted-foreground">
            Hallintasivulla näet kokotaulukon ja maksut ja lukitset tilauksen. Älä jaa tätä linkkiä.
            {valmis.sahkoposti ? " Lähetimme linkit myös sähköpostiisi." : " Tallenna linkki nyt, sillä se näytetään vain tässä."}
          </p>
          <KopioiLinkki url={`${origin}${hallintaPolku(valmis.hallinta)}`} nimi="hallintalinkki" />
        </div>
        <Button asChild><Link to={hallintaPolku(valmis.hallinta)}>Avaa hallintasivu</Link></Button>
      </section>
    );
  }

  return (
    <form onSubmit={luo} className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Ryhmäpaidan suunnittelu">
      <div className="space-y-4">
        <RyhmaMockup design={d.ok ? d : { nimi: "" }} selka={s.ok ? s : null} vari={vari} />
        {!d.ok && <p className="text-sm text-destructive" role="alert">{d.virhe}</p>}
        {!s.ok && selka && <p className="text-sm text-destructive" role="alert">Selkä: {s.virhe}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ryhma-selka">Esimerkkinimi selkään</Label>
            <Input id="ryhma-selka" value={selka} maxLength={SELKA_NIMI_MAX} onChange={(e) => setSelka(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ryhma-numero">Numero (valinnainen)</Label>
            <Input id="ryhma-numero" inputMode="numeric" value={numero} maxLength={2} onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Jokainen jäsen kirjoittaa oman nimensä ja kokonsa jaetusta linkistä. Tämä nimi näyttää, miltä selkä näyttää.</p>
        <Hintataulukko />
      </div>

      <div className="space-y-4">
        <fieldset className="space-y-3">
          <legend className="font-display text-xl text-foreground mb-1">1. Etupuoli</legend>
          <div>
            <Label htmlFor="ryhma-nimi">Ryhmän nimi</Label>
            <Input id="ryhma-nimi" value={nimi} maxLength={RYHMA_NIMI_MAX} onChange={(e) => setNimi(e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="ryhma-vuosi">Vuosiluku</Label>
              <Input id="ryhma-vuosi" inputMode="numeric" value={vuosi} maxLength={4} onChange={(e) => setVuosi(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="ryhma-teksti">Oma teksti (valinnainen)</Label>
              <Input id="ryhma-teksti" value={teksti} maxLength={28} onChange={(e) => setTeksti(e.target.value)} />
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-foreground block mb-1">Logo (valinnainen, PNG tai SVG)</span>
            {logo ? (
              <div className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm">
                <span className="min-w-0 break-words">{logo.nimi} <span className="text-muted-foreground">({logo.leveys} x {logo.korkeus} px)</span></span>
                <button type="button" onClick={() => setLogo(null)} className="text-muted-foreground hover:text-destructive p-0.5" aria-label="Poista logo"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <label htmlFor="ryhma-logo" className="flex items-center justify-center gap-2 h-11 rounded-md border border-dashed border-border bg-muted text-sm cursor-pointer hover:border-primary">
                {lataus === "ladataan" ? <><Loader2 className="h-4 w-4 animate-spin" /> Tarkistetaan logoa...</> : <><Upload className="h-4 w-4" /> Valitse logotiedosto</>}
              </label>
            )}
            <input id="ryhma-logo" ref={tiedosto} type="file" accept=".png,.svg,image/png,image/svg+xml" className="sr-only" onChange={(e) => valitseLogo(e.target.files?.[0])} />
            {lataus && lataus !== "ladataan" && <p className="text-sm text-destructive mt-1" role="alert">{lataus}</p>}
            {logo?.huomio && <p className="text-xs text-muted-foreground mt-1">{logo.huomio}</p>}
            {logo && <p className="text-xs text-muted-foreground mt-1">Logon kanssa ryhmän nimi ja teksti painetaan logon alle.</p>}
          </div>
          <div>
            <span className="text-sm font-medium text-foreground block mb-1">Paidan väri</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Paidan väri">
              {(RYHMA_VARIT as string[]).map((v) => (
                <button key={v} type="button" role="radio" aria-checked={vari === v} onClick={() => setVari(v)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${vari === v ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
                  <span className="h-4 w-4 rounded-full border border-border" style={{ background: VARIKOODIT[v] }} aria-hidden="true" />{v}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-display text-xl text-foreground mb-1">2. Maksu ja paitamäärä</legend>
          <div className="space-y-2" role="radiogroup" aria-label="Maksutapa">
            {([["jasenet", "Jokainen maksaa oman paitansa jaetusta linkistä"], ["vetaja", "Vetäjä maksaa kaikki paidat kerralla"]] as const).map(([k, t]) => (
              <label key={k} className={`flex items-start gap-2 rounded-lg border p-3 cursor-pointer ${maksutapa === k ? "border-primary" : "border-border"}`}>
                <input type="radio" name="maksutapa" checked={maksutapa === k} onChange={() => setMaksutapa(k)} className="mt-1" />
                <span className="text-sm text-foreground">{t}</span>
              </label>
            ))}
          </div>
          <div>
            <Label htmlFor="ryhma-paikat">Montako paitaa ({RYHMA_MIN_KPL}-{RYHMA_MAX_KPL})</Label>
            <Input id="ryhma-paikat" inputMode="numeric" value={paikat} onChange={(e) => setPaikat(e.target.value.replace(/\D/g, ""))} />
            <p className="text-xs text-muted-foreground mt-1">
              Kokotaulukossa on näin monta riviä. {arvioHinta ? `${n} paidan hinta on ${euro(arvioHinta)} kappaleelta (S-2XL).` : ""} Määrää voi muuttaa ennen lukitusta.
            </p>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            {RYHMA_SAANNOT.map((t) => <li key={t} className="flex gap-2"><span className="text-primary" aria-hidden="true">•</span><span>{t}</span></li>)}
          </ul>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-display text-xl text-foreground mb-1">3. Vetäjä ja toimitusosoite</legend>
          <p className="text-sm text-muted-foreground">Kaikki paidat toimitetaan vetäjälle. Jäsenet eivät näe näitä tietoja.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {kentta("nimi", "Nimi", { required: true, autoComplete: "name" })}
            {kentta("email", "Sähköposti", { required: true, type: "email", autoComplete: "email" })}
            {kentta("puhelin", "Puhelin (toimitusta varten)", { type: "tel", autoComplete: "tel" })}
            {kentta("osoite", "Katuosoite", { required: true, autoComplete: "street-address" })}
            {kentta("postinumero", "Postinumero", { required: true, inputMode: "numeric", maxLength: 5, autoComplete: "postal-code" })}
            {kentta("kaupunki", "Postitoimipaikka", { required: true, autoComplete: "address-level2" })}
          </div>
          <p className="text-xs text-muted-foreground">Tietojen käsittely: <Link to="/tietosuojakaytanto" className="underline">tietosuojaseloste</Link>.</p>
        </fieldset>

        {virhe && <p className="text-sm text-destructive" role="alert">{virhe}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={tila === "lahetetaan" || !d.ok}>
          {tila === "lahetetaan" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Luodaan ryhmää...</> : "Luo ryhmä ja jäsenlinkki"}
        </Button>
        <p className="text-xs text-muted-foreground">Ryhmän luonti ei maksa mitään. Maksut tehdään, kun jäsenet maksavat paitansa tai kun vetäjä lukitsee tilauksen.</p>
      </div>
    </form>
  );
}

export default RyhmaSuunnittelija;
