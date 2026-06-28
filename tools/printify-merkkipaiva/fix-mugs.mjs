import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execFileSync } from 'child_process';

const DIR = dirname(fileURLToPath(import.meta.url));
const TOKEN = fs.readFileSync(join(DIR, '.printify_token'), 'utf8').trim();
const SHOP = '26630629';
const API = 'https://api.printify.com/v1';
const REQ = join(DIR, '.req2.json');
const RESULTS = join(DIR, 'pipeline-results.json');
const DESIGNS = join(DIR, 'renderer', 'designs');

const results = JSON.parse(fs.readFileSync(RESULTS));
const muki = JSON.parse(fs.readFileSync(join(DIR, 'muki_template.json')));
results.mugUploads = results.mugUploads || {};
results.mugFixed = results.mugFixed || {};
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
  for (let a = 0; a < 5; a++) {
    const r = curlApi(method, url, bodyObj);
    if (r.status === 429 || r.status >= 500) { await sleep(1000 * (a + 1)); continue; }
    let json = null; try { json = r.body ? JSON.parse(r.body) : null; } catch {}
    return { ...r, json };
  }
  throw new Error(`API ${method} ${url} failed`);
}

async function uploadMug(jokeKey) {
  if (results.mugUploads[jokeKey]) return results.mugUploads[jokeKey];
  const contents = fs.readFileSync(join(DESIGNS, `${jokeKey}-landscape.png`)).toString('base64');
  const r = await api('POST', `${API}/uploads/images.json`, { file_name: `${jokeKey}-landscape-v2.png`, contents });
  if (r.status !== 200 || !r.json?.id) throw new Error(`upload ${jokeKey} -> ${r.status} ${r.body.slice(0, 200)}`);
  results.mugUploads[jokeKey] = r.json.id; save();
  return r.json.id;
}

const mugs = Object.entries(results.products).filter(([, v]) => v.type === 'muki');
console.log(`Mugs to fix: ${mugs.length}`);
let n = 0;
for (const [slug, v] of mugs) {
  if (results.mugFixed[slug]) { continue; }
  const uploadId = await uploadMug(v.jokeKey);
  const body = {
    print_areas: [{
      variant_ids: muki.enabled_variant_ids,
      placeholders: [{ position: 'front', images: [{ id: uploadId, x: muki.front.x, y: muki.front.y, scale: muki.front.scale, angle: muki.front.angle }] }],
    }],
  };
  const r = await api('PUT', `${API}/shops/${SHOP}/products/${v.id}.json`, body);
  if (r.status !== 200) throw new Error(`update ${slug} (${v.id}) -> ${r.status} ${r.body.slice(0, 300)}`);
  results.mugFixed[slug] = true; save();
  console.log(`  FIXED [${++n}] ${v.id} | ${v.title}`);
  await sleep(450);
}
console.log(`\nDONE: fixed ${n} mugs.`);
