import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base=process.env.TITLE_UI_QA_BASE_URL??'http://127.0.0.1:4173';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const records=[];
try{
  for(const game of ['game002','game003','game004','game005']){
    const context=await browser.newContext({viewport:{width:1920,height:1080}});const page=await context.newPage();const errors=[];const fontResponses=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('requestfailed',r=>errors.push(`${r.url()}: ${r.failure()?.errorText}`));
    page.on('response',r=>{if(r.request().resourceType()==='font')fontResponses.push((async()=>({url:r.url(),status:r.status(),encodedBytes:(await r.body()).length}))());});
    await page.goto(`${base}/${game}.html`);await page.evaluate(()=>document.fonts.ready);
    const fonts=await Promise.all(fontResponses);
    assert(fonts.length>0,`${game} no actual local font request`);
    assert(fonts.every(f=>f.status===200&&f.encodedBytes>0&&f.url.startsWith(base+'/fonts/')),`${game} failed/external font`);
    const styles=await page.evaluate(()=>({loaded:[...document.fonts].filter(f=>f.family.includes('Arcade Rounded')).map(f=>({family:f.family,status:f.status,weight:f.weight})),brand:getComputedStyle(document.querySelector('.brand-title')).fontFamily,title:getComputedStyle(document.querySelector('h1')).fontFamily,titleText:document.querySelector('h1').textContent,documentTitle:document.title}));
    assert(styles.loaded.some(f=>f.status==='loaded'),`${game} local face not loaded`);assert(styles.brand.includes('Arcade Rounded'));assert(styles.title.includes('Arcade Rounded'));assert(/[ぁ-んァ-ヶ一-龯]/.test(styles.titleText));
    assert.deepEqual(errors,[],game);records.push({game,fonts,styles,errors});await context.close();console.log(`${game}: local Japanese font and title PASS`);
  }
}finally{await browser.close();await writeFile('docs/revisions/FONT_LOAD_AUDIT.json',JSON.stringify(records,null,2)+'\n');}
