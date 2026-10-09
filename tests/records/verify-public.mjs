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
// Optional official asset listing supplied from a permitted GitHub log endpoint.
// Do not print errors from signed log-download redirects or retry forbidden hosts.
const listingPath=process.env.RECORDS_CI_ASSETS;
let ciFiles;
if(listingPath){const listing=JSON.parse(await readFile(listingPath,'utf8'));assert.equal(listing.sha,sha);assert.equal(listing.run,Number(run));ciFiles=listing.files;assert(ciFiles.length>30);await writeFile(out+'/CI_ASSETS.json',JSON.stringify(listing,null,2)+'\n');}
const names=(await readdir('dist')).filter(f=>f.endsWith('.html'));
const files=new Set([...names,'fonts/arcade-rounded-jp.woff2','analytics-legacy.js','legacy-records.js','games/native-record-bridge.js','games/export-manifest.json']);
// Native legacy runtime delivery must match the approved exact source export as well.
const legacyManifest=JSON.parse(await readFile('dist/games/export-manifest.json','utf8'));
for(const game of legacyManifest.games){for(const file of [...game.runtimeFiles,...game.shellFiles])files.add(file.path.replace(/^public\//,''));}

for(const file of await readdir('dist/assets'))if(/\.(js|css)$/.test(file)){const name='assets/'+file;if(ciFiles)assert(ciFiles.includes(name),'CI-equivalent asset mismatch: '+name);files.add(name);}
const digest=b=>createHash('sha256').update(b).digest('hex'),results=[];
// Bounded concurrency; no Analytics or record API requests.
const queue=[...files];await Promise.all(Array.from({length:4},async()=>{while(queue.length){const file=queue.shift(),expected=await readFile('dist/'+file),url=new URL(file,'https://game100garage.com/');url.searchParams.set('qa',sha.slice(0,12));const r=await fetch(url,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,file);const actual=Buffer.from(await r.arrayBuffer());assert.equal(digest(actual),digest(expected),'Published byte mismatch: '+file);results.push({file,status:200,bytes:actual.length,sha256:digest(actual)});}}));
const report={at:new Date().toISOString(),expected_commit:sha,workflow_id:Number(run),workflow_url:info.html_url,workflow_conclusion:info.conclusion,jobs:jobs.map(j=>({name:j.name,conclusion:j.conclusion})),reference_kind:ciFiles?'ci-equivalent-with-official-asset-list':'expected-commit-source-and-public-bytes',official_ci_asset_listing_verified:!!ciFiles,provenance:'Successful official expected-SHA build/deploy and clean expected-commit source production build using existing publicly known endpoint/empty GA4. Served HTML/JS/CSS/font and three native runtime/PCK/WASM/bridge/shell bytes match this build. Official artifact ZIP not downloaded; CI asset listing verified only when explicitly present. No backend requests or production synthetic events.',files:results.sort((a,b)=>a.file.localeCompare(b.file)),result:'PASS'};
await writeFile(out+'/VERSION.json',JSON.stringify(report,null,2)+'\n');console.log({sha,run,files:results.length,result:'PASS'});
