/** Original synthesized river ambience; no third-party recordings or continuous timers. */
export class RiverSound {
 private context?:AudioContext;
 private active=false;
 private wanted=false;
 async start(enabled:boolean):Promise<void>{
  this.wanted=enabled;
  if(!enabled){this.stop();return;}
  try{
   if(!this.context){const c=this.context=new AudioContext(),buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),samples=buffer.getChannelData(0);let smooth=0;for(let i=0;i<samples.length;i++){smooth=smooth*.94+(Math.random()*2-1)*.06;samples[i]=smooth;}
    const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=1100;gain.gain.value=.035;source.connect(filter);filter.connect(gain);gain.connect(c.destination);source.start();}
   await this.context.resume();this.active=true;if(!this.wanted)this.stop();
  }catch{/* Audio is optional; the river stays playable. */}
 }
 stop():void{this.wanted=false;if(!this.active)return;this.active=false;void this.context?.suspend().catch(()=>undefined);}
 destroy():void{this.wanted=false;this.active=false;void this.context?.close().catch(()=>undefined);}
}
