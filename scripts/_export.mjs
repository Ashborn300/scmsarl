import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const buckets = ['chantier-images','employe-photos','scm-images','annonce-images'];
const ROOT = '/mnt/documents/export-scm/storage_export';
async function listAll(b, prefix='') {
  const out=[]; let offset=0;
  while(true){
    const {data,error}=await sb.storage.from(b).list(prefix,{limit:1000,offset,sortBy:{column:'name',order:'asc'}});
    if(error)throw error; if(!data||!data.length)break;
    for(const it of data){
      const p=prefix?`${prefix}/${it.name}`:it.name;
      if(it.id===null||it.metadata===null){ out.push(...await listAll(b,p)); }
      else out.push(p);
    }
    if(data.length<1000)break; offset+=1000;
  }
  return out;
}
const manifest={};
for(const b of buckets){
  console.log(`\n=== ${b} ===`);
  const files=await listAll(b);
  manifest[b]=files;
  console.log(`  ${files.length} fichiers`);
  let i=0;
  for(const p of files){
    const {data,error}=await sb.storage.from(b).download(p);
    if(error){console.error(`  ERR ${p}: ${error.message}`);continue;}
    const buf=Buffer.from(await data.arrayBuffer());
    const dest=`${ROOT}/${b}/${p}`;
    await mkdir(dirname(dest),{recursive:true});
    await writeFile(dest,buf);
    i++;
    if(i%50===0)console.log(`  ${i}/${files.length}`);
  }
  console.log(`  OK ${i}/${files.length}`);
}
await mkdir(ROOT,{recursive:true});
await writeFile(`${ROOT}/manifest.json`,JSON.stringify(manifest,null,2));
console.log('Done');
