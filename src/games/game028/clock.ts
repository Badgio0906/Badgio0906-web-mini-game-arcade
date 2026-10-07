export class FixedClock {
 private last:number|null=null; private remainder=0; paused=true;
 reset():void{this.last=null;this.remainder=0;}
 resume():void{this.paused=false;this.reset();}
 pause():void{this.paused=true;this.reset();}
 frame(now:number,tick:(dt:number)=>void):'gap'|'ok'{if(this.paused){this.last=null;return'ok';}if(this.last===null){this.last=now;return'ok';}const delta=(now-this.last)/1000;this.last=now;if(delta>.2||delta<0){this.pause();return'gap';}this.remainder+=delta;for(let i=0;this.remainder>=1/120&&i<25&&!this.paused;i++){this.remainder-=1/120;tick(1/120);}return'ok';}
}
