import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const report={complete:false,provenance:'About:blank only; no portal runtime or network resource loaded. Reproduces initial fixture independently of old/new product source.',cases:[]};
for(const guarded of [false,true]){
 const errors=[],c=await browser.newContext();
 c.on('page',p=>p.on('pageerror',e=>errors.push({message:e.message,stack:e.stack,url:p.url()})));
 await c.addInitScript(({guarded})=>{if(guarded&&location.origin==='null')return;localStorage.getItem('comfort:initialized')},{guarded});
 const p=await c.newPage();await p.waitForTimeout(100);report.cases.push({guarded,url:p.url(),errors});await c.close();
}
await browser.close();report.complete=true;report.result=report.cases[0].errors.length===1&&report.cases[1].errors.length===0?'PASS':'FAIL';await writeFile('docs/portal-discovery/revision-01/QA/OPAQUE_STORAGE_DIAGNOSTIC.json',JSON.stringify(report,null,2)+'\n');if(report.result!=='PASS')process.exitCode=1;
