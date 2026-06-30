import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dir = dirname(fileURLToPath(import.meta.url));

// Mirrors slugify() in supabase/functions/_shared/printify-sync.ts exactly.
function slugify(text) {
  return (text || "")
    .toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/å/g, 'a')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// guide keys
const G_MIES = '/blogi/lahja-miehelle-30v-40v-50v-60v';
const G_NAINEN = '/blogi/lahja-naiselle-30v-40v-50v-60v';
const G_ELAKE = '/blogi/hauskimmat-elakelahjat-selviytymisopas';

// Each joke: guide, audience label for SEO, age (or 'elake'), and the print text.
const jokes = [
  // MIEHELLE
  { guide: G_MIES, aud: 'miehelle', age: 30, text: 'Level 30 – selkä rusahtaa nyt' },
  { guide: G_MIES, aud: 'miehelle', age: 30, text: '30 ja liian vanha tyhmyyksiin (teen ne silti)' },
  { guide: G_MIES, aud: 'miehelle', age: 40, text: '40v – kunto kuin 20v, 20 vuotta sitten' },
  { guide: G_MIES, aud: 'miehelle', age: 40, text: '40 vuotta, henkisesti 18' },
  { guide: G_MIES, aud: 'miehelle', age: 40, text: '40v – ei keski-ikä, klassikko' },
  { guide: G_MIES, aud: 'miehelle', age: 50, text: '50v – puoli vuosisataa, ei naarmuakaan' },
  { guide: G_MIES, aud: 'miehelle', age: 50, text: '50 ja paras vasta tulossa' },
  { guide: G_MIES, aud: 'miehelle', age: 60, text: '60v – mutta fyysinen kunto kuin 20v' },
  { guide: G_MIES, aud: 'miehelle', age: 60, text: '60 vuotta nuori' },
  { guide: G_MIES, aud: 'miehelle', age: 60, text: '60v – takuu mennyt, toimii silti' },
  // NAISELLE
  { guide: G_NAINEN, aud: 'naiselle', age: 30, text: '30 ja loistossaan' },
  { guide: G_NAINEN, aud: 'naiselle', age: 30, text: '30v – paranen iän myötä kuin viini' },
  { guide: G_NAINEN, aud: 'naiselle', age: 40, text: '40v – henkisesti 18, tyylillä 40' },
  { guide: G_NAINEN, aud: 'naiselle', age: 40, text: '40 ja fabulous' },
  { guide: G_NAINEN, aud: 'naiselle', age: 40, text: '40v – ei vanha, vintage' },
  { guide: G_NAINEN, aud: 'naiselle', age: 50, text: '50 ja hopeanhohtoinen (vain hiukset)' },
  { guide: G_NAINEN, aud: 'naiselle', age: 50, text: '50v – klassikkomalli' },
  { guide: G_NAINEN, aud: 'naiselle', age: 60, text: '60v – mutta sydän kuin 20v' },
  { guide: G_NAINEN, aud: 'naiselle', age: 60, text: '60 vuotta nuori ja nokkela' },
  { guide: G_NAINEN, aud: 'naiselle', age: 60, text: '60v – kokenut, ei vanha' },
  // ELAKE
  { guide: G_ELAKE, aud: 'eläkeläiselle', age: 'elake', text: 'Eläkkeellä – kiireinen tekemään ei mitään' },
  { guide: G_ELAKE, aud: 'eläkeläiselle', age: 'elake', text: 'Virallisesti työtön, epävirallisesti vapaa' },
  { guide: G_ELAKE, aud: 'eläkeläiselle', age: 'elake', text: '40 vuotta töitä, nyt ikuinen viikonloppu' },
  { guide: G_ELAKE, aud: 'eläkeläiselle', age: 'elake', text: 'Eläkeläinen – aamuherätys vapaaehtoinen' },
];

const TYPES = [
  { suffix: 'T-Paita', disp: 'T-paita', cat: 't-paidat', price: '24,90 €', material: '100 % puuvillaa (180 g/m2)' },
  { suffix: 'Huppari', disp: 'Huppari', cat: 'hupparit', price: '49,90 €', material: 'pehmeä puuvilla-polyesterisekoite' },
  { suffix: 'Muki', disp: 'Muki', cat: 'mukit', price: 'Printify-määräinen', material: '11 oz keraaminen muki' },
];

function seoTitle(j, t) {
  const who = j.age === 'elake' ? 'Hauska eläkelahja' : `Hauska ${j.age}v lahja ${j.aud}`;
  return `${who} – ${t.disp} | Huumorikauppa`;
}
function seoDesc(j, t) {
  const occ = j.age === 'elake' ? 'eläkelahja' : `${j.age}-vuotislahja ${j.aud}`;
  return `${j.text} – hauska ${occ}. ${t.material}. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.`;
}

let md = `# Merkkipäivätuotteet – handoff-spec (DRAFT, hyväksyttäväksi)

Generoitu skriptillä. Slugit laskettu täsmälleen \`printify-sync.ts\`:n \`slugify()\`-logiikalla,
joten kun Printify-tuotenimi asetetaan sarakkeen **Printify-tuotenimi** mukaan, auto-sync tuottaa
täsmälleen sarakkeen **Slug** mukaisen URL:n (\`huumorikauppa.fi/tuote/<slug>\`).

**Työnkulku:** designit + tuotteet luodaan Printifyssä → pidetään **draftina** (ei julkaista) →
auto-sync tuo julkaistut Supabaseen → hyväksynnän jälkeen lisään opaslinkit.

- T-paita: 24,90 € · Huppari: 49,90 € · Muki: hinta Printifystä (ei kategoriaylikirjoitusta).
- Tuotteita yhteensä: ${jokes.length} vitsiä × 3 tyyppiä = ${jokes.length * 3}.

`;

const guideNames = {
  [G_MIES]: 'Opas: lahja miehelle (30/40/50/60v)',
  [G_NAINEN]: 'Opas: lahja naiselle (30/40/50/60v)',
  [G_ELAKE]: 'Opas: hauskat eläkelahjat',
};

const allSlugs = [];
for (const guide of [G_MIES, G_NAINEN, G_ELAKE]) {
  md += `\n## ${guideNames[guide]}\n→ linkitetään: \`${guide}\`\n\n`;
  md += `| Painoteksti | Tyyppi | Printify-tuotenimi | Slug | SEO-title | Hinta |\n`;
  md += `|---|---|---|---|---|---|\n`;
  for (const j of jokes.filter(x => x.guide === guide)) {
    for (const t of TYPES) {
      const name = `${j.text} | ${t.suffix}`;
      const slug = slugify(name);
      allSlugs.push(slug);
      const esc = (s) => s.replace(/\|/g, '\\|');
      md += `| ${esc(j.text)} | ${t.disp} | ${esc(name)} | \`${slug}\` | ${esc(seoTitle(j, t))} | ${t.price} |\n`;
    }
  }
}

// SEO descriptions appendix
md += `\n## SEO-meta descriptions (per tuote)\n\n`;
for (const guide of [G_MIES, G_NAINEN, G_ELAKE]) {
  for (const j of jokes.filter(x => x.guide === guide)) {
    for (const t of TYPES) {
      const name = `${j.text} | ${t.suffix}`;
      md += `- **${slugify(name)}**: ${seoDesc(j, t)}\n`;
    }
  }
}

// Validation report to stderr
const dupes = allSlugs.filter((s, i) => allSlugs.indexOf(s) !== i);
const leading = allSlugs.filter(s => s.startsWith('-') || s.endsWith('-'));
console.error(`Total slugs: ${allSlugs.length}`);
console.error(`Duplicate slugs: ${dupes.length ? dupes.join(', ') : 'none'}`);
console.error(`Leading/trailing-hyphen slugs: ${leading.length ? leading.join(', ') : 'none'}`);

// ---- machine-readable manifest for the Printify pipeline ----
const TYPE_CFG = {
  'T-Paita': { type: 't-paita', tag: 't-shirt', orientation: 'portrait' },
  'Huppari': { type: 'huppari', tag: 'hoodie',  orientation: 'portrait' },
  'Muki':    { type: 'muki',    tag: 'mug',     orientation: 'landscape' },
};
const manifestJokes = [];
const manifestProducts = [];
let jk = 0;
for (const guide of [G_MIES, G_NAINEN, G_ELAKE]) {
  for (const j of jokes.filter((x) => x.guide === guide)) {
    const key = 'j' + String(++jk).padStart(2, '0');
    manifestJokes.push({ key, text: j.text, guide, age: j.age });
    for (const t of TYPES) {
      const cfg = TYPE_CFG[t.suffix];
      const name = `${j.text} | ${t.suffix}`;
      manifestProducts.push({
        jokeKey: key, type: cfg.type, tag: cfg.tag, orientation: cfg.orientation,
        title: name, slug: slugify(name), seoTitle: seoTitle(j, t), seoDescription: seoDesc(j, t),
      });
    }
  }
}
fs.writeFileSync(join(__dir, 'products-manifest.json'),
  JSON.stringify({ jokes: manifestJokes, products: manifestProducts }, null, 2));
console.error(`Manifest: ${manifestJokes.length} jokes, ${manifestProducts.length} products`);

// ---- guide recommendations (blog slug -> age groups -> product slugs) ----
const jokeByKey = Object.fromEntries(manifestJokes.map((j) => [j.key, j]));
const reco = {};
for (const guide of [G_MIES, G_NAINEN, G_ELAKE]) {
  const gkey = guide.replace('/blogi/', '');
  const order = [];
  const groups = {};
  for (const p of manifestProducts) {
    const j = jokeByKey[p.jokeKey];
    if (j.guide !== guide) continue;
    const ak = String(j.age);
    if (!groups[ak]) { groups[ak] = []; order.push(ak); }
    groups[ak].push(p.slug);
  }
  reco[gkey] = order.map((ak) => ({
    title: ak === 'elake' ? 'Eläkkeelle jäävälle' : `${ak}-vuotiaalle`,
    slugs: groups[ak],
  }));
}
const recoTs = `// AUTO-GENERATED by tools/printify-merkkipaiva/gen-spec.mjs — do not edit by hand.
// Maps a blog guide slug to age-grouped product slugs. Cards resolve live via useProducts().
export interface GuideRecoGroup {
  title: string;
  slugs: string[];
}

export const guideRecommendations: Record<string, GuideRecoGroup[]> = ${JSON.stringify(reco, null, 2)};
`;
fs.writeFileSync(join(__dir, 'guideRecommendations.ts'), recoTs);
console.error(`Recommendations: ${Object.keys(reco).length} guides`);

process.stdout.write(md);
