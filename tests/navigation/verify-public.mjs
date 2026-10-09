// Extend the existing official workflow/byte verifier with shared navigation.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const [sha,run,out]=process.argv.slice(2);
execFileSync(process.execPath,['tests/leaderboards/verify-public.mjs',sha,run,out],{stdio:'inherit'});
const report=JSON.parse(await readFile(out+'/VERSION.json','utf8'));
for(const file of ['arcade-navigation.css','arcade-navigation.js']){
 const url=new URL(file,'https://game100garage.com/');url.searchParams.set('qa',sha.slice(0,12));
 const r=await fetch(url,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,file);
 const bytes=Buffer.from(await r.arrayBuffer()),expected=await readFile('dist/'+file);
 const hash=b=>createHash('sha256').update(b).digest('hex');assert.equal(hash(bytes),hash(expected),file);
 report.files.push({file,status:200,bytes:bytes.length,sha256:hash(bytes)});
}
report.files.sort((a,b)=>a.file.localeCompare(b.file));
await writeFile(out+'/VERSION.json',JSON.stringify(report,null,2)+'\n');
console.log({navigation_assets:2,total_files:report.files.length,result:'PASS'});
