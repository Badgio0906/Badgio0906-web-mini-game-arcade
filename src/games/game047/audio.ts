/** Original deterministic synthesized snow/crunch/toy/ice sounds; no external assets. */
export class SnowAudio {
  context:AudioContext|null=null;master:GainNode|null=null;
  voices=new Set<AudioScheduledSourceNode>();muted=false;volume=.35;private noise:AudioBuffer|null=null;
  async unlock(){try{this.context??=new AudioContext();if(!this.master){this.master=this.context.createGain();this.master.connect(this.context.destination);}this.master.gain.value=this.muted?0:this.volume;await this.context.resume();}catch{/* Sound refusal leaves the game playable. */}}
  private tone(hz:number,to:number,d:number,delay:number,gain:number,type:OscillatorType='triangle'){
    const c=this.context,m=this.master;if(!c||!m||this.muted||this.voices.size>=16)return;
    const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(m);this.voices.add(o);o.onended=()=>{o.disconnect();g.disconnect();this.voices.delete(o);};o.start(t);o.stop(t+d+.01);
  }
  private crunch(d:number,hz:number,gain:number,high=false){
    const c=this.context,m=this.master;if(!c||!m||this.muted||this.voices.size>=16)return;
    if(!this.noise){this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const values=this.noise.getChannelData(0);let seed=4701;for(let i=0;i<values.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;values[i]=seed/2147483648-1;}}
    const n=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime;n.buffer=this.noise;filter.type=high?'highpass':'lowpass';filter.frequency.value=hz;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);n.connect(filter).connect(g).connect(m);this.voices.add(n);n.onended=()=>{n.disconnect();filter.disconnect();g.disconnect();this.voices.delete(n);};n.start(t);n.stop(t+d+.01);
  }
  play(kind:string,power=1){
    if(kind==='snow'){this.crunch(.045,1700,.045,true);this.tone(600+Math.min(power,24)*12,320,.065,0,.035,'sine');}
    else if(kind==='snowman'){this.crunch(.07,1300,.06);this.tone(240,100,.12,0,.065);}
    else if(kind==='toy'){this.crunch(.07,900,.06,true);for(let i=0;i<3;i++)this.tone(230+i*170,160+i*120,.075,i*.035,.035,'square');}
    else if(kind==='tower'){this.crunch(.2,1500,.12);this.tone(85,35,.24,0,.09);for(let i=0;i<3;i++)this.tone(480+i*230,220+i*140,.16,i*.04,.035,'sine');}
    else if(kind==='castle'){this.crunch(.34,1900,.15);this.tone(65,28,.4,0,.1);this.tone(90,44,.3,.06,.065);}
    else if(kind==='clear'){for(let i=0;i<5;i++)this.tone([262,330,392,523,659][i],[262,330,392,523,659][i],.25,i*.06,.06,'sine');}
    else if(kind==='damage'){this.crunch(.1,650,.08);this.tone(120,35,.18,0,.08,'sawtooth');}
    else{this.tone(420,620,.075,0,.05,'sine');this.tone(210,310,.06,0,.025);}
  }
  stop(){for(const v of this.voices)try{v.stop();}catch{}this.voices.clear();}
  set(volume:number,muted:boolean){this.volume=volume;this.muted=muted;if(this.master)this.master.gain.value=muted?0:volume;}
  dispose(){this.stop();void this.context?.close();}
}
