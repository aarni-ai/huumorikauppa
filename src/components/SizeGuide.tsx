import { Link } from "react-router-dom";
import { Ruler } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { parseSizeTable } from "@/lib/sizeChart";
import { ORGANIZATION } from "@/seo/site";

/** Vaatteen nimi ohjetekstiin: perusmuoto ja inessiivi. */
const GARMENT: Record<string, { noun: string; inessive: string }> = {
  hupparit: { noun: "huppari", inessive: "hupparissa" },
  bodyt: { noun: "body", inessive: "bodyssa" },
};
const DEFAULT_GARMENT = { noun: "paita", inessive: "paidassa" };

/**
 * Kokoapu vaatteille. Mittataulukko näytetään vain, jos tuotteen oma kuvaus sisältää sen
 * (src/lib/sizeChart.ts); muuten saatavilla olevat koot ja ohje ilman lukuja.
 */
export function SizeGuide({
  category,
  sizes,
  description,
  isCustom,
}: {
  category: string;
  sizes: string[];
  description: string;
  isCustom: boolean;
}) {
  const table = parseSizeTable(description);
  const { noun, inessive } = GARMENT[category] ?? DEFAULT_GARMENT;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="text-xs text-primary underline underline-offset-2 flex items-center gap-1 min-h-[32px]">
          <Ruler className="h-3.5 w-3.5" /> Kokoapu
        </button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Kokoapu</DialogTitle>
          <DialogDescription>Saatavilla olevat koot: {sizes.join(", ")}</DialogDescription>
        </DialogHeader>
        {table ? (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <caption className="text-left text-xs text-muted-foreground pb-2">
                Mitat tuotteen valmistajan kuvauksesta{table.unit ? ` (${table.unit === "cm" ? "cm" : "tuumaa"})` : ""}.
              </caption>
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-2 text-left font-medium">Mitta</th>
                  {table.sizes.map((s) => (
                    <th key={s} className="py-2 px-1 text-left font-medium">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.label} className="border-b border-border/50">
                    <td className="py-2 pr-2 text-foreground">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="py-2 px-1 text-muted-foreground">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="text-foreground font-medium">Näin valitset koon</p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Ota {noun}, joka istuu hyvin sinulle tai lahjan saajalle.</li>
              <li>Mittaa sen leveys kainaloiden kohdalta ja pituus olkasaumasta helmaan.</li>
              <li>
                Kysy tämän tuotteen mitat sähköpostilla{" "}
                <a href={`mailto:${ORGANIZATION.email}`} className="text-primary underline">{ORGANIZATION.email}</a>. Vastaamme 1-2 arkipäivässä.
              </li>
            </ol>
            <p>Jos tiedät vain kokomerkinnän, valitse sama koko kuin saajan omassa hyvin istuvassa {inessive}. Eri valmistajien koot eroavat, joten mittaaminen on tarkempi tapa.</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {isCustom ? (
            <>Personoidulla tuotteella ei ole 14 päivän palautusoikeutta, joten tarkista koko ennen tilausta. </>
          ) : (
            <>Jos koko ei sovi, tuotteella on 14 päivän palautusoikeus. </>
          )}
          <Link to="/palautusehdot" className="text-primary underline">Palautusehdot</Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}
