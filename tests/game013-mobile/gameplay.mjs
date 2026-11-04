import { chromium } from '@playwright/test';
import { rhythmChart } from '../../public/games/tachibana-task-heaven/mobile-model.js';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),report=[];
const page=await browser.newPage({viewport:{width:390,height:844}});
async function open(slug){await page.goto(`http://localhost:5187/games/${slug}/index.html`);const deny=page.getByRole('button',{name:'許可しない',exact:true});if(await deny.isVisible())await deny.click();}
await open('finger-heart-challenge');await page.locator('#practice').click();
for(let i=0;i<2;i++){await page.waitForFunction(()=>!document.querySelector('#stop').disabled&&document.querySelector('#hand').src.endsWith('/heart.webp')&&parseFloat(document.querySelector('.timing span')?.style.left)>40,{},{timeout:15000});await page.keyboard.press('Space');}
await page.getByText('できました！',{exact:true}).waitFor();report.push({test:'heart practice isolated',saved:await page.evaluate(()=>localStorage.getItem('game014.mobile.v2.best'))});
await page.locator('#play').click();await page.keyboard.press('Space');await page.getByText('RANK D · 0点',{exact:true}).waitFor();report.push({test:'wrong pose ends with zero',best:await page.evaluate(()=>localStorage.getItem('game014.mobile.v2.best'))});
await page.locator('#play').click();
for(let i=0;i<25;i++){await page.waitForFunction(()=>!document.querySelector('#stop').disabled&&document.querySelector('#hand').src.endsWith('/heart.webp')&&parseFloat(document.querySelector('.timing span')?.style.left)>40,{},{timeout:20000});await page.keyboard.press('Space');}
await page.getByText('25回クリア！',{exact:true}).waitFor();await page.screenshot({path:'docs/game014/mobile-20261104/QA/clear-390.png'});report.push({test:'25 normal input successes',panel:await page.locator('#panel').innerText(),best:await page.evaluate(()=>localStorage.getItem('game014.mobile.v2.best'))});
await open('tachibana-task-heaven');await page.locator('#adjust').click();await page.locator('#offset').fill('100');await page.locator('#title').click();await page.locator('#play').click();await page.locator('#pads').waitFor({state:'visible'});
await page.locator('#menu').click();const before=await page.locator('#score').textContent();await page.waitForTimeout(500);await page.locator('#resume').click();await page.locator('#pads').waitFor({state:'visible'});report.push({test:'rhythm explicit pause/resume',before,after:await page.locator('#score').textContent()});
const chart=rhythmChart(JSON.parse(await fs.readFile('public/games/tachibana-task-heaven/mobile-assets/stage_01.json','utf8')));
for(const note of chart.notes){await page.waitForFunction(({t,duration})=>parseFloat(document.querySelector('#progress span').style.width)*duration/100>=t+.1,{t:note.t,duration:chart.duration},{timeout:20000});await page.keyboard.press(String(note.channel));}
await page.getByText(/STAGE 1 結果/).waitFor({timeout:15000});await page.screenshot({path:'docs/game013/mobile-20261104/QA/result-390.png'});report.push({test:'stage1 normal keyboard completed',panel:await page.locator('#panel').innerText(),best:await page.evaluate(()=>localStorage.getItem('game013.mobile.v2.best')),stageBest:await page.evaluate(()=>localStorage.getItem('game013.mobile.v2.stage1.best'))});
await fs.writeFile('docs/game013/mobile-20261104/QA/gameplay.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
