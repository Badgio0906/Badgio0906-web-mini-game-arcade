import { readFileSync } from 'node:fs';import { describe, expect, it } from 'vitest';import ts from 'typescript';
/** Extract the production menu listeners; no copied gesture algorithm. */
function harness() {
 const source=readFileSync(new URL('../../src/games/game025/main.ts',import.meta.url),'utf8'),ast=ts.createSourceFile('main.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);const found=new Map<string,string>();
 function visit(n:ts.Node){if(ts.isCallExpression(n)&&n.expression.getText(ast)==='menu.addEventListener'){const name=n.arguments[0]?.getText(ast);if(["'pointerdown'","'pointercancel'","'click'"].includes(name))found.set(name.slice(1,-1),n.arguments[1].getText(ast));}ts.forEachChild(n,visit);}visit(ast);if(found.size!==3)throw Error('production listeners not found');
 const script=`let epoch=1,menuDown=null;const action={id:'resume'},other={id:'cancel'};const handlers={${[...found].map(([name,body])=>`${JSON.stringify(name)}:${body}`).join(',')}};return{down(){handlers.pointerdown({target:{closest:()=>action},isPrimary:true,button:0});},cancel(){handlers.pointercancel();},mode(){epoch++;menuDown=null;},click({keyboard=false,otherTarget=false}={}){let prevented=false,stopped=false;handlers.click({target:{closest:()=>otherTarget?other:action},detail:keyboard?0:1,preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});return{prevented,stopped};}};`;
 return new Function(ts.transpileModule(script,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText)() as {down():void;cancel():void;mode():void;click(options?:{keyboard?:boolean;otherTarget?:boolean}):{prevented:boolean;stopped:boolean}};
}
describe('game025 production menu gesture boundary',()=>{
 it('blocks retargeted compatibility click with no fresh menu press, permits a fresh cancel/resume action',()=>{const h=harness();expect(h.click()).toEqual({prevented:true,stopped:true});h.down();expect(h.click()).toEqual({prevented:false,stopped:false});});
 it('rejects a different target, canceled pointer, stale screen press and duplicate click',()=>{const h=harness();h.down();expect(h.click({otherTarget:true}).prevented).toBe(true);h.down();h.cancel();expect(h.click().prevented).toBe(true);h.down();h.mode();expect(h.click().prevented).toBe(true);h.down();expect(h.click().prevented).toBe(false);expect(h.click().prevented).toBe(true);});
 it('keeps keyboard activation without a pointer press',()=>{expect(harness().click({keyboard:true})).toEqual({prevented:false,stopped:false});});
});
