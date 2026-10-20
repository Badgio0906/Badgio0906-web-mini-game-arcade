// Reproduction probes for findings, not fixes or user-consent automation in production.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE||'http://127.0.0.1:4952/',out=process.env.QA_OUT;
if(!out)throw Error('QA_OUT required');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const rows=[];
try{for(const [id,width,height] of [['game002',390,844],['game003',390,844],['game033',390,844],['game015',844,390],['game015',320,568]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
 await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 if(id!=='game033')await context.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
 const page=await context.newPage(),row={id,width,height};
 await page.goto(base+id+'.html',{waitUntil:'networkidle'});
 if(id==='game002'){await page.locator('#how-button').tap();row.help=await page.locator('#how-dialog').innerText();}
 if(id==='game033'){
  const deny=page.locator('#analytics-settings-host').locator('#deny');row.titleModal=await page.locator('#menu').evaluate(e=>({open:e.open,modal:e.matches(':modal')}));row.denyVisible=await deny.isVisible();
  try{await deny.tap({timeout:1200});row.deniedBeforeStart=true;}catch{row.deniedBeforeStart=false;}
  await page.screenshot({path:out+'/game033-consent-before-start.png'});
  await page.locator('button[data-action="play"]').tap();await page.waitForTimeout(300);await deny.tap();row.deniedAfterStart=await page.evaluate(()=>localStorage.getItem('game100garage:analytics-consent:v1'));
 }
 if(id==='game015'){await page.locator('#play-button').tap();await page.waitForTimeout(400);}
 row.dom=await page.evaluate(()=>({text:document.body.innerText,overflow:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth,canvas:[...document.querySelectorAll('canvas')].map(e=>{const r=e.getBoundingClientRect();return {id:e.id,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};}),controls:[...document.querySelectorAll('#controls button,#analytics-settings-host')].map(e=>{const r=e.getBoundingClientRect();return {id:e.id,x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};})}));
 await page.screenshot({path:out+`/${id}-${width}.png`});rows.push(row);await context.close();
}}finally{await browser.close();await writeFile(out+'/findings.json',JSON.stringify(rows,null,2)+'\n');}
console.log(JSON.stringify(rows.map(r=>({id:r.id,width:r.width,overflow:r.dom.overflow,denyBefore:r.deniedBeforeStart,denyAfter:r.deniedAfterStart,oldCredit:r.help?.includes('CREDIT')}))));
