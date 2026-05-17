#!/usr/bin/env node
/**
 * Importe tous les fichiers d'un dossier `storage_export/` vers les buckets Supabase Storage.
 *
 * Prérequis :
 *   - Avoir SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans l'environnement
 *     (disponibles automatiquement dans le sandbox Lovable Cloud).
 *   - Avoir décompressé scm_storage_files.zip à la racine du projet,
 *     ce qui crée le dossier `storage_export/<bucket>/...`.
 *
 * Usage :
 *   bun scripts/import-storage.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Manque SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(url, key);

const ROOT = 'storage_export';
const BUCKETS = ['chantier-images', 'employe-photos', 'scm-images', 'annonce-images'];

const mime = (p) => {
  const ext = p.toLowerCase().split('.').pop();
  return ({
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    gif: 'image/gif', svg: 'image/svg+xml', pdf: 'application/pdf',
  }[ext]) || 'application/octet-stream';
};

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

for (const bucket of BUCKETS) {
  const base = join(ROOT, bucket);
  try { await stat(base); } catch { console.log(`(saut) ${bucket} : dossier absent`); continue; }
  // S'assurer que le bucket existe (public)
  await sb.storage.createBucket(bucket, { public: true }).catch(() => {});
  const files = await walk(base);
  console.log(`\n=== ${bucket} : ${files.length} fichiers ===`);
  let ok = 0, ko = 0;
  for (const full of files) {
    const path = relative(base, full).split(/[\\/]/).join('/');
    const body = await readFile(full);
    const { error } = await sb.storage.from(bucket).upload(path, body, {
      contentType: mime(path), upsert: true,
    });
    if (error) { ko++; console.error(`  KO ${path}: ${error.message}`); }
    else { ok++; if (ok % 25 === 0) console.log(`  ${ok}/${files.length}`); }
  }
  console.log(`  Terminé : ${ok} ok, ${ko} erreurs`);
}
console.log('\nImport Storage terminé.');
