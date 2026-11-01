// Wall-clock adapter only. Physics always advances in its unchanged 1/240s steps.
export class FixedClock {
 private previous:number;
 private remainder=0;
 constructor(now:number,private readonly hz:number){this.previous=now;}
 reset(now:number):void{this.previous=now;this.remainder=0;}
 advance(now:number,tick:()=>boolean,onGap:()=>void):void{
  // A rAF timestamp may precede an input callback already flushed in this frame.
  const end=Math.max(this.previous,now),elapsed=end-this.previous;this.previous=end;
  if(elapsed>500){this.remainder=0;onGap();return;}
  this.remainder+=elapsed;const dt=1000/this.hz;
  while(this.remainder+1e-9>=dt){this.remainder=Math.max(0,this.remainder-dt);if(!tick()){this.remainder=0;break;}}
 }
}
