/**
 * Kevyet teemasuodattimet (nimi/slug-säännöt). Laskeutumissivut (src/data/landingPages.ts) ja
 * suositukset (src/lib/recommendations.ts) käyttävät näitä. Erillään landingPages.ts:stä, jotta
 * etusivu ja koriin lisäyksen paneeli eivät tuo laskeutumissivujen tekstejä pääpakettiin.
 */

/** Suodattimen tarvitsemat kentät. */
export interface ThemeProduct {
  name: string;
  slug: string;
  description?: string | null;
}

const lower = (p: ThemeProduct) => `${p.name} ${p.slug}`.toLowerCase();

/** Kaupunkituotteet (kuvauksessa #kaupunki:Nimi). */
export const isCityProduct = (p: ThemeProduct) => (p.description ?? "").includes("#kaupunki:");

/** Nimi tai slug vastaa jotain säännöllistä lauseketta (kaupunkituotteet eivät kuulu teemoihin). */
export const theme =
  (...patterns: RegExp[]) =>
  (p: ThemeProduct) =>
    !isCityProduct(p) && patterns.some((re) => re.test(lower(p)));

export const TONNIN_SETELI_PATH = "/tonnin-seteli-paita";
/** Se oli tonnin seteli / Tonnin Seteli -tuotteet (mukit suodatetaan erikseen). */
export const TONNIN_SETELI = theme(/tonnin seteli/);
/** Muut suomalaiset meemit tonnin seteli -sivulle. */
export const SUOMI_MEEMIT = theme(/oispa kaljaa/, /saatanan tunarit/, /ice aatana/, /viisaampi häipyy/, /maailman mestarit/, /suomi finland/);

export const ELAKE = theme(/eläk/, /vapautunut virallisesti/, /ikuinen viikonloppu/, /virallisesti työtön/, /-elakelaiselle\b/);

export const MEEMI = theme(
  /oispa kaljaa/, /tonnin seteli/, /ice aatana/, /saatanan tunarit/, /viisaampi häipyy/, /\bkalju/,
  /amatimies/, /museokamaa/, /alkoholi/, /maailman mestarit/,
);

export const SUOMI = theme(
  /suomi finland/, /saatanan tunarit/, /ice aatana/, /oispa kaljaa/, /viisaampi häipyy/, /isäntä/,
  /amatimies/, /maailman mestarit/, /avantouija/, /pilkkijä/, /kalassa/,
);

export const SETA = theme(
  /\bkalju/, /isäntä/, /amatimies/, /museokamaa/, /iskä ei osaa/, /asuu yksi pomo/, /alkoholi/,
  /grillimest/, /kalamies/, /oispa kaljaa/,
);

export const HARRASTUS = theme(
  /(?<![a-zåäö])pelaaja/, /lumilautailija/, /juoksija/, /kitaristi/, /rottaharrastaja/, /koiranomistaja/, /pilkkijä/,
  /valokuvaaja/, /grillimest/, /avantouija/, /retkeilijä/, /pyöräilijä/, /kuntosali/, /golfaaja/,
  /mökkeilijä/, /kalastaja/, /metsästäjä/, /kalamies/, /kalassa/, /harrastusmestari/, /autoharrastaja/,
  /valmentajani/,
);

export const AMMATTI = theme(
  /maanviljelijä/, /sähkömie/, /sähköasentaja/, /putkimie/, /poliisi/, /palomie/, /kokille/, /siivooja/,
  /linja-auto/, /myyntimie/, /asiakaspalvelija/, /parturi/, /rakennusmie/, /koodari/,
  /ammatin/, /alalla x/, /työsankari/,
);

/** Huumorisarjat suosituksiin: sama sarja = tuotteet sopivat yhteen. */
export const THEME_FAMILIES: Record<string, (p: ThemeProduct) => boolean> = {
  tonninSeteli: TONNIN_SETELI,
  suomiMeemit: SUOMI_MEEMIT,
  meemit: MEEMI,
  suomi: SUOMI,
  seta: SETA,
  ammatti: AMMATTI,
  harrastus: HARRASTUS,
  elake: ELAKE,
};
