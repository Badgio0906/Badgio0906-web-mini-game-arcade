/**
 * Disposable Codex-side independent verification of Claude's Game037.
 * This file is deleted after objective CI evidence has been captured.
 * It does not alter game code, shared CI, or production settings.
 */
import {describe,it,expect} from 'vitest';
import {spawn} from 'node:child_process';
import {existsSync,mkdtempSync,readFileSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {act,createRun,createPieces,isFull,solveStage,STAGES,stageScore,resume,suspend,totalScore} from '../../src/games/game037/model';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ci=process.env.GITHUB_ACTIONS==='true';

describe.skipIf(!ci)('Independent Codex Game037 handoff QA',()=>{
  it('rejects model manipulation and protects the pause/retry boundaries',()=>{
    for(const stage of STAGES){
      const [solution]=solveStage(stage);
      expect(solution,stage).toHaveLength(4);
      let pieces=createPieces(stage);
      for(const p of solution){
        const ix=pieces.findIndex(x=>x.id===p.id);
        pieces[ix]={...pieces[ix],rotation:p.rotation,at:{x:p.x,y:p.y}};
      }
      expect(isFull(pieces),stage).toBe(true);
    }
    let state=createRun('run','independent-001');
    expect(act(state,{type:'next'},0).outcome).toEqual({ok:false,reason:'notCleared'});
    expect(act(state,{type:'place',id:'I1',x:0,y:0},0).outcome).toEqual({ok:false,reason:'inactive'});
    state=resume(state,1000);
    const good=act(state,{type:'place',id:'I1',x:0,y:0},1000);
    expect(good.outcome).toEqual({ok:true,event:'placed'});
    state=suspend(good.state,2000);
    expect(act(state,{type:'remove',id:'I1'},10000).outcome).toEqual({ok:false,reason:'inactive'});
    expect(state.clock.accumulatedMs).toBe(1000);
    expect(totalScore(state)).toBe(0);
    expect(stageScore(0,0,0)).toBe(1000);
    expect(stageScore(1999,2,1)).toBe(907);
    expect(stageScore(3600000,99,99)).toBe(0);
    expect(createRun('practice','fresh').results).toEqual([]);
    expect(createRun('run','fresh').stageIndex).toBe(0);
  });
  it('rebuilds and operates the actual independent Vite HTTP page in headless Chromium on 4 viewports',async()=>{
    const available=[
      process.env.GAME037_CHROME,
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
    ].find(x=>x && existsSync(x));
    expect(available,'GitHub runner must have Chrome/Chromium; never label missing browser PASS').toBeTruthy();
    const scratch=mkdtempSync(join(tmpdir(),'game037-codex-independent-'));
    const build=join(scratch,'dist');
    const publicDir=join(scratch,'public');
    const report=join(scratch,'qa');
    try{
      const env={...process.env,GAME037_CHROME:available,GAME037_BUILD_DIR:build,GAME037_PUBLIC_DIR:publicDir,GAME037_REPORT:report};
      // Keep Vitest's event loop free for worker RPC heartbeats during ~80s E2E.
      const run=await new Promise<{status:number|null;stdout:string;stderr:string;error?:Error}>(done=>{
        const child=spawn(process.execPath,[join(root,'tests/game037/browser.mjs')],{cwd:root,env,stdio:['ignore','pipe','pipe']});
        let stdout='',stderr='',error:Error|undefined;
        const timeout=setTimeout(()=>child.kill('SIGKILL'),240000);
        child.stdout.on('data',chunk=>{stdout+=String(chunk);});
        child.stderr.on('data',chunk=>{stderr+=String(chunk);});
        child.on('error',e=>{error=e;});
        child.on('close',status=>{clearTimeout(timeout);done({status,stdout,stderr,error});});
      });
      console.log('[Game037 independent HTTP Playwright QA] exit',run.status,(run.stdout??'').slice(-2400),(run.stderr??'').slice(-1200));

      if(existsSync(join(report,'RESULTS.json'))){
        const diag=JSON.parse(readFileSync(join(report,'RESULTS.json'),'utf8'));
        console.log('[Game037 independent QA diagnostic]',JSON.stringify({status:diag.status,error:diag.error,passed:diag.passed,failed:diag.failed,viewports:diag.viewports,last:diag.checks.slice(-15)}).slice(0,12000));
      }

      expect(run.error?.message??'','runtime error').toBe('');
      expect(run.status,(run.stdout??'')+'\\n'+(run.stderr??'')).toBe(0);
      const data=JSON.parse(readFileSync(join(report,'RESULTS.json'),'utf8'));
      expect(data.status).toBe('PASS');
      expect(data.failed).toBe(0);
      expect(data.passed).toBeGreaterThanOrEqual(574);
      const named=data.viewports.map((x:{name:string;ok:boolean})=>x.name);
      for(const name of ['desktop','phone','narrow','landscape','denied-storage']){
        expect(named).toContain(name);
        expect(data.viewports.find((x:{name:string;ok:boolean})=>x.name===name).ok).toBe(true);
      }
      const captures=readdirSync(report).filter(x=>x.endsWith('.png'));
      expect(captures.length).toBeGreaterThanOrEqual(30);
      for(const name of ['desktop-title.png','phone-stage6-clear.png','narrow-result.png','landscape-play-rejected.png','denied-storage-title.png'])expect(captures).toContain(name);
      const errors=data.checks.filter((x:{ok:boolean})=>!x.ok);
      expect(errors).toHaveLength(0);
      console.log('[Game037 independent QA] checks='+data.passed+'/'+data.checks.length+' screenshots='+captures.length+' viewports='+named.join(','));
    }finally{rmSync(scratch,{force:true,recursive:true});}
  },270000);
});
