/**
 * /pikkujoulut-yritykset (4.11.2026): pikkujoulupaketit yrityksille. Sama sisältö React-sivulle
 * (src/pages/PikkujoulutYrityksetPage.tsx) ja esirenderöintiin (src/seo/prerender/pages.ts). Paketit, designit ja
 * hinnat: api/_lib/pikkujoulut.js.
 */
import { PIKKUJOULU_PAKETIT, PIKKUJOULU_POLKU, PIKKUJOULU_KOOT, laskePikkujoulu, oletusValinta, designinNimi } from "../../api/_lib/pikkujoulut.js";
import { LASKU_MAKSUAIKA_PV } from "../../api/_lib/yritysmyynti.js";
import { YRITYS_JOULU_TEKSTI } from "./yrityksetPage";

const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;

export { PIKKUJOULU_POLKU };

/** Pakettien oletushinnat (oletusdesignit ja oletuskokojakauma). */
export const PIKKUJOULU_OLETUSHINNAT = PIKKUJOULU_PAKETIT.map((p) => {
  const h = laskePikkujoulu(oletusValinta(p));
  return { id: p.id, kpl: p.kpl, yhteensa: h.yhteensa, perKpl: h.perKpl, alennusProsentti: h.alennusProsentti, toimitus: h.toimitus };
});

/** Kokojakauma tekstinä, esim. "S 1, M 3, L 3, XL 2, 2XL 1". */
export const kokoTeksti = (koot: Record<string, number>) => PIKKUJOULU_KOOT.filter((k) => koot[k] > 0).map((k) => `${k} ${koot[k]}`).join(", ");

/** Paketin rivi esirenderöintiin ja tekstilistoihin. */
export function pakettiTeksti(id: string): string {
  const p = PIKKUJOULU_PAKETIT.find((x) => x.id === id)!;
  const h = PIKKUJOULU_OLETUSHINNAT.find((x) => x.id === id)!;
  return `${p.kpl} paitaa: ${eur(h.perKpl)}/kpl, yhteensä ${eur(h.yhteensa)}${h.alennusProsentti ? ` (määräalennus -${h.alennusProsentti} %)` : ""}, toimitus ${h.toimitus ? eur(h.toimitus) : "ilmainen"}. Oletuskoot ${kokoTeksti(p.oletusKoot)}. Designit: ${p.designit.map(designinNimi).join(", ")}.`;
}

export const pikkujoulutYrityksetPage = {
  intro: [
    "Valmis paketti tiimin pikkujouluihin: 10, 25 tai 50 t-paitaa, joissa on viidestä kymmeneen eri pikkujoulu-, työpaikka- ja jouluvitsiä. Jokainen saa oman vitsin, ja paidat tulevat yhteen osoitteeseen.",
    `Valitse paketti, vaihda halutessasi designeja ja aseta kokojakauma. Hinta päivittyy heti. Joulua varten tarjouspyyntö ja maksu viimeistään ${YRITYS_JOULU_TEKSTI}.`,
  ],
  hintaehto: "Hinnat sisältävät ALV:n 25,5 % ja toimituksen yhteen osoitteeseen Suomessa. Määräalennus riippuu paketista ja kokojakaumasta; lopullinen hinta vahvistetaan tarjouksessa.",
  maksu: `Tarjouksen jälkeen voitte maksaa kortilla tai laskulla (maksuaika ${LASKU_MAKSUAIKA_PV} päivää, laskuun tarvitaan Y-tunnus). Paidat lähtevät painoon, kun maksu on saapunut.`,
  jako: "Paidat jaetaan valituille designeille mahdollisimman tasan. Jos haluatte toisenlaisen jaon tai tietyt värit, kirjoittakaa siitä viestiin.",
  faqs: [
    {
      q: "Voiko paketin designeja vaihtaa?",
      a: "Voi. Jokaisen designin tilalle voi valita toisen listalta. Paketissa on aina yhtä monta eri designia kuin valmiissa valikoimassa.",
    },
    {
      q: "Miten koot valitaan?",
      a: "Paketissa on valmis kokojakauma, jota voi muuttaa. Kokojen summan pitää olla sama kuin paketin paitamäärä. Koko 3XL on valittavissa, kun mukana on design, josta 3XL on saatavilla.",
    },
    {
      q: "Voiko yrityksen logon tai tekstin lisätä?",
      a: "Kirjoittakaa toive lomakkeen logo- tai tekstikenttään, niin vastaamme tarjouksessa, miten se onnistuu. Pelkän logopaidan voi tilata myös suoraan yrityssivulta.",
    },
    {
      q: "Mihin mennessä pitää tilata?",
      a: `Jotta paidat ovat perillä ennen joulua, tilatkaa ja maksakaa viimeistään ${YRITYS_JOULU_TEKSTI}. Laskulla tilattaessa paidat lähtevät painoon, kun lasku on maksettu.`,
    },
    {
      q: "Voiko maksaa laskulla?",
      a: `Voi. Tarjouksen hyväksymisen jälkeen lähetämme laskun, maksuaika ${LASKU_MAKSUAIKA_PV} päivää. Laskuun tarvitaan yrityksen Y-tunnus.`,
    },
  ],
  links: [
    { href: "/yritykset", label: "Yritysten joululahjat ja tiimipaidat" },
    { href: "/yritykset/tilaus", label: "Tilaa omat designit koko tiimille" },
    { href: "/lahjat/pikkujouluihin", label: "Lahjat pikkujouluihin" },
  ],
};
