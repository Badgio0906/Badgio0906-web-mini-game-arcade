import { chromium } from '@playwright/test';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const base = process.env.GAME033_BASE ?? 'http://127.0.0.1:4933';
const out = process.env.GAME033_REPORT ?? `docs/game033/QA/native-${new Date().toISOString().replace(/[:.]/g,'-')}`;
if (fs.existsSync(out)) throw Error('Refusing to overwrite an existing QA run');
fs.mkdirSync(out,{recursive:true});
const sourceRoot = process.env.GAME033_SOURCE_ROOT ?? process.cwd();
const sourceFiles = ['game033.html',...fs.readdirSync(path.join(sourceRoot,'src/games/game033')).map(f=>'src/games/game033/'+f)];
const hashes = () => Object.fromEntries(sourceFiles.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(sourceRoot,f))).digest('hex')]));
const before = hashes(), report = {base,source_root:sourceRoot,source:process.env.GAME033_SOURCE??null,started_at:new Date().toISOString(),source_files:before,scope:'normal keyboard/native touch and visible target marker; no model mutation or result forcing',consent_fixture:'analytics denied before first document',network_policy:'all non-GET requests aborted; external analytics/ads GET mocked offline',viewports:[]};
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const check = (v,m) => {if(!v)throw Error(m);};
try {
 const requested = process.env.GAME033_VIEWPORTS?.split(',');
 for(const [name,width,height,touch] of [['desktop',1440,900,false],['phone',390,844,true],['narrow',320,568,true],['landscape',844,390,true]].filter(v=>!requested||requested.includes(v[0]))) {
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch}),page=await ctx.newPage(),errors=[],posts=[];
  const item={name,width,height,errors,posts,blockedWrites:[],checks:[],screenshots:[],passed:false};report.viewports.push(item);
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'){const u=new URL(r.url());posts.push({host:u.hostname,path:u.pathname});}});
  await ctx.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(request.method()!=='GET'){item.blockedWrites.push({method:request.method(),host:url.hostname,path:url.pathname});return route.abort();}
    if(/googlesyndication|googletagmanager|google-analytics|doubleclick/.test(url.hostname))return route.fulfill({body:'',contentType:'application/javascript'});
    if(url.hostname==='analytics.game100garage.com')return route.fulfill({status:503,body:'QA offline remote fixture'});
    return route.continue();
  });
  await page.addInitScript(()=>{
    localStorage.setItem('game100garage:analytics-consent:v1','denied');
    if(localStorage.getItem('web-mini-arcade:v1:game033:best')===null)localStorage.setItem('web-mini-arcade:v1:game033:best','123');
    if(localStorage.getItem('web-mini-arcade:v1:game033:muted')===null)localStorage.setItem('web-mini-arcade:v1:game033:muted','true');
  });
  const shot=async label=>{const file=`${name}-${label}.png`;await page.screenshot({path:`${out}/${file}`});item.screenshots.push(file);};
  const tap=async selector=>{if(touch)await page.locator(selector).tap();else await page.locator(selector).click();await page.waitForTimeout(40);};
  const geometry=async()=>{
    const viewport=page.viewportSize();
    // A native modal is scrollable; only its controls are currently actionable.
    // Check reachability after the browser scrolls each off-screen control, rather
    // than requiring every button in a long explanation to fit simultaneously.
    const modal=page.locator('dialog[open]');
    const scope=await modal.count()?modal:page.locator('body');
    const buttons=scope.locator('button:visible:enabled');
    const measurements=[];
    const read=locator=>locator.evaluate(el=>{const r=el.getBoundingClientRect(),d=el.closest('dialog'),dr=d?.getBoundingClientRect();return{id:el.id,text:el.textContent.trim(),x:r.x,y:r.y,w:r.width,h:r.height,dialog:d?{top:dr.top+d.clientTop,bottom:dr.top+d.clientTop+d.clientHeight,scrollTop:d.scrollTop,scrollHeight:d.scrollHeight,clientHeight:d.clientHeight,overflow:getComputedStyle(d).overflowY}:null};});
    for(let n=0;n<await buttons.count();n++){
      const button=buttons.nth(n),initial=await read(button);
      check(initial.h>=43.5,`44px action ${initial.id||initial.text}: ${initial.h}`);
      await button.scrollIntoViewIfNeeded();
      const b=await read(button);
      check(b.x>=-.5&&b.y>=-.5&&b.x+b.w<=viewport.width+.5&&b.y+b.h<=viewport.height+.5,`reachable action ${b.id||b.text} ${JSON.stringify(b)}`);
      if(b.dialog)check(b.y>=b.dialog.top-.5&&b.y+b.h<=b.dialog.bottom+.5,`dialog action unclipped ${b.id||b.text} ${JSON.stringify(b)}`);
      measurements.push({initial,reachable:b});
      if(initial.dialog&&Math.abs(initial.dialog.scrollTop-b.dialog.scrollTop)>.5)await shot(`scrolled-action-${item.checks.length}-${n}`);
    }
    item.geometry??=[];item.geometry.push(measurements);
    item.checks.push('native reachable 44px actions; modal clipping checked after scroll');
  };
  let cdp;
  const flower=async()=>{const power=await page.locator('#target-mark').evaluate(e=>parseFloat(e.style.left)/100);if(touch){cdp??=await ctx.newCDPSession(page);const b=await page.locator('#launch').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:b.x+b.width/2,y:b.y+b.height/2}]});await page.waitForTimeout(power*1600);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await page.keyboard.down('Space');await page.waitForTimeout(power*1600);await page.keyboard.up('Space');}await page.waitForTimeout(200);};
  await page.goto(`${base}/game033.html`,{waitUntil:'networkidle'});await geometry();await shot('title');
  await tap('[data-action="how"]');await geometry();await shot('explanation');
  await tap('[data-action="practice"]');for(let n=0;n<4;n++)await flower();await page.waitForTimeout(1500);await tap('#mute');check((await page.locator('#mute').textContent()).includes('ON'),'mute toggles on');await tap('#mute');check((await page.locator('#mute').textContent()).includes('OFF'),'mute toggles off');await geometry();await shot('practice');
  check(await page.evaluate(()=>localStorage.getItem('web-mini-arcade:v1:game033:best'))==='123','practice leaves BEST untouched');
  check(await page.locator('#practice-banner').isVisible(),'unlimited practice banner');item.checks.push('practice normal input and BEST excluded');
  await tap('#help');await tap('[data-action="play"]');for(let n=0;n<3;n++)await flower();await geometry();await shot('play');await shot('play-motion-a');await page.waitForTimeout(180);await shot('play-motion-b');
  await tap('#pause');const time=await page.locator('#time').textContent();await page.waitForTimeout(1200);check(await page.locator('#time').textContent()===time,'paused clock');await geometry();await shot('pause');await tap('[data-action="resume"]');await flower();check(await page.locator('#app').getAttribute('data-state')==='playing','resume restores gameplay focus for Space/touch');item.checks.push('pause freezes clock and charge; resumed Space/touch launches');
  if(name==='phone'){
    let count=0;while(await page.locator('#app').getAttribute('data-state')==='playing'&&count++<150){if(await page.locator('#launch').isEnabled())await flower();else await page.waitForTimeout(300);}
    check(await page.locator('#app').getAttribute('data-state')==='result','100-second normal RUN completed');await geometry();await shot('result');
    const best=await page.evaluate(()=>Number(localStorage.getItem('web-mini-arcade:v1:game033:best')));check(best>123,'completed score updates BEST');
    for(const [label,w,h]of[['result-desktop',1440,900],['result-narrow',320,568],['result-landscape',844,390]]){await page.setViewportSize({width:w,height:h});await page.waitForTimeout(100);await geometry();await shot(label);}await page.setViewportSize({width,height});
    await tap('[data-action="retry"]');check(await page.locator('#app').getAttribute('data-state')==='playing','native result retry');await page.waitForFunction(()=>document.querySelector('#score').textContent==='0');check(await page.locator('#score').textContent()==='0','retry score reset');await flower();item.checks.push('normal 100-second result, saved BEST, three result rotations and retry');
  }
  await tap('#pause');await tap('[data-action="title"]');const storedBest=await page.evaluate(()=>localStorage.getItem('web-mini-arcade:v1:game033:best'));await page.reload({waitUntil:'networkidle'});check(await page.locator('#best').textContent()===storedBest,'BEST survives reload exactly');check((await page.locator('#mute').textContent()).includes('OFF'),'mute persists reload');
  const returnLink=page.locator('a.arcade-portal-return:visible').last();await returnLink.click();await page.waitForURL(/(?:\/|\/index\.html)$/);item.checks.push('normal portal return');
  check(errors.length===0,'no page errors');check(posts.length===0&&item.blockedWrites.length===0,'no POST/write attempted (network guard always blocks writes)');item.passed=true;await ctx.close();
 }
 report.source_unchanged=JSON.stringify(before)===JSON.stringify(hashes());check(report.source_unchanged,'source unchanged during RUN');report.passed=true;
} catch(e){report.failure=String(e);report.passed=false;throw e;} finally {report.source_unchanged=JSON.stringify(before)===JSON.stringify(hashes());report.finished_at=new Date().toISOString();fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close();}
