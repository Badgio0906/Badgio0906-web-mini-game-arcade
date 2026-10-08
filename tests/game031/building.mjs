import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {deny,read,aim,mineOne} from './browser-tools.mjs';
const out=process.env.GAME031_QA_OUT;if(!out)throw Error('unique output required');await mkdir(out,{recursive:true});
const report={at:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),provenance:'Readonly state/voxel planning; ordinary mouse, keyboard and menu input only; no world or player injection.',steps:[],errors:[],requests:[]};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const context=await browser.newContext({viewport:{width:1280,height:900}});let page;
async function walk(key,ms){await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);await page.waitForTimeout(80);}
async function capture(name){const state=await read(page);report.steps.push({name,state});await page.screenshot({path:out+'/'+name+'.png'});return state;}
async function surface(){await page.getByRole('button',{name:'休憩',exact:true}).click();await page.getByRole('button',{name:'地上へ戻る',exact:true}).click();await page.waitForTimeout(100);}
async function voxel(x,y,z){return page.evaluate(([x,y,z])=>window.__DIG_PLACE_QA__.voxel(x,y,z),[x,y,z]);}
try{page=await context.newPage();await page.route('https://analytics.game100garage.com/**',r=>{report.requests.push(r.request().url());r.abort();});page.on('pageerror',e=>report.errors.push(e.message));await page.goto(process.env.GAME031_QA_URL||'http://127.0.0.1:4311/game031.html');await deny(page);await page.getByRole('button',{name:'すぐ遊ぶ',exact:true}).click();await page.waitForFunction(()=>window.__DIG_PLACE_QA__?.read()?.state==='playing');await page.waitForTimeout(900);const start=await capture('start');const sx=Math.floor(start.spawn.x),sy=start.referenceHeight,sz=Math.floor(start.spawn.z);
 for(const dy of [2,1])for(let n=0;n<3;n++){await aim(page,sx+.5,sy+dy+.5,sz-3+.5);await mineOne(page);}await capture('harvest');
 // Leave the protected return pad and construct a single-voxel step on unmodified ground.
 await aim(page,start.spawn.x,start.spawn.y+1.6,start.spawn.z-4);await walk('KeyD',1000);let s=await read(page);const bx=Math.floor(s.player.position.x),bz=sz-1;
 await page.keyboard.press('Digit1');await aim(page,bx+.5,sy+.999,bz+.5);s=await read(page);report.steps.push({name:'step-placement-target',state:s});await page.keyboard.press('KeyG');await page.waitForTimeout(100);if(await voxel(bx,sy+1,bz)!==1)throw Error('one-block step not placed');await capture('step-built');
 await aim(page,bx+.5,s.player.position.y+1.6,bz+.5);await page.keyboard.down('KeyW');await page.keyboard.press('Space');await page.waitForTimeout(280);await page.keyboard.up('KeyW');await page.waitForTimeout(500);s=await capture('step-climbed');if(s.player.position.y<sy+1.9)throw Error('ordinary jump did not land on self-built one-block step');
 // Start a two-block overhead bridge from the step, then remove its sole support.
 await surface();await aim(page,bx+.5,sy+1.999,bz+.5);await page.keyboard.press('KeyG');await page.waitForTimeout(80);if(await voxel(bx,sy+2,bz)!==1)throw Error('bridge root not placed');await capture('bridge-root');
 await aim(page,start.spawn.x,start.spawn.y+1.6,start.spawn.z-4);await walk('KeyD',1500);await aim(page,bx+.999,sy+2.5,bz+.5);s=await read(page);report.steps.push({name:'bridge-side-target',state:s});await page.keyboard.press('KeyG');await page.waitForTimeout(80);if(await voxel(bx+1,sy+2,bz)!==1)throw Error('bridge extension not placed');await capture('bridge-two-blocks');
 await surface();await aim(page,bx+.5,sy+1.5,bz+.999);await mineOne(page);if(await voxel(bx,sy+1,bz)!==0)throw Error('bridge support not mined');await page.waitForTimeout(500);if(await voxel(bx,sy+2,bz)!==1||await voxel(bx+1,sy+2,bz)!==1)throw Error('unsupported bridge did not remain fixed');await capture('bridge-support-removed');
 if(report.errors.length)throw Error('browser errors');report.result='PASS';
}catch(e){report.result='FAIL';report.error=String(e);report.failureState=await read(page).catch(()=>null);await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});}finally{await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');await context.close();await browser.close();}console.log({out,result:report.result,error:report.error});if(report.result!=='PASS')process.exitCode=1;
