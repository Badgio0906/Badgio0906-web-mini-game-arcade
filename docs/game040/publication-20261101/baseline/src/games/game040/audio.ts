export type SoundKind = 'ui'|'intake'|'full'|'small'|'large'|'full-shot'|'chain'|'reward'|'jam'|'damage'|'boss'|'result';
type AudioCtor = new()=>AudioContext;
type Source = OscillatorNode | AudioBufferSourceNode;
interface TrackedSource { source: Source; nodes: AudioNode[]; loop: boolean; }
export interface AudioDiagnostics {
  contextState: string; activeSources: number; loopActive: boolean; maxSources: number;
  peakActiveSources: number; createdContexts: number; eventsPlayed: number; muted: boolean; volume: number; disposed: boolean;
}
/** Local synthesized sounds only. No fetch, timers, media elements, microphone or voice API. */
export class CleaningAudio {
  private context: AudioContext|null = null;
  private master: GainNode|null = null;
  private compressor: DynamicsCompressorNode|null = null;
  private noise: AudioBuffer|null = null;
  private readonly sources = new Set<TrackedSource>();
  private loopGain: GainNode|null = null;
  private loopFilter: BiquadFilterNode|null = null;
  private loopTone: OscillatorNode|null = null;
  private muted = false;
  private volume = .55;
  private disposed = false;
  private createdContexts = 0;
  private peak = 0;
  private eventsPlayed = 0;
  private readonly maxSources = 24;
  /** Optional constructor injection is for local unit tests, not a service or SDK. */
  constructor(private readonly contextConstructor?:AudioCtor) {}
  async unlock():Promise<void> {
    if (this.disposed) return;
    try {
      if (!this.context) {
        const host = typeof window === 'undefined' ? undefined : window as unknown as { AudioContext?:AudioCtor; webkitAudioContext?:AudioCtor };
        const Ctor = this.contextConstructor ?? host?.AudioContext ?? host?.webkitAudioContext;
        if (!Ctor) return;
        const ctx = new Ctor();
        this.context = ctx;this.createdContexts++;
        this.master = ctx.createGain();this.master.gain.value=this.outputGain();
        this.compressor=ctx.createDynamicsCompressor();
        this.compressor.threshold.value=-15;this.compressor.knee.value=10;this.compressor.ratio.value=10;this.compressor.attack.value=.003;this.compressor.release.value=.16;
        this.master.connect(this.compressor);this.compressor.connect(ctx.destination);
        this.noise=ctx.createBuffer(1,Math.max(1,Math.floor(ctx.sampleRate*.5)),ctx.sampleRate);
        const samples=this.noise.getChannelData(0);let state=0x4a17;
        for(let i=0;i<samples.length;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;samples[i]=state/0x80000000-1;}
      }
      if (this.context.state==='suspended') await this.context.resume();
    } catch { /* Autoplay, no device or browser rejection never blocks gameplay. */ }
  }
  setVolume(value:number):void {
    if(!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(1,value));this.updateMaster();
    if(this.volume===0)this.stop();
  }
  setMuted(value:boolean):void {this.muted=!!value;this.updateMaster();if(this.muted)this.stop();}
  suction(active:boolean,charge:number):void {
    if(!active||!this.available()){this.stopLoop();return;}
    const ctx=this.context!,power=Math.max(0,Math.min(100,Number.isFinite(charge)?charge:0))/100;
    if(!this.loopGain){
      this.loopGain=ctx.createGain();this.loopGain.gain.value=0;this.loopGain.connect(this.master!);
      this.loopFilter=ctx.createBiquadFilter();this.loopFilter.type='bandpass';this.loopFilter.frequency.value=520;this.loopFilter.Q.value=.7;this.loopFilter.connect(this.loopGain);
      const wind=ctx.createBufferSource();wind.buffer=this.noise;wind.loop=true;wind.connect(this.loopFilter);this.track(wind,[wind],true);wind.start();
      this.loopTone=ctx.createOscillator();this.loopTone.type='triangle';this.loopTone.frequency.value=63;
      const hum=ctx.createGain();hum.gain.value=.15;this.loopTone.connect(hum);hum.connect(this.loopGain);this.track(this.loopTone,[this.loopTone,hum],true);this.loopTone.start();
    }
    this.loopGain.gain.setTargetAtTime(.11+power*.16,ctx.currentTime,.035);
    this.loopFilter!.frequency.setTargetAtTime(460+power*1100,ctx.currentTime,.04);
    this.loopTone!.frequency.setTargetAtTime(58+power*80,ctx.currentTime,.04);
  }
  play(kind:string,chain=1):void {
    if(!this.available())return;
    const ctx=this.context!,at=ctx.currentTime;
    const step=Math.max(1,Math.min(24,Math.floor(Number.isFinite(chain)?chain:1)));
    const pitch=Math.pow(1.045,Math.min(step-1,18));
    switch(kind as SoundKind){
      case'ui':this.tone(650,830,at,.07,.11,'sine');break;
      case'intake':this.tone(160,560,at,.09,.10,'sine');this.burst(at,.045,.06,1100,'highpass');break;
      case'full':[523,784,1047].forEach((f,i)=>this.tone(f,f*1.02,at+i*.04,.18,.12,'sine'));break;
      case'small':this.tone(420,130,at,.13,.17,'triangle');this.burst(at,.06,.12,1800,'lowpass');break;
      case'large':this.tone(110,45,at,.25,.34,'sine');this.tone(290,120,at,.13,.13,'triangle');this.burst(at,.17,.24,1600,'lowpass');break;
      case'full-shot':
        // Low attack + broad crack + short resonant tail. Not a single high beep.
        this.tone(96,31,at,.44,.55,'sine');this.tone(190,62,at,.22,.22,'triangle');
        this.burst(at,.25,.40,2200,'lowpass');this.burst(at+.015,.08,.13,2800,'highpass');
        this.tone(56,36,at+.045,.48,.17,'sine');break;
      case'chain':
        this.tone(110*pitch,45*pitch,at,.18,.20,'sine');this.burst(at,.12,.16,900*pitch,'lowpass');
        if(step>=3)this.tone(440*pitch,660*pitch,at+.02,.13,step>=12?.15:.09,'triangle');break;
      case'reward':this.tone(820*pitch,1400*pitch,at,.10,.075,'sine');break;
      case'jam':this.tone(180,48,at,.28,.17,'sawtooth');this.burst(at,.16,.11,420,'bandpass');break;
      case'damage':this.tone(150,47,at,.30,.25,'sawtooth');this.burst(at,.12,.15,780,'lowpass');break;
      case'boss':this.tone(85,24,at,.65,.40,'sine');this.burst(at,.38,.28,1600,'lowpass');[392,523,659,784].forEach((f,i)=>this.tone(f,f*1.01,at+.12+i*.055,.24,.10,'triangle'));break;
      case'result':[392,523,659,784].forEach((f,i)=>this.tone(f,f*1.01,at+i*.07,.24,.12,'sine'));break;
      default:return;
    }
    this.eventsPlayed++;
  }
  /** Stop every loop and queued transient on pause/result/pagehide. Context can be reused. */
  stop():void {
    this.stopLoop();for(const item of [...this.sources])this.finish(item,true);
  }
  destroy():void {
    if(this.disposed)return;this.stop();this.disposed=true;
    this.master?.disconnect();this.compressor?.disconnect();this.noise=null;
    const old=this.context;this.context=null;this.master=null;this.compressor=null;
    if(old)void old.close().catch(()=>{});
  }
  diagnostics():AudioDiagnostics {
    return{contextState:this.context?.state??'not-created',activeSources:this.sources.size,loopActive:!!this.loopGain,maxSources:this.maxSources,peakActiveSources:this.peak,createdContexts:this.createdContexts,eventsPlayed:this.eventsPlayed,muted:this.muted,volume:this.volume,disposed:this.disposed};
  }
  private outputGain():number{return this.muted?0:this.volume*this.volume*.40;}
  private updateMaster():void {if(this.context&&this.master)this.master.gain.setTargetAtTime(this.outputGain(),this.context.currentTime,.015);}
  private available():boolean {return !this.disposed&&!this.muted&&this.volume>0&&this.context?.state==='running'&&!!this.master;}
  private stopLoop():void {
    for(const item of [...this.sources])if(item.loop)this.finish(item,true);
    this.loopGain?.disconnect();this.loopFilter?.disconnect();this.loopGain=null;this.loopFilter=null;this.loopTone=null;
  }
  private finish(item:TrackedSource,stop:boolean):void {
    if(!this.sources.delete(item))return;
    item.source.onended=null;
    if(stop)try{item.source.stop();}catch{/* Already ended or not yet started. */}
    for(const node of item.nodes)try{node.disconnect();}catch{/* Optional audio cannot throw into a run. */}
  }
  private track(source:Source,nodes:AudioNode[],loop=false):void {
    while(this.sources.size>=this.maxSources){const first=[...this.sources].find(x=>!x.loop);if(!first)break;this.finish(first,true);}
    const item={source,nodes,loop};this.sources.add(item);this.peak=Math.max(this.peak,this.sources.size);source.onended=()=>this.finish(item,false);
  }
  private tone(from:number,to:number,at:number,duration:number,volume:number,type:OscillatorType):void {
    const ctx=this.context!,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;
    osc.frequency.setValueAtTime(from,at);osc.frequency.exponentialRampToValueAtTime(Math.max(20,to),at+duration);
    gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(volume,at+.004);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    osc.connect(gain);gain.connect(this.master!);this.track(osc,[osc,gain]);osc.start(at);osc.stop(at+duration+.02);
  }
  private burst(at:number,duration:number,volume:number,frequency:number,type:BiquadFilterType):void {
    const ctx=this.context!,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=this.noise;filter.type=type;filter.frequency.value=frequency;filter.Q.value=.65;
    gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(volume,at+.002);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    source.connect(filter);filter.connect(gain);gain.connect(this.master!);this.track(source,[source,filter,gain]);source.start(at);source.stop(at+duration+.02);
  }
}
