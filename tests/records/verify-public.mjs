// Verify the expected official workflow and its hash-named asset listing,
// then compare published bytes with the clean, CI-equivalent production build.
import {execFileSync} from 'node:child_process';
import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [sha,run,out]=process.argv.slice(2);
assert(/^[a-f0-9]{40}$/.test(sha));assert(/^\d+$/.test(run));assert(out);
await mkdir(out,{recursive:false});
const repo='Badgio0906/Badgio0906-web-mini-game-arcade';
const api=p=>JSON.parse(execFileSync('gh',['api',`repos/${repo}/${p}`],{encoding:'utf8'}));
const info=api(`actions/runs/${run}`), jobs=api(`actions/runs/${run}/jobs`).jobs;
assert.equal(info.head_sha,sha);assert.equal(info.conclusion,'success');
for(const name of ['build','deploy'])assert(jobs.some(j=>j.name===name&&j.conclusion==='success'));
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sha);
assert.equal(execFileSync('git',['diff','HEAD','--','src','public','index.html','privacy.html','vite.config.ts'],{encoding:'utf8'}),'');
const log=execFileSync('gh',['run','view',run,'--repo',repo,'--log'],{encoding:'utf8',maxBuffer:8*1024*1024});
const ciFiles=[...new Set([...log.matchAll(/dist\/(assets\/[^\s]+\.(?:js|css))/g)].map(m=>m[1]))];
assert(ciFiles.length>30,'Official CI asset listing missing');
await writeFile(out+'/CI_ASSETS.json',JSON.stringify({sha,run:Number(run),files:ciFiles},null,2)+'\n');
const names=(await readdir('dist')).filter(f=>f.endsWith('.html'));
const files=new Set([...names,'fonts/arcade-rounded-jp.woff2']);
for(const file of await readdir('dist/assets'))if(/\.(js|css)$/.test(file)){const name='assets/'+file;assert(ciFiles.includes(name),'CI-equivalent asset mismatch: '+name);files.add(name);}
const digest=b=>createHash('sha256').update(b).digest('hex'),results=[];
// Bounded concurrency; no Analytics or record API requests.
const queue=[...files];await Promise.all(Array.from({length:4},async()=>{while(queue.length){const file=queue.shift(),expected=await readFile('dist/'+file),url=new URL(file,'https://game100garage.com/');url.searchParams.set('qa',sha.slice(0,12));const r=await fetch(url,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,file);const actual=Buffer.from(await r.arrayBuffer());assert.equal(digest(actual),digest(expected),'Published byte mismatch: '+file);results.push({file,status:200,bytes:actual.length,sha256:digest(actual)});}}));
const report={at:new Date().toISOString(),expected_commit:sha,workflow_id:Number(run),workflow_url:info.html_url,workflow_conclusion:info.conclusion,jobs:jobs.map(j=>({name:j.name,conclusion:j.conclusion})),reference_kind:'ci-equivalent',provenance:'Clean expected-commit source production build using existing publicly known endpoint/empty GA4. Every JS/CSS filename matches official CI build logs; served bytes match this build. Official artifact ZIP not downloaded. No backend requests or production synthetic events.',files:results.sort((a,b)=>a.file.localeCompare(b.file)),result:'PASS'};
await writeFile(out+'/VERSION.json',JSON.stringify(report,null,2)+'\n');console.log({sha,run,files:results.length,result:'PASS'});
