// Actual published short-landscape result transitions; no production writes.
import {chromium} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out=process.env.NAV_QA_OUT,sha=process.env.RECORDS_EXPECTED_COMMIT;
if(!out||!/^[a-f0-9]{40}$/.test(sha||''))throw Error('Unique output and commit required');
await mkdir(out,{recursive:false});
const digest=b=>createHash('sha256').update(b).digest('hex');
const expectedNav=digest(await readFile('public/arcade-navigation.js'));
const raw=process.env.HTTPS_PROXY||process.env.https_proxy;
const proxy=raw?(()=>{const u=new URL(raw);return {server:u.origin,username:decodeURIComponent(u.username),password:decodeURIComponent(u.password)}})():undefined;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',proxy,args:['--no-sandbox']});
const base='https://game100garage.com/';
const report={at:new Date().toISOString(),expected_commit:sha,cases:[],posts:0,provenance:'Actual published 844x390 mobile viewport. Ordinary two-player drops/kana guesses; no model or save injection, manual scroll recovery, production score sharing, or analytics writes. Disposable local saves, consent denied. Actual navigation response bytes checked.'};
try{for(const id of ['game021','game023']){
 const c=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});await c.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
 await c.route('**/*',r=>{if(r.request().method()==='POST'){report.posts++;return r.abort()}return r.continue()});
 const p=await c.newPage();p.setDefaultTimeout(15000);const item={id,errors:[]};p.on('pageerror',e=>item.errors.push(e.message));
 try{
  const response=p.waitForResponse(r=>new URL(r.url()).pathname==='/arcade-navigation.js');
  await p.goto(base+id+'.html?qa='+sha.slice(0,12),{waitUntil:'domcontentloaded'});item.navigation_response_sha256=digest(await(await response).body());
  if(item.navigation_response_sha256!==expectedNav)throw Error('Published ordinary script URL is stale');
  // Respect existing 180ms overlay and 220ms turn gates; never bypass them.
  await p.waitForTimeout(240);
  if(id==='game021'){await p.locator('#mode-select').selectOption('two');await p.locator('#start-button').tap();await p.waitForTimeout(240);for(const col of [0,1,0,1,0,1,0]){await p.locator(`[data-column="${col}"]`).tap();await p.waitForTimeout(240)}}
  else{await p.locator('#play-button').tap();await p.waitForTimeout(240);for(let n=0;n<22&&await p.locator('#app').getAttribute('data-state')!=='result';n++){await p.locator('[data-kana][aria-disabled="false"]').first().tap();await p.waitForTimeout(240)}}
  await p.waitForSelector('#app[data-state="result"]');
  const a=p.locator('.arcade-game-header .arcade-portal-return');item.geometry=await a.evaluate(a=>{const r=a.getBoundingClientRect();return {x:r.x,y:r.y,height:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('a')===a,focus:document.activeElement?.id,scrollY}});
  if(item.geometry.y<0||item.geometry.height<44||!item.geometry.hit||item.geometry.focus!==(id==='game021'?'retry-button':'menu-title'))throw Error('Result header visibility/focus changed');
  await p.screenshot({path:`${out}/${id}-844-result.png`});await a.tap();await p.waitForURL(base+'index.html');if(item.errors.length)throw Error('Script exception');item.pass=true;item.actual_return=true;
 }catch(e){item.pass=false;item.failure=e.message;await p.screenshot({path:`${out}/${id}-failure.png`}).catch(()=>{})}
 finally{report.cases.push(item);await c.close()}
}}finally{await browser.close();report.result=report.cases.length===2&&report.cases.every(c=>c.pass)&&!report.posts?'PASS':'FAIL';await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n')}
console.log({result:report.result,cases:report.cases.length,posts:report.posts,failures:report.cases.filter(c=>!c.pass)});if(report.result!=='PASS')process.exitCode=1;
