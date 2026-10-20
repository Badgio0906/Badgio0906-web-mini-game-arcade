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
    host.dispatchEvent(e);return e;
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
  it('handles a terminal event at document capture before another UI can stop bubbling',()=>{
    down('left-button');send(doc,'pointerup',controls['left-button']);expect(game.snapshot().horizontal).toBe(0);
  });
  it('clears adapter input when document becomes hidden, without relying on the page wrapper',()=>{
    down('left-button');down('drop-button',2);Object.assign(doc,{hidden:true});doc.dispatchEvent(new Event('visibilitychange'));expect(game.snapshot()).toMatchObject({horizontal:0,heldDrop:false});
  });
  it('explicitly releases capture on pause and repeated terminal cleanup is safe',()=>{
    down('left-button');down('drop-button',2);controls['left-button'].releasePointerCapture=id=>{controls['left-button'].captures.delete(id);send(parent,'lostpointercapture',controls['left-button'],{pointerId:id});};game.pause(true);expect(controls['left-button'].captures.size).toBe(0);expect(controls['drop-button'].captures.size).toBe(0);
    send(doc,'pointercancel',controls['left-button']);send(parent,'lostpointercapture',controls['left-button']);game.pause(false);expect(game.snapshot()).toMatchObject({horizontal:0,heldDrop:false});
  });
  for(const type of ['touchend','touchcancel'])it(`uses ${type} with no active touches when pointerup is missing, preserving keyboard`,()=>{
    send(doc,'keydown',controls['fall-canvas'],{key:'ArrowRight'});down('left-button');down('drop-button',2);
    send(doc,type,controls['left-button'],{touches:[]});expect(game.snapshot()).toMatchObject({horizontal:1,heldDrop:false});send(doc,'keyup',controls['fall-canvas'],{key:'ArrowRight'});expect(game.snapshot().horizontal).toBe(0);
  });
  it('does not clear a remaining contact or mouse while another touch ends',()=>{
    down('left-button');down('drop-button',2);send(doc,'touchend',controls['left-button'],{touches:[{identifier:999}]});expect(game.snapshot()).toMatchObject({horizontal:-1,heldDrop:true});
    send(doc,'pointerup',controls['left-button']);expect(game.snapshot()).toMatchObject({horizontal:0,heldDrop:true});
    send(parent,'pointerdown',controls['right-button'],{pointerId:3,pointerType:'mouse'});send(doc,'touchend',controls['drop-button'],{touches:[]});expect(game.snapshot()).toMatchObject({horizontal:1,heldDrop:false});
  });
  for(const type of ['contextmenu','selectstart'])it(`prevents ${type} only on play controls and releases the affected contact`,()=>{
    down('left-button');down('drop-button',2);const e=send(parent,type,controls['left-button']);expect(e.defaultPrevented).toBe(true);expect(game.snapshot()).toMatchObject({horizontal:0,heldDrop:true});
    expect(send(parent,type,parent).defaultPrevented).toBe(false);
  });
  it('preserves another finger on the same button when a callout identifies one pointer',()=>{
    down('left-button');down('left-button',2);send(parent,'contextmenu',controls['left-button'],{pointerId:1});expect(game.snapshot().horizontal).toBe(-1);expect(controls['left-button'].captures.has(2)).toBe(true);send(doc,'pointerup',controls['left-button'],{pointerId:2});expect(game.snapshot().horizontal).toBe(0);
  });
  it('also stops selection originating on a control text node',()=>{
    down('left-button');const text=Object.assign(new Control('text'),{nodeType:3,parentElement:controls['left-button']});expect(send(parent,'selectstart',text).defaultPrevented).toBe(true);expect(game.snapshot().horizontal).toBe(0);
  });
  for(const duration of [3000,10000])it(`keeps a valid hold for ${duration}ms then clears the final touch, without a forced timeout`,()=>{
    vi.useFakeTimers();try{down('left-button');vi.advanceTimersByTime(duration);expect(game.snapshot().horizontal).toBe(-1);send(doc,'touchend',controls['left-button'],{touches:[]});expect(game.snapshot().horizontal).toBe(0);}finally{vi.useRealTimers();}
  });
  it('reconciles a captured pointer move with no pressed buttons',()=>{
    down('left-button');send(win,'pointermove',controls['left-button'],{buttons:0});expect(game.snapshot().horizontal).toBe(0);
  });
  it('retains keyboard direction and DROP release semantics',()=>{
    send(doc,'keydown',controls['fall-canvas'],{key:'ArrowRight'});send(doc,'keydown',controls['fall-canvas'],{key:' '});expect(game.snapshot()).toMatchObject({horizontal:1,heldDrop:true});
    send(doc,'keyup',controls['fall-canvas'],{key:' '});send(doc,'keyup',controls['fall-canvas'],{key:'ArrowRight'});expect(game.snapshot()).toMatchObject({horizontal:0,heldDrop:false});
  });
});
