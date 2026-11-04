export const RHYTHM_BEST_KEY = 'game013.mobile.v2.best';
export function rhythmChart(stage) {
 const notes=[],cues=[],segments=[];const beat=60/stage.bpm;let at=2;
 stage.rounds.forEach((round,index)=>{const demoStart=at,responseStart=at+(round.length+2)*beat,end=responseStart+(round.length+1)*beat;
  segments.push({round:index+1,demoStart,responseStart,end,length:round.length});
  for(const item of round.beats){cues.push({t:demoStart+item.beat*beat,channel:item.channel});notes.push({t:responseStart+item.beat*beat,channel:item.channel,result:null});}at=end+beat;
 });return {notes,cues,segments,duration:at,beat,score:0,combo:0,maxCombo:0,misses:0,perfect:0,offset:0,time:0};
}
export function advanceRhythm(song,t){song.time=t;for(const n of song.notes)if(!n.result&&t>n.t+.28+1e-8){n.result='MISS';song.misses++;song.combo=0;}}
export function strikeRhythm(song,channel,raw){const t=raw-song.offset;advanceRhythm(song,t);const segment=song.segments.find(s=>t>=s.responseStart-.28&&t<=s.end);if(!segment)return 'WAIT';
 const n=song.notes.filter(n=>!n.result&&Math.abs(t-n.t)<=.28+1e-8).sort((a,b)=>Math.abs(a.t-t)-Math.abs(b.t-t))[0];
 if(!n||n.channel!==channel){if(n)n.result='MISS';song.misses++;song.combo=0;return 'MISS';}
 const error=Math.abs(t-n.t);const result=error<=.09+1e-8?'PERFECT':error<=.18+1e-8?'GOOD':'OK';n.result=result;song.score+=result==='PERFECT'?100:result==='GOOD'?70:40;song.combo++;song.maxCombo=Math.max(song.maxCombo,song.combo);if(result==='PERFECT')song.perfect++;return result;
}
export function calibrationOffset(samples){if(!samples.length)return 0;const sorted=[...samples].sort((a,b)=>a-b);const mid=Math.floor(sorted.length/2);return Math.max(-250,Math.min(250,Math.round(sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2)));}
export function rhythmRank(score,total){const ratio=total?score/(total*100):0;return ratio>=.95?'S':ratio>=.8?'A':ratio>=.6?'B':ratio>=.35?'C':'D';}
