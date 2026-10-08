// Targeted attribution of published console network errors; no test submissions.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.RECORDS_QA_OUT,sha=process.env.RECORDS_EXPECTED_COMMIT;
if(!out||!/^[a-f0-9]{40}$/.test(sha))throw Error('Unique output and expected commit required');
await mkdir(out,{recursive:false});
const p=new URL(process.env.HTTPS_PROXY),proxy={server:p.origin,username:decodeURIComponent(p.username),password:decodeURIComponent(p.password)};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',proxy,args:['--no-sandbox']});
const report={at:new Date().toISOString(),expected_commit:sha,failed_requests:[],console_errors:[],page_errors:[],analytics_posts:0};
try{const context=await browser.newContext(),page=await context.newPage();
page.on('requestfailed',r=>{const url=new URL(r.url());report.failed_requests.push({host:url.hostname,path:url.pathname,error:r.failure()?.errorText});});
page.on('console',m=>{if(m.type()==='error')report.console_errors.push(m.text());});page.on('pageerror',e=>report.page_errors.push(e.message));
await context.route('**/*',route=>{if(route.request().method()==='POST'&&route.request().url().includes('analytics.game100garage.com')){report.analytics_posts++;return route.abort();}return route.continue();});
await page.goto('https://game100garage.com/?qa='+sha.slice(0,12),{waitUntil:'networkidle'});
const deny=page.getByRole('button',{name:'許可しない',exact:true});if(await deny.count())await deny.click();
await page.screenshot({path:out+'/portal.png'});
await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');console.log({out,failed_requests:report.failed_requests,page_errors:report.page_errors.length,analytics_posts:report.analytics_posts});
}finally{await browser.close();}
