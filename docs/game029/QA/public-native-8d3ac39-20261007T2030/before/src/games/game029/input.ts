/** Fresh physical menu down is required; detail0 keeps keyboard/assistive activation intact. */
export class MenuEpoch {
  epoch=0;private down:{target:EventTarget|null;epoch:number}|null=null;private held=new Set<string>();private keyEpoch=new Map<string,number>();
  next():void{this.epoch++;this.down=null;}
  pointerDown(target:EventTarget|null):void{this.down={target,epoch:this.epoch};}
  cancel():void{this.down=null;}
  keyDown(key:string):boolean{if(this.held.has(key))return false;this.held.add(key);this.keyEpoch.set(key,this.epoch);return true;}
  keyUp(key:string):boolean{const same=this.keyEpoch.get(key)===undefined||this.keyEpoch.get(key)===this.epoch;this.held.delete(key);this.keyEpoch.delete(key);return same;}
  releaseAll():void{this.held.clear();this.keyEpoch.clear();this.down=null;}
  validClick(target:EventTarget|null,detail:number):boolean{if(detail>0){const ok=this.down?.target===target&&this.down.epoch===this.epoch;this.down=null;return ok;}for(const key of ['Enter',' '])if(this.held.has(key)&&this.keyEpoch.get(key)!==this.epoch)return false;return true;}
}
