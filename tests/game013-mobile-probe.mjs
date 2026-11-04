import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const results=[];
for(const [slug,id] of [['tachibana-task-heaven','013'],['finger-heart-challenge','014']]){
 for(const [w,h] of [[390,844],[320,720],[844,390],[1280,900]]){
  const page=await browser.newPage({viewport:{width:w,height:h}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://localhost:5187/games/${slug}/index.html`);await page.locator('.character .body,.office img').first().waitFor();await page.getByRole('button',{name:'許可しない',exact:true}).click();await page.waitForTimeout(100);await page.screenshot({path:`docs/game${id}/mobile-20261104/QA/title-${w}.png`});
  const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,buttons:[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().height).map(b=>({id:b.id,w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height,bottom:b.getBoundingClientRect().bottom}))}));
  await page.locator('#play').click();await page.locator(id==='013'?'#pads':'#stop').waitFor({state:'visible',timeout:20000});await page.screenshot({path:`docs/game${id}/mobile-20261104/QA/play-${w}.png`});await page.locator('#menu').click();await page.locator('#resume').waitFor();await page.waitForTimeout(300);await page.locator('#resume').click();await page.locator(id==='013'?'#pads':'#stop').waitFor({state:'visible'});results.push({id,w,layout,errors});await page.close();
 }
}
await fs.writeFile('docs/game013/mobile-20261104/QA/layout-and-pause.json',JSON.stringify(results,null,2));await browser.close();console.log(JSON.stringify(results.map(x=>({id:x.id,w:x.w,overflow:x.layout.scroll>x.layout.width,vertical:x.layout.scrollHeight>x.layout.height,errors:x.errors})),null,2));
