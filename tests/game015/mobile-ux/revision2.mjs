import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.QA_BASE || 'http://127.0.0.1:4933/';
const out = process.env.QA_OUT || 'test-results/game015-mobile/revision2';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.QA_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] });
const rows = [];
const sizes = [[844,390],[667,375],[568,320],[932,430],[390,844],[375,667],[320,568],[1440,900]];
function overlaps(a,b) { return a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y; }
async function geometry(page) {
  return page.evaluate(() => {
    const rect = e => e.getBoundingClientRect().toJSON();
    const host = document.querySelector('#analytics-settings-host'), shadow = host.shadowRoot;
    const elements = Object.fromEntries(['#fall-canvas','#left-button','#right-button','#drop-button','#app>header','#live-status'].map(s => [s,rect(document.querySelector(s))]));
    return { width:innerWidth, height:innerHeight, overflowX:document.documentElement.scrollWidth-innerWidth, overflowY:document.documentElement.scrollHeight-innerHeight, elements, host:rect(host), settings:rect(shadow.querySelector('#settings')), privacy:rect(shadow.querySelector('.settings a')), panel:rect(shadow.querySelector('.panel')), panelHidden:shadow.querySelector('.panel').hidden, consent:localStorage.getItem('game100garage:analytics-consent:v1'), backing:[document.querySelector('#fall-canvas').width,document.querySelector('#fall-canvas').height] };
  });
}
try {
  for (const [width,height] of sizes) {
    const mobile=width!==1440, context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
    // No consent seed: exercise real initial unknown UI. All non-local traffic is blocked.
    await context.addInitScript(()=>{localStorage.setItem('web-mini-arcade:v1:game015:tutorialCompleted','true');localStorage.setItem('web-mini-arcade:v1:game015:muted','true');});
    const errors=[],writes=[];
    await context.route('**/*',route=>{const req=route.request();if(!['GET','HEAD'].includes(req.method()))writes.push(req.url().startsWith(base)?'local':'blocked external');return req.url().startsWith(base)?route.continue():route.abort();});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    const tap=async selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
    const host=page.locator('#analytics-settings-host'), panel=host.locator('.panel');
    try {
      await page.goto(base+'game015.html',{waitUntil:'networkidle'});
      assert(await panel.isVisible(),'unknown initially opens consent');
      await tap('#analytics-settings-host #later');
      assert(await page.evaluate(()=>localStorage.getItem('game100garage:analytics-consent:v1'))===null,'later does not grant/deny');
      await tap('#play-button');
      let g=await geometry(page);
      assert.deepEqual(g.backing,[256,448]);
      assert(g.overflowX===0&&g.overflowY===0);
      if(width>height&&height<=600){assert(g.host.height===100,'compact settings stays two44px rows');for(const r of [g.settings,g.privacy])assert(r.x>=g.host.x&&r.right<=g.host.right,'no shadow control overflow');}
      for(const r of [g.settings,g.privacy,g.elements['#left-button'],g.elements['#right-button'],g.elements['#drop-button']]) assert(r.width>=44&&r.height>=44&&r.x>=0&&r.y>=0&&r.right<=width+.1&&r.bottom<=height+.1,'visible44px target');
      for(const r of [g.settings,g.privacy])for(const id of ['#fall-canvas','#left-button','#right-button','#drop-button','#live-status'])assert(!overlaps(r,g.elements[id]),'settings must not cover '+id);
      if(width===844)assert(g.elements['#fall-canvas'].height>=304,'restore844Canvas');
      if(width===667)assert(g.elements['#fall-canvas'].height>=289,'restore667Canvas');
      if(width===844||width===667)await page.screenshot({path:out+'/'+width+'x'+height+'-playing.png'});
      await tap('#analytics-settings-host #settings');
      assert(await panel.isVisible());
      assert(await page.evaluate(()=>document.querySelector('#analytics-settings-host').shadowRoot.activeElement?.id==='grant'),'existing settings focuses grant');
      await tap('#analytics-settings-host #deny');
      assert((await geometry(page)).consent==='denied');
      await tap('#analytics-settings-host #settings');await tap('#analytics-settings-host #grant');
      assert((await geometry(page)).consent==='granted');
      await tap('#analytics-settings-host #settings');await tap('#analytics-settings-host #deny');
      assert((await geometry(page)).consent==='denied','existing deny revokes consent');
      // Existing keyboard access and focus path; no synthetic click on consent buttons.
      await host.locator('#settings').focus();await page.keyboard.press('Enter');assert(await panel.isVisible());
      await tap('#analytics-settings-host #later');
      if(width===844||width===667){
        await tap('#pause-button');await tap('#analytics-settings-host #settings');
        await page.setViewportSize({width:height,height:width});assert(await panel.isVisible());
        await tap('#analytics-settings-host #later');await page.setViewportSize({width,height});
        await tap('#resume-button');
        const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:0,left:47,right:47,bottom:21}});await page.waitForTimeout(60);
        const safe=await geometry(page);for(const r of [safe.settings,safe.privacy])assert(r.x>=47&&r.right<=width-47+.1&&r.bottom<=height-21+.1&&!overlaps(r,safe.elements['#fall-canvas']));
        assert(safe.overflowX===0&&safe.overflowY===0);g.safeArea=safe;
        await tap('#analytics-settings-host #settings');await panel.locator('#deny').scrollIntoViewIfNeeded();await tap('#analytics-settings-host #deny');
        await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:0,left:0,right:0,bottom:0}});
      }
      await tap('#analytics-settings-host .settings a');await page.waitForURL('**/privacy.html');
      assert(await page.locator('h1').count()>0,'privacy link navigates normally');
      assert(errors.length===0,errors.join(';'));
      // Consent grant is exercised with outbound requests aborted: no delivered production traffic.
      rows.push({width,height,pass:true,geometry:g,errors,blockedRequests:writes});
    } catch(e) { rows.push({width,height,pass:false,failure:e.message,errors});await page.screenshot({path:out+'/'+width+'-FAIL.png'}); }
    await context.close();await fs.writeFile(out+'/results.json',JSON.stringify(rows,null,2));
  }
  const context=await browser.newContext({viewport:{width:844,height:390}});await context.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());const page=await context.newPage();await page.goto(base+'game001.html',{waitUntil:'networkidle'});const unaffected=await page.locator('#analytics-settings-host').evaluate(e=>({height:e.getBoundingClientRect().height,position:getComputedStyle(e).position,flow:getComputedStyle(e.shadowRoot.querySelector('.settings')).flexDirection}));assert(unaffected.height===64&&unaffected.position==='relative'&&unaffected.flow==='row');rows.push({case:'other game settings presentation unchanged',pass:true,...unaffected});await context.close();
} finally { await browser.close();await fs.writeFile(out+'/results.json',JSON.stringify(rows,null,2)); }
console.log(JSON.stringify(rows.map(({geometry,...summary})=>summary),null,2));if(rows.some(r=>!r.pass))process.exitCode=1;
