/**
 * Lähikuva painatuksesta (2.11.2026): tuotesivun ensimmäinen kuva, jossa vitsi luetaan heti puhelimen näytöltä.
 * Rajataan tuotteen omasta Printify-mockupista (2048 px, ?s=2048), joten lähikuva on oikea jokaisella värillä eikä
 * uusia kuvatiedostoja tarvita. api/img.js ?lahi=1 käyttää tätä; tuotesivu src/lib/lahikuva.ts.
 *
 * Painatuksen alue: paidan väri on keskialueen yleisin väri; painatusta ovat pikselit, jotka eroavat siitä selvästi
 * rintamuksen hakualueella. Rajaus on neliö painatuksen ympärille marginaalilla. Jos painatusta ei löydy, käytetään
 * kiinteää rintamuksen rajausta.
 */
export const HAKUALUE = { x0: 0.24, x1: 0.76, y0: 0.14, y1: 0.72 };
/** Hupparissa huppu ja nyörit ovat rintamuksen yläosassa: haku alkaa alempaa. */
export const HAKUALUE_HUPPARI = { x0: 0.24, x1: 0.76, y0: 0.27, y1: 0.72 };
const KYNNYS = 70; // RGB-etäisyys paidan väristä
const NAYTE = 256;

const etaisyys = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Painatuksen rajaus näytekuvasta: data = RGB-tavut (leveys x korkeus x 3). Palauttaa { left, top, size } osuuksina
 * (0-1) neliörajaukselle, tai varahajauksen.
 */
export function painatuksenRajaus(data, leveys, korkeus, alue = HAKUALUE) {
  const px = (x, y) => { const i = (y * leveys + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };
  // Paidan väri: keskialueen yleisin väri (kvantisoitu 16 tasoon).
  const laskuri = new Map();
  for (let y = Math.floor(korkeus * 0.3); y < korkeus * 0.75; y += 2) {
    for (let x = Math.floor(leveys * 0.3); x < leveys * 0.7; x += 2) {
      const [r, g, b] = px(x, y);
      const k = `${r >> 4},${g >> 4},${b >> 4}`;
      laskuri.set(k, (laskuri.get(k) || 0) + 1);
    }
  }
  const yleisin = [...laskuri.entries()].sort((a, b) => b[1] - a[1])[0][0].split(",").map((v) => Number(v) * 16 + 8);
  // Osumat riveittäin: painatuksen rivit ovat tiheitä, mockupin varjot, rypyt ja nyörit harvoja. Rajaus lasketaan
  // vain tiheiden rivien osumista (1. ja 99. persentiili).
  const X0 = Math.floor(leveys * alue.x0), X1 = Math.ceil(leveys * alue.x1), Y0 = Math.floor(korkeus * alue.y0), Y1 = Math.ceil(korkeus * alue.y1);
  const osumat = [];
  for (let y = Y0; y < Y1; y++) {
    const rivi = [];
    for (let x = X0; x < X1; x++) if (etaisyys(px(x, y), yleisin) > KYNNYS) rivi.push(x);
    osumat.push(rivi);
  }
  const vara = { left: 0.25, top: alue.y0 + 0.02, size: 0.5 };
  const raja = Math.max(3, (X1 - X0) * 0.06);
  const xs = [], ys = [];
  osumat.forEach((rivi, i) => { if (rivi.length >= raja) for (const x of rivi) { xs.push(x); ys.push(Y0 + i); } });
  if (xs.length < leveys * korkeus * 0.002) return vara;
  xs.sort((a, b) => a - b);
  const p = (arr, q) => arr[Math.min(arr.length - 1, Math.floor(arr.length * q))];
  const [x0, x1, y0, y1] = [p(xs, 0.01), p(xs, 0.99), ys[0], ys[ys.length - 1]];
  const sivu = Math.max(x1 - x0, y1 - y0) * 1.22;
  const koko = Math.min(0.62, Math.max(0.3, sivu / leveys));
  const cx = (x0 + x1) / 2 / leveys, cy = (y0 + y1) / 2 / korkeus;
  const left = Math.min(1 - koko, Math.max(0, cx - koko / 2));
  const top = Math.min(1 - koko, Math.max(0, cy - koko / 2));
  return { left, top, size: koko };
}

/** Sharp-kuvasta lähikuva: neliö, leveys px. */
export async function teeLahikuva(sharp, syote, leveys, { huppari = false } = {}) {
  const { data, info } = await sharp(syote).flatten({ background: "#ffffff" }).resize(NAYTE, NAYTE, { fit: "fill" }).removeAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const r = painatuksenRajaus(data, info.width, info.height, huppari ? HAKUALUE_HUPPARI : HAKUALUE);
  const meta = await sharp(syote).metadata();
  const W = meta.width, H = meta.height;
  const koko = Math.round(r.size * Math.min(W, H));
  return sharp(syote).flatten({ background: "#ffffff" })
    .extract({ left: Math.round(r.left * W), top: Math.round(r.top * H), width: Math.min(koko, W), height: Math.min(koko, H) })
    .resize({ width: leveys, height: leveys, fit: "cover" });
}
