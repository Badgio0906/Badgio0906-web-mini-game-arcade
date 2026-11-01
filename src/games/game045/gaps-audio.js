// GAPS Web exports, integrated with each game's existing AudioContext and master.
export function installGaps(AudioClass, bankURL, options = {}) {
  const diagnostics = {version:1, ready:false, decoded:0, played:0, active:0, peak:0, stopped:0, mutedDrops:0, throttled:0, events:{}, errors:[]};
  window.__gapsAudio = diagnostics;
  let bank;
  const bytes = new Map(), states = new WeakMap(), owners = new Set();
  const loading = fetch(bankURL).then(r => {if(!r.ok) throw Error(`bank HTTP ${r.status}`); return r.json();}).then(async b => {
    bank=b;
    await Promise.all(Object.entries(b.sounds).map(async ([cue,s]) => {
      const response=await fetch(new URL(s.file,bankURL));
      if(!response.ok) throw Error(`${cue} HTTP ${response.status}`);
      bytes.set(cue,await response.arrayBuffer());
    }));
  }).catch(e=>{diagnostics.errors.push(String(e));});
  function state(owner) {
    let s=states.get(owner);
    if(!s){s={buffers:new Map(),voices:new Set(),last:new Map(),bus:null,decode:null};states.set(owner,s);owners.add(owner);}
    return s;
  }
  function finish(s,voice,stop=false) {
    if(!s.voices.delete(voice)) return;
    voice.source.onended=null;
    if(stop) {try{voice.source.stop();}catch{} diagnostics.stopped++;}
    voice.source.disconnect();voice.gain.disconnect();
    diagnostics.active--;
  }
  function stop(owner) {
    const s=states.get(owner);if(!s)return;
    for(const voice of [...s.voices]) finish(s,voice,true);
    s.last.clear();
  }
  async function prepare(owner) {
    const context=owner.context;if(!context||!owner.master||context.state==='closed')return;
    const s=state(owner);
    if(!s.decode)s.decode=(async()=>{
      await loading;
      s.bus=context.createDynamicsCompressor();
      s.bus.threshold.value=-16;s.bus.knee.value=12;s.bus.ratio.value=8;
      s.bus.attack.value=.003;s.bus.release.value=.12;s.bus.connect(owner.master);
      for(const [cue,data] of bytes) s.buffers.set(cue,await context.decodeAudioData(data.slice(0)));
      diagnostics.decoded=s.buffers.size;diagnostics.ready=!!bank&&s.buffers.size===Object.keys(bank.sounds).length;
    })().catch(e=>diagnostics.errors.push(String(e)));
    await s.decode;
  }
  function play(owner,event,n=1) {
    diagnostics.events[event]=(diagnostics.events[event]||0)+1;
    if(owner.muted||owner.volume===0||owner.disposed){diagnostics.mutedDrops++;return;}
    const context=owner.context,s=state(owner),cue=bank?.events[event],buffer=s.buffers.get(cue);
    if(!context||context.state!=='running'||!s.bus||!buffer)return;
    const now=context.currentTime,priority=bank.sounds[cue].priority??50;
    if(now-(s.last.get(event)??-100)<.018){diagnostics.throttled++;return;}
    s.last.set(event,now);
    if((owner.voices?.size??0)+s.voices.size>=24){diagnostics.throttled++;return false;}
    if(s.voices.size>=12){
      const victim=[...s.voices].sort((a,b)=>a.priority-b.priority||a.at-b.at)[0];
      if(victim.priority>priority){diagnostics.throttled++;return;}
      finish(s,victim,true);
    }
    const source=context.createBufferSource(),gain=context.createGain();
    source.buffer=buffer;
    source.playbackRate.value=['chain','graze','bumper','snow','gold','loot'].includes(event)?Math.pow(2,Math.min(6,Math.max(0,(Number(n)||1)-1))*.12/12):1;
    gain.gain.value=options.gains?.[event]??.55;source.connect(gain).connect(s.bus);
    const voice={source,gain,priority,at:now};s.voices.add(voice);
    source.onended=()=>finish(s,voice);
    source.start();diagnostics.played++;diagnostics.active++;diagnostics.peak=Math.max(diagnostics.peak,s.voices.size);
    if(typeof owner.eventsPlayed==='number')owner.eventsPlayed++;
    return true;
  }
  const originalUnlock=AudioClass.prototype.unlock;
  AudioClass.prototype.unlock=async function(...args){await originalUnlock.apply(this,args);await prepare(this);};
  const originalPlay=AudioClass.prototype.play;
  if(originalPlay)AudioClass.prototype.play=function(...args){const used=play(this,args[0],args[1]);if(options.nativeLayers||!used)originalPlay.apply(this,args);};
  if(AudioClass.prototype.hit) {
    AudioClass.prototype.hit=function(lane,judgment,combo){
      if(judgment==='PERFECT'||judgment==='GOOD'){
        play(this,lane==='L'?'left':'right');play(this,judgment==='PERFECT'?'perfect':'good');
        if(combo>0&&combo%8===0)play(this,'cheer');
      }else if(judgment==='EMPTY')play(this,'empty');
    };
    AudioClass.prototype.cheer=function(){play(this,'cheer');};
  }
  for(const method of ['stop','dispose','destroy']){
    const original=AudioClass.prototype[method];if(!original)continue;
    AudioClass.prototype[method]=function(...args){
      stop(this);const result=original.apply(this,args);
      if(method!=='stop'){states.get(this)?.bus?.disconnect();owners.delete(this);}
      return result;
    };
  }
  for(const method of ['set','setMuted','setVolume']){
    const original=AudioClass.prototype[method];if(!original)continue;
    AudioClass.prototype[method]=function(...args){const result=original.apply(this,args);if(this.muted||this.volume===0)stop(this);return result;};
  }
  const stopAll=()=>{for(const owner of owners)stop(owner);};
  window.addEventListener('pagehide',stopAll);
  window.addEventListener('blur',stopAll);
  document.addEventListener('click',event=>{if(event.target.closest?.('#pause'))queueMicrotask(stopAll);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')queueMicrotask(stopAll);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();});
}
