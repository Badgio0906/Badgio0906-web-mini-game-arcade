/** Game-local gesture boundary. A phase cannot reuse the press that opened it. */
export class MenuGesture {
 private epoch=0;private press:{target:Element;epoch:number}|null=null;private key:{key:string;epoch:number}|null=null;
 changePhase():void{this.epoch++;this.press=null;}
 pointerDown(target:Element|null):void{this.press=target?{target,epoch:this.epoch}:null;}
 click(target:Element,detail:number):boolean{if(detail===0){return this.key===null||this.key.epoch===this.epoch;}const allowed=this.press?.target===target&&this.press.epoch===this.epoch;this.press=null;return allowed;}
 keyDown(key:string,repeat:boolean):boolean{if(repeat||this.key!==null)return false;this.key={key,epoch:this.epoch};return true;}
 keyUp(key:string):boolean{const allowed=this.key===null||this.key.key===key&&this.key.epoch===this.epoch;if(this.key?.key===key)this.key=null;return allowed;}
 clearPointers():void{this.press=null;}
}
