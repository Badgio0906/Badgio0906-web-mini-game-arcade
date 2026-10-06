import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext();
const records={kind:'independent local fixture; production environment forced in module config; no live GA or Worker',findings:[]};
try {
 const page=await context.newPage();
 await page.route('**/__review.html*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head></head><body></body></html>'}));
 await page.goto('http://127.0.0.1:5401/__review.html?utm_source=TIKTOK&email=private&utm_campaign=launch');
 records.lifecycle=await page.evaluate(async()=>{
  const config=await import('/src/analytics/config.ts');config.analyticsConfig.environment='production';config.analyticsConfig.endpoint='https://fixture.invalid/v1/events';
  const runtime=await import('/src/analytics/runtime.ts');const {TelemetryService,TELEMETRY_KEY}=await import('/src/core/TelemetryService.ts');
  const calls=[];window.fetch=async(url,opts)=>{calls.push(JSON.parse(opts.body));return new Response('{}',{status:202});};
  const t=new TelemetryService(undefined,'game019');const r=t.analytics;
  t.trackEvent('run_start',{source:'review_unknown'});t.trackEvent('specific_game_events',{event:'fall_end',fall_distance:10});
  const before={keys:Object.keys(localStorage),sessionKeys:Object.keys(sessionStorage),calls:calls.length};
  r.consent.setState('granted');t.trackEvent('specific_game_events',{event:'jump',jump_charge_ms:300});await r.upload.flush();
  const after={local:JSON.parse(localStorage.getItem(TELEMETRY_KEY)||'[]'),events:calls.flatMap(x=>x.events),browser:localStorage.getItem(runtime.BROWSER_ID_KEY),visit:JSON.parse(sessionStorage.getItem(runtime.VISIT_KEY)||'null')};
  r.consent.setState('denied');t.trackEvent('run_start',{source:'review_denied'});await r.upload.flush();
  return {before,after,revoked:{keys:Object.keys(localStorage),sessionKeys:Object.keys(sessionStorage),calls:calls.length,local:JSON.parse(localStorage.getItem(TELEMETRY_KEY)||'[]')}};
 });
 // Same origin real game UI: dimensions and isolated keyboard.
 for(const [width,height] of [[1365,900],[390,844],[320,568],[844,390]]){
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:5401/game019.html');
  await page.locator('#play-button').waitFor();
  await page.locator('#analytics-settings-host').getByRole('button',{name:'解析データ設定',exact:true}).click();
  const layout=await page.evaluate(()=>{const s=document.querySelector('#analytics-settings-host').shadowRoot;return ['.panel','#grant','#deny'].map(selector=>{const e=s.querySelector(selector),r=e.getBoundingClientRect();return{selector,x:r.x,y:r.y,width:r.width,height:r.height,clientWidth:e.clientWidth,scrollWidth:e.scrollWidth};});});
  await page.locator('#analytics-settings-host').getByRole('button',{name:'許可しない',exact:true}).click();
  await page.locator('#play-button').click();
  const stateBefore=await page.evaluate(()=>window.__arcadeDebug?.snapshot());
  await page.locator('#analytics-settings-host').getByRole('button',{name:'解析データ設定',exact:true}).click();
  await page.keyboard.press('ArrowRight');await page.keyboard.down('Space');await page.waitForTimeout(500);await page.keyboard.up('Space');
  const stateAfter=await page.evaluate(()=>window.__arcadeDebug?.snapshot());
  (records.layouts??=[]).push({width,height,layout,stateBefore,stateAfter});
 }
 assert.equal(records.lifecycle.before.keys.length,0);assert.equal(records.lifecycle.before.sessionKeys.length,0);assert.equal(records.lifecycle.before.calls,0);assert.deepEqual(records.lifecycle.after.local.map(x=>x.name),['specific_game_events']);assert.deepEqual(records.lifecycle.after.events.map(x=>x.event_name),['specific_game_events']);assert.equal(records.lifecycle.after.events[0].data.utm_source,'tiktok');assert(!JSON.stringify(records.lifecycle.after.events).includes('private'));assert.equal(records.lifecycle.revoked.calls,1);assert(!records.lifecycle.revoked.keys.some(x=>x.includes('browser-id')||x.includes('queue')));assert.equal(records.lifecycle.revoked.sessionKeys.length,0);
 await writeFile('docs/analytics/QA/client-review-final.json',JSON.stringify(records,null,2));
 console.log(JSON.stringify({before:records.lifecycle.before,afterLocalNames:records.lifecycle.after.local.map(x=>x.name),external:records.lifecycle.after.events.map(x=>x.event_name),revokedKeys:records.lifecycle.revoked.keys,layouts:records.layouts.map(x=>({width:x.width,height:x.height,layout:x.layout,stateBefore:x.stateBefore,stateAfter:x.stateAfter}))},null,2));
}finally{await browser.close();}
