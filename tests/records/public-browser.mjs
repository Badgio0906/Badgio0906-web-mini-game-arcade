// Actual published pages, disposable local saves, no record or Analytics POST.
import{chromium}from'@playwright/test';
import{mkdir,writeFile}from'node:fs/promises';
const out=process.env.RECORDS_QA_OUT,sha=process.env.RECORDS_EXPECTED_COMMIT;
if(!out||!/^[a-f0-9]{40}$/.test(sha))throw Error('Unique output and expected commit required');
await mkdir(out,{recursive:false});
const proxy=(()=>{if(!process.env.HTTPS_PROXY)return undefined;const p=new URL(process.env.HTTPS_PROXY);return{server:p.origin,...(p.username?{username:decodeURIComponent(p.username)}:{}),...(p.password?{password:decodeURIComponent(p.password)}:{})};})();
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',proxy,args:['--no-sandbox']});
const report={at:new Date().toISOString(),expectedCommit:sha,url:'https://game100garage.com/',provenance:'Published HTML/JS via browser; four simulated viewports, disposable storage, one ordinary Game001 result per PC/phone. Not physical devices or author enjoyment. Production API remains disabled.',views:[],checks:[],errors:[],recordRequests:0,analyticsPosts:0};
const check=(ok,name)=>{report.checks.push({name,pass:!!ok});if(!ok)throw Error(name);};let active;
try{for(const viewport of[{width:1300,height:900},{width:390,height:844},{width:320,height:720},{width:844,height:390}]){
 const mobile=viewport.width!==1300,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile}),page=await context.newPage();active=page;
 page.on('pageerror',e=>report.errors.push(e.message));
 await context.route('**/*',route=>{const r=route.request();if(r.url().includes('/v1/records/')){report.recordRequests++;return route.abort();}if(r.method()==='POST'&&r.url().includes('analytics.game100garage.com')){report.analyticsPosts++;return route.abort();}return route.continue();});
 await page.goto(report.url+'?qa='+sha.slice(0,12),{waitUntil:'networkidle'});
 const deny=page.getByRole('button',{name:'許可しない',exact:true});if(await deny.count())await deny.click();
 await page.waitForFunction(()=>document.querySelectorAll('.card-records').length===30&&!Array.from(document.querySelectorAll('.card-records dd')).some(e=>e.textContent==='読み込み中'));
 const cards=await page.locator('.game-card').evaluateAll(list=>list.map(c=>({id:c.dataset.gameId,rows:c.querySelectorAll('.card-records dl>div').length,direct:c.querySelector('.game-image').nextElementSibling===c.querySelector('.card-records'),text:c.querySelector('.card-records').innerText,href:c.href,overflow:c.querySelector('.card-records').scrollWidth>c.querySelector('.card-records').clientWidth+1})));
 check(cards.length===30&&cards.every(c=>c.rows===2&&c.direct&&!c.overflow),'two direct rows in all30 cards '+viewport.width);
 check(cards.filter(c=>c.text.includes('みんなのBEST')).every(c=>c.text.includes('準備中')),'scored public records preparing '+viewport.width);
 check(cards.filter(c=>['game012','game013','game014'].includes(c.id)).every(c=>c.text.includes('未対応（旧作品）')),'Godot technical exclusions '+viewport.width);
 check(!cards.some(c=>c.id==='game010')&&cards.every(c=>/^https:\/\/game100garage.com\//.test(c.href)),'active links and retired protection '+viewport.width);
 check(await page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]').count()===1,'AdSense script retained '+viewport.width);
 await page.locator('#record-sharing-settings').scrollIntoViewIfNeeded().catch(()=>{});
 const summary=page.getByText('あなたのBEST・記録共有設定',{exact:true});await summary.click();check(await page.locator('.record-sharing-settings input[type=checkbox]').isDisabled(),'sharing disabled '+viewport.width);
 await page.screenshot({path:out+`/portal-${viewport.width}x${viewport.height}.png`,fullPage:true});
 report.views.push({viewport,cards,scripts:await page.locator('script[src]').evaluateAll(list=>list.map(s=>new URL(s.src).pathname))});
 if(viewport.width===1300||viewport.width===390){
  const card=page.locator('[data-game-id=game001]');if(mobile)await card.tap();else{await card.focus();await page.keyboard.press('Enter');}
  await page.waitForURL('**/game001.html');await page.locator('#play-button')[mobile?'tap':'click']();await page.waitForFunction(()=>document.getElementById('app').dataset.state==='result',null,{timeout:45000});
  check(await page.getByRole('button',{name:'この記録を共有',exact:true}).isDisabled(),'actual native result prepares optional share '+viewport.width);
  const best=await page.evaluate(()=>localStorage.getItem('orbit-shift:v1:best'));check(best!==null,'ordinary result stores original BEST '+viewport.width);
  await page.screenshot({path:out+`/game001-result-${viewport.width}.png`});
  await page.goto(report.url,{waitUntil:'networkidle'});await page.waitForFunction(best=>document.querySelector('[data-game-id=game001] .card-records dd')?.textContent===Number(best).toLocaleString('ja-JP')+' 点',best);
  check(true,'ordinary result agrees with published Portal personalBEST '+viewport.width);await page.locator('[data-game-id=game001]').scrollIntoViewIfNeeded();await page.screenshot({path:out+`/portal-updated-${viewport.width}.png`});
 }
 await context.close();active=undefined;
}check(report.recordRequests===0&&report.analyticsPosts===0,'no production record/API or Analytics POST');check(report.errors.length===0,'no browser pageerror');report.result='PASS';
}catch(e){report.result='FAIL';report.failure=e.message;if(active)await active.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});}finally{await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log({out,result:report.result,checks:report.checks.length});if(report.result!=='PASS')process.exitCode=1;
