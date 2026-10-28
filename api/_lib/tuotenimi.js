/**
 * Tuotenimet ilman ajatusviivoja (28.10.2026). Tuotetyyppiä kuvaava loppuosa erotetaan kaupan omalla tavalla
 * pystyviivalla, muut ajatusviivat korvataan kaksoispisteellä. Slug ei muutu, joten URL:t pysyvät ennallaan.
 *
 * "100 % Lahtelaista verta – hauska t-paita" -> "100 % Lahtelaista verta | Hauska t-paita"
 * "Forssa – parempi kuin Helsinki – hauska t-paita Forssalaiselle" -> "Forssa parempi kuin Helsinki | Hauska t-paita Forssalaiselle"
 * "60v – kokenut, ei vanha | T-Paita" -> "60v kokenut, ei vanha | T-Paita" (luontevaErotin)
 * "Hauska T-Paita Palomiehelle – Sankari Savussa" -> "Hauska T-Paita Palomiehelle: Sankari Savussa"
 * "Helsinki: parempi kuin kaikki muut – itse sanoo – hauska t-paita" -> "Helsinki: parempi kuin kaikki muut, itse sanoo | Hauska t-paita"
 */
const TYYPPILIITE = /^hauska (t-paita|huppari|pitkähihainen|paita|pipo|body|tarra|peitto|juliste|seinätaulu|koriste|kangaskassi)\b/i;

export function nimiIlmanAjatusviivoja(nimi) {
  const s = String(nimi ?? "");
  if (!/[–—]/.test(s)) return s;
  const osat = s.split(/\s*[–—]\s*/).map((o) => o.trim());
  let liite = null;
  if (osat.length > 1 && TYYPPILIITE.test(osat[osat.length - 1]) && !/[|｜]/.test(osat[osat.length - 1])) {
    const l = osat.pop();
    liite = l.charAt(0).toUpperCase() + l.slice(1);
  }
  // Ensimmäinen erotin kaksoispisteeksi (jos alussa ei jo ole kaksoispistettä), loput pilkuiksi.
  const [eka, ...muut] = osat.filter(Boolean);
  const runko = muut.length ? `${eka}${eka.includes(":") ? ", " : ": "}${muut.join(", ")}` : eka;
  return luontevaErotin((liite ? `${runko} | ${liite}` : runko).replace(/\s+/g, " ").trim());
}

/**
 * Kaksoispiste pois, kun se katkaisee lauseen luonnottomasti (29.10.2026): ikä ("60v kokenut, ei vanha"),
 * "Eläkkeellä kiireinen tekemään ei mitään" ja kaupungit ("Forssa parempi kuin Helsinki"). Otsikkomaiset
 * erottimet jäävät ("Syntymäkaupunki: Tornio", "Hauska T-Paita Palomiehelle: Sankari Savussa").
 */
const LUONNOTON = [/^(\d+v?): /, /^(Eläkkeellä): /, /^([A-ZÅÄÖ][a-zåäö]+): (?=parempi kuin )/];
export function luontevaErotin(nimi) {
  let s = String(nimi ?? "");
  for (const re of LUONNOTON) s = s.replace(re, "$1 ");
  return s;
}

/** Tarvitseeko nimi korjausta (ajatusviiva tai luonnoton kaksoispiste). */
export const nimiKorjattava = (nimi) => /[–—]/.test(String(nimi ?? "")) || luontevaErotin(nimi) !== String(nimi ?? "");
export const korjaaNimi = (nimi) => luontevaErotin(nimiIlmanAjatusviivoja(nimi));
