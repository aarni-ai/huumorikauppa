import { useEffect, useState } from "react";
import type { Review } from "@/lib/productReviews";

/**
 * Tuotteen oikeat arviot: tuotteen tilanneiden asiakkaiden arviot (arviopyyntö varmistetun perillemenon jälkeen),
 * jotka omistaja on julkaissut (reviews.status = 'julkaistu', /api/sahkoposti?arviot=<slug>). Tyhjä, jos arvioita
 * ei ole tai haku epäonnistuu; mitään ei täydennetä.
 */
export function useOikeatArviot(slug: string | undefined): Review[] {
  const [arviot, setArviot] = useState<Review[]>([]);
  useEffect(() => {
    setArviot([]);
    if (!slug) return;
    let peruttu = false;
    fetch(`/api/sahkoposti?arviot=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : { arviot: [] }))
      .then((j: { arviot?: { nimi: string; tahdet: number; teksti: string; pvm: string }[] }) => {
        if (peruttu) return;
        setArviot((j.arviot || []).map((a) => {
          const [v, k, p] = a.pvm.split("-").map(Number);
          return { name: a.nimi, stars: a.tahdet, text: a.teksti, date: `${p}.${k}.${v}` };
        }));
      })
      .catch(() => { /* arviot ovat lisätietoa */ });
    return () => { peruttu = true; };
  }, [slug]);
  return arviot;
}
