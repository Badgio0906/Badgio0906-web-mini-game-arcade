import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {createFallGame} from '../../src/games/game015/FallBoard';
import type {FallController} from '../../src/games/game015/types';

// Exercise the real DOM input adapter and FallRun; painting is outside this fixture.
class Control extends EventTarget {
  dataset:Record<string,string>={};
  captures=new Set<number>();
  constructor(public id:string,public button=false){super();}
  closest(selector:string){return this.button&&['button','button,a','.fall-controls'].includes(selector)?this:null;}
  setAttribute(name:string,value:string){if(name==='data-held')this.dataset.held=value;}
  replaceChildren(){}
  setPointerCapture(id:number){this.captures.add(id);}
  hasPointerCapture(id:number){return this.captures.has(id);}
  releasePointerCapture(id:number){this.captures.delete(id);}
  getBoundingClientRect(){return {left:100,top:70,right:300,bottom:420,width:200,height:350};}
}
describe('Game015 held UI input lifecycle',()=>{
  let parent:Control&{innerHTML:string;querySelector:(s:string)=>Control},win:EventTarget,doc:EventTarget;
  let controls:Record<string,Control>,game:FallController;
  const send=(host:EventTarget,type:string,target:Control,props:Record<string,unknown>={})=>{
    const e=new Event(type,{cancelable:true});
    Object.defineProperties(e,Object.fromEntries(Object.entries({target,isPrimary:true,pointerId:1,pointerType:'touch',button:0,clientX:150,clientY:150,detail:1,...props}).map(([k,v])=>[k,{value:v}])));
    host.dispatchEvent(e);
  };
  const down=(id='drop-button',pointerId=1)=>send(parent,'pointerdown',controls[id],{pointerId});
  beforeEach(()=>{
    controls=Object.fromEntries(['fall-canvas','left-button','right-button','drop-button'].map(id=>[id,new Control(id,id!=='fall-canvas')]));
    parent=Object.assign(new Control('parent'),{innerHTML:'',querySelector:(s:string)=>controls[s==='canvas'?'fall-canvas':s.slice(1)]});
    win=Object.assign(new EventTarget(),{innerWidth:844,innerHeight:390});
    doc=Object.assign(new EventTarget(),{hidden:false,querySelector:()=>null});
    vi.stubGlobal('window',win);vi.stubGlobal('document',doc);vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});
    game=createFallGame(parent as unknown as HTMLElement,{onUpdate:()=>{},onEvent:()=>{},onEnd:()=>{}});game.start();
  });
  afterEach(()=>{game.destroy();vi.unstubAllGlobals();});
  it('maps both directions, simultaneous DROP and independent pointer releases',()=>{
    down('left-button');expect(game.snapshot().horizontal).toBe(-1);
    down('drop-button',2);expect(game.snapshot().heldDrop).toBe(true);
    send(win,'pointerup',controls['drop-button'],{pointerId:2});expect(game.snapshot().heldDrop).toBe(false);expect(game.snapshot().horizontal).toBe(-1);
    send(win,'pointerup',controls['left-button']);down('right-button');expect(game.snapshot().horizontal).toBe(1);
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])it(`releases DROP on ${event}`,()=>{
    down();expect(game.snapshot().heldDrop).toBe(true);send(event==='lostpointercapture'?parent:win,event,controls['drop-button']);expect(game.snapshot().heldDrop).toBe(false);
  });
  for(const event of ['blur','resize','orientationchange'])it(`clears all held input on ${event} without restarting the run`,()=>{
    down('left-button');down('drop-button',2);const prior=game.snapshot();win.dispatchEvent(new Event(event));
    expect(game.snapshot()).toMatchObject({heldDrop:false,horizontal:0,time:prior.time,depth:prior.depth,alive:true});
  });
  it('releases a pointer outside the viewport and requires a fresh press',()=>{
    down();send(win,'pointermove',controls['drop-button'],{clientX:-1});expect(game.snapshot().heldDrop).toBe(false);
    send(win,'pointermove',controls['drop-button']);expect(game.snapshot().heldDrop).toBe(false);
    down();expect(game.snapshot().heldDrop).toBe(true);
  });
  it('does not steer when the new layout gutter is pressed',()=>{
    send(parent,'pointerdown',parent);expect(game.snapshot().horizontal).toBe(0);
  });
  it('clears pause/title/retry and reflects actual held input on the buttons',()=>{
    down();expect(controls['drop-button'].dataset.held).toBe('true');game.pause(true);expect(game.snapshot().heldDrop).toBe(false);expect(controls['drop-button'].dataset.held).toBe('false');
    game.pause(false);expect(game.snapshot().heldDrop).toBe(false);down();game.title();expect(game.snapshot().heldDrop).toBe(false);game.start();expect(game.snapshot().heldDrop).toBe(false);
  });
  it('retains keyboard direction and DROP release semantics',()=>{
    send(doc,'keydown',controls['fall-canvas'],{key:'ArrowRight'});send(doc,'keydown',controls['fall-canvas'],{key:' '});expect(game.snapshot()).toMatchObject({horizontal:1,heldDrop:true});
    send(doc,'keyup',controls['fall-canvas'],{key:' '});send(doc,'keyup',controls['fall-canvas'],{key:'ArrowRight'});expect(game.snapshot()).toMatchObject({horizontal:0,heldDrop:false});
  });
});
