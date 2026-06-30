import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execFileSync } from 'child_process';

const DIR = dirname(fileURLToPath(import.meta.url));
const TOKEN = fs.readFileSync(join(DIR, '.printify_token'), 'utf8').trim();
const SHOP = '26630629';
const API = 'https://api.printify.com/v1';
const REQ = join(DIR, '.req.json');
const RESULTS = join(DIR, 'pipeline-results.json');
const DESIGNS = join(DIR, 'renderer', 'designs');

const manifest = JSON.parse(fs.readFileSync(join(DIR, 'products-manifest.json')));
const TMPL = {
  't-paita': JSON.parse(fs.readFileSync(join(DIR, 'tpaita_template.json'))),
  'huppari': JSON.parse(fs.readFileSync(join(DIR, 'huppari_template.json'))),
  'muki':    JSON.parse(fs.readFileSync(join(DIR, 'muki_template.json'))),
};
let results = fs.existsSync(RESULTS)
  ? JSON.parse(fs.readFileSync(RESULTS))
  : { uploads: {}, products: {} };
const save = () => fs.writeFileSync(RESULTS, JSON.stringify(results, null, 2));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function curlApi(method, url, bodyObj) {
  const args = ['-sS', '-X', method,
    '-H', `Authorization: Bearer ${TOKEN}`,
    '-H', 'Content-Type: application/json',
    '-H', 'User-Agent: Huumorikauppa-Pipeline',
    '-w', '__STATUS__%{http_code}'];
  if (bodyObj !== undefined) { fs.writeFileSync(REQ, JSON.stringify(bodyObj)); args.push('--data-binary', '@' + REQ); }
  args.push(url);
  const out = execFileSync('curl', args, { maxBuffer: 1e9 }).toString();
  const i = out.lastIndexOf('__STATUS__');
  const status = parseInt(out.slice(i + 10), 10);
  const body = out.slice(0, i);
  let json = null; try { json = body ? JSON.parse(body) : null; } catch {}
  return { status, body, json };
}

async function api(method, url, bodyObj) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = curlApi(method, url, bodyObj);
    if (r.status === 429 || r.status >= 500) { await sleep(1000 * (attempt + 1)); continue; }
    return r;
  }
  throw new Error(`API ${method} ${url} failed after retries`);
}

async function uploadDesign(key, orient) {
  const ck = `${key}-${orient}`;
  if (results.uploads[ck]) return results.uploads[ck];
  const file = join(DESIGNS, `${ck}.png`);
  const contents = fs.readFileSync(file).toString('base64');
  const r = await api('POST', `${API}/uploads/images.json`, { file_name: `${ck}.png`, contents });
  if (r.status !== 200 || !r.json?.id) throw new Error(`upload ${ck} -> ${r.status} ${r.body.slice(0, 300)}`);
  results.uploads[ck] = r.json.id; save();
  return r.json.id;
}

async function createProduct(p) {
  const t = TMPL[p.type];
  const uploadId = await uploadDesign(p.jokeKey, p.orientation);
  const body = {
    title: p.title,
    description: p.seoDescription,
    blueprint_id: t.blueprint_id,
    print_provider_id: t.print_provider_id,
    tags: [p.tag],
    variants: t.enabled_variant_ids.map((id) => ({ id, price: t.price, is_enabled: true })),
    print_areas: [{
      variant_ids: t.enabled_variant_ids,
      placeholders: [{ position: 'front', images: [{ id: uploadId, x: t.front.x, y: t.front.y, scale: t.front.scale, angle: t.front.angle }] }],
    }],
  };
  const r = await api('POST', `${API}/shops/${SHOP}/products.json`, body);
  if (r.status !== 200 || !r.json?.id) throw new Error(`create ${p.slug} -> ${r.status} ${r.body.slice(0, 400)}`);
  return r.json.id;
}

const limit = parseInt(process.argv[2] || '9999', 10);
const todo = manifest.products.filter((p) => !results.products[p.slug]);
console.log(`Total ${manifest.products.length} | done ${Object.keys(results.products).length} | todo ${todo.length} | this run limit ${limit}`);

let n = 0;
for (const p of todo) {
  if (n >= limit) break;
  const id = await createProduct(p);
  results.products[p.slug] = { id, title: p.title, type: p.type, jokeKey: p.jokeKey };
  save();
  console.log(`  OK [${++n}] ${p.type.padEnd(8)} ${id} | ${p.title}`);
  await sleep(450);
}
console.log(`\nDONE this run: created ${n}. Total done: ${Object.keys(results.products).length}/${manifest.products.length}`);
