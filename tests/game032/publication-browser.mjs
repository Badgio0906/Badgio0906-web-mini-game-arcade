// Local/release and public ordinary-input smoke, never production synthetic uploads.
import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const base=process.env.GAME032_QA_URL??'http://127.0.0.1:4432',out=process.env.GAME032_QA_OUT;
if(!out)throw Error('Unique GAME032_QA_OUT required');await mkdir(out,{recursive:false});
const remote=new URL(base).protocol==='https:';
const report={kind:'actual browser ordinary-input release smoke; no virtual clock or injected model/RNG',base,expected_commit:process.env.GAME032_EXPECTED_SHA??null,started_at:new Date().toISOString(),source_hashes:{},checks:[],errors:[],console_errors:[],post_attempts:0,blocked_infrastructure_requests:[],views:[]};
for(const f of ['main.ts','FishingModel.ts','Save.ts','Projection.ts','style.css','RiverSound.ts'])report.source_hashes[f]=createHash('sha256').update(await readFile(`src/games/game032/${f}`)).digest('hex');
const launch={executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']};
if(remote&&process.env.HTTPS_PROXY){const p=new URL(process.env.HTTPS_PROXY);launch.proxy={server:p.protocol+'//'+p.hostname+(p.port?':'+p.port:''),username:decodeURIComponent(p.username),password:decodeURIComponent(p.password)};}
const browser=await chromium.launch(launch);let page,current='startup',cdp;
function check(ok,name,data={}){report.checks.push({name,passed:!!ok,...data});if(!ok)throw Error(name);}
async function phase(){return page.locator('#river').getAttribute('data-phase');}
async function touch(down){if(down){const r=await page.locator('#action').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});}else await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
async function hold(down){if(current==='pc'){if(down)await page.keyboard.down('Space');else await page.keyboard.up('Space');}else await touch(down);}
async function shot(name){await page.screenshot({path:path.join(out,current+'-'+name+'.png'),fullPage:true});}
try{
 for(const v of [{name:'pc',width:1280,height:900},{name:'phone',width:390,height:844},{name:'small',width:320,height:740},{name:'landscape',width:844,height:390}]){
  current=v.name;const context=await browser.newContext({viewport:v,hasTouch:current!=='pc'});
  await context.route('**/*',async route=>{
   const r=route.request(),u=new URL(r.url());if(r.method()==='POST'){report.post_attempts++;await route.abort();return;}
   // These hosts are outside this managed environment's allowed network policy.
   // An abort is explicitly not a production API/data/advertisement check.
   if(u.hostname==='analytics.game100garage.com'||u.hostname.endsWith('googlesyndication.com')){report.blocked_infrastructure_requests.push({host:u.hostname,path:u.pathname});await route.abort();return;}
   await route.continue();
  });
  page=await context.newPage();cdp=await context.newCDPSession(page);
  page.on('pageerror',e=>report.errors.push({view:current,message:e.message}));page.on('console',m=>{if(m.type()==='error')report.console_errors.push({view:current,message:m.text()});});
  await page.goto(base+'/game032.html');const deny=page.getByRole('button',{name:'許可しない',exact:true});if(await deny.count())await deny.click();await page.waitForFunction(()=>!document.querySelector('#play')?.disabled);
  check((await page.title()).includes('川辺で、ひとやすみ。'),'Game032 title '+current);await page.locator('#explain').click();await page.locator('#menu').evaluate(e=>e.scrollTop=e.scrollHeight);
  const hit=await page.locator('#menu-portal').evaluate(e=>{const r=e.getBoundingClientRect(),target=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {bottom:r.bottom,viewport:innerHeight,centerHit:e===target||e.contains(target)};});check(hit.bottom<=hit.viewport&&hit.centerHit,'scrolled help Portal is reachable '+current,hit);
  if(current==='pc'){await page.locator('#menu-portal').click();await page.waitForURL(/index\.html$/);check(!page.url().includes('game032'),'normal PC lower help return arrives');await page.goto(base+'/game032.html');await page.waitForFunction(()=>!document.querySelector('#play')?.disabled);}
  await page.locator('#practice').click();await page.locator('#river').focus();await page.evaluate(()=>scrollTo(0,0));
  const geometry=await page.locator('#action').evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,viewport:innerHeight};});check(geometry.height>=44&&geometry.width>=44&&geometry.bottom<=geometry.viewport,'visible44px action '+current,geometry);
  let bite=false;for(let attempt=0;attempt<6&&!bite;attempt++){await hold(true);await page.waitForTimeout(180);check(await phase()==='charging','charge '+current);await hold(false);check(await phase()==='casting','release cast '+current);for(let i=0;i<180;i++){const p=await phase();if(p==='bite'){bite=true;break;}if(p==='failed'){await shot('no-catch-'+attempt);await page.waitForFunction(()=>document.querySelector('#river').dataset.phase==='idle');break;}await page.waitForTimeout(50);}}
  check(bite,'ordinary visible bite '+current);await shot('bite');await hold(true);await hold(false);check(await phase()==='fight','ordinary hook '+current);let held=false;
  for(let i=0;i<500&&await phase()==='fight';i++){const pull=await page.locator('#river').getAttribute('data-pulling')==='true';if(!pull&&!held){await hold(true);held=true;}if(pull&&held){await hold(false);held=false;}await page.waitForTimeout(50);}if(held)await hold(false);
  check(await phase()==='landed','ordinary calm-reel/pull-release lands '+current);check(Number(await page.locator('#score').innerText())>0,'catch score '+current);await shot('land');
  check(await page.evaluate(()=>localStorage.getItem('web-mini-arcade:v1:game032:best:standard:r1'))===null,'practice excludes BEST '+current);
  await page.locator('#pause').click();await shot('pause');await page.locator('#pause-title').click();await page.locator('#play').click();check(await page.locator('#score').innerText()==='0','practice excluded from new standard '+current);check((await page.locator('#time').innerText()).startsWith('5:'),'five-minute start '+current);
  await page.locator('#portal').click();await page.waitForURL(/index\.html$/);await page.locator('.game-card').first().waitFor();check(await page.locator('.game-card').count()===31,'Portal31 cards '+current);
  const card=page.locator('[data-game-id="game032"]');await card.scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const im=document.querySelector('[data-game-id="game032"] img');return im?.complete&&im.naturalWidth===640;});
  check((await card.innerText()).includes('準備中'),'032 public BEST preparation '+current);check(await card.locator('.game-play').getAttribute('href')==='./game032.html','PLAY link '+current);
  const top=card.getByRole('button',{name:/TOP10/});await top.click();await page.getByRole('dialog').last().waitFor();check((await page.getByRole('dialog').last().innerText()).includes('準備中'),'032 TOP10 preparation '+current);await shot('portal-top10');
  check(await page.locator('script[src*="pagead2.googlesyndication.com"]').count()>0,'Portal AdSense script retained '+current);
  report.views.push({viewport:v,passed:true});await context.close();
 }
 check(report.errors.length===0,'no script page errors');check(report.post_attempts===0,'zero POST attempted');check(!report.blocked_infrastructure_requests.some(r=>r.path.includes('game032')||r.path.includes('game032.score')),'no unknown032 API request');
}catch(e){report.failure={view:current,message:e.message};if(page&&!page.isClosed())await shot('failure');process.exitCode=1;}
finally{report.finished_at=new Date().toISOString();report.success=!report.failure;report.limits='Physical devices, subjective fun/hearing and production backend reception are unverified. Infrastructure GETs are blocked according to environment policy, never substituted with fake live data.';await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log(JSON.stringify({out,success:report.success,checks:report.checks.length,failure:report.failure,errors:report.errors.length,posts:report.post_attempts}));}
