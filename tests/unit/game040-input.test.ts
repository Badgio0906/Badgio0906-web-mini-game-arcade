import {describe,it,expect} from 'vitest';
import {CleaningInput} from '../../src/games/game040/input';
class ElementTarget extends EventTarget {
  captures=new Set<number>();
  constructor(readonly left=0,readonly top=0,readonly width=480,readonly height=480){super();}
  getBoundingClientRect(){return{left:this.left,top:this.top,width:this.width,height:this.height};}
  setPointerCapture(id:number){this.captures.add(id);}
  hasPointerCapture(id:number){return this.captures.has(id);}
  releasePointerCapture(id:number){this.captures.delete(id);fire(this,'lostpointercapture',{pointerId:id});}
}
function fire(target:EventTarget,type:string,fields:Record<string,unknown>={}){const e=new Event(type,{cancelable:true});for(const[k,v]of Object.entries(fields))Object.defineProperty(e,k,{value:v});target.dispatchEvent(e);return e;}
function setup(){const pad=new ElementTarget(0,500,400,100),canvas=new ElementTarget(),win=new EventTarget(),doc=Object.assign(new EventTarget(),{hidden:false});let angle=0,begins=0,releases=0,cancels=0,pauses=0,accept=true;
 const input=new CleaningInput({pad:pad as unknown as HTMLElement,canvas:canvas as unknown as HTMLCanvasElement,targetWindow:win as Window,targetDocument:doc as unknown as Document,callbacks:{begin:()=>{begins++;return accept;},release:()=>{releases++;},cancel:()=>{cancels++;},pause:()=>{pauses++;},setAim:a=>{angle=a;},getAim:()=>angle}});
 input.setEnabled(true);return{input,pad,canvas,win,doc,values:()=>({angle,begins,releases,cancels,pauses}),accept:(v:boolean)=>{accept=v;}};
}
const down=(el:EventTarget,id=1,extra={})=>fire(el,'pointerdown',{pointerId:id,button:0,isPrimary:true,pointerType:'touch',clientX:100,clientY:550,...extra});
const up=(el:EventTarget,id=1)=>fire(el,'pointerup',{pointerId:id});
const key=(el:EventTarget,type:string,code:string,repeat=false)=>fire(el,type,{code,repeat});
describe('Game040 owned input and cancellation',()=>{
 it('normal primary touch release fires once and repeated up does not',()=>{const s=setup();down(s.pad);up(s.doc);up(s.doc);expect(s.values()).toMatchObject({begins:1,releases:1,cancels:0});s.input.destroy();});
 it('maps pad motion from starting angle and clamps at60 degrees',()=>{const s=setup();down(s.pad);fire(s.pad,'pointermove',{pointerId:1,clientX:200,clientY:550});expect(s.values().angle).toBe(40);fire(s.pad,'pointermove',{pointerId:1,clientX:600,clientY:550});expect(s.values().angle).toBe(60);fire(s.pad,'pointermove',{pointerId:1,clientX:-900,clientY:550});expect(s.values().angle).toBe(-60);s.input.destroy();});
 it('ignores a secondary pointer and concurrent keyboard without double fire',()=>{const s=setup();down(s.pad,1);down(s.pad,2,{isPrimary:false});key(s.doc,'keydown','Space');up(s.doc,2);expect(s.values().releases).toBe(0);up(s.doc,1);key(s.doc,'keyup','Space');expect(s.values()).toMatchObject({begins:1,releases:1});s.input.destroy();});
 it('keyboard ownership ignores a pointer and key repeat',()=>{const s=setup();key(s.doc,'keydown','Space');key(s.doc,'keydown','Space',true);down(s.pad);up(s.doc);expect(s.values().releases).toBe(0);key(s.doc,'keyup','Space');expect(s.values()).toMatchObject({begins:1,releases:1});s.input.destroy();});
 for(const cause of ['pointercancel','lostpointercapture','blur','hidden','touchcancel','touchend'] as const)it(cause+' cancels and never shoots',()=>{const s=setup();down(s.pad);if(cause==='blur')fire(s.win,'blur');else if(cause==='hidden'){s.doc.hidden=true;fire(s.doc,'visibilitychange');}else if(cause==='lostpointercapture')fire(s.pad,cause,{pointerId:1});else fire(s.doc,cause,{pointerId:1,touches:[]});up(s.doc);expect(s.values()).toMatchObject({releases:0,cancels:1});expect(s.input.diagnostics().owner).toBe('none');s.input.destroy();});
 it('pause blocks held Space until up and requires a new press',()=>{const s=setup();key(s.doc,'keydown','Space');s.input.setEnabled(false);s.input.setEnabled(true);key(s.doc,'keydown','Space',true);expect(s.values().begins).toBe(1);key(s.doc,'keyup','Space');expect(s.values().releases).toBe(0);key(s.doc,'keydown','Space');key(s.doc,'keyup','Space');expect(s.values()).toMatchObject({begins:2,releases:1,cancels:1});s.input.destroy();});
 it('menu Space held across start does not start suction',()=>{const s=setup();s.input.setEnabled(false);key(s.doc,'keydown','Space');s.input.setEnabled(true);key(s.doc,'keydown','Space',true);key(s.doc,'keyup','Space');expect(s.values().begins).toBe(0);key(s.doc,'keydown','Space');expect(s.values().begins).toBe(1);s.input.destroy();});
 it('unaccepted press cannot later shoot on its up',()=>{const s=setup();s.accept(false);down(s.pad);up(s.doc);expect(s.values()).toMatchObject({begins:1,releases:0,cancels:0});s.input.destroy();});
 it('keyboard aims before suction, preserves opposites, and uses actual elapsed ms',()=>{const s=setup();key(s.doc,'keydown','KeyD');s.input.update(200);expect(s.values().angle).toBe(18);key(s.doc,'keydown','KeyA');s.input.update(500);expect(s.values().angle).toBe(18);key(s.doc,'keyup','KeyD');s.input.update(1000);expect(s.values().angle).toBe(-60);s.input.destroy();});
 it('desktop pointer aims from480x480 world nozzle, not pad coordinates',()=>{const s=setup();down(s.canvas,1,{pointerType:'mouse',clientX:240,clientY:100});expect(s.values().angle).toBe(0);fire(s.canvas,'pointermove',{pointerId:1,clientX:480,clientY:222,pointerType:'mouse'});expect(s.values().angle).toBe(45);up(s.doc);s.input.destroy();});
 it('Escape cancels suction and requests pause without release',()=>{const s=setup();key(s.doc,'keydown','Space');key(s.doc,'keydown','Escape');expect(s.values()).toMatchObject({cancels:1,pauses:1,releases:0});s.input.destroy();});
 it('destroy removes listeners and does not accumulate after five lifecycles',()=>{for(let i=0;i<5;i++){const s=setup();expect(s.input.diagnostics().listeners).toBeGreaterThan(10);s.input.destroy();s.input.destroy();down(s.pad);key(s.doc,'keydown','Space');expect(s.input.diagnostics().listeners).toBe(0);expect(s.values().begins).toBe(0);}});
});
