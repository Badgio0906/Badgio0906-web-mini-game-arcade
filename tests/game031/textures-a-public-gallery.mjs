// Eight surfaces on the real published renderer, using official backup import.
// Synthetic display fixture in isolated browser storage; never natural achievement.
import {chromium} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const out=process.env.GAME031_QA_OUT,sha=process.env.GAME031_EXPECTED_COMMIT;
if(!out||!/^[a-f0-9]{40}$/.test(sha))throw Error('unique output and expected SHA required');
await mkdir(out,{recursive:false});
const fixture=JSON.parse(await readFile('docs/game031/textures-a/v1/QA/before/old-save-01/old-save.synthetic.json','utf8'));
fixture.worldId='synthetic-public-eight-surfaces';fixture.revision=1;fixture.inventory=Array(10).fill(0);fixture.selected=1;
fixture.stats={mined:0,placed:0,maxDepth:0,activeSeconds:0,found:[]};
fixture.player={position:{x:80,y:49,z:81.6},velocity:{x:0,y:0,z:0},yaw:0,pitch:-.127,grounded:true};
const cells=new Map();
function set(x,y,z,id){const key=[Math.floor(x/16),Math.floor(y/16),Math.floor(z/16)].join(',');if(!cells.has(key))cells.set(key,new Map());cells.get(key).set(x%16+16*(z%16+16*(y%16)),id);}
for(let x=72;x<=87;x++)for(let z=70;z<=86;z++){set(x,48,z,3);for(let y=49;y<=56;y++)set(x,y,z,0);}
const positions=[];for(let id=1;id<=8;id++){set(75+id,49,73,id);positions.push({id,x:75+id,y:49,z:73});}
fixture.chunks=[...cells].map(([key,values])=>({key,cells:[...values].sort((a,b)=>a[0]-b[0]).flat()}));
const proxy=(()=>{if(process.env.GAME031_USE_PROXY!=='1')return undefined;const p=new URL(process.env.HTTPS_PROXY||process.env.HTTP_PROXY);return{server:p.origin,...(p.username?{username:decodeURIComponent(p.username)}:{}),...(p.password?{password:decodeURIComponent(p.password)}:{})};})();
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,proxy,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();
const report={at:new Date().toISOString(),expectedCommit:sha,url:'https://game100garage.com/game031.html',provenance:'Synthetic all-eight surface display fixture imported by official UI into isolated disposable browser context on actual published JS. No debug hook, real user save, natural mining claim, thumbnail use or production ingest.',positions,quality:[],errors:[],analyticsRequests:0};
try{
 page.on('pageerror',e=>report.errors.push(e.message));await page.route('https://analytics.game100garage.com/**',r=>{report.analyticsRequests++;r.abort();});
 await page.goto(report.url,{waitUntil:'networkidle'});const deny=page.getByRole('button',{name:'許可しない',exact:true});if(await deny.count())await deny.click();
 await page.getByRole('button',{name:'設定・バックアップ',exact:true}).click();
 await page.locator('#import').setInputFiles({name:'synthetic-eight-surfaces.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
 await page.getByRole('button',{name:'置き換える',exact:true}).click();await page.getByRole('button',{name:'続きから',exact:true}).click();
 if(await page.evaluate(()=>typeof window.__DIG_PLACE_QA__!=='undefined'))throw Error('production debug hook present');
 for(const tier of ['standard','light']){
  await page.getByRole('button',{name:'休憩',exact:true}).click();await page.getByRole('button',{name:'設定・バックアップ',exact:true}).click();await page.locator('#quality').selectOption(tier);
  await page.waitForFunction(tier=>{const a=document.getElementById('app');return a.dataset.surfaceStatus==='supplied'&&a.dataset.surfaceCount==='8'&&a.dataset.surfaceTier===tier;},tier);
  await page.getByRole('button',{name:'戻る',exact:true}).click();await page.locator('#resume').click();await page.waitForTimeout(3500);
  report.quality.push({tier,state:await page.locator('#app').evaluate(a=>({status:a.dataset.surfaceStatus,count:a.dataset.surfaceCount,tier:a.dataset.surfaceTier})),icons:await page.locator('#palette .swatch').evaluateAll(elements=>elements.map(e=>({loaded:e.style.backgroundImage.startsWith('url("data:image/')}))),scripts:await page.locator('script[src]').evaluateAll(elements=>elements.map(e=>new URL(e.src).pathname))});
  if(report.quality.at(-1).icons.length!==8||report.quality.at(-1).icons.some(i=>!i.loaded))throw Error('eight supplied icons not shown');await page.screenshot({path:out+'/public-eight-'+tier+'.png'});
 }
 if(report.errors.length||report.analyticsRequests)throw Error('runtime error or unexpected ingest');report.result='PASS';
}catch(e){report.result='FAIL';report.error=e instanceof Error?e.message:'unknown';await page.screenshot({path:out+'/failure.png'}).catch(()=>{});}finally{await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');await context.close();await browser.close();}
console.log({out,result:report.result});if(report.result!=='PASS')process.exitCode=1;
