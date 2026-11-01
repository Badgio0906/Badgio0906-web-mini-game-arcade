/** Original deterministic synthesized snow/crunch/toy/ice sounds; no external assets. */
export class LootAudio {
  context:AudioContext|null=null;master:GainNode|null=null;
  voices=new Set<AudioScheduledSourceNode>();muted=false;volume=.35;private noise:AudioBuffer|null=null;
  async unlock(){try{this.context??=new AudioContext();if(!this.master){this.master=this.context.createGain();this.master.connect(this.context.destination);}this.master.gain.value=this.muted?0:this.volume;await this.context.resume();}catch{/* Sound refusal leaves the game playable. */}}
  private tone(hz:number,to:number,d:number,delay:number,gain:number,type:OscillatorType='triangle'){
    const c=this.context,m=this.master;if(!c||!m||this.muted||this.voices.size>=16)return;
    const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(m);this.voices.add(o);o.onended=()=>{o.disconnect();g.disconnect();this.voices.delete(o);};o.start(t);o.stop(t+d+.01);
  }
  private crunch(d:number,hz:number,gain:number,high=false){
    const c=this.context,m=this.master;if(!c||!m||this.muted||this.voices.size>=16)return;
    if(!this.noise){this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const values=this.noise.getChannelData(0);let seed=4401;for(let i=0;i<values.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;values[i]=seed/2147483648-1;}}
    const n=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime;n.buffer=this.noise;filter.type=high?'highpass':'lowpass';filter.frequency.value=hz;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);n.connect(filter).connect(g).connect(m);this.voices.add(n);n.onended=()=>{n.disconnect();filter.disconnect();g.disconnect();this.voices.delete(n);};n.start(t);n.stop(t+d+.01);
  }
  play(kind:string,n=1){
    if(kind==='throw'){this.crunch(.16,2200,.045,true);this.tone(280,780,.18,0,.04,'sine');}else if(kind==='loot'){this.tone(180,560,.09,0,.06);for(let i=0;i<Math.min(10,n);i++)this.tone(620+i*65,950+i*80,.12,.035*i,.045,'sine');if(n>=4){this.tone(100,45,.2,.18,.08);this.crunch(.1,1000,.035);}}
    else if(kind==='bomb'||kind==='damage'){this.crunch(.2,700,.12);this.tone(130,30,.25,0,.08,'sawtooth');}
    else if(kind==='invalid'||kind==='empty'){this.tone(180,85,.08,0,.04);}
    else if(kind==='clear'){for(let i=0;i<5;i++)this.tone([262,330,392,523,659][i],[262,330,392,523,659][i],.25,i*.06,.05,'sine');}
    else this.tone(440,660,.08,0,.045,'sine');
  }
  stop(){for(const v of this.voices)try{v.stop();}catch{}this.voices.clear();}
  set(volume:number,muted:boolean){this.volume=volume;this.muted=muted;if(this.master)this.master.gain.value=muted?0:volume;}
  dispose(){this.stop();void this.context?.close();}
}
