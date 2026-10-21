import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const base='http://127.0.0.1:4981',out='docs/game036/QA/independent-motion';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];
try{for(const viewport of [{width:390,height:844},{width:844,height:390}]){
 const name=`${viewport.width}x${viewport.height}`,context=await browser.newContext({viewport,isMobile:true,hasTouch:true});
 const row={name,startedAt:new Date().toISOString(),errors:[],blocked:[],frames:[],actions:[]};
 await context.route('**/*',r=>{const q=r.request();if(new URL(q.url()).origin===base&&['GET','HEAD'].includes(q.method()))return r.continue();row.blocked.push({method:q.method(),url:q.url()});return r.abort();});
 const page=await context.newPage();page.on('pageerror',e=>row.errors.push(e.message));
 try{
  await page.goto(base+'/game036.html',{waitUntil:'domcontentloaded'});await page.waitForTimeout(550);
  const deny=page.locator('#analytics-settings-host #deny');if(await deny.isVisible())await deny.tap();
  row.title=await page.locator('#app').getAttribute('data-state');
  await page.locator('#practice').tap();row.actions.push('native touch practice');await page.waitForTimeout(250);
  await page.screenshot({path:`${out}/${name}-preview.png`});
  const t=Date.now();await page.locator('#drop').tap();row.actions.push('native touch drop');
  for(let i=0;i<18;i++){
   const state=await page.locator('#app').getAttribute('data-state'),status=await page.locator('#status').innerText();
   const image=await page.screenshot({path:`${out}/${name}-frame-${String(i).padStart(2,'0')}.png`});
   row.frames.push({i,wallElapsedMs:Date.now()-t,state,status,sha256:crypto.createHash('sha256').update(image).digest('hex')});
   await page.waitForTimeout(120);
  }
  row.resultText=await page.locator('#menu').innerText();row.complete=row.resultText.includes('2連鎖')&&await page.locator('#app').getAttribute('data-state')==='result';
  row.uniqueFrames=new Set(row.frames.map(x=>x.sha256)).size;
  row.geometry=await page.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight},bodyScrollHeight:document.body.scrollHeight,htmlScrollHeight:document.documentElement.scrollHeight,buttons:[...document.querySelectorAll('.pad button')].map(e=>({id:e.id,...e.getBoundingClientRect().toJSON()}))}));
 }catch(e){row.error=String(e.message);}
 finally{await context.close();row.contextClosed=true;results.push(row);await fs.writeFile(out+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify({name,complete:row.complete,error:row.error,uniqueFrames:row.uniqueFrames,errors:row.errors}));}
}}finally{await browser.close();await fs.writeFile(out+'/closed.json',JSON.stringify({browserClosed:true,at:new Date().toISOString()}));}
