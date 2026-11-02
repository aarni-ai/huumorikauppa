/**
 * Anton-fontin merkkien leveydet (advance width / unitsPerEm, Anton v27, sama TTF kuin api/_lib/logopaita-kuva.js
 * haeFontti; luettu fontin hmtx-taulusta 2.11.2026). Personoidun tekstin leveys mitataan näillä sekä selaimessa että
 * palvelimella, jotta "mahtuuko teksti painoalueelle" -tarkistus antaa saman tuloksen kummassakin. Kerningiä ei
 * lasketa: todellinen teksti on korkeintaan yhtä leveä, joten arvio on varovainen.
 */
const LEVEYDET = {
  A: 0.485, B: 0.479, C: 0.474, D: 0.493, E: 0.412, F: 0.399, G: 0.485, H: 0.499, I: 0.227, J: 0.466, K: 0.472, L: 0.397,
  M: 0.746, N: 0.498, O: 0.486, P: 0.472, Q: 0.494, R: 0.477, S: 0.461, T: 0.396, U: 0.474, V: 0.469, W: 0.712, X: 0.484,
  Y: 0.446, Z: 0.41, Å: 0.485, Ä: 0.485, Ö: 0.486, Ü: 0.474, É: 0.412, È: 0.412, Á: 0.485, À: 0.485, Í: 0.227, Ó: 0.486,
  Ú: 0.474, Ñ: 0.498, Ç: 0.474, Š: 0.461, Ž: 0.41, Æ: 0.64, Ø: 0.486,
  0: 0.494, 1: 0.331, 2: 0.494, 3: 0.494, 4: 0.494, 5: 0.494, 6: 0.494, 7: 0.494, 8: 0.494, 9: 0.494,
  " ": 0.234, "-": 0.311, "'": 0.214, ".": 0.229, ",": 0.236, "!": 0.229, "?": 0.492, ":": 0.242, "&": 0.52, "/": 0.405, "+": 0.355,
};
/** Tuntematon merkki lasketaan leveimmän tavallisen kirjaimen (M) mukaan. */
const OLETUS = 0.746;

/** Tekstin leveys em-yksiköinä (kerrotaan fonttikoolla). Teksti mitataan sellaisenaan (painokuva käyttää versaaleja). */
export function leveysEm(teksti) {
  let s = 0;
  for (const m of String(teksti)) s += LEVEYDET[m] ?? OLETUS;
  return s;
}
