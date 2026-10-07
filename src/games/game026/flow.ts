/** Cancelable single-task scheduler. Every boundary invalidates earlier delayed work. */
export class TurnScheduler {
  private generation = 0;
  private handle: ReturnType<typeof setTimeout>|null = null;
  cancel():void {this.generation++;if(this.handle!==null)clearTimeout(this.handle);this.handle=null;}
  schedule(delay:number, action:()=>void):void {this.cancel();const token=this.generation;this.handle=setTimeout(()=>{this.handle=null;if(token===this.generation)action();},delay);}
}
/** A native physical click needs a fresh down on that same control in the same screen. */
export class InputGate {
  epoch=0;
  private pointer:{id:number;target:Element;epoch:number;released:boolean}|null=null;
  private keys=new Set<string>();
  private consumed=new Set<string>();
  transition():void {this.epoch++;this.pointer=null; for(const key of this.keys)this.consumed.add(key);}
  down(id:number,target:Element):void {this.pointer={id,target,epoch:this.epoch,released:false};}
  release(id:number):void {if(this.pointer?.id===id)this.pointer.released=true;}
  lost(id:number):void {if(this.pointer?.id===id&&!this.pointer.released)this.pointer=null;}
  cancel(id:number):void {if(this.pointer?.id===id)this.pointer=null;}
  physicalClick(target:Element):boolean {const allowed=this.pointer?.target===target && this.pointer.epoch===this.epoch;this.pointer=null;return allowed;}
  keyDown(key:string,repeat:boolean):boolean {if(repeat || this.keys.has(key))return false;this.keys.add(key);return !this.consumed.has(key);}
  keyUp(key:string):boolean {const allowed=this.keys.has(key)&&!this.consumed.has(key);this.keys.delete(key);this.consumed.delete(key);return allowed;}
  clear():void {for(const key of this.keys)this.consumed.add(key);this.pointer=null;}
}
