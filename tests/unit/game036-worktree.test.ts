/**
 * ONE-TIME verification: remove after capturing evidence in HANDOFF/report.
 * Must execute real git fetch, named remote ref, detached worktree and clean
 * npm ci plus the originally requested three CLI commands.
 */
import {describe,it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const branch = 'claude/pilot-game036-handoff-20261018';
const base = '9e96d557779c5de099fe54c51731ceb131e591a1';

const allowed = (file:string):boolean =>
  file === 'game036.html' ||
  file.startsWith('src/games/game036/') ||
  file.startsWith('tests/game036/') ||
  (file.startsWith('tests/unit/game036') && file.endsWith('.test.ts')) ||
  file.startsWith('docs/game036/') ||
  file === 'docs/agent-tasks/pilot-game036-handoff-20261018/ASSIGNMENT.md' ||
  file === 'docs/agent-tasks/pilot-game036-handoff-20261018/HANDOFF.md';

describe('Game036 one-time new worktree reproduction',()=>{
  it.skipIf(process.env.GITHUB_ACTIONS !== 'true' || process.env.GAME036_WORKTREE_CHILD === '1')(
    'fetches actual remote HEAD and runs original CLI commands in fresh worktree',
    ()=>{
      const scratch=mkdtempSync(join(tmpdir(),'game036-real-worktree-'));
      const checkout=join(scratch,'checkout');
      const build=join(scratch,'dist-game036');
      const qa=join(scratch,'qa');
      let worktreeAdded=false;
      const sharedEnv={...process.env,GAME036_WORKTREE_CHILD:'1'};
      function cmd(label:string,exec:string,args:string[],cwd=root,extraEnv:Record<string,string>={},timeout=180000){
        const result=spawnSync(exec,args,{cwd,env:{...sharedEnv,...extraEnv},encoding:'utf8',timeout,maxBuffer:10*1024*1024});
        const output=((result.stdout??'')+'\n'+(result.stderr??'')).trim();
        console.log('[Game036 real worktree] '+label+' exit='+result.status+'\n'+output.slice(-3000));
        expect(result.error?.message ?? '',label).toBe('');
        expect(result.status,label+'\n'+output).toBe(0);
        return (result.stdout??'').trim();
      }
      try {
        cmd('git fetch origin','git',['fetch','origin'],root,{},60000);
        const probe=spawnSync('git',['rev-parse','--verify','origin/'+branch],{cwd:root,env:sharedEnv,encoding:'utf8'});
        if(probe.status!==0){
          // checkout@v4 may use a shallow PR-only fetch refspec.
          cmd('explicit named remote branch fetch','git',['fetch','origin','+refs/heads/'+branch+':refs/remotes/origin/'+branch],root,{},60000);
        }
        const remoteSha=cmd('git rev-parse origin/'+branch,'git',['rev-parse','origin/'+branch]);
        expect(remoteSha).toMatch(/^[a-f0-9]{40}$/);
        cmd('fetch base for exact diff','git',['fetch','origin',base],root,{},60000);
        cmd('git worktree add --detach','git',['worktree','add','--detach',checkout,remoteSha],root,{},60000);
        worktreeAdded=true;
        expect(existsSync(join(checkout,'node_modules'))).toBe(false);
        expect(existsSync(join(checkout,'dist'))).toBe(false);
        const changed=cmd('git diff --name-only BASE remoteSHA','git',['diff','--name-only',base,remoteSha],checkout).split('\n').filter(Boolean);
        expect(changed.length).toBeGreaterThan(0);
        expect(changed.filter(file=>!allowed(file)),'out-of-scope files').toEqual([]);
        console.log('[Game036 real worktree] VERIFIED_REMOTE_SHA='+remoteSha+' ALLOWED_FILES='+changed.length);
        cmd('npm ci','npm',['ci'],checkout,{},180000);
        cmd('npx vitest run tests/unit/game036*.test.ts','bash',['-lc','npx vitest run tests/unit/game036*.test.ts'],checkout,{},180000);
        cmd('npx tsc --noEmit','npx',['tsc','--noEmit'],checkout,{},180000);
        cmd('GAME036_BUILD_DIR=<isolated> npx vite build --config tests/game036/vite.config.mjs',
          'npx',['vite','build','--config','tests/game036/vite.config.mjs'],checkout,{GAME036_BUILD_DIR:build},180000);
        cmd('GAME036_BUILD_DIR=<isolated> GAME036_QA_OUT=<isolated> node tests/game036/browser.mjs',
          'node',['tests/game036/browser.mjs'],checkout,{GAME036_BUILD_DIR:build,GAME036_QA_OUT:qa},180000);
        console.log('[Game036 real worktree] ALL_REQUIRED_WORKTREE_STEPS_PASS');
      } finally {
        if(worktreeAdded){
          const cleanup=spawnSync('git',['worktree','remove','--force',checkout],{cwd:root,env:sharedEnv,encoding:'utf8',timeout:30000});
          console.log('[Game036 real worktree] cleanup status='+cleanup.status+' '+(cleanup.stderr??'').trim());
        }
        rmSync(scratch,{recursive:true,force:true});
      }
    },360000);
});
