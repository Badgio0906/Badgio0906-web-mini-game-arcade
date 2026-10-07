/** Game-local gesture boundary. A phase cannot reuse the press that opened it. */
export class MenuGesture {
 private epoch=0;private press:{target:Element;epoch:number;pointerId:number;released:boolean}|null=null;private key:{key:string;epoch:number}|null=null;
 changePhase():void{this.epoch++;this.press=null;}
 pointerDown(target:Element|null,pointerId=0):void{this.press=target?{target,epoch:this.epoch,pointerId,released:false}:null;}
 pointerUp(target:Element|null,pointerId:number):void{if(this.press?.pointerId!==pointerId)return;if(this.press.target!==target){this.press=null;return;}this.press.released=true;}
 lostCapture(pointerId:number):void{if(this.press?.pointerId===pointerId&&!this.press.released)this.press=null;}
 click(target:Element,detail:number):boolean{if(detail===0){return this.key===null||this.key.epoch===this.epoch;}const allowed=this.press?.target===target&&this.press.epoch===this.epoch;this.press=null;return allowed;}
 keyDown(key:string,repeat:boolean):boolean{if(repeat||this.key!==null)return false;this.key={key,epoch:this.epoch};return true;}
 keyUp(key:string):boolean{const allowed=this.key===null||this.key.key===key&&this.key.epoch===this.epoch;if(this.key?.key===key)this.key=null;return allowed;}
 clearPointers():void{this.press=null;}
}

/** Capture listeners are shared with the deterministic event-order regression. */
export function bindMenuPointerGuard(menu:HTMLElement,gesture:MenuGesture):void{
 const button=(event:Event)=>(event.target as Element).closest('button,a');
 menu.addEventListener('pointerdown',e=>{if(e.isPrimary&&e.button===0)gesture.pointerDown(button(e),e.pointerId);},true);
 menu.addEventListener('pointerup',e=>gesture.pointerUp(button(e),e.pointerId),true);
 menu.addEventListener('pointercancel',()=>gesture.clearPointers(),true);
 menu.addEventListener('lostpointercapture',e=>gesture.lostCapture(e.pointerId),true);
 menu.addEventListener('click',e=>{const target=button(e);if(target&&!gesture.click(target,e.detail)){e.preventDefault();e.stopImmediatePropagation();}},true);
}
