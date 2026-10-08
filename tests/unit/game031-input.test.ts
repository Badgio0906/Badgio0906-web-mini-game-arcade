import {describe,it,expect,vi,afterEach} from 'vitest';
import {Input,PointerRoles} from '../../src/games/game031/Input';

describe('Game031 concurrent pointer roles',()=>{
  it('walk, look and hold DIG independently; crossing a button does not change the role',()=>{
    const input=new PointerRoles();
    expect(input.begin(1,'move',45,450)).toBe(true);
    expect(input.begin(2,'look',230,250)).toBe(true);
    expect(input.begin(3,'dig',280,450)).toBe(true);
    input.update(1,75,420);
    const look=input.update(2,280,450); // view finger crosses the DIG control
    expect(look).toEqual({role:'look',dx:50,dy:200});
    expect(input.get(1)?.role).toBe('move');
    expect(input.get(2)?.role).toBe('look');
    expect(input.has('dig')).toBe(true);
    expect(input.movement()).toEqual({right:30/Math.hypot(30,30),forward:30/Math.hypot(30,30)});
    input.release(3,true);
    expect(input.has('dig')).toBe(false);
    expect(input.has('look')).toBe(true);
    expect(input.has('move')).toBe(true);
  });
  it('a moving joystick finger keeps its movement role when it enters the view',()=>{
    const input=new PointerRoles();
    input.begin(10,'move',30,300);
    expect(input.update(10,290,80)?.role).toBe('move');
    expect(input.begin(10,'look',290,80)).toBe(false);
    expect(input.has('look')).toBe(false);
    const axes=input.movement(35);
    expect(Math.hypot(axes.right,axes.forward)).toBeCloseTo(1);
  });
  it('only one joystick and one view finger own their respective controls',()=>{
    const input=new PointerRoles();
    input.begin(1,'move',0,0);
    input.begin(2,'look',80,0);
    expect(input.begin(3,'move',1,1)).toBe(false);
    expect(input.begin(4,'look',81,1)).toBe(false);
    input.release(1,true);
    expect(input.begin(3,'move',1,1)).toBe(true);
    expect(input.get(2)?.role).toBe('look');
  });
  it('PLACE releases exactly once and cancel / lost capture never place',()=>{
    const input=new PointerRoles();
    input.begin(1,'place',20,20);
    expect(input.release(1)).toEqual({role:'place',tap:true});
    expect(input.release(1)).toBeNull();
    input.begin(2,'place',20,20);
    expect(input.release(2,true)).toEqual({role:'place',tap:false});
    input.begin(3,'place',20,20);
    input.update(3,70,20);
    input.update(3,20,20); // moving away then back is still not a tap
    expect(input.release(3)?.tap).toBe(false);
  });
  it('an unrelated or cancelled finger cannot cancel another held DIG',()=>{
    const input=new PointerRoles();
    input.begin(1,'dig',0,0);
    input.begin(2,'dig',30,0);
    expect(input.release(99,true)).toBeNull();
    input.release(1,true);
    expect(input.has('dig')).toBe(true);
    input.release(2);
    expect(input.has('dig')).toBe(false);
  });
  it('clear on pause, orientation or hidden page releases every role',()=>{
    const input=new PointerRoles();
    input.begin(1,'move',0,0);
    input.begin(2,'look',30,0);
    input.begin(3,'dig',60,0);
    input.begin(4,'place',90,0);
    input.clear();
    expect(input.movement()).toEqual({right:0,forward:0});
    for(const role of ['move','look','dig','place','jump'] as const)expect(input.has(role)).toBe(false);
    expect(input.release(4)?.tap).toBeUndefined();
  });
});

// No rendering mock: exercise the DOM adapter's press/release lifecycle using
// native EventTarget; physical touch feel is checked separately in browser QA.
class ElementStub extends EventTarget {
  readonly style={setProperty:vi.fn()};
  readonly dataset:Record<string,string>={};
  readonly captured=new Set<number>();
  isContentEditable=false;
  tagName='BUTTON';
  getBoundingClientRect(){return {left:0,top:0,right:100,bottom:100,width:100,height:100};}
  setPointerCapture(id:number){this.captured.add(id);}
  releasePointerCapture(id:number){this.captured.delete(id);}
  hasPointerCapture(id:number){return this.captured.has(id);}
}
function dispatched(target:EventTarget,type:string,props:Record<string,unknown>={}) {
  const event=new Event(type,{cancelable:true});
  Object.assign(event,props);target.dispatchEvent(event);return event;
}
function adapter() {
  const windowStub=new EventTarget();
  const doc=new EventTarget() as EventTarget & {
    pointerLockElement:ElementStub|null;hidden:boolean;getElementById:(id:string)=>ElementStub|null;
    querySelectorAll:()=>ElementStub[];exitPointerLock:()=>void;
  };
  const controls=new Map(['joystick','dig','place','jump'].map(id=>[id,new ElementStub()]));
  const palette=new ElementStub();palette.dataset.material='5';
  Object.assign(doc,{
    pointerLockElement:null,hidden:false,
    getElementById:(id:string)=>controls.get(id)??null,
    querySelectorAll:()=>[palette],
    exitPointerLock:()=>{doc.pointerLockElement=null;dispatched(doc,'pointerlockchange');},
  });
  const canvas=new ElementStub() as ElementStub & {requestPointerLock:()=>Promise<void>};
  canvas.requestPointerLock=async()=>{doc.pointerLockElement=canvas;dispatched(doc,'pointerlockchange');};
  vi.stubGlobal('window',windowStub);vi.stubGlobal('document',doc);vi.stubGlobal('HTMLElement',ElementStub);
  const callbacks={look:vi.fn(),place:vi.fn(),select:vi.fn(),pause:vi.fn(),unlockAudio:vi.fn()};
  const input=new Input(canvas as unknown as HTMLCanvasElement,callbacks);
  input.setActive(true);
  const pointer=(target:EventTarget,type:string,id:number,x=20,y=20,pointerType='touch',button=0)=>
    dispatched(target,type,{pointerId:id,clientX:x,clientY:y,pointerType,button});
  const key=(type:string,code:string,repeat=false)=>dispatched(windowStub,type,{code,repeat});
  return {input,callbacks,canvas,doc,windowStub,controls,palette,pointer,key};
}
afterEach(()=>vi.unstubAllGlobals());

describe('Game031 DOM input adapter lifecycle',()=>{
  it('fallback canvas drag only looks, while F holds mining and G places once',()=>{
    const a=adapter();
    a.pointer(a.canvas,'pointerdown',1,20,20,'mouse');
    a.pointer(a.windowStub,'pointermove',1,40,10,'mouse');
    expect(a.input.dig).toBe(false);
    expect(a.callbacks.look).toHaveBeenCalledWith(.05,-.025);
    a.key('keydown','KeyF');expect(a.input.dig).toBe(true);
    a.key('keyup','KeyF');expect(a.input.dig).toBe(false);
    a.key('keydown','KeyG');a.key('keydown','KeyG',true);
    expect(a.callbacks.place).toHaveBeenCalledTimes(1);
    a.input.destroy();
  });
  it('touch move, view and DIG work simultaneously; cancellation only releases the cancelled finger',()=>{
    const a=adapter();
    a.pointer(a.controls.get('joystick')!,'pointerdown',1);
    a.pointer(a.canvas,'pointerdown',2);
    a.pointer(a.controls.get('dig')!,'pointerdown',3);
    a.pointer(a.windowStub,'pointermove',1,40,0);
    a.pointer(a.windowStub,'pointermove',2,50,35);
    expect(a.input.forward).toBeGreaterThan(0);
    expect(a.input.right).toBeGreaterThan(0);
    expect(a.input.dig).toBe(true);
    expect(a.callbacks.look).toHaveBeenCalledOnce();
    a.pointer(a.windowStub,'pointercancel',2);
    expect(a.input.dig).toBe(true);expect(a.input.forward).toBeGreaterThan(0);
    a.pointer(a.doc,'lostpointercapture',3);
    expect(a.input.dig).toBe(false);expect(a.input.forward).toBeGreaterThan(0);
    a.input.destroy();
  });
  it('placement tap is single-shot, and cancelled or dragged-off presses never place',()=>{
    const a=adapter(),button=a.controls.get('place')!;
    a.pointer(button,'pointerdown',1);a.pointer(a.windowStub,'pointerup',1);
    a.pointer(a.doc,'lostpointercapture',1);dispatched(button,'click');
    expect(a.callbacks.place).toHaveBeenCalledTimes(1);
    a.pointer(button,'pointerdown',2);a.pointer(a.windowStub,'pointercancel',2);
    a.pointer(button,'pointerdown',3);a.pointer(a.windowStub,'pointerup',3,130,20);
    expect(a.callbacks.place).toHaveBeenCalledTimes(1);
    a.input.destroy();
  });
  it('pause and resume clear held keys and suppress inherited repeat presses',()=>{
    const a=adapter();
    a.key('keydown','KeyW');a.key('keydown','KeyF');a.key('keydown','Space');
    expect(a.input.forward).toBe(1);expect(a.input.dig).toBe(true);expect(a.input.consumeJump()).toBe(true);
    expect(a.input.consumeJump()).toBe(false);
    a.input.setActive(false);a.input.setActive(true);
    a.key('keydown','KeyW',true);a.key('keydown','KeyF',true);a.key('keydown','Space',true);
    expect(a.input.forward).toBe(0);expect(a.input.dig).toBe(false);expect(a.input.consumeJump()).toBe(false);
    a.key('keyup','KeyF');a.key('keydown','KeyF');expect(a.input.dig).toBe(true);
    a.input.destroy();
  });
  it('native pointer-lock loss clears input and pauses, while an intentional menu exit does not pause twice',async()=>{
    const a=adapter();expect(await a.input.requestLock()).toBe(true);
    a.pointer(a.canvas,'pointerdown',1,20,20,'mouse');expect(a.input.dig).toBe(true);
    a.doc.exitPointerLock();
    expect(a.input.dig).toBe(false);expect(a.callbacks.pause).toHaveBeenCalledTimes(1);
    await a.input.requestLock();a.input.setActive(false);
    expect(a.callbacks.pause).toHaveBeenCalledTimes(1);
    a.input.destroy();
  });
  it('locked right-click places once per mouse press, including left + right button chords',async()=>{
    const a=adapter();await a.input.requestLock();
    a.pointer(a.canvas,'pointerdown',1,20,20,'mouse',2);
    dispatched(a.canvas,'mousedown',{button:2});
    expect(a.callbacks.place).toHaveBeenCalledTimes(1);
    a.pointer(a.canvas,'pointerdown',2,20,20,'mouse',0);
    expect(a.input.dig).toBe(true);
    // Browser sends only mousedown for the additional button in a chord.
    dispatched(a.canvas,'mousedown',{button:2});
    expect(a.callbacks.place).toHaveBeenCalledTimes(2);
    a.input.destroy();
  });
  it('palette taps never look or jump; wheel continues from the restored selected material',()=>{
    const a=adapter();
    a.pointer(a.palette,'pointerdown',8);a.pointer(a.windowStub,'pointermove',8,60,60);
    expect(a.callbacks.select).toHaveBeenLastCalledWith(5);
    expect(a.callbacks.look).not.toHaveBeenCalled();expect(a.input.jump).toBe(false);
    a.input.syncSelected(7);dispatched(a.canvas,'wheel',{deltaY:1});
    expect(a.callbacks.select).toHaveBeenLastCalledWith(8);
    dispatched(a.canvas,'wheel',{deltaY:1});expect(a.callbacks.select).toHaveBeenLastCalledWith(1);
    a.input.destroy();
  });
  it('hidden-page interruption clears every pointer and keyboard state',()=>{
    const a=adapter();a.key('keydown','KeyW');a.pointer(a.controls.get('dig')!,'pointerdown',1);
    a.doc.hidden=true;dispatched(a.doc,'visibilitychange');
    expect(a.input.forward).toBe(0);expect(a.input.dig).toBe(false);
    expect(a.callbacks.pause).toHaveBeenCalledOnce();a.input.destroy();
  });
});
