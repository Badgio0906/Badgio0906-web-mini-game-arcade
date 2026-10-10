// Official expected-SHA workflow plus CI-equivalent bytes, including real032 art.
import {execFileSync} from 'node:child_process';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [sha,run,out]=process.argv.slice(2);
assert(/^[a-f0-9]{40}$/.test(sha));assert(/^\d+$/.test(run));assert(out);
execFileSync(process.execPath,['tests/navigation/verify-public.mjs',sha,run,out],{stdio:'inherit'});
const report=JSON.parse(await readFile(out+'/VERSION.json','utf8'));
const files=[...(await readdir('dist/assets/game032')).map(f=>'assets/game032/'+f),'assets/portal/game032.webp'];
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const file of files){
 const expected=await readFile('dist/'+file),url=new URL(file,'https://game100garage.com/');url.searchParams.set('qa',sha.slice(0,12));
 const response=await fetch(url,{signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,file);
 const bytes=Buffer.from(await response.arrayBuffer());assert.equal(hash(bytes),hash(expected),file);
 report.files.push({file,status:200,bytes:bytes.length,sha256:hash(bytes)});
}
assert(report.files.some(r=>r.file==='game032.html'));
report.files.sort((a,b)=>a.file.localeCompare(b.file));report.game032={art_files:files.length-1,thumbnail:'actual saved gameplay canvas, source and crop in asset index',analytics_and_records:'032 registration pending; no backend verification or synthetic posts'};
await writeFile(out+'/VERSION.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({result:'PASS',sha,workflow:run,total_files:report.files.length,game032_art:files.length-1}));
