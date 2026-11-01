/** Original deterministic synthesized chrome, pin hits and overdrive sounds; no external assets. */
export class PinAudio {
  context:AudioContext|null=null;master:GainNode|null=null;
  voices=new Set<AudioScheduledSourceNode>();muted=false;volume=.35;private noise:AudioBuffer|null=null;
  async unlock(){try{this.context??=new AudioContext();if(!this.master){this.master=this.context.createGain();const compressor=this.context.createDynamicsCompressor();compressor.threshold.value=-16;compressor.ratio.value=8;this.master.connect(compressor).connect(this.context.destination);}this.master.gain.value=this.muted?0:this.volume;await this.context.resume();}catch{/* Sound refusal leaves the game playable. */}}
  private tone(hz:number,to:number,d:number,delay:number,gain:number,type:OscillatorType='triangle'){
    const c=this.context,m=this.master;if(!c||!m||this.muted||this.voices.size>=16)return;
    const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(m);this.voices.add(o);o.onended=()=>{o.disconnect();g.disconnect();this.voices.delete(o);};o.start(t);o.stop(t+d+.01);
  }
  private crunch(d:number,hz:number,gain:number,high=false){
    const c=this.context,m=this.master;if(!c||!m||this.muted||this.voices.size>=16)return;
    if(!this.noise){this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const values=this.noise.getChannelData(0);let seed=4601;for(let i=0;i<values.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;values[i]=seed/2147483648-1;}}
    const n=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime;n.buffer=this.noise;filter.type=high?'highpass':'lowpass';filter.frequency.value=hz;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);n.connect(filter).connect(g).connect(m);this.voices.add(n);n.onended=()=>{n.disconnect();filter.disconnect();g.disconnect();this.voices.delete(n);};n.start(t);n.stop(t+d+.01);
  }
  play(kind:string,n=1){if(kind==='bumper'){this.tone(650+(n%8)*90,1000+(n%8)*100,.08,0,.045,'sine');this.crunch(.06,2200,.025,true);if(n>=5)this.tone(110,45,.12,0,.025,'triangle');if(n%8===0)for(const hz of[330,440,660])this.tone(hz,hz,.16,.03,.04);}else if(kind==='multi'){this.tone(130,40,.32,0,.12);this.crunch(.12,900,.07);for(let i=0;i<6;i++)this.tone(440+i*100,880+i*100,.17,.04*i,.05,'sine');}else if(kind==='drain'){this.crunch(.2,650,.1);this.tone(160,50,.2,0,.07,'sawtooth');}else if(kind==='star'){this.crunch(.055,3500,.025,true);this.tone(900+(n%5)*110,1500,.13,0,.06);this.tone(450,450,.12,.02,.04);}else if(kind==='flipper'){this.tone(110,55,.08,0,.035);this.crunch(.035,500,.0225);}else if(kind==='clear'){for(let i=0;i<5;i++)this.tone([262,330,392,523,659][i],[262,330,392,523,659][i],.25,i*.07,.055);}else this.tone(440,660,.08,0,.04);}
  stop(){for(const v of this.voices)try{v.stop();}catch{}this.voices.clear();}
  set(volume:number,muted:boolean){if(muted)this.stop();this.volume=volume;this.muted=muted;if(this.master)this.master.gain.value=muted?0:volume;}
  dispose(){this.stop();void this.context?.close();}
}
