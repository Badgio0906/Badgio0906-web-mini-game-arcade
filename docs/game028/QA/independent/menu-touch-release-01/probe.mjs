import ts from 'typescript';import fs from 'node:fs';import {createHash} from 'node:crypto';
const file='/workspace/batch-two-author-028/src/games/game028/input.ts',source=fs.readFileSync(file,'utf8'),dir=new URL('.',import.meta.url).pathname;
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;fs.writeFileSync(dir+'input-before.ts.txt',source);
const {MenuGesture}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const target={id:'explain'},normal=new MenuGesture();normal.pointerDown(target);const control=normal.click(target,1);
const implicitRelease=new MenuGesture();implicitRelease.pointerDown(target);implicitRelease.clearPointers();const afterLostCapture=implicitRelease.click(target,1);
const invalidPhase=new MenuGesture();invalidPhase.pointerDown(target);invalidPhase.changePhase();const afterPhase=invalidPhase.click(target,1);
fs.writeFileSync(dir+'probe.json',JSON.stringify({recorded_at:new Date().toISOString(),source_sha256:createHash('sha256').update(source).digest('hex'),method:'Synthetic pure production MenuGesture probe; native event ordering observed separately in immutable authorphone trace. No browser/game state or source mutation.',normal_down_click:control,native_release_lostcapture_click:afterLostCapture,phase_changed_click:afterPhase},null,2));console.log(JSON.stringify({control,afterLostCapture,afterPhase}));
