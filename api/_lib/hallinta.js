/**
 * Hallintasivujen avaimelliset linkit (2.11.2026): /hallinta/mittarit, /hallinta/some, /hallinta/tarjoukset ja
 * /hallinta/kumppanit (4.11.2026). Jokaisella sivulla on oma avain ja eväste hk_hallinta_<sivu>.
 * Linkit lähtevät vain sähköpostilla (päivän yhteenveto ja cron ?tehtava=hallintalinkit-viesti); niitä ei tallenneta
 * repoon eikä tulosteta. Ensimmäinen avaus tallentaa avaimen evästeeseen 90 päiväksi (api/sahkoposti.js hallintaPaasy).
 */
import { allekirjoita } from "./markkinointi.js";

export const HALLINTASIVUT = [
  { sivu: "mittarit", nimi: "Tavoitemittari", kuvaus: "kate, tilaukset, käynnit, mainoskulut ja yritysmyynti; lomakkeet päivän luvuille" },
  { sivu: "some", nimi: "Somevideot ja Pinterest-kuvat", kuvaus: "päivän videot latauslinkkeineen, kuvatekstit, hashtagit ja UTM-linkit" },
  { sivu: "tarjoukset", nimi: "Yritysten tarjouspyynnöt", kuvaus: "tarjouspyynnöt katteineen ja tilan vaihto" },
  { sivu: "kumppanit", nimi: "Kumppanikoodit", kuvaus: "kumppanikoodien ja /k/-linkkien luonti, klikit ja ensimmäinen käynti" },
  { sivu: "syote", nimi: "Syöte Claudelle", kuvaus: "Search Consolen, Merchantin ja somen luvut tekstinä tai CSV:nä otsikolla" },
];

export function hallintaLinkit(pohja = process.env.KAUPPA_URL || "https://huumorikauppa.fi") {
  const p = String(pohja).replace(/\/$/, "");
  return Object.fromEntries(HALLINTASIVUT.map(({ sivu }) => [sivu, `${p}/hallinta/${sivu}?avain=${encodeURIComponent(allekirjoita("hallinta", sivu))}`]));
}

/** Päivän yhteenvetoviestin rivit (mittarin ja somen linkit ovat jo mittaririveissä). */
export const yhteenvetoRivit = (linkit) => [
  `Tarjouspyynnöt (hallinta): ${linkit.tarjoukset}`,
  `Kumppanikoodit ja /k/-linkit (hallinta): ${linkit.kumppanit}`,
  "Hallintalinkit pysyvät kirjautuneina Chromessa 90 päivää ensimmäisestä avauksesta; avaa linkki uudelleen, jos sivu sanoo \"Ei pääsyä\".",
];

const OTSIKOT = new Set(["MITTARILOMAKKEET (/hallinta/mittarit)", "KIRJAUSRAJAPINTA", "SEARCH CONSOLE (huumorikauppa@gmail.com)"]);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** "Hallintalinkit Coworkille": linkit ja ohje mittarilomakkeisiin ja kirjausrajapintaan. */
export function hallintalinkkiViesti(linkit) {
  const kauppa = new URL(linkit.mittarit).origin;
  const rivit = [
    "Hallintalinkit Coworkille",
    "",
    "Avaa jokainen linkki kerran Coworkin Chromessa. Sivu tallentaa pääsyn evästeeseen 90 päiväksi, ja avain poistuu osoiteriviltä. Sen jälkeen sivut aukeavat suoraan osoitteista huumorikauppa.fi/hallinta/mittarit, /hallinta/some, /hallinta/tarjoukset, /hallinta/kumppanit ja /hallinta/syote. Jos sivu sanoo \"Ei pääsyä\", avaa linkki uudelleen tästä viestistä tai päivän yhteenvetoviestistä.",
    "",
    ...HALLINTASIVUT.flatMap(({ sivu, nimi, kuvaus }) => [`${nimi} (${kuvaus}):`, linkit[sivu], ""]),
    "MITTARILOMAKKEET (/hallinta/mittarit)",
    "Mainonta: päivä, kanava (google-ads, meta, tiktok, pinterest, muu), kulut euroina, klikit ja konversiot. Kirjaa joka aamu edellisen päivän luvut mainostilin raportista. Sama päivä ja kanava uudelleen korvaa luvut.",
    "Yritysmyynti: päivä, yritysviestejä lähetetty, vastauksia, tarjouspyyntöjä, tilauksia ja huomio. Kirjaa päivän luvut illalla. Sama päivä uudelleen korvaa luvut.",
    "Tallenna-painikkeen jälkeen sivu päivittää luvut ja näyttää \"Tallennettu\".",
    "",
    "KIRJAUSRAJAPINTA",
    `POST ${kauppa}/api/sahkoposti, Content-Type: application/json. Avain on mittarilinkin avain-parametrin arvo. Coworkin Chromessa avaimen voi jättää pois, kun mittarisivu on avattu kerran (eväste).`,
    `Yritysmyynti: {"action":"yritysluvut","avain":"<avain>","paiva":"VVVV-KK-PP","viestit":0,"vastaukset":0,"tarjouspyynnot":0,"tilaukset":0,"huom":""}`,
    `Mainoskulut: {"action":"mainoskulut","avain":"<avain>","paiva":"VVVV-KK-PP","kanava":"google-ads","kulut":0,"klikit":0,"konversiot":0,"huom":""}`,
    "Vastaus {\"ok\":true,\"tallennettu\":{...}}; virheessä {\"ok\":false,\"virhe\":\"...\"} (esim. päivä tulevaisuudessa). Väärä tai puuttuva avain: 404.",
    "",
    "SEARCH CONSOLE (huumorikauppa@gmail.com)",
    "Sivustolla on Search Consolen vahvistustagi (google-site-verification, index.html). Kirjaudu search.google.com/search-console tilillä huumorikauppa@gmail.com, lisää ominaisuus \"URL-etuliite\" https://huumorikauppa.fi/ ja valitse vahvistustavaksi HTML-tagi. Jos vahvistus ei mene läpi, tagi on toisen Google-tilin: kopioi Search Consolen antama content-arvo ja lähetä se Aarnille, tai pyydä nykyistä omistajaa lisäämään huumorikauppa@gmail.com käyttäjäksi (Asetukset > Käyttäjät ja oikeudet > Omistaja). Vahvistuksen jälkeen Sivukartat > lisää sitemap.xml > Lähetä.",
    "",
    "Älä jaa linkkejä eteenpäin: niillä pääsee hallintasivuille ilman salasanaa.",
  ];
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;line-height:1.5;color:#1a1a1a">${rivit.map((r) =>
    /^https?:\/\//.test(r) ? `<p><a href="${esc(r)}">${esc(r.replace(/\?avain=.*/, "?avain=..."))}</a></p>` : r === "" ? "" : OTSIKOT.has(r) || r === rivit[0] ? `<h3>${esc(r)}</h3>` : `<p>${esc(r)}</p>`).join("")}</div>`;
  return { subject: "Hallintalinkit Coworkille", html, text: rivit.join("\n") };
}
