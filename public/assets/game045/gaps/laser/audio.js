// Bounded priority voice pool with independently controlled SE/BGM gains.
export class GapsAudio {
  constructor(context = new AudioContext(), capacity = 16) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 64) throw Error('capacity 1..64');
    this.context = context; this.capacity = capacity; this.voices = []; this.sequence = 0;
    this.buses = {};
    for (const name of ['SE', 'BGM']) {const g=context.createGain();g.gain.value=name==='SE'?.8:.5;g.connect(context.destination);this.buses[name]=g;}
  }
  setVolume(bus, value) {
    if (!this.buses[bus] || !Number.isFinite(value) || value<0 || value>1) throw Error('invalid bus volume');
    this.buses[bus].gain.setValueAtTime(value,this.context.currentTime);
  }
  async load(url) {const r=await fetch(url);if(!r.ok)throw Error('Audio fetch failed');return this.context.decodeAudioData(await r.arrayBuffer());}
  play(buffer, {priority=50,polyphony=8,bus='SE',asset_id='default',key=asset_id}={}) {
    if(!this.buses[bus]||!Number.isInteger(polyphony)||polyphony<1||polyphony>64||!Number.isInteger(priority)||priority<0||priority>100)throw Error('invalid voice settings');
    const same=this.voices.filter(v=>v.key===key);
    let victim=same.length>=polyphony?same[0]:null;
    if(!victim && this.voices.length>=this.capacity) victim=[...this.voices].sort((a,b)=>a.priority-b.priority||a.sequence-b.sequence)[0];
    if(victim && victim.priority>priority)return false;
    if(victim)this.stop(victim);
    const source=this.context.createBufferSource();source.buffer=buffer;source.connect(this.buses[bus]);
    const voice={source,priority,key,sequence:this.sequence++};this.voices.push(voice);
    source.onended=()=>{this.voices=this.voices.filter(v=>v!==voice);source.disconnect();};source.start();return true;
  }
  stop(voice){this.voices=this.voices.filter(v=>v!==voice);voice.source.stop();}
  stopAll(){for(const v of [...this.voices])this.stop(v);}
}
