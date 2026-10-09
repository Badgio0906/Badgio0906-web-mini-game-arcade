// Actual published native exports. No fulfilled product resources or synthetic results.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.LEGACY_QA_OUT,sha=process.env.RECORDS_EXPECTED_COMMIT;
if(!out||!/^[a-f0-9]{40}$/.test(sha))throw Error('unique output and expected commit required');
await mkdir(out,{recursive:false});
const proxy=(()=>{const value=process.env.HTTPS_PROXY||process.env.https_proxy;if(!value)return;const u=new URL(value);return{server:u.origin,username:decodeURIComponent(u.username),password:decodeURIComponent(u.password)};})();
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',proxy,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={at:new Date().toISOString(),expectedCommit:sha,provenance:'Published HTTPS GET resources, disposable native/browser saves, ordinary Enter/Space/tap/click. Original readonly013 phase and opt-in014 qa observer only; no forced game state. Phone emulation, not physical devices or human enjoyment. Consent denied, webdriver retained, every POST blocked.',checks:[],runs:[],posts:0,errors:[],consoleErrors:[]};
const check=(value,name,details={})=>{report.checks.push({name,pass:!!value,...details});if(!value)throw Error(name);};
const games=[['game012','yokodori-days','点'],['game013','tachibana-task-heaven','点'],['game014','finger-heart-challenge','回']];let page;
try{for(const [id,slug,unit] of games)for(const touch of [false,true]){
 const device=touch?'phone':'desktop',label=id+'-'+device,context=await browser.newContext({viewport:touch?{width:844,height:390}:{width:1300,height:900},isMobile:touch,hasTouch:touch});page=await context.newPage();
 await context.addInitScript(()=>{localStorage.setItem('game100garage:analytics-consent:v1','denied');window.__nativeObserved=[];window.addEventListener('message',e=>{if(e.data?.channel==='game100-native-record')window.__nativeObserved.push(e.data);});});
 await context.route('**/*',r=>{if(r.request().method()==='POST'){report.posts++;return r.abort();}return r.continue();});
 page.on('pageerror',e=>report.errors.push({label,message:e.message}));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push({label,message:m.text()});});
 const boot=async()=>{await page.goto('https://game100garage.com/games/'+slug+'/index.html?qa='+sha.slice(0,12));await page.getByRole('button',{name:'すぐ遊ぶ',exact:true})[touch?'tap':'click']();const f=page.frameLocator('#legacy-game-frame');await f.locator('#status').waitFor({state:'hidden',timeout:60000});const frame=page.frames().find(f=>f.url().includes('/game.html'));await page.waitForTimeout(500);return frame;};
 let frame=await boot();
 const tapBoard=async(x,y)=>{const b=await frame.locator('#canvas').boundingBox(),s=Math.min(b.width/1280,b.height/720);const px=b.x+(b.width-1280*s)/2+x*s,py=b.y+(b.height-720*s)/2+y*s;if(touch)await page.touchscreen.tap(px,py);else await page.mouse.click(px,py);};
 const center=async()=>{const b=await frame.locator('#canvas').boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);};
 const key=async(code)=>{await frame.locator('#canvas').focus();await page.keyboard.press(code);};
 if(id==='game012'){
  await page.waitForFunction(()=>window.__nativeObserved.some(p=>p.kind==='legacy_best'),null,{timeout:20000});await page.waitForTimeout(1000);if(touch)await center();else await key('Enter');await page.waitForFunction(()=>window.__nativeObserved.some(p=>p.kind==='start'));await page.waitForTimeout(100);if(touch)await center();else await key('Enter');
 }else if(id==='game013'){
  await frame.waitForFunction(()=>window.TaskHeavenStatus?.state==='title');await tapBoard(238,488);await frame.waitForFunction(()=>window.TaskHeavenStatus?.state==='playing');await frame.waitForFunction(()=>window.TaskHeavenStatus?.phase==='answer',null,{timeout:20000});
  if(!touch)await frame.locator('#canvas').focus();
  for(let n=0;n<75;n++){const s=await frame.evaluate(()=>window.TaskHeavenStatus);if(s.state==='fail')break;if(s.phase==='answer'){if(touch)await tapBoard(1117,392);else await page.keyboard.press('4');}await page.waitForTimeout(100);}
 }else{
  await page.waitForFunction(()=>window.__nativeObserved.some(p=>p.kind==='start'),null,{timeout:20000});check(!await frame.evaluate(()=>'__fingerHeart'in window),'normal014 URL has no diagnostic '+label);
  const url=new URL(frame.url());url.searchParams.set('qa','1');await frame.goto(url.href);await frame.locator('#status').waitFor({state:'hidden',timeout:60000});await frame.waitForFunction(()=>window.__fingerHeart?.state===0);
  const b=await frame.locator('#canvas').boundingBox(),point={x:b.x+b.width/2,y:b.y+b.height/2};if(!touch)await frame.locator('#canvas').focus();
  const input=()=>touch?page.touchscreen.tap(point.x,point.y):page.keyboard.press('Space');
  await frame.waitForFunction(()=>window.__fingerHeart.state===0&&window.__fingerHeart.hand===0,null,{polling:'raf',timeout:20000});await input();await frame.waitForFunction(()=>window.__fingerHeart.score===1,null,{timeout:5000});await frame.waitForFunction(()=>window.__fingerHeart.state===0&&window.__fingerHeart.hand!==0,null,{polling:'raf',timeout:20000});await input();
 }
 await page.waitForFunction(()=>window.__nativeObserved.some(p=>p.kind==='result'),null,{timeout:15000});const result=await page.evaluate(()=>window.__nativeObserved.filter(p=>p.kind==='result').at(-1));check(result.mode_id==='normal'&&Number.isSafeInteger(result.value),'native finalized normal result '+label,{value:result.value});if(id==='game014')check(result.value===1,'actual native success count '+label);
 await page.getByText('記録共有：準備中',{exact:true}).waitFor();await page.waitForTimeout(700);await page.screenshot({path:out+'/'+label+'-result.png'});
 if(id==='game012'){if(touch)await center();else await key('Enter');}
 else if(id==='game013')await tapBoard(527,645);
 else{const b=await frame.locator('#canvas').boundingBox(),s=await frame.evaluate(()=>window.__fingerHeart),x=b.x+(s.retry[0]+s.retry[2]/2)/s.width*b.width,y=b.y+(s.retry[1]+s.retry[3]/2)/s.height*b.height;if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);}
 await page.locator('#legacy-record-result').waitFor({state:'hidden',timeout:5000});check(true,'native retry clears optional result '+label);await page.waitForTimeout(1600);
 frame=await boot();await page.waitForFunction(()=>window.__nativeObserved.some(p=>p.kind==='current_best'||p.kind==='legacy_best'),null,{timeout:20000});const restored=await page.evaluate(()=>window.__nativeObserved.filter(p=>p.kind==='current_best'||p.kind==='legacy_best'));check(restored.some(p=>p.value===result.value),'native save restored after reload '+label);
 await page.getByRole('link',{name:'← ゲームセンターへ',exact:true})[touch?'tap':'click']();await page.waitForFunction(({id,value,unit})=>document.querySelector('[data-game-id='+id+'] .card-records')?.innerText.includes(value.toLocaleString('ja-JP')+' '+unit),{id,value:result.value,unit},{timeout:20000});const card=page.locator('[data-game-id='+id+']');await card.scrollIntoViewIfNeeded();await page.screenshot({path:out+'/'+label+'-portal.png'});const text=await card.locator('.card-records').innerText();check(text.includes('準備中')&&!text.includes('未対応'),'Portal current record and disabled public sharing '+label);await page.reload();await page.waitForFunction(({id,text})=>document.querySelector('[data-game-id='+id+'] .card-records')?.innerText===text,{id,text});check(true,'Portal maximum persists across reload '+label);
 report.runs.push({id,device,value:result.value,mode:result.mode_id,portal:text});await context.close();
}check(report.posts===0,'zero production POST');check(report.errors.length===0,'no JS exceptions');report.status='PASS';}
catch(e){report.status='FAIL';report.error=e.message;if(page&&!page.isClosed()){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});report.failureState=await page.evaluate(()=>{const w=document.getElementById('legacy-game-frame')?.contentWindow;return{native013:w?.TaskHeavenStatus,native014:w?.__fingerHeart,messages:window.__nativeObserved?.map(({session,run_result_id,...p})=>p)};}).catch(()=>null);}throw e;}
finally{await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
