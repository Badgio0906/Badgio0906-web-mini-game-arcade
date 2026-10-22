import{chromium}from'/workspace/arcade-rain/node_modules/@playwright/test/index.mjs';import{writeFile,mkdir}from'node:fs/promises';import assert from'node:assert/strict';
const base='http://127.0.0.1:4942/',out='/tmp/pr11-integration-20261022/site';await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),rows=[];
for(const task of['portal-http','game012-portrait','game012-landscape']){
 const c=await b.newContext({viewport:task.endsWith('landscape')?{width:844,height:390}:{width:390,height:844},isMobile:true,hasTouch:true}),p=await c.newPage(),r={task,errors:[]};
 await c.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));await c.route('**/*',x=>x.request().url().startsWith(base)&&['GET','HEAD'].includes(x.request().method())?x.continue():x.abort());p.on('pageerror',e=>r.errors.push(e.message));
 try{
  if(task==='portal-http'){
   await p.goto(base+'index.html');await p.locator('.game-card').first().waitFor();r.cards=await p.locator('.game-card').evaluateAll(es=>es.map(e=>({id:e.dataset.gameId,text:e.innerText})));assert.equal(r.cards.length,28);assert.equal(r.cards.filter(e=>e.text.includes('完成版')).length,9);assert.equal(r.cards.filter(e=>e.text.includes('試遊版')).length,19);
   r.removed=[];for(const id of['026','028','029','030','031','037']){const x=await c.request.get(base+'game'+id+'.html');r.removed.push({id,status:x.status()});assert.equal(x.status(),404);}
  }else{
   await p.goto(base+'games/yokodori-days/index.html');
   if(task.endsWith('portrait')){await p.getByText('横向きで遊んでください',{exact:true}).waitFor();assert.equal(await p.locator('#legacy-game-frame').getAttribute('src'),null);await p.locator('#game012-guide-return').tap();await p.waitForURL(base+'index.html');}
   else{await p.locator('#play-button').tap();const f=p.frameLocator('#legacy-game-frame');await f.locator('#status').waitFor({state:'hidden',timeout:60000});r.canvas=await f.locator('#canvas').evaluate(e=>({width:e.width,height:e.height,rect:e.getBoundingClientRect().toJSON()}));assert.equal(r.canvas.width,960);assert.equal(r.canvas.height,540);assert(Math.abs(r.canvas.rect.width/r.canvas.rect.height-16/9)<.01);await p.screenshot({path:out+'/game012-landscape.png'});await p.setViewportSize({width:390,height:844});await p.getByText('横向きで遊んでください',{exact:true}).waitFor();}
  }assert.equal(r.errors.length,0);r.pass=true;
 }catch(e){r.pass=false;r.failure=e.message;await p.screenshot({path:out+'/'+task+'-FAIL.png'});}
 rows.push(r);console.log(task,r.pass?'PASS':r.failure);await c.close();
}await b.close();await writeFile(out+'/REPORT.json',JSON.stringify(rows,null,2)+'\n');if(rows.some(r=>!r.pass))process.exitCode=1;
