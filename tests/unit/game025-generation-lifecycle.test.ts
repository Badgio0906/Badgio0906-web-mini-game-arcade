import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
/** Executes the actual production functions/arrow callbacks, with DOM/model edges
 * stubbed. This intentionally tests the production lifecycle, not a copied algorithm. */
function harness() {
  const source = readFileSync(new URL('../../src/games/game025/main.ts', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('main.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  const fragments: string[] = []; let apply = '', visibility = '', pagehide = '';
  const required = new Set(['pause','pauseMenu','mode','cancelJob','stopClock']);
  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name && required.has(node.name.text)) fragments.push(node.getText(ast));
    if (ts.isVariableDeclaration(node) && node.name.getText(ast)==='apply') apply=node.initializer!.getText(ast);
    if (ts.isCallExpression(node) && node.expression.getText(ast)==='document.addEventListener' && node.arguments[0]?.getText(ast)==="'visibilitychange'") visibility=node.arguments[1].getText(ast);
    if (ts.isCallExpression(node) && node.expression.getText(ast)==='window.addEventListener' && node.arguments[0]?.getText(ast)==="'pagehide'") pagehide=node.arguments[1].getText(ast);
    ts.forEachChild(node,visit);
  }
  visit(ast); if(fragments.length!==5||!apply||!visibility)throw Error('production lifecycle extraction failed');
  const script = `
    let state='generating',prior='playing',pending=5,job=1,id=1,startCell=5,seed=1,generationPaused=false,deferredFirstOpen=null;
    let elapsedMs=0,ticking=0,epoch=0,gesture=null,menuDown=null,worker=null,deadline=null,feedback='',menuCount=0,saveCount=0,opened=[];
    const document={hidden:false},performance={now:()=>1000},app={dataset:{}},grid={inert:true},menu={open:false,close(){this.open=false}},buttons={resume:{},'pause-title':{}};
    const board={difficulty:'beginner',outcome:'active',initialize(){this.initialized=true;return true;},initialized:false};
    const fallbacks=Array.from({length:81},()=>({mines:[],proof:null})),candidate=()=>[];
    const playable=()=>['playing','practice'].includes(state),training=()=>false,elapsed=()=>elapsedMs+(ticking?performance.now()-ticking:0);
    const audio={destroy:()=>{}};
    const el=id=>buttons[id],event=()=>{},save=()=>{saveCount++},render=()=>{},focusCell=()=>{},title=()=>{};
    const move=(type,cell)=>{opened.push({type,cell});};
    const show=(html,next)=>{mode(next);if(next==='paused')menuCount++;};
    ${fragments.join('\n')}
    const apply=${apply};const visibility=${visibility};const pagehide=${pagehide};
    return {pagehide(){pagehide();},hide(){document.hidden=true;visibility();},visible(){document.hidden=false;visibility();},apply(){apply(null,null);},resume(){buttons.resume.onclick();},cancel(){cancelJob();state='title';},get(){return {state,prior,ticking,generationPaused,deferredFirstOpen,menuCount,saveCount,opened:[...opened],job,pending};}};
  `;
  return new Function(ts.transpileModule(script,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText)() as {pagehide():void;hide():void;visible():void;apply():void;resume():void;cancel():void;get():{state:string;ticking:number;generationPaused:boolean;deferredFirstOpen:number|null;menuCount:number;opened:{type:string;cell:number}[]}};
}
describe('game025 production generation lifecycle callbacks',()=>{
  it('hidden during generation completes into pause, remains paused when visible, and opens only on manual resume',()=>{
    const h=harness();h.hide();expect(h.get().generationPaused).toBe(true);h.apply();
    expect(h.get().state).toBe('paused');expect(h.get().ticking).toBe(0);expect(h.get().opened).toEqual([]);expect(h.get().deferredFirstOpen).toBe(5);
    h.visible();expect(h.get().state).toBe('paused');expect(h.get().ticking).toBe(0);expect(h.get().opened).toEqual([]);
    h.resume();expect(h.get().state).toBe('playing');expect(h.get().ticking).toBe(1000);expect(h.get().opened).toEqual([{type:'open',cell:5}]);expect(h.get().deferredFirstOpen).toBe(null);
  });
  it('pagehide retains a generated deferred first open for its paused snapshot',()=>{const h=harness();h.hide();h.apply();h.pagehide();expect(h.get().state).toBe('paused');expect(h.get().deferredFirstOpen).toBe(5);expect(h.get().opened).toEqual([]);expect(h.get().ticking).toBe(0);});
  it('cancelled hidden generation cannot resume or apply its stale first open',()=>{
    const h=harness();h.hide();h.cancel();h.visible();h.apply();expect(h.get().state).toBe('title');expect(h.get().ticking).toBe(0);expect(h.get().opened).toEqual([]);expect(h.get().deferredFirstOpen).toBe(null);
  });
});
