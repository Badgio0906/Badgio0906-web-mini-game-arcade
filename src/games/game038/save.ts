import {GENRES,FOCUSES,STATS,EVENTS,QUESTIONS,END_LABEL,AGENCY_LABEL,JOB_LABEL,MAX_MONTHS,NAME_MAX,NOTE_MAX,POPULATION,type Career,type Summary,type Genre} from './model';
export const SAVE_KEY='web-mini-arcade:v1:game038:state',HISTORY_MAX=10;
export interface CareerSave {game_id:'game038';rules_version:'1';runs:number;bestRank:number|null;lastName:string;lastAim:Genre;history:Summary[];snapshot:Career|null;runId:string|null;reported:boolean;}
export function blankSave():CareerSave{return {game_id:'game038',rules_version:'1',runs:0,bestRank:null,lastName:'',lastAim:'talk',history:[],snapshot:null,runId:null,reported:true};}
const genreIds=new Set<string>(GENRES.map(g=>g.id)),focusIds=new Set<string>(FOCUSES.map(f=>f.id));
const int=(v:unknown,min:number,max:number):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;
const num=(v:unknown,min:number,max:number):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&[...v].length<=max;
const genre=(v:unknown):v is Genre=>typeof v==='string'&&genreIds.has(v);
const record=(v:unknown,check:(x:unknown)=>boolean)=>!!v&&typeof v==='object'&&GENRES.every(g=>check((v as Record<string,unknown>)[g.id]));
const member=(v:unknown,values:readonly string[])=>typeof v==='string'&&values.includes(v);
const tones=['good','bad','neutral','big'],eventIds=new Set(EVENTS.map(e=>e.id));
const validNotes=(v:Career['notes'],month:number)=>Array.isArray(v)&&v.length<=MAX_MONTHS&&v.every(n=>int(n?.month,0,month)&&text(n.text,NOTE_MAX));
const validPeers=(v:Career['peers'],month:number)=>Array.isArray(v)&&v.length===3&&v.every(p=>text(p?.name,20)&&genre(p.genre)&&int(p.subs,0,1e10)&&(p.ended===null||int(p.ended,0,month)));
function validSummary(s:Summary):boolean{return !!s&&text(s.name,NAME_MAX)&&!!s.name&&genre(s.aim)&&genre(s.direction)&&member(s.agency,Object.keys(AGENCY_LABEL))&&member(s.job,Object.keys(JOB_LABEL))&&member(s.reason,Object.keys(END_LABEL))&&int(s.months,0,MAX_MONTHS)&&int(s.peakSubs,0,1e10)&&int(s.finalSubs,0,s.peakSubs)&&int(s.peakCcv,0,1e10)&&int(s.rank,1,POPULATION)&&typeof s.monetized==='boolean'&&int(s.viral,0,1e6)&&Array.isArray(s.highlights)&&s.highlights.length<=8&&s.highlights.every(h=>text(h,120))&&validNotes(s.notes,s.months)&&(s.farewell===null||text(s.farewell,NOTE_MAX))&&validPeers(s.peers,s.months)&&text(s.endedAt,100)&&Number.isFinite(Date.parse(s.endedAt));}
function validPending(c:Career):boolean{
 const p=c.pending;
 if(p===null)return c.ended===null&&c.retireKind===null;
 if(!p||!text(p.id,40)||!text(p.title,60)||!text(p.text,300)||!Array.isArray(p.choices)||!p.choices.length||p.choices.length>4||!p.choices.every(x=>text(x?.label,60)&&(x.hint===undefined||text(x.hint,60))))return false;
 // The final note is still an unfinished decision, not an already-recorded result.
 if(c.ended!==null)return !!c.ended&&member(c.ended.reason,Object.keys(END_LABEL))&&int(c.ended.month,1,MAX_MONTHS)&&c.ended.month===c.month&&c.retireKind===null&&p.kind==='end'&&p.id==='end'&&p.choices.length===1;
 if(p.kind==='question')return c.retireKind===null&&!!QUESTIONS[c.month]&&p.id===`q${c.month}`&&p.choices.length===1;
 if(p.kind!=='event')return false;
 if(p.id==='retire')return member(c.retireKind,['graduate','fade'])&&p.choices.length===3;
 const event=EVENTS.find(e=>e.id===p.id);return c.retireKind===null&&!!event&&p.choices.length===event.choices(c).length;
}
/** Only a coherent in-progress production career is resumed; malformed parts fall back to a fresh title. */
function validCareer(c:Career):boolean{
 if(!c||c.rules_version!=='1'||c.practice!==false||!int(c.seed,0,0xffffffff)||!text(c.name,NAME_MAX)||!c.name||!genre(c.aim)||!['indie','small','mid','major'].includes(c.agency)||!['student','worker','part','fulltime'].includes(c.job)||!int(c.budget,0,2)||!['ja','en','other'].includes(c.region)||typeof c.veteran!=='boolean')return false;
 if(!int(c.month,0,MAX_MONTHS)||!STATS.every(s=>num(c.stats?.[s.id],0,100))||![c.subs,c.peakSubs,c.ccv,c.peakCcv].every(n=>int(n,0,1e10))||!int(c.income,0,1e12)||!int(c.savings,-1e12,1e12)||typeof c.monetized!=='boolean')return false;
 if(!record(c.affinity,v=>num(v,0,1e6))||!record(c.talent,v=>num(v,0,3))||!focusIds.has(c.focus)||![c.planBank,c.stagnant,c.rested,c.viral,c.scandals].every(n=>num(n,0,1e6)))return false;
 if(!Array.isArray(c.used)||!c.used.every(u=>typeof u==='string'&&eventIds.has(u))||!Array.isArray(c.log)||c.log.length>160||!c.log.every(l=>int(l?.month,0,c.month)&&text(l.text,200)&&member(l.tone,tones))||!Array.isArray(c.tones)||c.tones.length>MAX_MONTHS||!c.tones.every(t=>t==null||member(t,tones)))return false;
 if(!validNotes(c.notes,c.month)||!Array.isArray(c.highlights)||c.highlights.length>8||!c.highlights.every(h=>text(h,120))||!validPeers(c.peers,c.month))return false;
 if(c.farewell!==null)return false;
 return validPending(c);
}
export function validateSave(v:unknown):CareerSave|null{
 try{const s=v as CareerSave;if(!s||s.game_id!=='game038'||s.rules_version!=='1'||!int(s.runs,0,1e9)||!(s.bestRank===null||int(s.bestRank,1,POPULATION))||!text(s.lastName,NAME_MAX)||!genre(s.lastAim)||typeof s.reported!=='boolean'||!(s.runId===null||text(s.runId,100)))return null;
  const history=Array.isArray(s.history)?s.history.filter(validSummary).slice(0,HISTORY_MAX):[];
  const snapshot=s.snapshot&&!s.reported&&validCareer(s.snapshot)?s.snapshot:null;
  return structuredClone({...s,history,snapshot,reported:snapshot?s.reported:true});
 }catch{return null;}
}
export class CareerStore {private memory:CareerSave|null=null;private denied=false;constructor(private backend?:Pick<Storage,'getItem'|'setItem'>){try{this.backend??=window.localStorage;}catch{this.denied=true;}}
 read():CareerSave{if(this.memory)return structuredClone(this.memory);try{const raw=this.denied?null:this.backend?.getItem(SAVE_KEY);return raw&&raw.length<400000?validateSave(JSON.parse(raw))??blankSave():blankSave();}catch{return blankSave();}}
 write(s:CareerSave):void{this.memory=structuredClone(s);if(!this.denied)try{this.backend?.setItem(SAVE_KEY,JSON.stringify(s));}catch{this.denied=true;}}
 get memoryOnly():boolean{return this.denied;}
}
