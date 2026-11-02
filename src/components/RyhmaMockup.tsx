import { useMemo } from "react";
import { etuSvg, selkaSvg, logoEtuRivit, PAINOALUE } from "../../api/_lib/ryhmatilaus.js";
import { TUOTEVARIT } from "./PersonoituMockup";

export type RyhmaDesign = { nimi: string; vuosi?: string | null; teksti?: string | null; logo?: string | null };
export type Selka = { nimi: string; numero?: string | null };

/** Painoalue mockupin koordinaateissa (viewBox 1000 x 1100), sama kuin personoidussa t-paidassa. */
const ALUE = { x: 330, y: 200, w: 340 };
const KORKEUS = (ALUE.w * PAINOALUE.korkeus) / PAINOALUE.leveys;

/** Logon kanssa etupuoli on logopaidan esikatselukuva (api/painokuva.js, sama kuva kuin painossa). */
// eslint-disable-next-line react-refresh/only-export-components
export function logoEsikatseluUrl(d: RyhmaDesign, vari: string): string | null {
  if (!d.logo) return null;
  const q = new URLSearchParams({ logopaita: "1", vari, logo: d.logo });
  logoEtuRivit(d).forEach((r: string, i: number) => q.set(`r${i + 1}`, r));
  return `/api/painokuva?${q}`;
}

function Paita({ vari, children, takaa = false, nimi }: { vari: string; children: React.ReactNode; takaa?: boolean; nimi: string }) {
  const tayte = TUOTEVARIT[vari] ?? TUOTEVARIT.Musta;
  const reuna = vari === "Valkoinen" ? "#d4d4d0" : "rgba(0,0,0,0.25)";
  return (
    <svg viewBox="0 0 1000 1100" className="w-full h-auto" role="img" aria-label={nimi}>
      <g fill={tayte} stroke={reuna} strokeWidth="4" strokeLinejoin="round">
        <path d="M370,70 L250,110 L60,260 L150,420 L240,360 L240,1060 L760,1060 L760,360 L850,420 L940,260 L750,110 L630,70 Q500,170 370,70 Z" />
        <path d={takaa ? "M370,70 Q500,110 630,70" : "M370,70 Q500,190 630,70"} fill="none" />
      </g>
      {children}
    </svg>
  );
}

/** Sisäkkäinen <svg> painoalueelle, jotta sivun Anton-fontti on käytössä esikatselussa. */
const sijoita = (svg: string) => svg.replace(/^<svg [^>]*?width="\d+" height="\d+"/, `<svg x="${ALUE.x}" y="${ALUE.y}" width="${ALUE.w}" height="${KORKEUS}" preserveAspectRatio="xMidYMin meet"`);

/**
 * Ryhmäpaidan esikatselu edestä ja takaa: etupuolella ryhmän nimi, vuosi ja teksti (tai logo), selässä jäsenen nimi.
 * Tekstit samasta asettelusta kuin painokuva (api/_lib/ryhmatilaus.js etuSvg ja selkaSvg).
 */
export function RyhmaMockup({ design, selka, vari, className = "" }: { design: RyhmaDesign; selka: Selka | null; vari: string; className?: string }) {
  const fontti = "Anton, Impact, sans-serif";
  const etu = useMemo(() => (design.nimi && !design.logo ? sijoita(etuSvg(design, vari, { fontti })) : null), [design, vari]);
  const taka = useMemo(() => (selka?.nimi ? sijoita(selkaSvg(selka, vari, { fontti })) : null), [selka, vari]);
  const logoUrl = logoEsikatseluUrl(design, vari);
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      <figure className="rounded-xl border border-border bg-muted/40 p-2">
        <Paita vari={vari} nimi={`Esikatselu edestä: ${design.nimi || "ryhmän nimi"}`}>
          {etu && <g dangerouslySetInnerHTML={{ __html: etu }} />}
          {logoUrl && <image href={logoUrl} x={ALUE.x} y={ALUE.y} width={ALUE.w} height={KORKEUS} preserveAspectRatio="xMidYMin meet" />}
        </Paita>
        <figcaption className="text-center text-xs text-muted-foreground">Edestä</figcaption>
      </figure>
      <figure className="rounded-xl border border-border bg-muted/40 p-2">
        <Paita vari={vari} takaa nimi={`Esikatselu takaa: ${selka?.nimi || "jäsenen nimi"}`}>
          {taka && <g dangerouslySetInnerHTML={{ __html: taka }} />}
        </Paita>
        <figcaption className="text-center text-xs text-muted-foreground">Takaa</figcaption>
      </figure>
    </div>
  );
}

export default RyhmaMockup;
