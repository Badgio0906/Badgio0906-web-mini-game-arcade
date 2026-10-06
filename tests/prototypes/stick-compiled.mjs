import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
for(const url of ['http://localhost:5174/prototype-stick.html','http://localhost:5174/play-standalone.html']){
 const page=await browser.newPage({viewport:{width:1366,height:768}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const epoch=new Date('2026-10-06T00:00:00Z');await page.clock.install({time:epoch});await page.goto(url);await page.clock.pauseAt(new Date(epoch.getTime()+10000));
 assert.equal(await page.evaluate(()=>typeof window.__stick),'undefined');await page.click('#start');await page.clock.runFor(800);await page.keyboard.down('ArrowRight');await page.clock.runFor(100);await page.keyboard.up('ArrowRight');
 assert.equal(await page.locator('#app').getAttribute('data-mode'),'playing');
 assert.ok(await page.locator('.controls').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));
 await page.clock.runFor(15000);assert.equal(await page.locator('#app').getAttribute('data-mode'),'over');await page.click('#start');await page.clock.runFor(16);assert.equal(await page.locator('#app').getAttribute('data-mode'),'playing');
 assert.deepEqual(errors,[]);results.push({url,errors,play:true,loss:true,retry:true,diagnosticsAbsent:true,controlsFit:true});await page.close();
}
await browser.close();writeFileSync('docs/prototypes/stick-balance/QA/COMPILED.json',JSON.stringify(results,null,2));console.log('PASS compiled HTTP and standalone HTTP');
