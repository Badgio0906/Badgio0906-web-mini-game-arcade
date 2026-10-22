// Fixed candidate UI acceptance. Ordinary input only; no model or clock injection.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4972/',out=process.env.QA_OUT;
if(!out)throw Error('QA_OUT required');await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',proxy:base.startsWith('https:')?{server:process.env.HTTPS_PROXY||process.env.HTTP_PROXY}:undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),rows=[];
const cases=[...[[390,844],[375,667],[320,568],[844,390],[932,430],[667,375],[1440,900]].map(([width,height])=>({name:`${width}x${height}`,width,height,mobile:width<1000,guide:width<height&&width<600})),
 {name:'fine-PC-portrait',width:390,height:844,mobile:false,guide:false},
 {name:'touch-tablet-portrait',width:768,height:1024,mobile:true,screen:{width:768,height:1024},guide:false},
 {name:'touch-tablet-split',width:390,height:700,mobile:true,screen:{width:768,height:1024},guide:false},
 {name:'600px-tablet-boundary',width:600,height:960,mobile:true,guide:false}];
async function one(v){const{width,height,mobile,guide,name}=v,r={name,width,height,expectedGuide:guide,errors:[],nativeRequests:[],blocked:[]};
const c=await b.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,...(v.screen?{screen:v.screen}:{})});
await c.addInitScript(()=>{window.__native=[];addEventListener('message',e=>{if(e.isTrusted&&e.data?.channel==='game100-native-record')window.__native.push(e.data);});});
await c.route('**/*',x=>{const q=x.request();if(!q.url().startsWith(base)||!['GET','HEAD'].includes(q.method())){r.blocked.push({method:q.method(),url:q.url()});return x.abort();}if(/game\.html|\.wasm/.test(q.url()))r.nativeRequests.push(q.url());return x.continue();});
const p=await c.newPage();p.setDefaultTimeout(5000);p.on('pageerror',e=>r.errors.push(e.message));const tap=async l=>l[mobile?'tap':'click']();
try{await p.goto(base+'games/yokodori-days/index.html',{waitUntil:'networkidle'});
const settings=p.locator('#analytics-settings-host');if(await settings.locator('#later').isVisible())await tap(settings.locator('#later'));
r.device=await p.evaluate(()=>({screen:[screen.width,screen.height],orientation:screen.orientation?.type,coarse:matchMedia('(pointer:coarse)').matches,noHover:matchMedia('(hover:none)').matches}));
if(guide){
 await p.getByRole('heading',{name:'横向きで遊んでください',exact:true}).waitFor();
 assert((await p.locator('#legacy-start').innerText()).includes('このゲームはスマートフォン横向き専用です。端末を横にすると、ゲーム画面をすべて表示できます。'));
 assert.equal(await p.locator('#legacy-game-frame').getAttribute('src'),null);assert.equal(r.nativeRequests.length,0);
 await p.screenshot({path:out+`/${name}-guide.png`});
 await tap(p.locator('#tutorial-explain-button'));assert((await p.locator('#legacy-start').innerText()).includes('遊び方'));
 assert.equal(await p.locator('#play-button').isDisabled(),true);await p.keyboard.press('Enter');assert.equal(r.nativeRequests.length,0);
 await tap(p.locator('#title-button'));await p.getByRole('heading',{name:'横向きで遊んでください',exact:true}).waitFor();
 if(width===390){await tap(settings.locator('#settings'));await tap(settings.locator('#deny'));assert.equal(await p.evaluate(()=>localStorage.getItem('game100garage:analytics-consent:v1')),'denied');await tap(settings.locator('#settings'));await tap(settings.locator('.panel a'));await p.waitForURL('**/privacy.html');await p.goBack();await p.getByRole('heading',{name:'横向きで遊んでください',exact:true}).waitFor();r.privacy=true;}
 await tap(p.locator('#game012-guide-return'));await p.waitForURL('**/index.html');r.returned=true;
}else{
 assert.equal(await p.getByRole('heading',{name:'横向きで遊んでください',exact:true}).count(),0);
 await tap(p.locator('#play-button'));const f=p.frameLocator('#legacy-game-frame');await f.locator('#status').waitFor({state:'hidden',timeout:45000});await p.waitForTimeout(350);const cv=f.locator('#canvas');
 r.canvas=await cv.evaluate(e=>{const q=e.getBoundingClientRect();return{internal:[e.width,e.height],x:q.x,y:q.y,width:q.width,height:q.height,viewport:[innerWidth,innerHeight]};});
 assert.deepEqual(r.canvas.internal,[960,540]);assert(Math.abs(r.canvas.width/r.canvas.height-16/9)<.01);assert(r.canvas.x>=-.5&&r.canvas.y>=-.5&&r.canvas.x+r.canvas.width<=r.canvas.viewport[0]+.5&&r.canvas.y+r.canvas.height<=r.canvas.viewport[1]+.5);
 if(mobile)await cv.tap();else{await cv.focus();await p.keyboard.press('Enter');}await p.waitForFunction(()=>window.__native.some(e=>e.kind==='start'));
 const before=await cv.boundingBox();await p.waitForTimeout(350);const after=await cv.boundingBox();assert(Math.abs(before.width-after.width)<.1&&Math.abs(before.height-after.height)<.1);r.stableWhilePlaying=true;
 await p.screenshot({path:out+`/${name}-play.png`});
 if(name==='844x390'||name==='1440x900'){
  if(mobile)await cv.tap();else await p.keyboard.press('Enter');await p.waitForFunction(()=>window.__native.some(e=>e.kind==='result'),null,{timeout:10000});
  r.result=await p.evaluate(()=>window.__native.find(e=>e.kind==='result').value);await p.screenshot({path:out+`/${name}-result.png`});
  if(mobile)await cv.tap();else await p.keyboard.press('Enter');await p.waitForFunction(()=>window.__native.filter(e=>e.kind==='start').length===2);r.retry=true;
 }
 await tap(p.locator('#legacy-menu-return'));await tap(p.locator('#legacy-portal-return'));await p.waitForURL('**/index.html');r.returned=true;
}assert.equal(r.errors.length,0);r.pass=true;
}catch(e){r.pass=false;r.failure=e.message;await p.screenshot({path:out+`/${name}-failure.png`}).catch(()=>{});}
finally{rows.push(r);await c.close();await writeFile(out+'/REPORT.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify({name,pass:r.pass,failure:r.failure}));}}
try{for(const v of cases)await one(v);
for(const[width,height]of[[390,844],[844,390]]){
const r={name:`direct-runtime-${width}`,errors:[],wasm:0},c=await b.newContext({viewport:{width,height},isMobile:true,hasTouch:true});await c.route('**/*',x=>{if(!x.request().url().startsWith(base))return x.abort();if(x.request().url().endsWith('.wasm'))r.wasm++;return x.continue();});const p=await c.newPage();p.on('pageerror',e=>r.errors.push(e.message));
try{await p.goto(base+'games/yokodori-days/game.html');await p.waitForURL('**/games/yokodori-days/index.html');assert.equal(r.wasm,0);assert.equal(await p.locator('#legacy-game-frame').getAttribute('src'),null);assert.equal(r.errors.length,0);r.pass=true;}catch(e){r.pass=false;r.failure=e.message;}finally{rows.push(r);await c.close();await writeFile(out+'/REPORT.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(r));}
}}finally{await b.close();}if(rows.some(r=>!r.pass))process.exitCode=1;
