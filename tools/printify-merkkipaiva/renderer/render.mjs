import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import satori from 'satori';
import sharp from 'sharp';
import opentype from 'opentype.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const LH = 1.1;
const COLOR = '#111111';

const FONTS = {
  anton:   { file: 'fonts/Anton-Regular.ttf',        name: 'Anton',         weight: 400 },
  archivo: { file: 'fonts/ArchivoBlack-Regular.ttf', name: 'Archivo Black', weight: 400 },
};

function loadFont(key) {
  const f = FONTS[key];
  const buf = fs.readFileSync(join(__dir, f.file));
  const ot = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  return { ...f, buf, ot };
}

function wrap(words, size, ot, usableW) {
  const lines = [];
  let cur = '';
  const width = (t) => ot.getAdvanceWidth(t, size);
  for (const w of words) {
    if (width(w) > usableW) return null;
    const trial = cur ? cur + ' ' + w : w;
    if (width(trial) <= usableW) cur = trial;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  const measured = lines.map((t) => ({ text: t, width: width(t) }));
  return { lines: measured, widest: Math.max(...measured.map((l) => l.width)) };
}

function fits(words, size, ot, usableW, usableH) {
  const r = wrap(words, size, ot, usableW);
  if (!r) return false;
  return r.widest <= usableW && r.lines.length * size * LH <= usableH;
}

function bestSize(text, ot, usableW, usableH, hiCap = 1200) {
  const words = text.split(/\s+/).filter(Boolean);
  let lo = 30, hi = hiCap, best = lo;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(words, mid, ot, usableW, usableH)) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
  }
  return { size: best, lines: wrap(words, best, ot, usableW).lines.map((l) => l.text) };
}

export async function renderPng(text, fontKey, outPath, { W, H, uw = 0.84, uh = 0.82, max = 1200 }) {
  const usableW = W * uw, usableH = H * uh;
  const font = loadFont(fontKey);
  const { size, lines } = bestSize(text, font.ot, usableW, usableH, max);

  const element = {
    type: 'div',
    props: {
      style: {
        width: W, height: H, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: `${H * 0.09}px ${W * 0.08}px`,
      },
      children: lines.map((ln) => ({
        type: 'div',
        props: {
          style: {
            fontFamily: font.name, fontWeight: font.weight, fontSize: size,
            lineHeight: LH, color: COLOR, textAlign: 'center', display: 'flex',
          },
          children: ln,
        },
      })),
    },
  };

  const svg = await satori(element, {
    width: W, height: H,
    fonts: [{ name: font.name, data: font.buf, weight: font.weight, style: 'normal' }],
  });
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  return { size, lines: lines.length };
}

const DIMS = {
  // Shirt/hoodie: restrained chest print like existing products — central band,
  // capped size so text sits mid-chest and never collides with hood/pocket.
  portrait:  { W: 4500, H: 5400, uw: 0.60, uh: 0.50, max: 450 },
  // Mug: confine text to the front face (~central 44% of the wrap) so it reads head-on.
  landscape: { W: 2700, H: 1120, uw: 0.44, uh: 0.86 },
};

// Batch: render one portrait + one landscape PNG per joke from the manifest.
if (process.argv[2] === 'batch') {
  const FONT = process.argv[3] || 'anton';
  const manifest = JSON.parse(fs.readFileSync(join(__dir, '..', 'products-manifest.json')));
  const outDir = join(__dir, 'designs');
  fs.mkdirSync(outDir, { recursive: true });
  for (const j of manifest.jokes) {
    for (const orient of ['portrait', 'landscape']) {
      const out = join(outDir, `${j.key}-${orient}.png`);
      const r = await renderPng(j.text, FONT, out, DIMS[orient]);
      console.log(`${j.key}-${orient}: size=${r.size} lines=${r.lines} | "${j.text}"`);
    }
  }
  console.log(`\nDONE: ${manifest.jokes.length * 2} PNGs in designs/`);
}
