import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key);
const buckets = ['chantier-images','employe-photos','scm-images','annonce-images'];
const ROOT = '/mnt/documents/storage_export';

async function listAll(bucket, prefix='') {
  const out = [];
  let offset = 0;
  while (true) {
    const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: 1000, offset, sortBy:{column:'name',order:'asc'} });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null || item.metadata === null) {
        // folder
        const sub = await listAll(bucket, path);
        out.push(...sub);
      } else {
        out.push(path);
      }
    }
    if (data.length < 1000) break;
    offset += 1000;
  }
  return out;
}

const manifest = {};
for (const b of buckets) {
  console.log(`\n=== Bucket: ${b} ===`);
  const files = await listAll(b);
  console.log(`  ${files.length} fichiers`);
  manifest[b] = files;
  let i = 0;
  for (const path of files) {
    const { data, error } = await sb.storage.from(b).download(path);
    if (error) { console.error(`  ERR ${path}: ${error.message}`); continue; }
    const buf = Buffer.from(await data.arrayBuffer());
    const dest = `${ROOT}/${b}/${path}`;
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    i++;
    if (i % 50 === 0) console.log(`  ${i}/${files.length}`);
  }
  console.log(`  Téléchargé: ${i}/${files.length}`);
}
await writeFile(`${ROOT}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log('\nDone');
