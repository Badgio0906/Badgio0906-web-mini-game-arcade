import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
/** Execute the actual main.ts finalization functions with isolated service/state
 * fixtures. This covers emission/guards, not DOM input, live transport or gameplay. */
function functions(game:string,names:string[]):string {
 const text=readFileSync(`src/games/${game}/main.ts`,'utf8'),file=ts.createSourceFile('main.ts',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 const selected=file.statements.filter(ts.isFunctionDeclaration).filter(node=>node.name&&names.includes(node.name.text));
 expect(selected).toHaveLength(names.length);
 return ts.transpileModule(selected.map(node=>node.getText(file)).join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
}
function events(spy:ReturnType<typeof vi.fn>){return spy.mock.calls.map(call=>call[0]);}
describe('standard finalization events use existing production idempotence guards',()=>{
 const snakeFunctions=functions('game024',['recordEnd']);
 const snakeFixture=(training=false)=>({training,phase:'playing',saved:{run:{active:true,reported:false},stats:{runs:0,clears:0},snapshot:{},clock:{}},snake:{foods:4,body:Array(7),outcome:'wall'},speed:4,clock:{elapsed:2000},store:{write:vi.fn()},persist:vi.fn(),recordSession:{complete:vi.fn()},telemetry:{trackEvent:vi.fn()}});
 for(const outcome of ['wall','self','clear'])it(`024 ${outcome} emits one score and one end, never a quit`,()=>{
  const fixture=snakeFixture();runInNewContext(snakeFunctions+`;recordEnd('${outcome}');recordEnd('${outcome}');recordEnd('quit');`,fixture);
  expect(events(fixture.telemetry.trackEvent)).toEqual(['score','run_end']);expect(fixture.telemetry.trackEvent.mock.calls[0][1]).toMatchObject({score:4,foods:4,speed:4,outcome});expect(fixture.saved.stats.runs).toBe(1);
 });
 for(const reason of ['quit','restart'])it(`024 ${reason} emits one quit/end without a completed score`,()=>{
  const fixture=snakeFixture();runInNewContext(snakeFunctions+`;recordEnd('${reason}');recordEnd('quit');`,fixture);
  expect(events(fixture.telemetry.trackEvent)).toEqual(['quit','run_end']);expect(fixture.telemetry.trackEvent.mock.calls[0][1]).toMatchObject({reason,source:'playing',score:4});expect(fixture.recordSession.complete).not.toHaveBeenCalled();
 });
 it('024 excludes practice and already finalized restores',()=>{for(const mode of ['practice','reported','inactive']){const fixture=snakeFixture(mode==='practice');if(mode==='reported')fixture.saved.run.reported=true;if(mode==='inactive')fixture.saved.run.active=false;runInNewContext(snakeFunctions+";recordEnd('wall');recordEnd('quit');",fixture);expect(fixture.telemetry.trackEvent).not.toHaveBeenCalled();}});
 const poolFunctions=functions('game027',['track','abandon']);
 for(const training of [false,true])it(`027 abandon is idempotent and training=${training} is respected`,()=>{
  const fixture={training,current:{},phase:'paused',mode:'two',difficulty:'normal',match:{shots:[2,3],fouls:[0,1]},saved:{snapshot:{}},store:{write:vi.fn()},invalidate:vi.fn(),analyticsConfig:{environment:'production'},telemetry:{trackEvent:vi.fn()}};
  runInNewContext(poolFunctions+";abandon('restart');abandon('quit');",fixture);expect(events(fixture.telemetry.trackEvent)).toEqual(training?[]:['quit','run_end']);if(!training)expect(fixture.telemetry.trackEvent.mock.calls[0][1]).toMatchObject({reason:'restart',shots:5,source:'paused',mode:'two'});
 });
 const curlingFunctions=functions('game035',['abandon']);
 for(const mode of ['active','training','reported','missing'])it(`035 abandonment obeys ${mode} state and emits at most one quit/end`,()=>{
  const fixture={training:mode==='training',phase:'paused',saved:{snapshot:mode==='missing'?null:{},reported:mode==='reported'},game:{total:99,end:2,shots:1},store:{write:vi.fn()},telemetry:{trackEvent:vi.fn()}};
  runInNewContext(curlingFunctions+';abandon();abandon();',fixture);expect(events(fixture.telemetry.trackEvent)).toEqual(mode==='active'?['quit','run_end']:[]);if(mode==='active')expect(fixture.telemetry.trackEvent.mock.calls[0][1]).toMatchObject({source:'paused',score:99,end:2,shot:1});
 });
});
