import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {read,until,input,tutorial,sequence} from './helpers.mjs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const records=[];
try {
 for (const denied of [false,true]) {
 const context=await browser.newContext({viewport:{width:1440,height:900}});if(denied)await context.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('denied','SecurityError');}});});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const record={kind:denied?'storage-denied':'native-input-lifecycle',checks:[],runtimeWrites:false};records.push(record);
 try {
 await page.goto('http://127.0.0.1:5181/game018.html');await tutorial(page,false);await input(page,false,'#start-button');
 if(!denied) {
  const box=await page.locator('#shoe-canvas').boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2,{button:'right'});assert.equal((await read(page)).snapshot.phase,'angle');
  await page.keyboard.down('Shift');await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await page.keyboard.up('Shift');assert.equal((await read(page)).snapshot.phase,'angle');record.checks.push('secondary and Shift canvas rejected');
  await page.keyboard.down('Space');assert.equal((await read(page)).snapshot.phase,'angle-lock');await until(page,r=>r.snapshot.phase==='spin','spin');await page.keyboard.down('Space');assert.equal((await read(page)).snapshot.phase,'spin');await page.keyboard.up('Space');await page.keyboard.press('Space');assert.equal((await read(page)).snapshot.phase,'spin-lock');record.checks.push('held Space cannot carry into next phase; fresh key stops');
  await until(page,r=>r.snapshot.phase==='power','power');await input(page,false,'#mute-button');const phase=(await read(page)).snapshot.phase;await page.locator('#mute-button').focus();await page.keyboard.press('Space');assert.equal((await read(page)).snapshot.phase,phase);record.checks.push('header Space toggles native button without stopping gauge');
  await input(page,false,'#pause-button');const frozen=await read(page);await page.waitForTimeout(240);assert.equal((await read(page)).snapshot.time,frozen.snapshot.time);await input(page,false,'#resume-button');
  // Begin in POWER, keep pointer held through kick and release after phase changes.
  await page.locator('#control-button').hover();await page.mouse.down();await until(page,r=>r.snapshot.phase==='flight','flight');await page.mouse.up();assert.equal((await read(page)).snapshot.phase,'flight');record.checks.push('old pointer release does not change flight');
  await input(page,false,'#pause-button');await input(page,false,'#title-button');await input(page,false,'#play-button');await input(page,false,'#start-button');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await read(page)).state,'paused');record.checks.push('synthetic blur fixture pauses');await input(page,false,'#title-button');
  const before=await read(page);assert.equal(before.events.filter(e=>e.name==='run_end'&&e.data.outcome==='quit').length,2);assert.equal(before.events.filter(e=>e.name==='score').length,0);record.checks.push('quit once per unfinished run, no best/score');await input(page,false,'#play-button');await input(page,false,'#start-button');
 }
 await sequence(page,false,{power:[65,85]});await until(page,r=>r.state==='result','result');const r=await read(page);assert.ok(r.snapshot.result.score.total>0);const best=await page.locator('#best-value').textContent();assert.notEqual(best,'0.0 m');await input(page,false,'#retry-button');await input(page,false,'#pause-button');await input(page,false,'#title-button');assert.equal(await page.locator('#best-value').textContent(),best);
 if(denied){await page.reload();assert.equal(await page.locator('#best-value').textContent(),'0.0 m');assert.equal(await page.locator('#play-button').textContent(),'遊んでみる');record.checks.push('denied storage retains memory best on retry then reload resets');}
 assert.deepEqual(errors,[]);record.status='PASS';
 } catch(e){record.status='FAIL';record.error=e.message;process.exitCode=1;}finally{record.errors=errors;await context.close();console.log(record.kind,record.status,record.error||'');}
 }
}finally{await browser.close();await writeFile(process.env.GAME018_GUARD_REPORT||'docs/game018/QA/INPUT_LIFECYCLE_GUARDS.json',JSON.stringify({records},null,2)+'\n');}
