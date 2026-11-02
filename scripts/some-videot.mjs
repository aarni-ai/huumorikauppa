/**
 * Somevideot (1.11.2026): 20 pystyvideota (1080 x 1920, 9:16, noin 10,5 s) TikTokiin, Instagram Reelsiin ja YouTube
 * Shortsiin sekä some/JULKAISUT.md (julkaisujärjestys, kuvatekstit, hashtagit, UTM-linkit).
 *
 * Rakenne: koukku ensimmäisestä ruudusta (iso teksti) > kaksi tuotekuvaa (Printifyn mockupit, hidas zoom) > loppuruutu
 * "huumorikauppa.fi". Ei musiikkia: äänirata on hiljainen, ja TikTokissa lisätään sovelluksen oma musiikki.
 * Personoitu paita: painokuvat piirretään samalla koodilla kuin tilauksen painokuva (api/_lib/personoitu.js).
 *
 * Ajo: FFMPEG=/polku/ffmpeg node scripts/some-videot.mjs [--vain 07] [--alkaen 36] [--md]
 *   --md  kirjoita vain some/JULKAISUT.md
 *   --alkaen 36  vain videot 36 alkaen (toinen kierros 2.11.2026, teeVideo2)
 * Kuvat haetaan julkisesta tuoterajapinnasta ja välimuistitetaan kansioon some/.valimuisti (ei gittiin).
 * Videot some/videot/NN-slug.mp4 ja kansikuvat NN-slug.jpg (mp4 ja jpg eivät ole gitissä, koska repo on julkinen ja
 * tiedostot ovat isoja; ne ovat Aarnin koneella ja jaetaan Coworkille kansiosta).
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import { painokuvaSvg, tarkistaPersonointi, PAINOALUEET, MALLIT } from "../api/_lib/personoitu.js";
import { TPAITAPARI_KAMPANJA } from "../api/_lib/vakiot.js";

const JUURI = new URL("..", import.meta.url).pathname;
const ULOS = join(JUURI, "some/videot");
const VALI = join(JUURI, "some/.valimuisti");
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const W = 1080, H = 1920, FPS = 30;
const KAUPPA = "https://huumorikauppa.fi";
const ANTON = "https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm0K0.ttf";
const ARIAL = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";

const TEEMAT = {
  perus: { tausta: "#15171f", korostus: "#ffd23f" },
  metsa: { tausta: "#1d3326", korostus: "#f5a623" },
  kala: { tausta: "#0f3150", korostus: "#7fd3ff" },
  mokki: { tausta: "#2e2a24", korostus: "#ffb36b" },
  joulu: { tausta: "#6e1720", korostus: "#ffe08a" },
  synttari: { tausta: "#2a1f4a", korostus: "#ff9ecf" },
  isa: { tausta: "#1b2a40", korostus: "#8fd0ff" },
  pimeys: { tausta: "#0b0d14", korostus: "#ffcf5c" },
};

/**
 * Videot julkaisujärjestyksessä (päivä 1 = ensimmäinen). hook = ensimmäisen sekunnin teksti, kuvat = mockupien
 * indeksit (tai "lifestyle"), linkki = sivu, jolle YouTube-kuvauksen linkki vie.
 */
export const VIDEOT = [
  { slug: "tonnin-seteli-t-paita", teema: "perus", ala: "SUOMIHUUMORIA", hook: "Kun kaveri kysyy, paljonko se maksoi", kuvat: [0, 1],
    teksti: "Vastaus on aina sama: tonnin seteli. T-paita ja huppari löytyvät osoitteesta huumorikauppa.fi", tagit: ["#hauskapaita", "#suomihuumori", "#tonninseteli", "#lahjaidea"] },
  { slug: "pikkujoulut-muistan-osittain-t-paita-pikkujouluihin", teema: "joulu", ala: "PIKKUJOULUIHIN", hook: "Pikkujoulujen jälkeinen aamu", kuvat: [0, 1],
    teksti: "Pikkujoulut. Muistan osittain. T-paitana ja huppari­na, huumorikauppa.fi", tagit: ["#pikkujoulut", "#pikkujoulupaita", "#hauskapaita", "#joulu"] },
  { slug: "passissa-14-tuntia-hirvi-naki-minut-t-paita-metsastajalle", teema: "metsa", ala: "METSÄSTÄJÄLLE", hook: "Passissa 14 tuntia.", kuvat: [0, 1],
    teksti: "Ja sitten hirvi näki minut. T-paita metsästäjälle, huumorikauppa.fi", tagit: ["#metsästys", "#hirvijahti", "#hauskapaita", "#lahjaidea"] },
  { slug: "saatanan-tunarit-t-paita", teema: "perus", ala: "SUOMIHUUMORIA", hook: "Kun koko porukka on taas myöhässä", kuvat: [0, 1],
    teksti: "Saatanan tunarit. Klassikko nyt paitana, huumorikauppa.fi", tagit: ["#hauskapaita", "#suomihuumori", "#saatanantunarit"] },
  { slug: "kiltti-enimmakseen-t-paita-jouluun", teema: "joulu", ala: "JOULUPAITA", hook: "Pukki kysyy: oletko ollut kiltti?", kuvat: [0, 1],
    teksti: "Kiltti. Enimmäkseen. Joulupaita rehelliselle ihmiselle, huumorikauppa.fi", tagit: ["#joulupaita", "#joululahja", "#hauskapaita", "#joulu"] },
  { slug: "60v-kokenut-ei-vanha-huppari", teema: "synttari", ala: "60-VUOTIAALLE", hook: "Hän täyttää 60. Älä sano vanha.", kuvat: [0, 1],
    teksti: "60v kokenut, ei vanha. Lahja, joka naurattaa päivänsankaria. huumorikauppa.fi", tagit: ["#60v", "#lahjaidea", "#syntymäpäivä", "#hauskapaita"] },
  { slug: "kala-oli-tatakin-isompi-t-paita-kalastajalle", teema: "kala", ala: "KALASTAJALLE", hook: "Se kala oli näin iso. Oikeasti.", kuvat: [0, 1],
    teksti: "Kala oli tätäkin isompi. Kalastajalle, jolla on aina tarina. huumorikauppa.fi", tagit: ["#kalastus", "#kalastaja", "#hauskapaita", "#lahjaidea"] },
  { slug: "personoitu-ikapaita-t-paita", teema: "synttari", ala: "PERSONOITU PAITA", hook: "Paita, jossa lukee hänen nimensä", personoitu: true,
    linkki: "/personoitu-paita",
    teksti: "Kirjoita nimi ja ikä, ja näet paidan heti esikatselussa. Personoitu t-paita: huumorikauppa.fi", tagit: ["#personoitupaita", "#synttärilahja", "#lahjaidea", "#hauskapaita"] },
  { slug: "tonttu-koeajalla-t-paita-jouluun", teema: "joulu", ala: "JOULUPAITA", hook: "Uusi tonttu aloitti tänään", kuvat: [0, 1],
    teksti: "Tonttu koeajalla. Joulupaita työpaikan pikkujouluihin, huumorikauppa.fi", tagit: ["#joulupaita", "#pikkujoulut", "#tonttu", "#joululahja"] },
  { slug: "pilkilla-ala-soita-t-paita-kalastajalle", teema: "kala", ala: "KALASTAJALLE", hook: "Lauantaiaamu jäällä. Puhelin äänettömällä.", kuvat: [0, 1],
    teksti: "Pilkillä. Älä soita. huumorikauppa.fi", tagit: ["#pilkki", "#kalastus", "#talvikalastus", "#hauskapaita"] },
  { slug: "se-oli-tonnin-seteli-t-paita", teema: "perus", ala: "SUOMIHUUMORIA", hook: "Se oli tonnin seteli.", kuvat: [0, 1],
    teksti: "Tunnistaa jokainen, joka on kuullut tarinan. T-paita ja huppari, huumorikauppa.fi", tagit: ["#hauskapaita", "#suomihuumori", "#meemi"] },
  { slug: "mokilla-ei-ole-kiire-eika-kenttaa-t-paita-mokkeilijalle", teema: "mokki", ala: "MÖKKEILIJÄLLE", hook: "Mökillä ei ole kiire.", kuvat: [0, 1],
    teksti: "Eikä kenttää. Mökkeilijälle, joka tietää. huumorikauppa.fi", tagit: ["#mökki", "#mökkielämä", "#hauskapaita", "#suomihuumori"] },
  { slug: "glogi-ensin-sitten-joulu-t-paita-jouluun", teema: "joulu", ala: "JOULUPAITA", hook: "Joulun oikea järjestys", kuvat: [0, 1],
    teksti: "Glögi ensin. Sitten joulu. huumorikauppa.fi", tagit: ["#glögi", "#joulupaita", "#joululahja", "#suomihuumori"] },
  { slug: "koira-loysi-mina-en-t-paita-metsastajalle", teema: "metsa", ala: "METSÄSTÄJÄLLE", hook: "Kun koira löytää linnun ennen sinua", kuvat: [0, 1],
    teksti: "Koira löysi. Minä en. Paita jokaiseen jahtiporukkaan, huumorikauppa.fi", tagit: ["#metsästys", "#lintukoira", "#hauskapaita"] },
  { slug: "60v-takuu-mennyt-toimii-silti-t-paita", teema: "synttari", ala: "60-VUOTIAALLE", hook: "Takuu meni jo. Toimii silti.", kuvat: [0, 1],
    teksti: "Kuusikymppiselle, joka pitää huumorista. huumorikauppa.fi", tagit: ["#60v", "#synttärilahja", "#hauskapaita", "#suomihuumori"] },
  { slug: "pikkujoulujen-nimetty-kuski-t-paita-pikkujouluihin", teema: "joulu", ala: "PIKKUJOULUIHIN", hook: "Joku ajaa kotiin. Tänä vuonna sinä.", kuvat: [0, 1],
    teksti: "Pikkujoulujen nimetty kuski. Ansaittu paita. huumorikauppa.fi", tagit: ["#pikkujoulut", "#pikkujoulupaita", "#hauskapaita"] },
  { slug: "sauna-lampiaa-muut-asiat-odottaa-t-paita-mokkeilijalle", teema: "mokki", ala: "SAUNOJALLE", hook: "Sauna lämpiää.", kuvat: [0, 1],
    teksti: "Muut asiat odottaa. huumorikauppa.fi", tagit: ["#sauna", "#mökki", "#suomihuumori", "#hauskapaita"] },
  { slug: "saatanan-tunarit-huppari", teema: "perus", ala: "HUPPARI", hook: "Talvi tulee. Tunarit eivät lähde mihinkään.", kuvat: [0, 1],
    teksti: "Saatanan tunarit, nyt myös huppari. huumorikauppa.fi", tagit: ["#huppari", "#suomihuumori", "#hauskapaita"] },
  { slug: "hauska-t-paita-golfaajalle-bogey-on-elamantapa", teema: "perus", ala: "GOLFAAJALLE", hook: "Par on tavoite. Bogey on elämäntapa.", kuvat: [0, "lifestyle"],
    teksti: "Golfaajalle, joka tuntee kentän. huumorikauppa.fi", tagit: ["#golf", "#golfhuumori", "#hauskapaita", "#lahjaidea"] },
  { slug: "kalastan-siis-valehtelen-t-paita-kalastajalle", teema: "kala", ala: "KALASTAJALLE", hook: "Kalastaja kertoo saaliistaan", kuvat: [0, 1],
    teksti: "Kalastan, siis valehtelen. huumorikauppa.fi", tagit: ["#kalastus", "#suomihuumori", "#hauskapaita"] },
].map((v, i) => ({ ...v, nro: String(i + 1).padStart(2, "0"), paiva: i + 1, aika: "18-20", teksti: v.teksti.replace(/­/g, "") }));

/**
 * Trendimuodot (1.11.2026, Coworkin tutkimus): POV-sketsit ("se yks kaveri joka..."), pariskuntahuumori,
 * "kumman paidan valitsisit?" -äänestykset ja vuodenaika (marraskuun pimeys, isänpäivä 8.11., pikkujoulut, joulu).
 * muoto: "pov" (koukku + kaksi tuotekuvaa), "dialogi" (Hän: kysymys -> Minä: paidan teksti), "aanestys" (A ja B
 * rinnakkain). paiva = julkaisupäivä (1 = 2.11.), toinen video samalle päivälle klo 11-13. Isävideot ennen isänpäivää.
 */
const VIDEOT_TRENDI = [
  { muoto: "pov", slug: "kuka-koski-termostaattiin-huppari-isalle", teema: "isa", ala: "ISÄNPÄIVÄ 8.11.", hook: "POV: isä huomaa, että joku koski termostaattiin", kuvat: [0, 1], paiva: 1,
    teksti: "Kuka koski termostaattiin? Jokainen isä kysyy tämän joka talvi. Isänpäivä 8.11. huumorikauppa.fi", tagit: ["#isänpäivä", "#isä", "#pov", "#suomihuumori", "#hauskapaita"] },
  { muoto: "pov", slug: "sammuta-valot-sahko-maksaa-t-paita-isalle", teema: "isa", ala: "MARRASKUU", hook: "POV: marraskuu, kaikki valot päällä ja isä tulee kotiin", kuvat: [0, 1], paiva: 2,
    teksti: "Sammuta valot. Sähkö maksaa. Isän lempilause marraskuussa. huumorikauppa.fi", tagit: ["#isänpäivä", "#marraskuu", "#pov", "#hauskapaita"] },
  { muoto: "pov", slug: "en-nuku-lepuutan-silmia-t-paita-isalle", teema: "isa", ala: "ISÄNPÄIVÄ 8.11.", hook: "POV: isä sohvalla klo 20.03", kuvat: [0, 1], paiva: 3,
    teksti: "En nuku. Lepuutan silmiä. Tunnistatko isäsi? huumorikauppa.fi", tagit: ["#isänpäivä", "#isä", "#pov", "#suomihuumori"] },
  { muoto: "aanestys", slugit: ["isa-tietaa-oikotien-aina-t-paita-isalle", "en-nuku-lepuutan-silmia-huppari-isalle"], teema: "isa", ala: "ISÄNPÄIVÄ 8.11.", hook: "Isänpäivälahja: kumman valitsisit?", paiva: 4,
    teksti: "A vai B? Kerro kommenteissa, kumpi sopii sinun isällesi. Isänpäivä 8.11. huumorikauppa.fi", tagit: ["#isänpäivä", "#isänpäivälahja", "#kummanvalitsisit", "#hauskapaita"] },
  { muoto: "pov", slug: "heratyskello-elakkeella-myos-t-paita-elakelaiselle", teema: "pimeys", ala: "MARRASKUU", hook: "Marraskuun aamu. Pimeää kuin yöllä.", kuvat: [0, 1], paiva: 5,
    teksti: "Herätyskello eläkkeellä myös. Marraskuun virallinen asenne. huumorikauppa.fi", tagit: ["#marraskuu", "#eläkeläinen", "#suomihuumori", "#hauskapaita"] },
  { muoto: "pov", slug: "loylya-lisaa-ei-ole-kuuma-t-paita-mokkeilijalle", teema: "mokki", ala: "SAUNOJALLE", hook: "Se yks kaveri saunassa, jonka mielestä ei ole kuuma", kuvat: [0, 1], paiva: 6,
    teksti: "Löylyä lisää. Ei ole kuuma. Jokaisessa saunaporukassa on yksi. huumorikauppa.fi", tagit: ["#sauna", "#seykskaveri", "#pov", "#suomihuumori", "#hauskapaita"] },
  { muoto: "pov", slug: "elakkeella-kiireinen-silti-t-paita-elakelaiselle", teema: "synttari", ala: "ELÄKELÄISELLE", hook: "POV: eläkeläisellä on enemmän menoja kuin töissä ollessa", kuvat: [0, 1], paiva: 8,
    teksti: "Eläkkeellä. Kiireinen silti. Lahja eläkeläiselle, jonka kalenteri on täynnä. huumorikauppa.fi", tagit: ["#eläkeläinen", "#eläkelahja", "#pov", "#hauskapaita"] },
  { muoto: "dialogi", slug: "karaokevuoro-varattu-jo-syyskuussa-t-paita-pikkujouluihin", teema: "joulu", ala: "PARISKUNTA", hook: "Hän: Lähdetäänkö pikkujouluista jo kotiin?", vastaus: "Minä:", kuvat: [0, 1], paiva: 9,
    teksti: "Karaokevuoro varattu jo syyskuussa. Merkkaa se, joka ei koskaan lähde ajoissa. huumorikauppa.fi", tagit: ["#pikkujoulut", "#pariskunta", "#karaoke", "#hauskapaita"] },
  { muoto: "pov", slug: "tanaan-tanssin-huomenna-kadun-t-paita-pikkujouluihin", teema: "joulu", ala: "PIKKUJOULUT", hook: "Se yks kaveri, joka lupasi lähteä pikkujouluista klo 22", kuvat: [0, 1], paiva: 10,
    teksti: "Tänään tanssin. Huomenna kadun. Merkkaa kaveri. huumorikauppa.fi", tagit: ["#pikkujoulut", "#seykskaveri", "#pov", "#pikkujoulupaita"] },
  { muoto: "pov", slug: "hauska-huppari-pikkujouluihin-pikkujoulut-muistetaan-vuosia", teema: "joulu", ala: "PIKKUJOULUT", hook: "Se yks kaveri, joka muistaa pikkujouluista ihan kaiken", kuvat: [0, 1], paiva: 11,
    teksti: "Pikkujoulut 2026: muistetaan 2036. Huppari pikkujouluihin. huumorikauppa.fi", tagit: ["#pikkujoulut", "#seykskaveri", "#pov", "#huppari"] },
  { muoto: "aanestys", slugit: ["pikkujoulut-muistan-osittain-t-paita-pikkujouluihin", "pikkujoulujen-nimetty-kuski-t-paita-pikkujouluihin"], teema: "joulu", ala: "PIKKUJOULUT", hook: "Pikkujouluihin: kumman paidan valitsisit?", paiva: 12,
    teksti: "A vai B? Kerro kommenteissa, kumpi kuvaa sinun pikkujoulujasi paremmin. huumorikauppa.fi", tagit: ["#pikkujoulut", "#kummanvalitsisit", "#pikkujoulupaita", "#hauskapaita"] },
  { muoto: "aanestys", slugit: ["elakkeella-kello-on-vain-koru-t-paita-elakelaiselle", "tyot-loppui-mokki-ei-t-paita-elakelaiselle"], teema: "synttari", ala: "ELÄKELÄISELLE", hook: "Eläkeläiselle joululahjaksi: A vai B?", paiva: 13,
    teksti: "Kumman antaisit eläkeläiselle? Vastaa kommentteihin A tai B. huumorikauppa.fi", tagit: ["#eläkeläinen", "#joululahja", "#kummanvalitsisit", "#hauskapaita"] },
  { muoto: "dialogi", slug: "riisipuurosta-loysin-vain-riisia-t-paita-jouluun", teema: "joulu", ala: "PARISKUNTA", hook: "Hän: Kuka sai mantelin tänä vuonna?", vastaus: "Minä:", kuvat: [0, 1], paiva: 14,
    teksti: "Riisipuurosta löysin vain riisiä. Joka joulu sama tarina. huumorikauppa.fi", tagit: ["#joulu", "#riisipuuro", "#pariskunta", "#joulupaita"] },
  { muoto: "dialogi", slug: "joulukortit-lahtevat-ensi-vuonna-t-paita-jouluun", teema: "joulu", ala: "PARISKUNTA", hook: "Hän: Onko joulukortit jo lähetetty?", vastaus: "Minä:", kuvat: [0, 1], paiva: 15,
    teksti: "Joulukortit lähtevät ensi vuonna. Merkkaa puolisosi. huumorikauppa.fi", tagit: ["#joulu", "#joulukortit", "#pariskunta", "#joulupaita"] },
  { muoto: "aanestys", slugit: ["glogi-ensin-sitten-joulu-t-paita-jouluun", "joulusaunan-loylymestari-t-paita-jouluun"], teema: "joulu", ala: "JOULUPAITA", hook: "Joulupaita: kumman valitsisit?", paiva: 16,
    teksti: "A vai B? Glögi vai joulusauna, kerro kommenteissa. huumorikauppa.fi", tagit: ["#joulupaita", "#joulu", "#kummanvalitsisit", "#suomihuumori"] },
].map((v, i) => ({ ...v, slug: v.slug || v.slugit[0], nro: String(21 + i).padStart(2, "0"), aika: "11-13" }));
VIDEOT.push(...VIDEOT_TRENDI);

/** Joulun viimeinen tilauspäivä (src/data/campaignSchedule.ts JOULU_TILAUSPAIVA_ISO, testi src/test/mittarit.test.ts). */
export const JOULU_VIIMEINEN = { iso: "2026-12-02", teksti: "ke 2.12." };
const eur = (x) => `${x.toFixed(2).replace(".", ",")} €`;
const BF = TPAITAPARI_KAMPANJA;
const BF_PAIVAT = `${Number(BF.alku.slice(8))}.-${Number(BF.loppu.slice(8))}.${Number(BF.loppu.slice(5, 7))}.`;
/** Kuluttajansuojalaki 2:6 a §: t-paidan hinta ja 30 päivän alin hinta jokaiseen Black Friday -videoon ja kuvatekstiin. */
export const BF_HINTALAUSE = `T-paidan hinta ${eur(BF.kappalehinta)}, alin hinta 30 päivän aikana ${eur(BF.alinHinta30pv)}. Tarjous koskee ${eur(BF.kappalehinta)}:n t-paitoja.`;
const BF_INFO = { otsikko: `KAKSI T-PAITAA ${eur(BF.parihinta)}`, rivit: [`Black Friday ${BF_PAIVAT}`, "Hinta lasketaan ostoskorissa", "ilman koodia."], pieni: BF_HINTALAUSE };
const LAHJAKORTTI_INFO = { otsikko: "PAINETTU PAITA EI EHDI ENÄÄ 8.11.", rivit: ["Lahjakortti ehtii:", "koodi ja tulostettava PDF", "heti maksun jälkeen."] };
const JOULU_INFO = { otsikko: `JOULUKSI: TILAA VIIMEISTÄÄN ${JOULU_VIIMEINEN.teksti.toUpperCase()}`, rivit: ["niin tilaus ehtii perille", "jouluaattoon mennessä."] };
const NIMI_INFO = { otsikko: "TEE PAITA NIMELLÄ", rivit: ["Kirjoita nimi, ja näet", "paidan heti esikatselussa."] };

/**
 * Toinen kierros (2.11.2026): 20 videota, 36-55. Julkaisulista riittää 30.11. asti: ilman näitä Coworkin ajot
 * 22.-30.11. olisivat jääneet ilman uutta videota ja julkaisseet listan vanhimman videon uudestaan.
 * Rakenne: koukku > lifestyle-mockup (paita päällä, Printifyn kuva) > tuotekuva tai tietoruutu > loppuruutu.
 * muoto "tarjous" = Black Friday -pari (kaksi 24,90 €:n t-paitaa, KSL 2:6 a §:n hintatiedot ruudulla ja kuvatekstissä).
 * personoitu = paidan oma esikatselu (api/_lib/personoitu.js painokuvaSvg) kahdella esimerkkinimellä.
 * Isävideot 6. ja 7.11. (kampanjakalenterin mukaan painettu lahja ei enää ehdi, joten lahjakortti); niiden tilalta
 * videot 25 ja 26 siirtyvät 20. ja 21.11. Puheääni: ei (macOS:n ainoa suomenkielinen Satu on kompakti versio,
 * fif_satu_embedded-compact, ja kuulostaa koneelliselta), äänirata hiljainen kuten ennen.
 * paiva = julkaisupäivä (1 = 2.11.).
 */
const VIDEOT_KIERROS2 = [
  { muoto: "perus", slug: "isanpaiva-lepopaiva-sama-asia-t-paita-isalle", teema: "isa", ala: "ISÄNPÄIVÄ 8.11.", paiva: 5, aika: "11-13",
    hook: "Isänpäivä on sunnuntaina. Lahja vielä hankkimatta?", info: LAHJAKORTTI_INFO, ilmanTuotekuvaa: true, linkki: "/lahjakortti",
    teksti: "Painettu paita ei enää ehdi isänpäiväksi, mutta lahjakortti ehtii: koodi ja tulostettava PDF ovat valmiina heti maksun jälkeen. Isä valitsee paidan itse. huumorikauppa.fi",
    tagit: ["#isänpäivä", "#isänpäivälahja", "#lahjakortti", "#hauskapaita"] },
  { muoto: "pov", slug: "isanpaivana-mina-paatan-kaukosaatimesta-t-paita-isalle", teema: "isa", ala: "ISÄNPÄIVÄ HUOMENNA", paiva: 6, aika: "11-13",
    hook: "POV: isänpäivä on huomenna ja lahja puuttuu", info: { ...LAHJAKORTTI_INFO, otsikko: "LAHJAKORTTI EHTII VIELÄ" }, ilmanTuotekuvaa: true, linkki: "/lahjakortti",
    teksti: "Isänpäivä on huomenna. Lahjakortti ehtii vielä: koodi ja tulostettava PDF ovat valmiina heti maksun jälkeen. huumorikauppa.fi",
    tagit: ["#isänpäivä", "#pov", "#lahjakortti", "#isänpäivälahja"] },
  { muoto: "pov", slug: "pikkujoulut-nyt-sinuttelen-esimiesta-t-paita-jouluun", teema: "joulu", ala: "PIKKUJOULUT", paiva: 21, aika: "11-13",
    hook: "Se yks kaveri, joka sinuttelee esimiestä pikkujouluissa", toinen: "Merkkaa se kaveri",
    teksti: "Pikkujoulut. Nyt sinuttelen esimiestä. Merkkaa se kaveri. huumorikauppa.fi", tagit: ["#pikkujoulut", "#seykskaveri", "#pov", "#pikkujoulupaita"] },
  { muoto: "perus", slug: "personoidut-pikkujoulut", teema: "joulu", ala: "TEE PAITA NIMELLÄ", paiva: 21, aika: "18-20", linkki: "/personoidut",
    hook: "Pikkujouluihin paita, jossa on sinun nimesi", info: NIMI_INFO,
    pers: [{ malli: "pikkujoulu", nimi: "Mikko", vuosi: "2026", vari: "Musta" }, { malli: "tonttu", nimi: "Laura", vari: "Valkoinen" }],
    teksti: "Kirjoita nimi, ja näet paidan heti esikatselussa. Personoidut paidat pikkujouluihin: huumorikauppa.fi", tagit: ["#personoitupaita", "#pikkujoulut", "#tonttu", "#lahjaidea"] },
  { muoto: "tarjous", slugit: ["amatimies-t-paita", "minulla-ei-ole-alkoholiongelmaa-t-paita"], teema: "pimeys", ala: "BLACK FRIDAY", paiva: 22, aika: "18-20", linkki: "/black-friday",
    hook: `Black Friday alkoi: kaksi t-paitaa ${eur(BF.parihinta)}`,
    teksti: `Black Friday ${BF_PAIVAT}: kaksi t-paitaa ${eur(BF.parihinta)}. Amatimies ja Minulla ei ole alkoholiongelmaa, tai mitkä tahansa kaksi ${eur(BF.kappalehinta)}:n t-paitaa. ${BF_HINTALAUSE} huumorikauppa.fi`,
    tagit: ["#blackfriday", "#hauskapaita", "#suomihuumori", "#amatimies"] },
  { muoto: "pov", slug: "loylymestari-vain-yksi-kauha-lisaa-t-paita-saunojalle", teema: "mokki", ala: "SAUNOJALLE", paiva: 22, aika: "11-13",
    hook: "Se yks kaveri, joka heittää aina vielä yhden kauhan", toinen: "Merkkaa löylymestari",
    teksti: "Löylymestari. Vain yksi kauha lisää. Jokaisessa saunaporukassa on yksi. huumorikauppa.fi", tagit: ["#sauna", "#löylyt", "#seykskaveri", "#pov", "#hauskapaita"] },
  { muoto: "tarjous", slugit: ["minulla-ei-ole-alkoholiongelmaa-t-paita", "kalju-t-paita"], teema: "pimeys", ala: "BLACK FRIDAY", paiva: 23, aika: "18-20", linkki: "/black-friday",
    hook: `Kaljaporukalle kaksi paitaa ${eur(BF.parihinta)}`,
    teksti: `Black Friday ${BF_PAIVAT}: kaksi t-paitaa ${eur(BF.parihinta)}, toinen sinulle ja toinen kaverille. ${BF_HINTALAUSE} huumorikauppa.fi`,
    tagit: ["#blackfriday", "#olut", "#hauskapaita", "#suomihuumori"] },
  { muoto: "perus", slug: "saunakalja-ei-ole-neuvoteltavissa-t-paita-oluen-ystavalle", teema: "mokki", ala: "OLUEN YSTÄVÄLLE", paiva: 23, aika: "11-13",
    hook: "Saunan jälkeen on yksi asia, josta ei neuvotella", toinen: "Joululahjaksi saunojalle",
    teksti: "Saunakalja ei ole neuvoteltavissa. Joululahja saunojalle, joka tietää. huumorikauppa.fi", tagit: ["#saunakalja", "#sauna", "#olut", "#hauskapaita"] },
  { muoto: "tarjous", slugit: ["amatimies-t-paita", "kalju-t-paita"], teema: "metsa", ala: "BLACK FRIDAY", paiva: 24, aika: "18-20", linkki: "/black-friday",
    hook: `Työmaalle kaksi paitaa ${eur(BF.parihinta)}`,
    teksti: `Amatimies ja Kalju: kaksi t-paitaa ${eur(BF.parihinta)} Black Fridayna ${BF_PAIVAT} ${BF_HINTALAUSE} huumorikauppa.fi`,
    tagit: ["#blackfriday", "#työmaa", "#amatimies", "#hauskapaita"] },
  { muoto: "pov", slug: "sahkomies-tiedan-mika-johtaa-mihinkin-t-paita-sahkomiehelle", teema: "perus", ala: "SÄHKÖMIEHELLE", paiva: 24, aika: "11-13",
    hook: "Sähkömies kylässä. Katsoo ensin jatkojohtoja.", toinen: "Joululahjaksi sähkömiehelle",
    teksti: "Sähkömies. Tiedän, mikä johtaa mihinkin. Merkkaa sähkömies. huumorikauppa.fi", tagit: ["#sähkömies", "#ammatit", "#pov", "#hauskapaita"] },
  { muoto: "tarjous", slugit: ["olen-elakkeella-t-paita", "100-elakelainen-t-paita"], teema: "joulu", ala: "BLACK FRIDAY", paiva: 25, aika: "18-20", linkki: "/black-friday",
    hook: `Kaksi joululahjaa eläkeläisille: ${eur(BF.parihinta)}`,
    teksti: `Kaksi joululahjaa eläkeläisille, kaksi t-paitaa ${eur(BF.parihinta)}. Black Friday ${BF_PAIVAT} ${BF_HINTALAUSE} huumorikauppa.fi`,
    tagit: ["#blackfriday", "#joululahja", "#eläkeläinen", "#hauskapaita"] },
  { muoto: "perus", slug: "personoidut-sauna", teema: "mokki", ala: "TEE PAITA NIMELLÄ", paiva: 25, aika: "11-13", linkki: "/personoidut",
    hook: "Saunaporukan vanhimmalle paita hänen nimellään", info: NIMI_INFO,
    pers: [{ malli: "saunan-vanhin", nimi: "Erkki", vari: "Musta" }, { malli: "loylymestari", nimi: "Timo", vuosi: "1975", vari: "Valkoinen" }],
    teksti: "Saunan vanhin ja Löylymestari omalla nimellä. Kirjoita nimi, ja näet paidan heti esikatselussa. huumorikauppa.fi", tagit: ["#sauna", "#personoitupaita", "#joululahja", "#saunojalle"] },
  { muoto: "tarjous", slugit: ["maailman-paras-aiti-t-paita", "amatimies-t-paita"], teema: "pimeys", ala: "TÄNÄÄN BLACK FRIDAY", paiva: 26, aika: "18-20", linkki: "/black-friday",
    hook: "Tänään on Black Friday", teksti: `Joululahja äidille ja isälle. Black Friday -tarjous on voimassa maanantaihin ${Number(BF.loppu.slice(8))}.${Number(BF.loppu.slice(5, 7))}. asti: kaksi t-paitaa ${eur(BF.parihinta)}. ${BF_HINTALAUSE} huumorikauppa.fi`,
    tagit: ["#blackfriday", "#joululahja", "#hauskapaita", "#suomihuumori"] },
  { muoto: "dialogi", slug: "kinkkuvahti-ala-koske-t-paita-jouluun", teema: "joulu", ala: "PARISKUNTA", paiva: 26, aika: "11-13",
    hook: "Hän: Saako kinkkua jo maistaa?", vastaus: "Minä:", toinen: "Joulupaita kinkun vartijalle",
    teksti: "Kinkkuvahti. Älä koske. Merkkaa kinkun vartija. huumorikauppa.fi", tagit: ["#joulu", "#joulukinkku", "#pariskunta", "#joulupaita"] },
  { muoto: "perus", slug: "personoidut-tyokaveri", teema: "synttari", ala: "TEE PAITA NIMELLÄ", paiva: 27, aika: "18-20", linkki: "/personoidut",
    hook: "Paras työkaveri ansaitsee oman paidan", info: NIMI_INFO,
    pers: [{ malli: "tyokaveri", nimi: "Tiina", vari: "Valkoinen" }, { malli: "tyokaveri", nimi: "Jukka", vari: "Musta" }],
    teksti: "Paras työkaveri, omalla nimellä. Pikkujoululahjaksi tai kiitokseksi. Kirjoita nimi, ja näet paidan heti esikatselussa. huumorikauppa.fi", tagit: ["#työkaveri", "#personoitupaita", "#pikkujoulut", "#lahjaidea"] },
  { muoto: "pov", slug: "sairaanhoitaja-kahvi-on-ensiapua-t-paita-sairaanhoitajalle", teema: "kala", ala: "SAIRAANHOITAJALLE", paiva: 27, aika: "11-13",
    hook: "Yövuoro, kello 3.12. Kahvi loppui.", toinen: "Merkkaa hoitaja",
    teksti: "Sairaanhoitaja. Kahvi on ensiapua. Merkkaa hoitaja, joka tarvitsee tämän. huumorikauppa.fi", tagit: ["#sairaanhoitaja", "#yövuoro", "#ammatit", "#hauskapaita"] },
  { muoto: "pov", slug: "anoppi-tulee-jouluksi-pysy-rauhallisena-t-paita-jouluun", teema: "joulu", ala: "JOULU", paiva: 28, aika: "18-20",
    hook: "POV: anoppi soitti. Hän tulee jouluksi.", info: JOULU_INFO, ilmanTuotekuvaa: true,
    teksti: `Anoppi tulee jouluksi. Pysy rauhallisena. Jouluksi ehtii, kun tilaat viimeistään ${JOULU_VIIMEINEN.teksti} huumorikauppa.fi`, tagit: ["#joulu", "#anoppi", "#pov", "#joulupaita"] },
  { muoto: "pov", slug: "piipahdan-yhdelle-palaan-maanantaina-t-paita-oluen-ystavalle", teema: "perus", ala: "OLUEN YSTÄVÄLLE", paiva: 28, aika: "11-13",
    hook: "Se yks kaveri, joka lähtee vain yhdelle", toinen: "Merkkaa se kaveri",
    teksti: "Piipahdan yhdelle. Palaan maanantaina. Merkkaa se kaveri. huumorikauppa.fi", tagit: ["#pikkujoulut", "#olut", "#seykskaveri", "#pov"] },
  { muoto: "tarjous", slugit: ["minulla-ei-ole-alkoholiongelmaa-t-paita", "elakelainen-t-paita"], teema: "pimeys", ala: "VIIMEINEN PÄIVÄ", paiva: 29, aika: "18-20", linkki: "/black-friday",
    hook: "Black Friday päättyy tänään klo 23.59",
    teksti: `Viimeinen päivä: kaksi t-paitaa ${eur(BF.parihinta)} tänään klo 23.59 asti. Jouluksi ehtii, kun tilaat viimeistään ${JOULU_VIIMEINEN.teksti} ${BF_HINTALAUSE} huumorikauppa.fi`,
    tagit: ["#blackfriday", "#viimeinenpäivä", "#hauskapaita", "#joululahja"] },
  { muoto: "perus", slug: "lahjapaniikki-perinteinen-joulutapa-t-paita-jouluun", teema: "joulu", ala: "JOULUN TILAUSPÄIVÄT", paiva: 29, aika: "11-13",
    hook: "Lahjapaniikki? Jouluksi ehtii vielä.", info: JOULU_INFO, ilmanTuotekuvaa: true,
    teksti: `Lahjapaniikki. Perinteinen joulutapa. Tilaa viimeistään ${JOULU_VIIMEINEN.teksti}, niin tilaus ehtii perille jouluaattoon mennessä. huumorikauppa.fi`,
    tagit: ["#joululahja", "#lahjapaniikki", "#joulu", "#joulupaita"] },
].map((v, i) => ({ ...v, slug: v.slug || `black-friday-${v.slugit[0]}`, nro: String(36 + i).padStart(2, "0"), kierros: 2 }));
// Videot 25 ja 26 siirtyvät 6. ja 7.11. isävideoiden tieltä 20. ja 21.11. aamupäivään (vapaat paikat).
for (const [nro, paiva] of [["25", 19], ["26", 20]]) VIDEOT.find((v) => v.nro === nro).paiva = paiva;
VIDEOT.push(...VIDEOT_KIERROS2);

const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Rivitys arvioidulla merkkileveydellä (Anton noin 0,46 em, Arial Bold noin 0,6 em). */
function rivita(teksti, koko, leveys, kerroin = 0.46) {
  const max = Math.max(4, Math.floor(leveys / (koko * kerroin)));
  const rivit = [];
  for (const sana of teksti.split(/\s+/)) {
    const v = rivit[rivit.length - 1];
    if (v && (v + " " + sana).length <= max) rivit[rivit.length - 1] = v + " " + sana;
    else rivit.push(sana);
  }
  return rivit;
}

/** Suurin fonttikoko, jolla teksti mahtuu laatikkoon (leveys x korkeus). */
function sovita(teksti, leveys, korkeus, { max = 170, min = 60, rivivali = 1.18 } = {}) {
  for (let k = max; k >= min; k -= 4) {
    const r = rivita(teksti, k, leveys);
    if (r.length * k * rivivali <= korkeus && r.every((x) => x.length * k * 0.46 <= leveys)) return { koko: k, rivit: r };
  }
  return { koko: min, rivit: rivita(teksti, min, leveys) };
}

let fontit;
async function lataaFontit() {
  if (fontit) return fontit;
  await mkdir(VALI, { recursive: true });
  const anton = join(VALI, "anton.ttf");
  try { await access(anton); } catch { await writeFile(anton, Buffer.from(await (await fetch(ANTON)).arrayBuffer())); }
  fontit = [anton, ARIAL];
  return fontit;
}

async function svgPng(svg) {
  return new Resvg(svg, { font: { fontFiles: await lataaFontit(), loadSystemFonts: false, defaultFontFamily: "Anton" }, fitTo: { mode: "original" } }).render().asPng();
}

const tekstiSvg = (rivit, koko, y0, vari, perhe = "Anton", rivivali = 1.18) => rivit
  .map((r, i) => `<text x="${W / 2}" y="${y0 + koko + i * koko * rivivali}" font-family="${perhe}" font-size="${koko}" fill="${vari}" text-anchor="middle">${xml(r)}</text>`).join("");

/** Yläotsikon pillin leveys: vähintään 520, pitkälle tekstille leveämpi (Arial Bold 46 px noin 31 px/merkki). */
const pilli = (teksti) => Math.min(W - 60, Math.max(520, teksti.length * 31 + 70));

/** Koukkuruutu: teeman tausta, pieni yläotsikko ja iso koukku keskellä (pysyy TikTokin käyttöliittymän turva-alueella). */
async function koukku(v) {
  const t = TEEMAT[v.teema];
  const { koko, rivit } = sovita(v.hook.toUpperCase(), 900, 760);
  const korkeus = rivit.length * koko * 1.18;
  const y0 = 760 - korkeus / 2;
  return svgPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${t.tausta}"/>
    <rect x="${W / 2 - pilli(v.ala) / 2}" y="${y0 - 150}" width="${pilli(v.ala)}" height="84" rx="42" fill="${t.korostus}"/>
    ${tekstiSvg([v.ala], 46, y0 - 150 + 6, t.tausta, "Arial", 1)}
    ${tekstiSvg(rivit, koko, y0, "#ffffff")}</svg>`);
}

/** Tuoteruutu: paidan teksti ylhäällä, mockup pyöristetyssä kortissa. */
async function tuoteruutu(v, kuva, otsikko, etuliite = "", lainaus = true) {
  const t = TEEMAT[v.teema];
  const { koko, rivit } = sovita(lainaus ? `${etuliite}"${otsikko}"` : otsikko, 920, 230, { max: 96, min: 50 });
  const koko2 = 980;
  const maski = Buffer.from(`<svg width="${koko2}" height="${koko2}"><rect width="${koko2}" height="${koko2}" rx="36" fill="#fff"/></svg>`);
  // Mockupeissa on paljon tyhjää: rajataan keskeltä 78 %, jotta paidan teksti erottuu puhelimen ruudulla.
  const m = await sharp(kuva).metadata();
  const rajaus = v.personoitu ? null : { left: Math.round(m.width * 0.11), top: Math.round(m.height * 0.1), width: Math.round(m.width * 0.78), height: Math.round(m.height * 0.78) };
  const kortti = await (rajaus ? sharp(kuva).extract(rajaus) : sharp(kuva)).resize(koko2, koko2, { fit: "cover" }).composite([{ input: maski, blend: "dest-in" }]).png().toBuffer();
  const ylä = await svgPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${t.tausta}"/>
    ${tekstiSvg(rivit, koko, 250 - (rivit.length - 1) * koko * 0.54, t.korostus)}</svg>`);
  return sharp(ylä).composite([{ input: kortti, left: (W - koko2) / 2, top: 470 }]).png().toBuffer();
}

/** Loppuruutu: huumorikauppa.fi isona. */
async function loppu(v) {
  const t = TEEMAT[v.teema];
  return svgPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${t.tausta}"/>
    ${tekstiSvg(["HUUMORIKAUPPA.FI"], 118, 640, "#ffffff")}
    <rect x="${W / 2 - 300}" y="830" width="600" height="8" rx="4" fill="${t.korostus}"/>
    ${tekstiSvg(["Hauskat paidat suomeksi"], 56, 900, t.korostus, "Arial", 1)}
    ${tekstiSvg(["Linkki profiilissa"], 46, 1010, "#ffffff", "Arial", 1)}</svg>`);
}

/** Personoidun paidan esimerkki: oikea painokuva (sama koodi kuin tilauksessa) paidan värisellä pohjalla. */
async function personoituKuva(malli, nimi, ika, vari) {
  const pers = tarkistaPersonointi({ malli, nimi, ika });
  if (!pers.ok) throw new Error(pers.virhe);
  const paino = await svgPng(painokuvaSvg(pers, vari, { leveys: 1200, korkeus: 1371 }));
  const pohja = vari === "Musta" ? "#1b1b1d" : "#f2f2f0";
  const p = await sharp(paino).trim().resize(760, 600, { fit: "inside" }).png().toBuffer();
  return sharp({ create: { width: 1200, height: 1200, channels: 4, background: pohja } }).composite([{ input: p, gravity: "center" }]).jpeg().toBuffer();
}

let tuotteet;
async function tuote(slug) {
  if (!tuotteet) {
    const r = await fetch(`${KAUPPA}/api/products?fields=slug,name,images,price,category,variants`);
    const j = await r.json();
    tuotteet = new Map((Array.isArray(j) ? j : j.products).map((p) => [p.slug, p]));
  }
  const p = tuotteet.get(slug);
  if (!p) throw new Error(`tuotetta ei löydy: ${slug}`);
  return p;
}

async function kuva(url, nimi) {
  const polku = join(VALI, `${nimi}.jpg`);
  try { return await readFile(polku); } catch { /* haetaan */ }
  const r = await fetch(url);
  if (!r.ok) throw new Error(`kuva ${r.status}: ${url}`);
  const b = Buffer.from(await r.arrayBuffer());
  await writeFile(polku, b);
  return b;
}

/** Paidan teksti tuotteen nimestä ("Kala oli tätäkin isompi | T-paita kalastajalle" -> "Kala oli tätäkin isompi"). */
export function paidanTeksti(nimi) {
  const n = String(nimi).split("|")[0].trim();
  const m = n.match(/^Hauska (?:T-Paita|Huppari)[^:]*:\s*(.+)$/i);
  let s = (m ? m[1] : n).trim();
  // Otsikkomuoto ("Bogey On Elämäntapa") virkkeeksi: paidassa ja videossa luetaan tavallisena lauseena.
  const sanat = s.split(" ");
  if (sanat.length > 1 && sanat.every((w) => /^[A-ZÅÄÖ0-9]/.test(w))) s = [sanat[0], ...sanat.slice(1).map((w) => w.toLowerCase())].join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Kehykset ffmpegillä: hidas zoom jokaiseen ruutuun, ristihäivytys 0,35 s, hiljainen äänirata. */
function koosta(ruudut, kestot, ulos) {
  const H2 = 0.35;
  const args = ["-y", "-loglevel", "error"];
  ruudut.forEach((r, i) => args.push("-loop", "1", "-t", String(kestot[i]), "-i", r));
  args.push("-f", "lavfi", "-t", "20", "-i", "anullsrc=r=44100:cl=stereo");
  const suodin = [];
  ruudut.forEach((_, i) => {
    const n = Math.round(kestot[i] * FPS);
    // Ensimmäinen ruutu ilman zoomin alkua: koukku näkyy täytenä heti.
    suodin.push(`[${i}:v]scale=${W * 2}:${H * 2},zoompan=z='min(1+on*0.0009,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${n}:s=${W}x${H}:fps=${FPS},format=yuv420p,setsar=1[v${i}]`);
  });
  let edellinen = "v0", aika = kestot[0];
  for (let i = 1; i < ruudut.length; i++) {
    const nimi = `x${i}`;
    suodin.push(`[${edellinen}][v${i}]xfade=transition=fade:duration=${H2}:offset=${(aika - H2).toFixed(2)}[${nimi}]`);
    aika += kestot[i] - H2;
    edellinen = nimi;
  }
  args.push("-filter_complex", suodin.join(";"), "-map", `[${edellinen}]`, "-map", `${ruudut.length}:a`, "-t", aika.toFixed(2),
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", ulos);
  execFileSync(FFMPEG, args, { stdio: "inherit" });
  return aika;
}

export const utm = (polku, lahde, nro, kampanja = "somevideo") =>
  `${KAUPPA}${polku}${polku.includes("?") ? "&" : "?"}utm_source=${lahde}&utm_medium=social&utm_campaign=${kampanja}&utm_content=video${nro}`;

/** Dialogiruutu: puhekupla "Hän: ..." (pariskuntahuumori), vastaus tulee seuraavassa ruudussa paidan tekstinä. */
async function dialogi(v) {
  const t = TEEMAT[v.teema];
  const teksti = v.hook.replace(/^Hän:\s*/, "");
  const { koko, rivit } = sovita(teksti, 820, 520, { max: 110, min: 56 });
  const korkeus = rivit.length * koko * 1.18 + 120;
  const y0 = 760 - korkeus / 2;
  return svgPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${t.tausta}"/>
    <rect x="${W / 2 - pilli(v.ala) / 2}" y="${y0 - 170}" width="${pilli(v.ala)}" height="84" rx="42" fill="${t.korostus}"/>
    ${tekstiSvg([v.ala], 46, y0 - 170 + 6, t.tausta, "Arial", 1)}
    <rect x="80" y="${y0}" width="${W - 160}" height="${korkeus}" rx="48" fill="#ffffff"/>
    <polygon points="160,${y0 + korkeus - 4} 250,${y0 + korkeus - 4} 150,${y0 + korkeus + 70}" fill="#ffffff"/>
    ${tekstiSvg(["HÄN:"], 52, y0 + 22, t.tausta, "Arial", 1)}
    ${tekstiSvg(rivit, koko, y0 + 90, "#15171f")}</svg>`);
}

/** Äänestysruutu: A ja B rinnakkain paidan teksteineen. */
async function aanestysruutu(v, kuvat, nimet, kehotus) {
  const t = TEEMAT[v.teema];
  const lev = 500;
  const kortit = await Promise.all(kuvat.map(async (k) => {
    const m = await sharp(k).metadata();
    const raj = { left: Math.round(m.width * 0.11), top: Math.round(m.height * 0.1), width: Math.round(m.width * 0.78), height: Math.round(m.height * 0.78) };
    const maski = Buffer.from(`<svg width="${lev}" height="${lev}"><rect width="${lev}" height="${lev}" rx="28" fill="#fff"/></svg>`);
    return sharp(k).extract(raj).resize(lev, lev, { fit: "cover" }).composite([{ input: maski, blend: "dest-in" }]).png().toBuffer();
  }));
  const nimiRivit = nimet.map((n) => sovita(`"${n}"`, 470, 200, { max: 54, min: 34 }));
  const pohja = await svgPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${t.tausta}"/>
    ${tekstiSvg(sovita(v.hook.toUpperCase(), 940, 260, { max: 92, min: 56 }).rivit, 80, 150, "#ffffff")}
    ${["A", "B"].map((x, i) => `<circle cx="${30 + lev / 2 + i * (lev + 20)}" cy="560" r="62" fill="${t.korostus}"/><text x="${30 + lev / 2 + i * (lev + 20)}" y="588" font-family="Anton" font-size="80" fill="${t.tausta}" text-anchor="middle">${x}</text>`).join("")}
    ${nimiRivit.map((n, i) => n.rivit.map((r, j) => `<text x="${30 + lev / 2 + i * (lev + 20)}" y="${1220 + j * n.koko * 1.1}" font-family="Anton" font-size="${n.koko}" fill="${t.korostus}" text-anchor="middle">${xml(r)}</text>`).join("")).join("")}
    ${tekstiSvg([kehotus], 60, 1390, "#ffffff", "Arial", 1)}</svg>`);
  return sharp(pohja).composite(kortit.map((k, i) => ({ input: k, left: 30 + i * (lev + 20), top: 650 }))).png().toBuffer();
}

const kuvaUrlit = (p, kuvat) => kuvat.map((x) => (x === "lifestyle" ? p.images.find((u) => u.includes("lifestyle")) : p.images[x]));

/** Videon tiedostonimi ilman päätettä. */
export const videonNimi = (v) => `${v.nro}-${v.slug.slice(0, 48).replace(/-+$/, "")}`;

async function teeVideo(v) {
  const ruudut = [];
  const tmp = join(VALI, "ruudut");
  await mkdir(tmp, { recursive: true });
  const tallenna = async (b, n) => { const p = join(tmp, `${v.nro}-${n}.png`); await writeFile(p, b); ruudut.push(p); };
  let kestot = [2.6, 3.2, 3.2, 2.6];
  const k = v.muoto === "dialogi" ? await dialogi(v) : await koukku(v);
  await tallenna(k, "a");
  if (v.personoitu) {
    await tallenna(await tuoteruutu(v, await personoituKuva("kokenut", "Marja", "60", "Musta"), "Marja 60v, kokenut, ei vanha"), "b");
    await tallenna(await tuoteruutu(v, await personoituKuva("nuori", "Jari", "50", "Valkoinen"), "Jari, 50 vuotta nuori"), "c");
  } else if (v.muoto === "aanestys") {
    const tuotteetAB = await Promise.all(v.slugit.map((x) => tuote(x)));
    const kuvatAB = await Promise.all(tuotteetAB.map((p) => kuva(p.images[0], `${p.slug}-0`)));
    const nimet = tuotteetAB.map((p) => paidanTeksti(p.name));
    await tallenna(await aanestysruutu(v, kuvatAB, nimet, "Kumpi? Vastaa A tai B"), "b");
    await tallenna(await aanestysruutu(v, kuvatAB, nimet, "Kommentoi A tai B"), "c");
    kestot = [2.2, 4.2, 3.4, 2.6];
  } else {
    const p = await tuote(v.slug);
    for (const [i, u] of kuvaUrlit(p, v.kuvat).entries()) {
      const etuliite = v.muoto === "dialogi" && i === 0 ? `${v.vastaus} ` : "";
      await tallenna(await tuoteruutu(v, await kuva(u, `${v.slug}-${i}`), paidanTeksti(p.name), etuliite), String.fromCharCode(98 + i));
    }
    if (v.muoto === "dialogi") kestot = [2.8, 3.4, 2.8, 2.6];
  }
  await tallenna(await loppu(v), "z");
  await mkdir(ULOS, { recursive: true });
  const nimi = videonNimi(v);
  const kesto = koosta(ruudut, kestot, join(ULOS, `${nimi}.mp4`));
  await sharp(k).resize(540, 960).jpeg({ quality: 85 }).toFile(join(ULOS, `${nimi}.jpg`));
  return { nimi, kesto };
}

/** Printifyn lifestyle-mockup (paita päällä): oletusvärin kuva, muuten mikä tahansa (kuten scripts/pinterest-kuvat.mjs). */
function lifeUrl(p) {
  const vi = p.variants?.variant_images || {};
  const onLife = (u) => /camera_label=(lifestyle|context)/.test(u);
  return (vi[p.variants?.default_color] || []).find(onLife) || Object.values(vi).flat().find(onLife) || (p.images || []).find(onLife) || null;
}

/** Lifestyle-ruutu: kuvasta rajataan paita (yläosa keskeltä), jotta painatus erottuu puhelimen ruudulla. */
async function lifeRuutu(v, kuvaB, otsikko) {
  const m = await sharp(kuvaB).metadata();
  const rajattu = await sharp(kuvaB).extract({ left: Math.round(m.width * 0.19), top: Math.round(m.height * 0.01), width: Math.round(m.width * 0.62), height: Math.round(m.height * 0.62) }).jpeg().toBuffer();
  return tuoteruutu({ ...v, personoitu: true }, rajattu, otsikko.teksti, otsikko.etuliite);
}

/** Tietoruutu: otsikko korostusvärillä, rivit valkoisella ja pakollinen pieni teksti (esim. 30 päivän alin hinta). */
async function inforuutu(v, { otsikko, rivit, pieni }) {
  const t = TEEMAT[v.teema];
  const o = sovita(otsikko, 940, 420, { max: 120, min: 64 });
  const oKork = o.rivit.length * o.koko * 1.18;
  const y0 = 560 - oKork / 2;
  const p = pieni ? rivita(pieni, 40, 900, 0.56) : [];
  return svgPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${t.tausta}"/>
    ${tekstiSvg(o.rivit, o.koko, y0, t.korostus)}
    <rect x="${W / 2 - 220}" y="${y0 + oKork + 50}" width="440" height="8" rx="4" fill="#ffffff"/>
    ${tekstiSvg(rivit, 64, y0 + oKork + 110, "#ffffff", "Arial", 1.3)}
    ${p.length ? tekstiSvg(p, 40, 1330, "#d9d9d9", "Arial", 1.35) : ""}</svg>`);
}

/** Black Friday -pari: kaksi paitaa rinnakkain, plusmerkki ja parin hinta. */
async function pariruutu(v, kuvat, nimet) {
  const t = TEEMAT[v.teema];
  const lev = 500;
  const kortit = await Promise.all(kuvat.map(async (k) => {
    const m = await sharp(k).metadata();
    const raj = { left: Math.round(m.width * 0.11), top: Math.round(m.height * 0.1), width: Math.round(m.width * 0.78), height: Math.round(m.height * 0.78) };
    const maski = Buffer.from(`<svg width="${lev}" height="${lev}"><rect width="${lev}" height="${lev}" rx="28" fill="#fff"/></svg>`);
    return sharp(k).extract(raj).resize(lev, lev, { fit: "cover" }).composite([{ input: maski, blend: "dest-in" }]).png().toBuffer();
  }));
  const nimiRivit = nimet.map((n) => sovita(`"${n}"`, 470, 200, { max: 54, min: 34 }));
  const pohja = await svgPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${t.tausta}"/>
    <rect x="${W / 2 - pilli(v.ala) / 2}" y="250" width="${pilli(v.ala)}" height="84" rx="42" fill="${t.korostus}"/>
    ${tekstiSvg([v.ala], 46, 256, t.tausta, "Arial", 1)}
    ${tekstiSvg(["KAKSI T-PAITAA"], 110, 380, "#ffffff")}
    ${nimiRivit.map((n, i) => n.rivit.map((r, j) => `<text x="${30 + lev / 2 + i * (lev + 20)}" y="${1220 + j * n.koko * 1.1}" font-family="Anton" font-size="${n.koko}" fill="#ffffff" text-anchor="middle">${xml(r)}</text>`).join("")).join("")}
    ${tekstiSvg([eur(BF.parihinta)], 170, 1330, t.korostus)}</svg>`);
  // Plusmerkki korttien väliin, korttien päälle.
  const plus = await svgPng(`<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><circle cx="70" cy="70" r="54" fill="${t.korostus}"/><text x="70" y="100" font-family="Anton" font-size="84" fill="${t.tausta}" text-anchor="middle">+</text></svg>`);
  return sharp(pohja).composite([...kortit.map((k, i) => ({ input: k, left: 30 + i * (lev + 20), top: 650 })), { input: plus, left: W / 2 - 70, top: 650 + lev / 2 - 70 }]).png().toBuffer();
}

/** Personoidun paidan esikatselu kuten kaupan sivulla (src/components/PersonoituMockup.tsx): siluetti ja painokuva. */
async function personoituEsikatselu({ malli, vari, ...arvot }) {
  const pers = tarkistaPersonointi({ malli, ...arvot });
  if (!pers.ok) throw new Error(`${malli}: ${pers.virhe}`);
  const tayte = { Musta: "#1d1d1d", Valkoinen: "#f5f5f2" }[vari];
  const reuna = vari === "Valkoinen" ? "#d4d4d0" : "rgba(0,0,0,0.25)";
  const alue = PAINOALUEET["t-paita"];
  const p = { x: 330, y: 200, w: 340 };
  const h = (p.w * alue.korkeus) / alue.leveys;
  const kuva = painokuvaSvg(pers, vari, { tuote: "t-paita", fontti: "Anton" })
    .replace(/^<svg [^>]*?width="\d+" height="\d+"/, `<svg x="${p.x}" y="${p.y}" width="${p.w}" height="${h}" preserveAspectRatio="xMidYMin meet"`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1100" viewBox="-50 0 1100 1100"><rect x="-50" width="1100" height="1100" fill="#e9e6df"/>
    <g fill="${tayte}" stroke="${reuna}" stroke-width="4" stroke-linejoin="round">
      <path d="M370,70 L250,110 L60,260 L150,420 L240,360 L240,1060 L760,1060 L760,360 L850,420 L940,260 L750,110 L630,70 Q500,170 370,70 Z"/>
      <path d="M370,70 Q500,190 630,70" fill="none"/></g>${kuva}</svg>`;
  return { kuva: await svgPng(svg), pers };
}

/** Personoidun esimerkin otsikko: mallin nimi ja esimerkkinimi ("Saunan vanhin: Erkki"). */
const persOtsikko = (e) => `${MALLIT.find((m) => m.id === e.malli).nimi}: ${e.nimi}`;

/** Toisen kierroksen video: kehykset tyypin mukaan, kestot 10-13 s. */
async function teeVideo2(v) {
  const ruudut = [];
  const kestot = [];
  const tmp = join(VALI, "ruudut");
  await mkdir(tmp, { recursive: true });
  const tallenna = async (b, n, kesto) => { const p = join(tmp, `${v.nro}-${n}.png`); await writeFile(p, b); ruudut.push(p); kestot.push(kesto); };
  const k = v.muoto === "dialogi" ? await dialogi(v) : await koukku(v);
  await tallenna(k, "a", 2.4);
  if (v.pers) {
    for (const [i, e] of v.pers.entries()) {
      const { kuva: b } = await personoituEsikatselu(e);
      await tallenna(await tuoteruutu({ ...v, personoitu: true }, b, persOtsikko(e), "", false), `b${i}`, 3.0);
    }
  } else if (v.muoto === "tarjous") {
    const tt = await Promise.all(v.slugit.map((x) => tuote(x)));
    for (const p of tt) if (Math.abs(p.price - BF.kappalehinta) > 0.005 || p.category !== BF.kategoria) throw new Error(`${p.slug}: ei Black Friday -paita (${p.price} €)`);
    const kuvat = await Promise.all(tt.map((p) => kuva(p.images[0], `${p.slug}-0`)));
    await tallenna(await pariruutu(v, kuvat, tt.map((p) => paidanTeksti(p.name))), "b", 4.0);
  } else {
    const p = await tuote(v.slug);
    const life = lifeUrl(p);
    const otsikko = { teksti: paidanTeksti(p.name), etuliite: v.muoto === "dialogi" ? `${v.vastaus} ` : "" };
    if (life) await tallenna(await lifeRuutu(v, await kuva(life, `${v.slug}-life`), otsikko), "b", 3.4);
    else await tallenna(await tuoteruutu(v, await kuva(p.images[1] || p.images[0], `${v.slug}-1`), otsikko.teksti, otsikko.etuliite), "b", 3.4);
    if (!v.ilmanTuotekuvaa) await tallenna(await tuoteruutu(v, await kuva(p.images[0], `${v.slug}-0`), v.toinen || otsikko.teksti, "", !v.toinen), "c", 2.8);
  }
  const info = v.muoto === "tarjous" ? BF_INFO : v.info;
  if (info) await tallenna(await inforuutu(v, info), "i", v.muoto === "tarjous" ? 3.6 : 3.2);
  await tallenna(await loppu(v), "z", 2.4);
  await mkdir(ULOS, { recursive: true });
  const nimi = videonNimi(v);
  const kesto = koosta(ruudut, kestot, join(ULOS, `${nimi}.mp4`));
  await sharp(k).resize(540, 960).jpeg({ quality: 85 }).toFile(join(ULOS, `${nimi}.jpg`));
  return { nimi, kesto };
}

/** Julkaisupäivä (1 = 2.11.2026) muodossa { iso, fi }. */
const ALKU = "2026-11-02";
function paivays(n) {
  const d = new Date(`${ALKU}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n - 1);
  return { iso: d.toISOString().slice(0, 10), fi: `${d.getUTCDate()}.${d.getUTCMonth() + 1}.` };
}

/**
 * Julkaisulista: videot päivän ja kellonajan mukaan, kuvateksti hashtageineen (some/julkaisut.json). 2.11.2026: ei
 * UTM-linkkejä. Biossa on pelkkä huumorikauppa.fi, ja somekävijät tunnistetaan sovelluksen selaimesta ja viittaajasta
 * (api/_lib/kaynnit.js someSovellus, index.html GA4).
 */
export function julkaisulista() {
  return [...VIDEOT].sort((a, b) => a.paiva - b.paiva || a.aika.localeCompare(b.aika)).map((v) => {
    const polku = v.linkki || `/tuote/${v.slug}`;
    const teksti = /[.!?]$/.test(v.teksti) ? v.teksti : `${v.teksti}.`;
    return {
      nro: v.nro, nimi: videonNimi(v), muoto: v.muoto || "perus", paiva: paivays(v.paiva).iso, paivaFi: paivays(v.paiva).fi, aika: v.aika,
      hook: v.hook, kuvateksti: `${teksti} Linkki biossa. ${v.tagit.join(" ")}`, tagit: v.tagit, tuote: polku,
    };
  });
}

/** some/JULKAISUT.md ja some/julkaisut.json: järjestys 2.-30.11., kuvatekstit ja hashtagit (ei UTM-linkkejä). */
async function julkaisut() {
  const lista = julkaisulista();
  const rivit = [
    `# Somevideot: julkaisujärjestys ${lista[0].paivaFi}-${lista[lista.length - 1].paivaFi} (${lista.length} videota)`,
    "",
    "Videot: 1080 x 1920, 9:16, 9-13 s, H.264, hiljainen äänirata (ei puheääntä eikä musiikkia). Kansikuva on samanniminen .jpg.",
    "Lataus Coworkille: /hallinta/some (avaimellinen linkki päivän yhteenvetoviestissä). Paikallisesti kansiossa `some/videot/`.",
    "Tehty skriptillä `scripts/some-videot.mjs` (1.11.2026, videot 36-55 2.11.2026). Tuotekuvat ovat kaupan omia Printify-mockupeja ja lifestyle-kuvia.",
    "",
    "## Näin julkaiset",
    "",
    "- **Videot 1-20** iltaisin klo 18-20, **trendivideot 21-35** (POV, pariskunta, äänestys, vuodenaika) päivisin klo 11-13. **Videot 36-55** 6.11. ja 22.-30.11. molemmissa ajoissa. Sama video kaikkiin kolmeen kanavaan.",
    "- **Isävideot ennen isänpäivää 8.11.** Painettu paita ei enää ehdi isänpäiväksi, joten videot 36 ja 37 nostavat lahjakortin. Äänestysvideoissa vastaa kommentteihin ja kiinnitä paras kommentti.",
    `- **Black Friday ${BF_PAIVAT}** (muoto tarjous): kaksi ${eur(BF.kappalehinta)}:n t-paitaa ${eur(BF.parihinta)}. Kuvatekstissä on aina t-paidan hinta ja 30 päivän alin hinta; älä poista sitä. Joulun viimeinen tilauspäivä on ${JOULU_VIIMEINEN.teksti}`,
    "- **TikTok:** lisää sovelluksen oma musiikki (Commercial Music Library, jos tili on yritystili). Videossa ei ole musiikkia.",
    "- **Instagram Reels ja YouTube Shorts:** voi julkaista sellaisenaan tai lisätä sovelluksen oman äänen.",
    "- **Bio joka kanavaan:** pelkkä huumorikauppa.fi. Kuvatekstissä mainitaan vain \"linkki biossa\" tai huumorikauppa.fi, ei pitkiä linkkejä.",
    "- Käynnit tunnistetaan lähteittäin automaattisesti (Instagramin, TikTokin, Facebookin ja Pinterestin sovelluksen selain ja viittaaja).",
    "",
    "## Julkaisujärjestys",
    "",
  ];
  let edellinen = null;
  for (const v of lista) {
    if (v.paiva !== edellinen) { rivit.push(`### ${v.paivaFi}`, ""); edellinen = v.paiva; }
    rivit.push(`**Klo ${v.aika}: video ${v.nro} (${v.muoto}): ${v.hook}**`, "",
      `- **Video:** \`some/videot/${v.nimi}.mp4\``,
      `- **Kuvateksti:** ${v.kuvateksti}`, "");
  }
  rivit.push("## Seuranta", "",
    "- Käynnit lähteittäin (tiktok, instagram, youtube) näkyvät sivulla /hallinta/mittarit ja päivän yhteenvetoviestissä.",
    "- GA4 näyttää samat lähteet (Hankinta > Liikenteen hankinta, medium social), kun kävijä on antanut analytiikkasuostumuksen.",
    "- Arvioi 7 päivän jälkeen, mikä muoto ja aihe tuo eniten käyntejä, ja tee siitä lisää versioita.", "");
  await writeFile(join(JUURI, "some/JULKAISUT.md"), rivit.join("\n"));
  await writeFile(join(JUURI, "some/julkaisut.json"), JSON.stringify(lista, null, 1));
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const vain = process.argv.includes("--vain") ? process.argv[process.argv.indexOf("--vain") + 1] : null;
  const alkaen = process.argv.includes("--alkaen") ? Number(process.argv[process.argv.indexOf("--alkaen") + 1]) : 0;
  await mkdir(join(JUURI, "some"), { recursive: true });
  await julkaisut();
  if (!process.argv.includes("--md")) {
    for (const v of VIDEOT.filter((x) => (!vain || x.nro === vain) && Number(x.nro) >= alkaen)) {
      const r = v.kierros === 2 ? await teeVideo2(v) : await teeVideo(v);
      console.log(`${r.nimi}.mp4 ${r.kesto.toFixed(1)} s`);
    }
  }
}
