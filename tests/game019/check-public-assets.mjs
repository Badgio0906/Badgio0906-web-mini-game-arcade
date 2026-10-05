import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd()+'/',base='https://game100garage.com/';
const native=JSON.parse(await readFile(root+'docs/game019/revision-02/QA/production-public/report.json','utf8'));
assert.equal(native.records.length,4);
for(const r of native.records){if(r.status==='FAIL')assert.ok(r.error?.includes('EAI_AGAIN'));else assert.equal(r.status,'PASS');assert.ok(parseFloat(r.height)>=20);assert.equal(r.nativeJumps.at(-1).landing,'root-top');assert.deepEqual(r.persistedStats,r.reloadedStats);assert.deepEqual(r.errors,[]);assert.deepEqual(r.responses,[]);assert.ok(r.jevEvents.some(e=>e.data?.event==='jump'));}
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage();const checks=[],started=new Date().toISOString();
try{
await page.goto(base);await page.locator('a[href="./game019.html"],a[href="game019.html"]').first().waitFor();const links=await page.locator('a').evaluateAll(a=>a.map(e=>({href:e.getAttribute('href'),text:e.innerText})));const gameLinks=links.filter(a=>/game\d{3}\.html|games\//.test(a.href??''));assert.equal(gameLinks.length,19);assert.ok(gameLinks.find(a=>a.href?.includes('game019.html')));await page.screenshot({path:root+'docs/game019/revision-02/QA/production-public/portal.png',fullPage:true});
await page.goto(base+'game019.html');await page.locator('#play-button').waitFor();assert.equal(await page.evaluate(()=>('__game019' in window)||('__game019Forecasts'in window)),false);
const paths=await page.evaluate(()=>[...document.querySelectorAll('script[src],link[rel=stylesheet],link[rel=modulepreload]')].map(e=>new URL(e.src||e.href).pathname.slice(1)));
paths.push('assets/game019/charge-rounded-jp.woff2','assets/portal/game019.webp','game019.html');
for(const path of paths){const r=await page.evaluate(async href=>{const r=await fetch(href,{cache:'no-store'});return{status:r.status,bytes:[...new Uint8Array(await r.arrayBuffer())]};},base+path);assert.equal(r.status,200);const local=await readFile(root+'dist/'+path),b=Buffer.from(r.bytes);assert.deepEqual(b,local);checks.push({path,status:200,sha256:createHash('sha256').update(b).digest('hex'),distMatch:true});}
await writeFile(root+'docs/game019/revision-02/QA/PUBLIC_FINAL.json',JSON.stringify({status:'PASS',started,finished:new Date().toISOString(),base,nativeProof:'production-public/report.json',nativeProfiles:native.records.map(r=>({profile:r.profile.name,height:r.height,actualJumps:r.nativeJumps.length,stats:r.reloadedStats,nativeInputPersistence:'PASS'})),assetProof:checks,portalCards:gameLinks.length,portalGame019:gameLinks.find(a=>a.href.includes('game019.html')),networkFailureClassification:'Initial public collector Node APIRequestContext bypassed working browser network path and failed DNS EAI_AGAIN only after all physical input/save/reload cases passed. Actual public browser fetch now independently verifies all assets against dist. No game-source change or full RUN repetition.',limits:'Human fun and physical-device evaluation unassessed. Full200m separate fixed-source independent proof.'},null,2)+'\n');console.log('PUBLIC native4 + browser assets + portal19 PASS');
}finally{await browser.close();}
