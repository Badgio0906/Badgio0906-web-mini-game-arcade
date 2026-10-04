/* Web Audio uses the same hardware clock for pre-rendered demonstrations and judging. */
window.TaskAudio = {
  context: null, buffers: {}, active: null, startAt: 0, gain: null, ready: false,
  async init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)({latencyHint:'interactive'});
      this.gain = this.context.createGain(); this.gain.gain.value=.75;
      this.gain.connect(this.context.destination);
      const names=['tutorial','stage_01','stage_02','stage_03','tambourine','triangle','cymbal','kick','error','omit','clear','fail','wind'];
      this.loading=Promise.all(names.map(async name=>{
        const response=await fetch('audio/'+name+'.wav');
        if(!response.ok) throw Error('Audio load failed: '+name);
        this.buffers[name]=await this.context.decodeAudioData(await response.arrayBuffer());
      })).then(()=>this.ready=true).catch(e=>{this.error=String(e);console.error(e);});
    }
    await this.context.resume();
  },
  start(name) {
    this.stop();
    if (!this.ready) return;
    this.context.resume();
    const source=this.context.createBufferSource(); source.buffer=this.buffers[name];
    source.connect(this.gain); this.startAt=this.context.currentTime+.12;
    source.start(this.startAt); this.active=source;
  },
  clock(){ return this.context ? this.context.currentTime-this.startAt : 0; },
  stop(){ if(this.active){this.active.stop();this.active.disconnect();this.active=null;} },
  play(name){if(!this.ready)return; const s=this.context.createBufferSource();s.buffer=this.buffers[name];s.connect(this.gain);s.start();s.onended=()=>s.disconnect();},
  volume(value){if(this.gain)this.gain.gain.value=value;}
};
