// Run only with a granted single browser slot. No output directory is reused.
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const base=process.env.GAME026_BASE,out=process.env.GAME026_REPORT;
if(!base||!out)throw new Error('Set GAME026_BASE and a NEW unique GAME026_REPORT directory');
await fs.mkdir(out,{recursive:false});
const freeze=JSON.parse(await fs.readFile(process.env.GAME026_FREEZE??'docs/game026/SOURCE_FREEZE.json','utf8'));
async function frozen(){for(const[p,h]of Object.entries(freeze.files))assert.equal(crypto.createHash('sha256').update(await fs.readFile(p)).digest('hex'),h,`source changed:${p}`);}
await frozen();
const report={base,started_at:new Date().toISOString(),source:freeze.files,records:[],provenance:'Compiled production ordinary native input, read-only synthetic browser save; DOM background/capture cancellation fixtures labeled explicitly; no model or dice injection. Not author enjoyment or physical phone.',physicalPhone:false,authorPlayed:false};
const save=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-arcade:v1:game026:snapshot')??'null'));
const state=(p,s)=>p.waitForFunction(s=>document.getElementById('app').dataset.state===s,s);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
async function write(){report.updated_at=new Date().toISOString();await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));}
try{for(const[name,width,height,touch]of [['desktop',1365,900,false],['phone',390,844,true],['small',320,740,true],['landscape',844,390,true]]){
 const r={name,width,height,touch,status:'RUNNING',checks:[],captures:[],errors:[],trace:[],layouts:[]};report.records.push(r);
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});await ctx.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
 await ctx.route(/google-analytics\.com|googletagmanager\.com|analytics\.game100garage\.com/,q=>q.abort());await ctx.route(/googlesyndication\.com/,q=>q.fulfill({status:200,body:'',contentType:'application/javascript'}));
 const p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>r.errors.push(e.message));
 await p.exposeFunction('record026',e=>{r.trace.push(e);if(r.trace.length>150)r.trace.shift()});
 await p.addInitScript(()=>{for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture','click','keydown','keyup'])document.addEventListener(type,e=>window.record026({type,target:e.target.id,detail:e.detail??null,key:e.key??null,state:document.getElementById('app')?.dataset.state,at:performance.now()}),true)});
 const tap=s=>touch?p.locator(s).tap():p.locator(s).click();
 const capture=async label=>{const f=`${name}-${label}.png`;await p.screenshot({path:path.join(out,f),fullPage:false});r.captures.push(f);r.layouts.push(await p.evaluate(()=>{const rect=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom,text:e.textContent.trim()}};return{state:document.getElementById('app').dataset.state,width:innerWidth,height:innerHeight,scrollY,scrollWidth:document.documentElement.scrollWidth,board:rect(document.getElementById('board')),controls:[...document.querySelectorAll('button,select')].filter(e=>e.getClientRects().length).map(rect)}}));};
 const pass=(name,data={})=>r.checks.push({name,status:'PASS',...data});
 try{
 await p.goto(`${base}/game026.html`);await state(p,'title');await capture('title');await tap('#explain');await state(p,'help');await capture('explanation');await tap('#help-return');await state(p,'title');
 await p.locator('#mode').selectOption('local4');await tap('#play');await state(p,'playing');await capture('ordinary-four-overlap');let s=await save(p);assert.equal(s.active.mode,'local4');assert.equal(await p.locator('#board rect').count(),101); //100cells plus square player
 assert.equal(await p.locator('#players .player').count(),4);assert.deepEqual(s.active.history,[]);pass('ordinary4players, full100cell code-drawn overview and distinguishable overlap');
 await tap('#roll');await p.keyboard.press('Escape');await state(p,'paused');const saved=await save(p);assert.equal(saved.active.pending!==null,true);assert.deepEqual(saved.active.history,[]);await capture('pending-die-paused');await delay(400);assert.deepEqual((await save(p)).active,saved.active);pass('pendingdie pause stops settlement and retains current turn');
 await tap('#mute');assert.equal(await p.locator('#mute').innerText(),'音 OFF');await p.reload();await state(p,'title');await tap('#restore');await state(p,'paused');s=await save(p);assert.equal(s.active.pending,saved.active.pending);assert.equal(s.active.resultId,saved.active.resultId);assert.equal(s.active.runId,saved.active.runId);assert.equal(await p.locator('#mute').innerText(),'音 OFF');pass('restore explicitly paused, exact pendingdice/localresult/observer preserved');
 await tap('#resume');await state(p,'playing');s=await save(p);assert.equal(s.active.history.length,1);assert.equal(s.active.history[0].die,saved.active.pending);assert.equal(s.active.pending,null);await capture('ordinary-after-first');pass('exact pending result settles once, no reroll');
 const count=s.active.history.length;await p.locator('#roll').focus();await p.keyboard.down('Enter');await p.keyboard.down('Enter');await p.keyboard.up('Enter');await state(p,'playing');assert.equal((await save(p)).active.history.length,count+1);pass('held repeat keyboard commits one roll on release');
 await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await state(p,'paused');await capture('paused');await delay(350);assert.equal((await save(p)).active.history.length,count+1);await tap('#resume');await state(p,'playing');pass('delivered DOM blur fixture pauses, explicit resume no catchup',{fixture:'DOM blur dispatch, not physical app switch'});
 const beforeCancel=await save(p);await p.evaluate(()=>{const b=document.getElementById('roll');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:777,isPrimary:true,button:0}));b.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:777,isPrimary:true}));b.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));});assert.deepEqual((await save(p)).active,beforeCancel.active);pass('DOMpointercancel fixture refuses subsequent compatibility click');
 await tap('#pause');await state(p,'paused');await tap('#pause-title');await state(p,'title');const abandoned=await save(p);assert.equal(abandoned.active,null);await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));assert.equal((await save(p)).active,null);await p.reload();await state(p,'title');assert.equal(await p.locator('#restore').count(),0);pass('abandon→pagehide→reload cannot resurrect oldmatch');
 const beforePractice=(await save(p)).stats;await tap('#practice');await state(p,'practice');await capture('practice');await tap('#roll');await state(p,'practice');assert.match(await p.locator('#status').innerText(),/異動/);await tap('#roll');await state(p,'practice-result');await capture('practice-complete');assert.deepEqual((await save(p)).stats,beforePractice);await tap('#practice-title');await state(p,'title');pass('genuine practice transfer+promotion, no localstats or RUN persistence');
 await p.locator('#mode').selectOption('cpu');await tap('#play');await state(p,'playing');await tap('#roll');await p.waitForFunction(()=>JSON.parse(localStorage.getItem('web-mini-arcade:v1:game026:snapshot')).active.history.length>=2);await state(p,'playing');assert.equal((await save(p)).active.history.length,2);pass('ordinary equal-rule CPU turn returns to human once');
 for(const layout of r.layouts){assert.ok(layout.scrollWidth<=width+.1,'horizontal page overflow');for(const b of layout.controls){assert.ok(b.width>=43.9&&b.height>=43.9,`control below44px:${b.text}`);assert.ok(b.x>=-.1&&b.right<=width+.1,`horizontally clippedcontrol:${b.text}`)}if(layout.state==='playing'){assert.ok(layout.board.x>=0&&layout.board.right<=width+.1);assert.ok(layout.board.y>=0&&layout.board.bottom<=height+.1,'fullboard not visible in viewport');}}
 assert.deepEqual(r.errors,[]);pass('44px controls, no horizontal clipping, real viewport fullboard, errors0');r.status='PASS';
 }catch(e){r.status='FAIL';r.error=String(e);await capture('failure').catch(()=>{});r.failureDOM=await p.locator('#app').evaluate(e=>({state:e.dataset.state,html:e.outerHTML.slice(0,18000)})).catch(()=>null);await write();process.exitCode=1;break;}
 finally{await ctx.close();await write();}
 }}finally{await browser.close();await frozen();report.finished_at=new Date().toISOString();await write();}
