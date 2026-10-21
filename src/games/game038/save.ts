import {GENRES,FOCUSES,STATS,MAX_MONTHS,NAME_MAX,NOTE_MAX,POPULATION,type Career,type Summary,type Genre} from './model';
export const SAVE_KEY='web-mini-arcade:v1:game038:state',HISTORY_MAX=10;
export interface CareerSave {game_id:'game038';rules_version:'1';runs:number;bestRank:number|null;lastName:string;lastAim:Genre;history:Summary[];snapshot:Career|null;runId:string|null;reported:boolean;}
export function blankSave():CareerSave{return {game_id:'game038',rules_version:'1',runs:0,bestRank:null,lastName:'',lastAim:'talk',history:[],snapshot:null,runId:null,reported:true};}
const genreIds=new Set<string>(GENRES.map(g=>g.id)),focusIds=new Set<string>(FOCUSES.map(f=>f.id));
const int=(v:unknown,min:number,max:number):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;
const num=(v:unknown,min:number,max:number):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&[...v].length<=max;
const genre=(v:unknown):v is Genre=>typeof v==='string'&&genreIds.has(v);
const record=(v:unknown,check:(x:unknown)=>boolean)=>!!v&&typeof v==='object'&&GENRES.every(g=>check((v as Record<string,unknown>)[g.id]));
function validSummary(s:Summary):boolean{return !!s&&text(s.name,NAME_MAX)&&genre(s.aim)&&genre(s.direction)&&int(s.months,0,MAX_MONTHS)&&int(s.peakSubs,0,1e10)&&int(s.rank,1,POPULATION)&&Array.isArray(s.highlights)&&s.highlights.every(h=>text(h,120))&&Array.isArray(s.notes)&&s.notes.every(n=>text(n?.text,NOTE_MAX))&&(s.farewell===null||text(s.farewell,NOTE_MAX))&&Array.isArray(s.peers)&&typeof s.endedAt==='string';}
/** Only a coherent in-progress production career is resumed; malformed parts fall back to a fresh title. */
function validCareer(c:Career):boolean{
 if(!c||c.rules_version!=='1'||c.practice!==false||!int(c.seed,0,0xffffffff)||!text(c.name,NAME_MAX)||!c.name||!genre(c.aim)||!['indie','small','mid','major'].includes(c.agency)||!['student','worker','part','fulltime'].includes(c.job)||!int(c.budget,0,2)||!['ja','en','other'].includes(c.region)||typeof c.veteran!=='boolean')return false;
 if(!int(c.month,0,MAX_MONTHS)||!STATS.every(s=>num(c.stats?.[s.id],0,100))||![c.subs,c.peakSubs,c.ccv,c.peakCcv].every(n=>int(n,0,1e10))||!int(c.income,0,1e12)||!int(c.savings,-1e12,1e12)||typeof c.monetized!=='boolean')return false;
 if(!record(c.affinity,v=>num(v,0,1e6))||!record(c.talent,v=>num(v,0,3))||!focusIds.has(c.focus)||![c.planBank,c.stagnant,c.rested,c.viral,c.scandals].every(n=>num(n,0,1e6)))return false;
 if(!Array.isArray(c.used)||!c.used.every(u=>text(u,40))||!Array.isArray(c.log)||c.log.length>160||!c.log.every(l=>int(l?.month,0,MAX_MONTHS)&&text(l.text,200))||!Array.isArray(c.tones)||c.tones.length>MAX_MONTHS)return false;
 if(!Array.isArray(c.notes)||!c.notes.every(n=>text(n?.text,NOTE_MAX))||!Array.isArray(c.highlights)||!c.highlights.every(h=>text(h,120))||!Array.isArray(c.peers)||c.peers.length!==3||!c.peers.every(p=>text(p?.name,20)&&genre(p.genre)&&int(p.subs,0,1e10)&&(p.ended===null||int(p.ended,0,MAX_MONTHS))))return false;
 if(c.ended!==null||c.farewell!==null)return false;
 const p=c.pending;if(p!==null&&(!p||!['event','question'].includes(p.kind)||!text(p.id,40)||!text(p.title,60)||!text(p.text,300)||!Array.isArray(p.choices)||!p.choices.length||p.choices.length>4||!p.choices.every(x=>text(x?.label,60))))return false;
 return c.retireKind===null||['graduate','fade'].includes(c.retireKind);
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
