/**
 * Lahjakortti tulostettavana PDF:nä (1.11.2026): yksi A4-sivu, vektorigrafiikka ja PDF:n vakiofontit (Helvetica,
 * WinAnsi-merkistö: ä, ö, å ja € toimivat). Ei riippuvuuksia, joten toimii Vercelin funktiossa sellaisenaan.
 * Käyttö: kiitossivun latauslinkki (api/order.js ?lahjakortti=) ja sähköpostin liite (lahjakortti-db.js).
 */

// WinAnsiEncoding: Latin-1 sellaisenaan, € = 0x80. Muut merkit korvataan kysymysmerkillä.
function winAnsi(s) {
  let out = "";
  for (const ch of String(s ?? "")) {
    const c = ch === "€" ? 0x80 : ch.codePointAt(0);
    const k = c === 0x80 || (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) ? c : 0x3f;
    out += k === 0x28 || k === 0x29 || k === 0x5c ? `\\${String.fromCharCode(k)}` : k > 0x7e ? `\\${k.toString(8).padStart(3, "0")}` : String.fromCharCode(k);
  }
  return out;
}

// Helvetican ja Helvetica-Boldin merkkileveydet (1/1000 em) yleisimmille merkeille keskitystä varten.
const LEVEYS = { " ": 278, ",": 278, ".": 278, "-": 333, ":": 278, "€": 556, "!": 278 };
const ISOT = { A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611, Ä: 667, Ö: 778, Å: 667 };
const ISOT_LIHAVA = { ...ISOT, A: 722, B: 722, J: 556, K: 722, L: 611, Ä: 722, Å: 722 };
const leveys = (s, koko, lihava) => [...String(s)].reduce((a, ch) => {
  if (LEVEYS[ch]) return a + LEVEYS[ch];
  if (/[0-9]/.test(ch)) return a + 556;
  if ((lihava ? ISOT_LIHAVA : ISOT)[ch]) return a + (lihava ? ISOT_LIHAVA : ISOT)[ch];
  if (/[il]/.test(ch)) return a + (lihava ? 278 : 222);
  if (/[mw]/.test(ch)) return a + (lihava ? 889 : 833);
  return a + (lihava ? 590 : 540);
}, 0) * koko / 1000;

const L = 595.28, K = 841.89; // A4 pisteinä
const vari = (hex) => [0, 2, 4].map((i) => (parseInt(hex.slice(i + 1, i + 3), 16) / 255).toFixed(3)).join(" ");

function teksti(s, x, y, koko, { lihava = false, keski = false, hex = "#1a1a1a" } = {}) {
  const tx = keski ? x - leveys(s, koko, lihava) / 2 : x;
  return `BT /${lihava ? "F2" : "F1"} ${koko} Tf ${vari(hex)} rg ${tx.toFixed(2)} ${y.toFixed(2)} Td (${winAnsi(s)}) Tj ET\n`;
}

/** Rivitys annettuun leveyteen (sanarajalta). */
function rivita(s, koko, max) {
  const rivit = [];
  let rivi = "";
  for (const sana of String(s).split(/\s+/).filter(Boolean)) {
    const koe = rivi ? `${rivi} ${sana}` : sana;
    if (leveys(koe, koko, false) > max && rivi) { rivit.push(rivi); rivi = sana; } else rivi = koe;
  }
  if (rivi) rivit.push(rivi);
  return rivit;
}

const eur = (x) => `${Number(x).toFixed(2).replace(".", ",").replace(",00", "")} €`;

/**
 * @param kortti { code, initial_value, expires_at, recipient_name?, message? }
 * @returns Buffer (application/pdf)
 */
export function lahjakorttiPdf(kortti) {
  const voimassa = new Date(kortti.expires_at).toLocaleDateString("fi-FI", { timeZone: "Europe/Helsinki" });
  const kx = 60, ky = 430, kl = L - 120, kk = 340; // kortin alue
  let s = "";
  // Kortti: tumma pohja, vaalea koodilaatikko
  s += `${vari("#14532d")} rg ${kx} ${ky} ${kl} ${kk} re f\n`;
  s += `${vari("#22c55e")} rg ${kx} ${ky + kk - 10} ${kl} 10 re f\n`;
  s += teksti("HUUMORIKAUPPA.FI", L / 2, ky + kk - 52, 15, { lihava: true, keski: true, hex: "#bbf7d0" });
  s += teksti("LAHJAKORTTI", L / 2, ky + kk - 108, 40, { lihava: true, keski: true, hex: "#ffffff" });
  s += teksti(eur(kortti.initial_value), L / 2, ky + kk - 178, 56, { lihava: true, keski: true, hex: "#ffffff" });
  if (kortti.recipient_name) s += teksti(`Saajalle: ${kortti.recipient_name}`, L / 2, ky + kk - 212, 14, { keski: true, hex: "#dcfce7" });
  s += `1 1 1 rg ${kx + 50} ${ky + 40} ${kl - 100} 62 re f\n`;
  s += teksti("KOODI", L / 2, ky + 84, 10, { lihava: true, keski: true, hex: "#4b5563" });
  s += teksti(kortti.code, L / 2, ky + 54, 26, { lihava: true, keski: true, hex: "#111827" });

  // Viesti ja ohjeet kortin alla
  let y = ky - 50;
  if (kortti.message) {
    for (const r of rivita(`"${kortti.message}"`, 13, kl - 40).slice(0, 6)) { s += teksti(r, L / 2, y, 13, { keski: true, hex: "#374151" }); y -= 19; }
    y -= 14;
  }
  s += teksti("Näin käytät lahjakortin", kx, y, 15, { lihava: true }); y -= 24;
  const ohjeet = [
    "1. Valitse tuotteet osoitteessa huumorikauppa.fi.",
    '2. Kirjoita koodi kassalla kenttään "Lahjakortin koodi".',
    "3. Lahjakortin arvo vähennetään tilauksen summasta.",
  ];
  for (const r of ohjeet) { s += teksti(r, kx, y, 12, { hex: "#374151" }); y -= 19; }
  y -= 10;
  s += teksti(`Voimassa ${voimassa} asti. Voit käyttää lahjakorttia useaan tilaukseen, kunnes saldo on käytetty.`, kx, y, 10, { hex: "#6b7280" }); y -= 15;
  s += teksti("Lahjakorttia ei voi vaihtaa rahaksi. Kysyttävää: huumorikauppa@gmail.com", kx, y, 10, { hex: "#6b7280" });

  const sisalto = Buffer.from(s, "latin1");
  const objektit = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${L} ${K}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    null, // sisältövirta
    `<< /Title (${winAnsi(`Lahjakortti ${kortti.code}`)}) /Producer (Huumorikauppa.fi) >>`,
  ];
  const osat = [Buffer.from("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n", "latin1")];
  const kohdat = [];
  let pituus = osat[0].length;
  objektit.forEach((o, i) => {
    const runko = o === null
      ? Buffer.concat([Buffer.from(`${i + 1} 0 obj\n<< /Length ${sisalto.length} >>\nstream\n`, "latin1"), sisalto, Buffer.from("\nendstream\nendobj\n", "latin1")])
      : Buffer.from(`${i + 1} 0 obj\n${o}\nendobj\n`, "latin1");
    kohdat.push(pituus);
    osat.push(runko);
    pituus += runko.length;
  });
  const xref = `xref\n0 ${objektit.length + 1}\n0000000000 65535 f \n${kohdat.map((k) => `${String(k).padStart(10, "0")} 00000 n \n`).join("")}`;
  osat.push(Buffer.from(`${xref}trailer\n<< /Size ${objektit.length + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n${pituus}\n%%EOF\n`, "latin1"));
  return Buffer.concat(osat);
}

export const pdfTiedostonimi = (code) => `lahjakortti-${String(code).replace(/[^A-Z0-9-]/gi, "")}.pdf`;
