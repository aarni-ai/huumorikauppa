import { useMemo } from "react";
import { painokuvaSvg, PAINOALUEET } from "../../api/_lib/personoitu.js";

/** Tuotteen värit esikatselussa (Printifyn värien sävyt: Black, White, Sport Grey, Navy). */
// eslint-disable-next-line react-refresh/only-export-components
export const TUOTEVARIT: Record<string, string> = { Musta: "#1d1d1d", Valkoinen: "#f5f5f2", Vaaleanharmaa: "#b9bbbd", Tummansininen: "#1f2a44" };

type Pers = { malli: string } & Record<string, unknown>;

/**
 * Personoidun tuotteen esikatselu (2.11.2026): t-paidan tai hupparin siluetti valitulla värillä ja painokuva
 * (painokuvaSvg, sama SVG kuin palvelimen PNG api/painokuva.js) rinnan painoalueella oikeassa kuvasuhteessa.
 * Mallikuvaksi kategoriasivulle ja nostoihin pienennettynä (koko = CSS-leveys).
 */
export function PersonoituMockup({ pers, vari, tuote = "t-paita", className = "" }: { pers: Pers | null; vari: string; tuote?: "t-paita" | "huppari"; className?: string }) {
  const svg = useMemo(() => (pers ? painokuvaSvg(pers, vari, { tuote, fontti: "Anton, Impact, sans-serif" }) : null), [pers, vari, tuote]);
  const tayte = TUOTEVARIT[vari] ?? TUOTEVARIT.Musta;
  const reuna = vari === "Valkoinen" ? "#d4d4d0" : "rgba(0,0,0,0.25)";
  const alue = PAINOALUEET[tuote];
  // Painoalue mockupin koordinaateissa (viewBox 1000 x 1100).
  const p = tuote === "huppari" ? { x: 320, y: 300, w: 360 } : { x: 330, y: 200, w: 340 };
  const h = (p.w * alue.korkeus) / alue.leveys;
  // Sisäkkäinen <svg> (ei <image>-elementtiä), jotta sivun Anton-fontti on käytössä esikatselussa.
  const kuva = svg ? svg.replace(/^<svg [^>]*?width="\d+" height="\d+"/, `<svg x="${p.x}" y="${p.y}" width="${p.w}" height="${h}" preserveAspectRatio="xMidYMin meet"`) : null;
  return (
    <svg viewBox="0 0 1000 1100" className={className} role="img" aria-label={`Esikatselu: ${tuote === "huppari" ? "huppari" : "t-paita"}, väri ${vari.toLowerCase()}`}>
      {tuote === "huppari" ? (
        <g fill={tayte} stroke={reuna} strokeWidth="4" strokeLinejoin="round">
          <path d="M340,150 Q500,-10 660,150 L640,250 Q500,300 360,250 Z" />
          <path d="M340,170 L230,210 L90,560 L80,900 L190,910 L220,600 L240,560 L240,1060 L760,1060 L760,560 L780,600 L810,910 L920,900 L910,560 L770,210 L660,170 Q500,290 340,170 Z" />
          <path d="M360,250 Q500,330 640,250" fill="none" />
          <path d="M330,760 L670,760 L720,960 L280,960 Z" fill="none" />
          <path d="M470,275 L465,340 M530,275 L535,340" fill="none" strokeWidth="6" />
        </g>
      ) : (
        <g fill={tayte} stroke={reuna} strokeWidth="4" strokeLinejoin="round">
          <path d="M370,70 L250,110 L60,260 L150,420 L240,360 L240,1060 L760,1060 L760,360 L850,420 L940,260 L750,110 L630,70 Q500,170 370,70 Z" />
          <path d="M370,70 Q500,190 630,70" fill="none" />
        </g>
      )}
      {kuva && <g dangerouslySetInnerHTML={{ __html: kuva }} />}
    </svg>
  );
}

export default PersonoituMockup;
