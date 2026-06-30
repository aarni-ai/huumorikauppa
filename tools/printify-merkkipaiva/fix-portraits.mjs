import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execFileSync } from 'child_process';

const DIR = dirname(fileURLToPath(import.meta.url));
const TOKEN = fs.readFileSync(join(DIR, '.printify_token'), 'utf8').trim();
const SHOP = '26630629';
const API = 'https://api.printify.com/v1';
const REQ = join(DIR, '.req3.json');
const RESULTS = join(DIR, 'pipeline-results.json');
const DESIGNS = join(DIR, 'renderer', 'designs');

const results = JSON.parse(fs.readFileSync(RESULTS));
const TMPL = {
  't-paita': JSON.parse(fs.readFileSync(join(DIR, 'tpaita_template.json'))),
  'huppari': JSON.parse(fs.readFileSync(join(DIR, 'huppari_template.json'))),
};
results.portraitUploads = results.portraitUploads || {};
results.portraitFixed = results.portraitFixed || {};
const save = () => fs.writeFileSync(RESULTS, JSON.stringify(results, null, 2));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function curlApi(method, url, bodyObj) {
  const args = ['-sS', '-X', method,
    '-H', `Authorization: Bearer ${TOKEN}`, '-H', 'Content-Type: application/json',
    '-H', 'User-Agent: Huumorikauppa-Pipeline', '-w', '__STATUS__%{http_code}'];
  if (bodyObj !== undefined) { fs.writeFileSync(REQ, JSON.stringify(bodyObj)); args.push('--data-binary', '@' + REQ); }
  args.push(url);
  const out = execFileSync('curl', args, { maxBuffer: 1e9 }).toString();
  const i = out.lastIndexOf('__STATUS__');
  return { status: parseInt(out.slice(i + 10), 10), body: out.slice(0, i) };
}
async function api(method, url, bodyObj) {
  for (let a = 0; a < 6; a++) {
    try {
      const r = curlApi(method, url, bodyObj);
      if (r.status === 429 || r.status >= 500) { await sleep(1000 * (a + 1)); continue; }
      let json = null; try { json = r.body ? JSON.parse(r.body) : null; } catch {}
      return { ...r, json };
    } catch (e) { await sleep(1500 * (a + 1)); continue; } // transient curl/SSL/network error
  }
  throw new Error(`API ${method} ${url} failed after retries`);
}

async function uploadPortrait(jokeKey) {
  if (results.portraitUploads[jokeKey]) return results.portraitUploads[jokeKey];
  const contents = fs.readFileSync(join(DESIGNS, `${jokeKey}-portrait.png`)).toString('base64');
  const r = await api('POST', `${API}/uploads/images.json`, { file_name: `${jokeKey}-portrait-v2.png`, contents });
  if (r.status !== 200 || !r.json?.id) throw new Error(`upload ${jokeKey} -> ${r.status} ${r.body.slice(0, 200)}`);
  results.portraitUploads[jokeKey] = r.json.id; save();
  return r.json.id;
}

const limit = parseInt(process.argv[2] || '9999', 10);
const targets = Object.entries(results.products).filter(([, v]) => v.type === 't-paita' || v.type === 'huppari');
console.log(`Portrait products: ${targets.length} | already fixed: ${Object.keys(results.portraitFixed).length} | limit ${limit}`);
let n = 0;
for (const [slug, v] of targets) {
  if (results.portraitFixed[slug]) continue;
  if (n >= limit) break;
  const t = TMPL[v.type];
  const uploadId = await uploadPortrait(v.jokeKey);
  const body = {
    print_areas: [{
      variant_ids: t.all_variant_ids,
      placeholders: [{ position: 'front', images: [{ id: uploadId, x: t.front.x, y: t.front.y, scale: t.front.scale, angle: t.front.angle }] }],
    }],
  };
  const r = await api('PUT', `${API}/shops/${SHOP}/products/${v.id}.json`, body);
  if (r.status !== 200) throw new Error(`update ${slug} (${v.id}) -> ${r.status} ${r.body.slice(0, 300)}`);
  results.portraitFixed[slug] = true; save();
  console.log(`  FIXED [${++n}] ${v.type.padEnd(8)} ${v.id} | ${v.title}`);
  await sleep(450);
}
console.log(`\nDONE this run: ${n}. Total fixed: ${Object.keys(results.portraitFixed).length}/${targets.length}`);
