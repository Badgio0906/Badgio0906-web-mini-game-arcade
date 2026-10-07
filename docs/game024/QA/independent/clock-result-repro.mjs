import fs from 'node:fs';
import crypto from 'node:crypto';
import ts from 'typescript';
const author='/workspace/classic-author-024';
const read=path=>fs.readFileSync(`${author}/${path}`,'utf8');
const moduleUrl=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const transpile=code=>ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const modelUrl=moduleUrl(transpile(read('src/games/game024/model.ts')));
const {createSnake,step}=await import(modelUrl);
const {SnakeClock}=await import(moduleUrl(transpile(read('src/games/game024/clock.ts'))));
const {blankSave,captureSave,validateSave,SnakeSaveStore}=await import(moduleUrl(transpile(read('src/games/game024/save.ts')).replace(/from ['"]\.\/model['"]/g,`from '${modelUrl}'`)));
let snake={...createSnake(24),body:[{x:19,y:10},{x:18,y:10},{x:17,y:10}],food:{x:0,y:0}};
let save={...blankSave(),speed:8,snapshot:snake,run:{id:'00000000-0000-4000-8000-000000000024',active:true,reported:false,freshFoods:0},stats:{best:{4:9,6:7,8:12},runs:3,clears:0}};
const before=structuredClone(save);let raw=null,ticks=0;
const backend={getItem:()=>raw,setItem:(_key,value)=>{raw=value}};
const store=new SnakeSaveStore(backend),clock=new SnakeClock(8);
clock.resume();clock.frame(0,()=>true);clock.frame(500,()=>{
  ticks++;snake=step(snake);
  if(snake.outcome!=='playing'){
    save.run.active=false;save.run.reported=true;save.stats.runs++;
    save=captureSave(save,snake,8,{remainder:clock.remainder,elapsed:clock.elapsed});store.write(save);
    return false;
  } return true;
});
// main.result() does a second persist after setPhase(result)/clock.pause().
save=captureSave(save,snake,8,{remainder:clock.remainder,elapsed:clock.elapsed});store.write(save);
const restored=new SnakeSaveStore(backend).read();
const output={observed_at:new Date().toISOString(),provenance:'independent synthetic boundary invocation of actual frozen model/clock/save; main lifecycle sequence reproduced, no browser or Jev answers',source_hashes:Object.fromEntries(['model','clock','save','main'].map(name=>{const p=`src/games/game024/${name}.ts`;return[p,crypto.createHash('sha256').update(read(p)).digest('hex')]})),input:{speed:8,frame_times:[0,500],before},observed:{ticks,outcome:snake.outcome,remainder:clock.remainder,elapsed:clock.elapsed,saved:save,snapshot_valid:validateSave(save)!==null,reloaded:restored},expectation:'completed result and prior BEST/statistics remain valid after early collision on a permitted slow frame'};
fs.writeFileSync('docs/game024/QA/independent/CLOCK_RESULT_REPRO_BEFORE.json',JSON.stringify(output,null,2)+'\n');
if(ticks!==1||snake.outcome!=='wall'||clock.remainder!==375||validateSave(save)!==null||restored.stats.best[8]!==0||restored.stats.runs!==0)throw new Error('Expected finding did not reproduce');
process.stdout.write(JSON.stringify({reproduced:true,ticks,outcome:snake.outcome,saved_remainder:clock.remainder,saved_runs:save.stats.runs,reloaded_runs:restored.stats.runs,saved_best:save.stats.best[8],reloaded_best:restored.stats.best[8]})+'\n');
