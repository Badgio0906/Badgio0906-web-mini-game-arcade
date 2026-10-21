/** Game038 ONE IN 60,000: pure VTuber career simulation. DOM, audio and storage stay outside. */
export const POPULATION=60000,MAX_MONTHS=144,NAME_MAX=16,NOTE_MAX=60;
export type Genre='song'|'game'|'talk'|'asmr'|'art'|'variety'|'study';
export type Focus='stream'|'plan'|'practice'|'collab'|'sns'|'rest';
export type Agency='indie'|'small'|'mid'|'major';
export type Job='student'|'worker'|'part'|'fulltime';
export type StatKey='health'|'joy'|'skill'|'bond';
export type Tone='good'|'bad'|'neutral'|'big';
export type EndReason='graduate'|'health'|'fade'|'reincarnate'|'contract'|'life'|'cap';
export const GENRES:readonly {id:Genre;label:string;short:string}[]=[
 {id:'song',label:'歌・音楽',short:'歌'},{id:'game',label:'ゲーム実況',short:'ゲーム'},{id:'talk',label:'雑談',short:'雑談'},{id:'asmr',label:'ASMR',short:'ASMR'},
 {id:'art',label:'お絵描き・ものづくり',short:'お絵描き'},{id:'variety',label:'企画・バラエティ',short:'企画'},{id:'study',label:'学び・解説',short:'解説'}];
export const FOCUSES:readonly {id:Focus;label:string;hint:string}[]=[
 {id:'stream',label:'配信多め',hint:'伸びやすいが疲れる'},{id:'plan',label:'企画を練る',hint:'あとで効いてくる'},{id:'practice',label:'練習する',hint:'配信力が上がる'},
 {id:'collab',label:'コラボ',hint:'つながりと新規'},{id:'sns',label:'切り抜き・SNS',hint:'バズりやすいが荒れやすい'},{id:'rest',label:'休む',hint:'体と心を戻す'}];
export const STATS:readonly {id:StatKey;label:string}[]=[{id:'health',label:'体と心'},{id:'joy',label:'楽しさ'},{id:'skill',label:'配信力'},{id:'bond',label:'つながり'}];
export const AGENCY_LABEL:Record<Agency,string>={indie:'個人勢',small:'小さな事務所',mid:'中堅の事務所',major:'大手の事務所'};
export const JOB_LABEL:Record<Job,string>={student:'学生',worker:'会社員',part:'アルバイト',fulltime:'専業'};
export const END_LABEL:Record<EndReason,string>={graduate:'卒業',health:'体調による引退',fade:'無期限の活動休止',reincarnate:'転生（新しい姿で再出発）',contract:'契約終了',life:'暮らしの変化による引退',cap:'活動12年目、物語は続く'};
export interface Peer {name:string;genre:Genre;subs:number;ended:number|null;}
export interface LogEntry {month:number;text:string;tone:Tone;}
export interface Choice {label:string;hint?:string;}
export interface Pending {kind:'event'|'question'|'end';id:string;title:string;text:string;choices:Choice[];}
export interface Career {
 rules_version:'1';practice:boolean;seed:number;name:string;aim:Genre;agency:Agency;job:Job;budget:0|1|2;region:'ja'|'en'|'other';veteran:boolean;
 month:number;stats:Record<StatKey,number>;subs:number;peakSubs:number;ccv:number;peakCcv:number;monetized:boolean;income:number;savings:number;
 affinity:Record<Genre,number>;talent:Record<Genre,number>;focus:Focus;planBank:number;stagnant:number;rested:number;used:string[];log:LogEntry[];tones:Tone[];notes:{month:number;text:string}[];
 peers:Peer[];pending:Pending|null;retireKind:EndReason|null;ended:{reason:EndReason;month:number}|null;farewell:string|null;viral:number;scandals:number;highlights:string[];
}
// ---------- random ----------
function next(s:{seed:number}):number{let t=(s.seed+0x6d2b79f5)>>>0;s.seed=t;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
const pick=<T,>(s:{seed:number},list:readonly T[]):T=>list[Math.floor(next(s)*list.length)];
function weighted<T>(s:{seed:number},items:readonly [T,number][]):T{const total=items.reduce((n,[,w])=>n+Math.max(0,w),0);let r=next(s)*total;for(const [v,w] of items){r-=Math.max(0,w);if(r<0)return v;}return items[items.length-1][0];}
/** Log-normal style luck around 1 (σ≈0.45). */
function luck(s:{seed:number},spread=.45):number{const u=Math.max(1e-9,next(s)),v=next(s);return Math.exp(Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)*spread-spread*spread/2);}
const clamp=(v:number,lo=0,hi=100)=>Math.max(lo,Math.min(hi,v));
// ---------- ranking ----------
/**
 * Assumed (not measured) share of the 60,000 VTubers with at least N subscribers.
 * Game premise only: most channels stay small, a few dozen pass one million.
 */
export const SHARE_AT_LEAST:readonly [number,number][]=[[0,1],[10,.88],[100,.58],[1000,.24],[10000,.065],[100000,.012],[1000000,.0009],[5000000,.00004]];
export function rankOf(subs:number):number{
 const s=Math.max(0,subs);let share=SHARE_AT_LEAST[SHARE_AT_LEAST.length-1][1];
 for(let i=1;i<SHARE_AT_LEAST.length;i++){const [a,pa]=SHARE_AT_LEAST[i-1],[b,pb]=SHARE_AT_LEAST[i];if(s<=b){const t=a===0?s/b:(Math.log(s)-Math.log(a))/(Math.log(b)-Math.log(a));share=Math.exp(Math.log(pa)+(Math.log(pb)-Math.log(pa))*Math.max(0,Math.min(1,t)));break;}}
 if(s>5000000)share=.00004*5000000/s;
 return Math.max(1,Math.min(POPULATION,Math.ceil(POPULATION*share)));
}
// ---------- names ----------
const SYL=['あ','い','う','か','き','く','こ','さ','し','す','そ','た','ち','つ','な','に','の','は','ひ','ふ','ほ','ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ'];
const FAMILY=['星宮','月詠','白羽','夜凪','花森','天音','雪代','鳴海','空野','狐塚','茜','黒葛','七瀬','桃瀬','氷室','朝霧'];
function peerName(s:{seed:number}):string{return pick(s,FAMILY)+Array.from({length:2+Math.floor(next(s)*2)},()=>pick(s,SYL)).join('');}
export function cleanName(raw:string):string{const name=[...raw.replace(/[\u0000-\u001f\u007f<>]/g,'').trim()].slice(0,NAME_MAX).join('');return name||'名もなき新人';}
export function cleanNote(raw:string):string{return [...raw.replace(/[\u0000-\u001f\u007f]/g,' ').trim()].slice(0,NOTE_MAX).join('');}
export const genreLabel=(g:Genre)=>GENRES.find(x=>x.id===g)!.label;
export const genreShort=(g:Genre)=>GENRES.find(x=>x.id===g)!.short;
/** The direction the audience actually sees: the strongest affinity, which may differ from the aim. */
export function direction(c:Career):Genre{let best:Genre=c.aim;for(const g of GENRES)if(c.affinity[g.id]>c.affinity[best]+.001)best=g.id;return best;}
// ---------- creation ----------
export function createCareer(nameRaw:string,aim:Genre,seed=(Date.now()^Math.floor(Math.random()*0x7fffffff))>>>0,practice=false):Career{
 const r={seed:seed>>>0};
 const agency=practice?'indie':weighted<Agency>(r,[['indie',74],['small',16],['mid',7],['major',3]]);
 const job=practice?'student':weighted<Job>(r,[['student',30],['worker',36],['part',24],['fulltime',10]]);
 const budget=(practice?1:weighted<0|1|2>(r,[[0,40],[1,45],[2,15]]));
 const region=practice?'ja':weighted<'ja'|'en'|'other'>(r,[['ja',55],['en',30],['other',15]]);
 const veteran=!practice&&next(r)<.22;
 const affinity=Object.fromEntries(GENRES.map(g=>[g.id,g.id===aim?30:3+next(r)*8])) as Record<Genre,number>;
 // Hidden aptitude: the aim is a little favoured, but the audience may love something else.
 const talent=Object.fromEntries(GENRES.map(g=>[g.id,Math.round((.45+next(r)*1.1+(g.id===aim?.15:0))*100)/100])) as Record<Genre,number>;
 const base=(lo:number,hi:number)=>Math.round(lo+next(r)*(hi-lo));
 const stats={health:base(55,80),joy:base(60,85),skill:base(15,35)+(veteran?18:0)+budget*4,bond:base(15,35)+(agency==='indie'?0:15)};
 const c:Career={rules_version:'1',practice,seed:r.seed,name:cleanName(nameRaw),aim,agency,job,budget,region,veteran,month:0,stats,subs:agency==='major'?base(8000,25000):agency==='mid'?base(800,3000):agency==='small'?base(100,500):veteran?base(30,200):base(0,15),peakSubs:0,ccv:0,peakCcv:0,monetized:false,income:0,savings:[50000,150000,400000][budget],affinity,talent,focus:'stream',planBank:0,stagnant:0,rested:0,used:[],log:[],tones:[],notes:[],peers:[],pending:null,retireKind:null,ended:null,farewell:null,viral:0,scandals:0,highlights:[]};
 c.peakSubs=c.subs;
 c.peers=Array.from({length:3},()=>({name:peerName(r),genre:pick(r,GENRES).id,subs:Math.round(c.subs*luck(r,.6)),ended:null}));
 c.seed=r.seed;return c;
}
// ---------- events ----------
type Rng={seed:number};
interface EventDef {id:string;title:string;text:(c:Career)=>string;when:(c:Career)=>boolean;weight:(c:Career)=>number;once?:boolean;choices:(c:Career)=>Choice[];apply:(c:Career,choice:number,r:Rng)=>string;auto:(c:Career)=>number;}
const add=(c:Career,patch:Partial<Record<StatKey,number>>)=>{for(const [k,v] of Object.entries(patch) as [StatKey,number][])c.stats[k]=clamp(c.stats[k]+v);};
const lean=(c:Career,g:Genre,v:number)=>{c.affinity[g]=Math.max(0,c.affinity[g]+v);};
const gain=(c:Career,ratio:number,min=0)=>{const n=Math.round(Math.max(min,c.subs*ratio));c.subs=Math.max(0,c.subs+n);return n;};
const isDir=(c:Career,...g:Genre[])=>g.includes(direction(c))||g.includes(c.aim);
const mark=(c:Career,text:string)=>{if(c.highlights.length<8)c.highlights.push(`${monthLabel(c.month)}：${text}`);};
export const EVENTS:readonly EventDef[]=[
 {id:'debut',title:'初配信の夜',text:c=>`待機画面の向こうに、${c.subs?c.subs+'人の':'まだ見ぬ'}誰かがいる。${c.name}、最初の一言は？`,when:c=>c.month===1,weight:()=>1e6,once:true,
  choices:c=>[{label:'自己紹介を丁寧に',hint:'つながり'},{label:`${genreShort(c.aim)}を全力で見せる`,hint:'目指すジャンル'},{label:'緊張をそのまま話す',hint:'雑談'}],
  apply:(c,i,r)=>{if(i===0){add(c,{bond:6});gain(c,.05,3+Math.round(next(r)*8));return '丁寧な自己紹介。最初のリスナーが名前を覚えてくれた。';}if(i===1){lean(c,c.aim,8);add(c,{skill:3,health:-3});gain(c,.08,2+Math.round(next(r)*14*luck(r)));return `${genreShort(c.aim)}を全力で。手応えと、少しの疲れ。`;}lean(c,'talk',8);add(c,{joy:6});gain(c,.04,2+Math.round(next(r)*10));return '噛んで、笑って、緊張がほどけた。「かわいい」とコメントがついた。';},auto:()=>1},
 {id:'gear',title:'マイクが壊れた',text:()=>'配信の途中で、音がぷつりと途切れた。',when:c=>c.month>=2,weight:c=>c.budget===0?3:1.2,once:true,
  choices:()=>[{label:'思い切って買い替える',hint:'貯金を使う'},{label:'だましだまし使う',hint:'お金は守る'}],
  apply:(c,i)=>{if(i===0){c.savings-=40000+c.budget*30000;add(c,{skill:3,joy:2});return '新しいマイク。声がくっきり届くようになった。';}add(c,{skill:-3,joy:-3});return 'ノイズまじりの配信。「音が小さい」コメントが続く。';},auto:c=>c.savings>40000?0:1},
 {id:'collab',title:'コラボのお誘い',text:c=>`同じくらいの規模の${pick({seed:c.seed},['先輩','新人','海外の'])}VTuberからDMが届いた。`,when:c=>c.month>=3,weight:c=>1+c.stats.bond/40+(c.focus==='collab'?2:0),
  choices:()=>[{label:'受ける',hint:'つながり・新規'},{label:'今回は見送る',hint:'自分のペース'}],
  apply:(c,i,r)=>{if(i===0){add(c,{bond:7,health:-2,joy:3});const n=gain(c,.06*luck(r),5);return `コラボは大盛り上がり。相手のリスナーが${n.toLocaleString()}人来てくれた。`;}add(c,{health:2});return '今は自分の配信に集中することにした。';},auto:c=>c.stats.health<35?1:0},
 {id:'cover',title:'歌ってみた',text:()=>'好きな曲を、ちゃんと録って出してみない？',when:c=>c.month>=2,weight:c=>isDir(c,'song')?3:.6,
  choices:()=>[{label:'本気で作る',hint:'歌・体力を使う'},{label:'今はやめておく'}],
  apply:(c,i,r)=>{if(i===0){lean(c,'song',10);add(c,{skill:4,health:-5,joy:4});const n=gain(c,(.05+c.stats.skill/1000)*luck(r,.7),8);return `歌ってみたを投稿。${n.toLocaleString()}人が登録してくれた。`;}return '歌はまた今度。';},auto:c=>isDir(c,'song')&&c.stats.health>40?0:1},
 {id:'release',title:'話題の新作ゲーム',text:()=>'みんなが待っていた新作が、今夜発売。',when:c=>c.month>=2,weight:c=>isDir(c,'game')?3:1,
  choices:()=>[{label:'発売日に耐久配信',hint:'ゲーム実況'},{label:'落ち着いてから遊ぶ'}],
  apply:(c,i,r)=>{if(i===0){lean(c,'game',10);add(c,{health:-7,joy:5,skill:2});const n=gain(c,.07*luck(r,.8),6);return `朝まで耐久。同時視聴が跳ね、${n.toLocaleString()}人増えた。`;}add(c,{health:2});return 'ネタバレを避けて、のんびり遊んだ。';},auto:c=>c.stats.health>45?0:1},
 {id:'endurance',title:'企画会議',text:()=>'「24時間○○してみた」——やる？',when:c=>c.month>=4,weight:c=>isDir(c,'variety')?3:.8,
  choices:()=>[{label:'やってみる',hint:'企画・体力'},{label:'小さな企画にする'}],
  apply:(c,i,r)=>{if(i===0){lean(c,'variety',12);add(c,{health:-12,joy:6,skill:3});const n=gain(c,(.09+c.planBank/400)*luck(r,.8),10);c.planBank=0;return `限界企画、完走。切り抜きが回って${n.toLocaleString()}人増えた。`;}lean(c,'variety',4);add(c,{joy:2});gain(c,.02,1);return 'ちょうどいい企画で、常連さんが笑ってくれた。';},auto:c=>c.stats.health>55?0:1},
 {id:'asmr-mic',title:'バイノーラルマイク',text:()=>'耳の形をした高いマイク。カートに入れたまま一週間。',when:c=>c.month>=3,weight:c=>isDir(c,'asmr')?3:.5,once:true,
  choices:()=>[{label:'買う',hint:'ASMR・貯金'},{label:'手持ちで工夫する'}],
  apply:(c,i,r)=>{if(i===0){c.savings-=80000;lean(c,'asmr',14);add(c,{skill:5});gain(c,.06*luck(r),5);return '音が変わった。「寝落ちしました」というコメントが増えた。';}lean(c,'asmr',4);add(c,{skill:2});return 'タオルと工夫で、意外といい音が出た。';},auto:c=>c.savings>150000?0:1},
 {id:'fanart',title:'ファンアートタグ',text:c=>`#${c.name}の絵 に、初めて絵が投稿された。`,when:c=>c.subs>=50,weight:c=>isDir(c,'art')?3:1,once:true,
  choices:()=>[{label:'配信で紹介して描き返す',hint:'お絵描き・つながり'},{label:'そっといいねする'}],
  apply:(c,i)=>{if(i===0){lean(c,'art',10);add(c,{bond:8,joy:6});gain(c,.03,3);return '描き返した絵に、描いた人が泣いて喜んでいた。';}add(c,{joy:4});return '保存して、何度も見返した。';},auto:()=>0},
 {id:'explain',title:'解説がほしい',text:()=>'「この話、もっと詳しく聞きたい」というコメントが続いている。',when:c=>c.month>=3,weight:c=>isDir(c,'study')?3:.7,
  choices:()=>[{label:'資料を作って解説配信',hint:'学び・解説'},{label:'雑談のまま話す',hint:'雑談'}],
  apply:(c,i,r)=>{if(i===0){lean(c,'study',12);add(c,{skill:5,health:-4});const n=gain(c,.05*luck(r,.7),4);return `解説配信がアーカイブで伸び、${n.toLocaleString()}人増えた。`;}lean(c,'talk',6);add(c,{joy:3});return '脱線だらけの雑談も、それはそれで好評だった。';},auto:()=>0},
 {id:'clip',title:'雑談が切り抜かれた',text:()=>'何気ない一言が、知らない人の切り抜きで回っている。',when:c=>c.month>=2,weight:c=>1+(c.focus==='sns'?2:0),
  choices:()=>[{label:'その話題でもう一度配信',hint:'雑談'},{label:'いつも通りに戻る',hint:'目指すジャンル'}],
  apply:(c,i,r)=>{const n=gain(c,.1*luck(r,.9),15);c.viral++;if(i===0){lean(c,'talk',12);return `切り抜きから${n.toLocaleString()}人。雑談の人として知られ始めた。`;}lean(c,c.aim,5);return `切り抜きから${n.toLocaleString()}人。でも、やりたいことは変えない。`;},auto:c=>direction(c)==='talk'?0:1},
 {id:'storm',title:'コメント欄が荒れた',text:()=>'言葉の切り取りが広まって、知らない人が押し寄せてきた。',when:c=>c.subs>=300,weight:c=>.5+(c.focus==='sns'?1.6:0)+c.subs/200000,
  choices:()=>[{label:'経緯を説明して謝る'},{label:'反応せずに配信を続ける'},{label:'少し休む',hint:'体と心'}],
  apply:(c,i,r)=>{c.scandals++;if(i===0){add(c,{joy:-8,bond:4});c.subs=Math.round(c.subs*(.97+next(r)*.02));return '誠実な説明に、残ってくれた人たちがいた。';}if(i===1){add(c,{joy:-12,health:-6});c.subs=Math.round(c.subs*(.92+next(r)*.1));return '嵐が過ぎるのを待った。思ったより長かった。';}add(c,{joy:-4,health:6});c.rested+=2;c.subs=Math.round(c.subs*.97);return 'しばらく配信を休んだ。戻ると「おかえり」が並んでいた。';},auto:c=>c.stats.joy<40?2:0},
 {id:'busy',title:'本業が忙しい',text:c=>c.job==='student'?'試験期間がやってきた。':'繁忙期。帰宅は毎晩23時。',when:c=>c.job!=='fulltime'&&c.month>=2,weight:()=>1.4,
  choices:()=>[{label:'配信を減らす',hint:'体と心'},{label:'睡眠を削って続ける',hint:'伸びは保つ'}],
  apply:(c,i)=>{if(i===0){add(c,{health:3,joy:-3});c.rested+=1;return '配信はお休み多め。告知だけは欠かさなかった。';}add(c,{health:-12,skill:2});gain(c,.02);return '眠い目をこすって、今夜も配信。';},auto:c=>c.stats.health<50?0:1},
 {id:'go-full',title:'専業になる？',text:c=>`月の収益が${c.income.toLocaleString()}円になった。配信だけで暮らしていけるかもしれない。`,when:c=>c.job!=='fulltime'&&c.monetized&&c.subs>=8000,weight:()=>2.5,once:true,
  choices:()=>[{label:'専業になる',hint:'時間が増える・生活費'},{label:'両立を続ける'}],
  apply:(c,i)=>{if(i===0){c.job='fulltime';add(c,{joy:6,health:4});mark(c,'専業VTuberに');return '退職届を出した。毎日が配信の日になった。';}add(c,{health:-2});return '二足のわらじで、もう少し。';},auto:c=>c.savings>300000?0:1},
 {id:'scout',title:'事務所からのスカウト',text:()=>'「うちでデビューしませんか」。条件の書かれたメールが届いた。',when:c=>c.agency==='indie'&&c.subs>=2500&&c.month>=4,weight:()=>1.2,once:true,
  choices:()=>[{label:'所属する',hint:'サポートと分配'},{label:'個人で続ける',hint:'自由'}],
  apply:(c,i)=>{if(i===0){c.agency=c.subs>30000?'mid':'small';add(c,{bond:10,joy:2});gain(c,.15,200);mark(c,`${AGENCY_LABEL[c.agency]}に所属`);return `${AGENCY_LABEL[c.agency]}に所属。同期ができ、告知の輪が広がった。`;}add(c,{joy:4});return '自分の色で、自分の足で。';},auto:c=>c.stats.bond<40?0:1},
 {id:'sponsor',title:'案件の依頼',text:()=>'ゲーム会社から、紹介配信の依頼が届いた。',when:c=>c.subs>=10000,weight:()=>1.2,
  choices:()=>[{label:'受ける',hint:'収入'},{label:'自分の企画を優先'}],
  apply:(c,i)=>{if(i===0){const pay=Math.round(c.subs*3);c.savings+=pay;lean(c,'game',4);add(c,{health:-2});return `案件配信を完走。${pay.toLocaleString()}円の報酬。`;}add(c,{joy:3});c.planBank+=10;return '今は自分の企画に時間を使う。';},auto:()=>0},
 {id:'3d',title:'3Dお披露目',text:()=>'全身が動く、新しい姿。お披露目の日程を決める時が来た。',when:c=>c.subs>=30000||(c.agency==='major'&&c.month>=10),weight:()=>2,once:true,
  choices:()=>[{label:'歌って踊るライブにする',hint:'歌'},{label:'企画もりもりにする',hint:'企画'},{label:'のんびり雑談で',hint:'雑談'}],
  apply:(c,i,r)=>{const g:Genre=(['song','variety','talk'] as const)[i];lean(c,g,10);if(c.agency==='indie')c.savings-=300000;add(c,{joy:10,health:-6});const n=gain(c,.12*luck(r,.6),500);mark(c,'3Dお披露目');return `3Dお披露目。${n.toLocaleString()}人が新しい姿を見に来た。`;},auto:c=>(['song','variety','talk'] as Genre[]).indexOf(direction(c))>=0?(['song','variety','talk'] as Genre[]).indexOf(direction(c)):2},
 {id:'peer-grad',title:'同期の卒業',text:c=>{const p=c.peers.find(p=>p.ended===c.month);return `同期の${p?.name??'あの子'}が、卒業を発表した。`;},when:c=>c.peers.some(p=>p.ended===c.month),weight:()=>1e5,
  choices:()=>[{label:'気持ちを配信で話す',hint:'つながり'},{label:'静かに見送る'}],
  apply:(c,i)=>{if(i===0){add(c,{bond:5,joy:-4});lean(c,'talk',4);return '泣きながら話した。リスナーも一緒に泣いてくれた。';}add(c,{joy:-6});return 'アーカイブを、最初からもう一度見た。';},auto:()=>1},
 {id:'dm',title:'心ないDM',text:()=>'深夜、知らないアカウントから長いメッセージが届いた。',when:c=>c.subs>=1000,weight:c=>.6+c.subs/100000,
  choices:()=>[{label:'仲間に相談する',hint:'つながり'},{label:'ひとりで抱える'},{label:'専門家に相談して対応する',hint:'貯金を使う'}],
  apply:(c,i)=>{if(i===0){add(c,{joy:-3,bond:5});return '「大丈夫だよ」と言ってくれる人がいた。';}if(i===1){add(c,{joy:-14,health:-6});return '画面を閉じても、言葉が頭に残った。';}c.savings-=200000;add(c,{joy:-2,health:2});return 'きちんと対応した。少し、気持ちが軽くなった。';},auto:c=>c.stats.bond>30?0:2},
 {id:'throat',title:'喉の違和感',text:()=>'高い音が、いつもより出ない。',when:c=>isDir(c,'song')&&c.month>=4,weight:()=>1,
  choices:()=>[{label:'しっかり休む',hint:'体と心'},{label:'予定通り歌枠をやる'}],
  apply:(c,i,r)=>{if(i===0){add(c,{health:10});c.rested+=1;return '歌枠をお休みして、喉を休めた。';}if(next(r)<.35){add(c,{health:-20,joy:-8});return '無理がたたって、しばらく声が出なくなった。';}add(c,{health:-6});gain(c,.02);return 'なんとか歌いきった。';},auto:()=>0},
 {id:'tournament',title:'配信者大会',text:()=>'人気タイトルの配信者大会に、出場枠をもらった。',when:c=>isDir(c,'game')&&c.subs>=3000,weight:()=>1.2,once:true,
  choices:()=>[{label:'練習して本気で挑む',hint:'ゲーム実況'},{label:'エンジョイ枠で出る',hint:'楽しさ'}],
  apply:(c,i,r)=>{lean(c,'game',8);if(i===0){add(c,{skill:8,health:-8});const win=next(r)<c.stats.skill/140;const n=gain(c,(win?.2:.07)*luck(r,.5),100);if(win)mark(c,'配信者大会で優勝');return win?`まさかの優勝。${n.toLocaleString()}人増えた。`:`惜しくも敗退。それでも${n.toLocaleString()}人増えた。`;}add(c,{joy:8,bond:4});gain(c,.05,50);return '笑いの絶えない試合になった。';},auto:c=>c.stats.health>50?0:1},
 {id:'anniv',title:'周年記念',text:c=>`活動${Math.floor(c.month/12)}周年。どんな配信にする？`,when:c=>c.month>0&&c.month%12===0,weight:()=>1e4,
  choices:c=>[{label:'大きな記念企画',hint:'体力を使う'},{label:'いつものメンバーと静かに'},{label:`${genreShort(direction(c))}でお祝い`,hint:'いまの方向性'}],
  apply:(c,i,r)=>{if(i===0){add(c,{health:-8,joy:8});const n=gain(c,.08*luck(r,.6),20);return `記念企画は大成功。${n.toLocaleString()}人増えた。`;}if(i===1){add(c,{bond:8,joy:5});return '長くいてくれる人たちと、ゆっくり話した。';}lean(c,direction(c),8);add(c,{joy:6});gain(c,.04,5);return 'いまの自分らしい周年になった。';},auto:c=>c.stats.health>55?0:1},
 {id:'overseas',title:'海外からのコメント',text:()=>'翻訳つきのコメントが増えてきた。',when:c=>c.subs>=800&&c.region!=='en',weight:()=>.8,once:true,
  choices:()=>[{label:'少し英語で話してみる',hint:'配信力'},{label:'いつもの言葉で'}],
  apply:(c,i,r)=>{if(i===0){add(c,{skill:4,health:-3});const n=gain(c,.08*luck(r,.7),20);return `つたない英語に、海外のリスナーが${n.toLocaleString()}人増えた。`;}add(c,{joy:2});return '言葉が違っても、笑うところは同じだった。';},auto:()=>1},
 {id:'drift',title:'伸びているのは',text:c=>`目指したのは「${genreLabel(c.aim)}」。でも伸びているのは「${genreLabel(direction(c))}」の配信だ。`,when:c=>c.month>=6&&direction(c)!==c.aim,weight:()=>2,once:true,
  choices:c=>[{label:`「${genreShort(direction(c))}」の流れに乗る`},{label:`「${genreShort(c.aim)}」を貫く`}],
  apply:(c,i)=>{if(i===0){lean(c,direction(c),15);add(c,{joy:-2});gain(c,.04);mark(c,`${genreShort(direction(c))}に軸足を移す`);return '求められる場所で、もう一度頑張ってみる。';}lean(c,c.aim,15);add(c,{joy:6});return '最初に決めた道を、もう少し。';},auto:c=>c.stats.joy<45?0:1},
 {id:'sick',title:'体調を崩した',text:()=>'朝、起き上がれなかった。',when:c=>c.stats.health<30,weight:()=>4,
  choices:()=>[{label:'まとまったお休みをとる',hint:'体と心'},{label:'短い配信だけ続ける'}],
  apply:(c,i,r)=>{if(i===0){add(c,{health:22,joy:2});c.rested+=2;c.subs=Math.round(c.subs*.98);return 'しっかり休んだ。待っていてくれる人がいた。';}add(c,{health:-4});if(next(r)<.25){add(c,{health:-12});return '無理を重ねて、また倒れてしまった。';}return '短い配信で、つながりだけは切らさなかった。';},auto:()=>0},
 {id:'original',title:'オリジナル曲',text:()=>'作曲家さんから「一緒に曲を作りませんか」。',when:c=>isDir(c,'song')&&c.subs>=10000,weight:()=>1.5,once:true,
  choices:()=>[{label:'作る',hint:'歌・貯金'},{label:'もう少し先に'}],
  apply:(c,i,r)=>{if(i===0){c.savings-=200000;lean(c,'song',12);add(c,{joy:10});const n=gain(c,.1*luck(r,.8),300);mark(c,'オリジナル曲を発表');return `オリジナル曲を発表。${n.toLocaleString()}人が聴きに来た。`;}return 'いつか、きっと。';},auto:c=>c.savings>250000?0:1},
 {id:'topic',title:'話すことがない',text:()=>'今日の雑談、何を話そう。',when:c=>c.stats.skill<35&&c.month>=2,weight:()=>1,
  choices:()=>[{label:'マシュマロを読む',hint:'つながり'},{label:'思い切って休む'}],
  apply:(c,i)=>{if(i===0){add(c,{bond:5,skill:2});lean(c,'talk',4);return 'お便りに助けられて、気づけば2時間話していた。';}add(c,{health:4});c.rested+=1;return '話題を探しに、散歩に出た。';},auto:()=>0},
 {id:'move',title:'防音の部屋',text:()=>'隣から壁を叩かれた。',when:c=>isDir(c,'song','asmr','variety')&&c.month>=5,weight:()=>.8,once:true,
  choices:()=>[{label:'防音の部屋へ引っ越す',hint:'貯金を使う'},{label:'声を抑えて工夫する'}],
  apply:(c,i)=>{if(i===0){c.savings-=250000;add(c,{joy:6,skill:3});return '新しい部屋。思いきり声が出せる。';}add(c,{joy:-4});return '小声の配信が、なぜか好評だった。';},auto:c=>c.savings>350000?0:1},
 {id:'rebirth',title:'転生のすすめ',text:()=>'知り合いから「新しい姿で、ゼロからやり直さない？」と誘われた。',when:c=>c.month>=18&&c.subs<800&&c.stagnant>=6,weight:()=>1.2,once:true,
  choices:()=>[{label:'新しい姿で再出発する',hint:'この物語はここで終わる'},{label:'今の姿で続ける'}],
  apply:(c,i)=>{if(i===0){finish(c,'reincarnate');return '今の名前に別れを告げて、新しい姿へ。';}add(c,{joy:5});c.stagnant=0;return 'この名前で、もう少しだけ。';},auto:c=>c.stats.joy<30?0:1},
];
/** Pauses for a one-line note, offset from the debut (month 1) and anniversaries (every 12). */
export const QUESTIONS:Record<number,string>={2:'初配信を終えて、いまの気持ちは？',13:'1周年を迎えた。この1年で一番うれしかったことは？',37:'3周年。まだ続けている理由は？',61:'5周年。デビューした日の自分に、なんて言う？'};
export function monthLabel(m:number):string{if(m<=0)return 'デビュー前';const y=Math.floor((m-1)/12),mm=(m-1)%12+1;return y?`${y}年${mm}ヶ月目`:`${mm}ヶ月目`;}
function log(c:Career,text:string,tone:Tone='neutral'):void{c.log.unshift({month:c.month,text,tone});if(c.log.length>160)c.log.length=160;const rank:Record<Tone,number>={neutral:0,good:1,bad:1,big:2};if(c.month>0&&(c.tones[c.month-1]===undefined||rank[tone]>=rank[c.tones[c.month-1]]))c.tones[c.month-1]=tone;}
function finish(c:Career,reason:EndReason):void{if(c.ended)return;c.ended={reason,month:c.month};c.pending={kind:'end',id:'end',title:END_LABEL[reason],text:endingText(c,reason),choices:[{label:'最後のひと声を残す'}]};log(c,`${END_LABEL[reason]}。`,'big');}
function endingText(c:Career,reason:EndReason):string{const y=monthLabel(c.month);return ({graduate:`${y}、${c.name}は卒業を発表した。最後の配信には、${Math.max(1,c.ccv).toLocaleString()}人が集まった。`,health:`${y}、体調を理由に${c.name}は活動を終えた。「また元気な声を」というコメントが、いつまでも流れていた。`,fade:`${y}、${c.name}の配信枠は、静かに止まった。最後のアーカイブは、今も残っている。`,reincarnate:`${y}、${c.name}は別の姿へと旅立った。この名前の物語は、ここまで。`,contract:`${y}、事務所との契約が終わり、${c.name}としての活動は幕を閉じた。`,life:`${y}、仕事や暮らしが変わり、${c.name}は配信から離れることを決めた。「楽しかった」と最後に書き残して。`,cap:`活動12年。${c.name}の配信は、今日も続いている。物語はここでひと区切り。`} as Record<EndReason,string>)[reason];}
// ---------- monthly simulation ----------
const FOCUS_MULT:Record<Focus,number>={stream:1.35,plan:.85,practice:.8,collab:1.2,sns:1.15,rest:.35};
const GENRE_MULT:Record<Genre,number>={song:1.05,game:1.1,talk:1,asmr:.9,art:.85,variety:1.12,study:.88};
export const RATE_BASE=.004,RATE_SKILL=.022,RATE_BOND=.009,RATE_CEILING=5.5,CHURN=.026;
const AGENCY_INFLOW:Record<Agency,number>={indie:4,small:22,mid:90,major:420};
function growth(c:Career,r:Rng):number{
 const s=c.stats,dir=direction(c),fit=c.talent[dir]*(dir===c.aim?1.05:1);
 const saturation=Math.max(.03,1-Math.log10(c.subs+10)/RATE_CEILING);
 const rate=(RATE_BASE+s.skill/100*RATE_SKILL+s.bond/100*RATE_BOND)*FOCUS_MULT[c.focus]*GENRE_MULT[dir]*fit*(c.job==='fulltime'?1.15:c.job==='student'?.95:.88)*(.55+s.joy/100*.7)*saturation;
 const inflow=AGENCY_INFLOW[c.agency]*(.4+s.skill/100)*fit*(c.focus==='rest'?.3:1);
 return (c.subs+20)*rate*luck(r,.6)+inflow*luck(r,.7)-c.subs*CHURN;
}
function stepPeers(c:Career,r:Rng):void{for(const p of c.peers){if(p.ended!==null)continue;p.subs=Math.max(0,Math.round(p.subs+(p.subs+20)*.05*luck(r,.7)*Math.max(.2,1-Math.log10(p.subs+10)/7.5)+3*luck(r)));if(c.month>=3&&next(r)<.016+(p.subs<500?.01:0))p.ended=c.month;}}
function applyFocus(c:Career):void{
 const f=c.focus;
 const d:Record<Focus,Partial<Record<StatKey,number>>>={stream:{health:-3.2,skill:.7,joy:.4},plan:{skill:.5,joy:.8,health:-.6},practice:{skill:1.5,joy:-.4,health:-1},collab:{bond:2.4,health:-1.6,joy:.8},sns:{bond:.6,joy:-1.2,health:-1},rest:{health:6,joy:2.4,skill:-.3}};
 add(c,d[f]);if(f==='plan')c.planBank=Math.min(60,c.planBank+6);if(c.job!=='fulltime'&&f!=='rest')add(c,{health:-1.2});
 if(c.rested>0){c.rested--;add(c,{health:4});}
 // Feelings drift back toward ordinary; months without growth wear them down.
 add(c,{joy:(50-c.stats.joy)*.08-(c.stagnant>=3?1.8:0)});
 lean(c,c.aim,f==='practice'?.8:.3);for(const g of GENRES)c.affinity[g.id]*=.985;
}
/** Audience reception: each month one kind of stream lands, the aim is likelier but never certain. */
function reception(c:Career,r:Rng):void{const g=weighted(r,GENRES.map(x=>[x.id,(c.affinity[x.id]+6)*c.talent[x.id]**2] as [Genre,number]));lean(c,g,3*c.talent[g]*luck(r,.5));}
function money(c:Career,r:Rng):void{
 if(!c.monetized&&c.subs>=1000&&c.month>=2){c.monetized=true;log(c,'収益化が通った。初めてのスーパーチャットに手がふるえた。','big');mark(c,'収益化');}
 const cut={indie:1,small:.6,mid:.55,major:.5}[c.agency];
 c.income=c.monetized?Math.round(c.subs*(c.focus==='rest'?.6:2.1)*luck(r,.35)*cut):0;
 const living=c.job==='fulltime'?140000:0,costs=4000+c.budget*3000;
 c.savings=Math.round(c.savings+c.income-living-costs+(c.job==='fulltime'?0:20000));
}
function triggerEvent(c:Career,r:Rng):boolean{
 const forced=EVENTS.filter(e=>!(e.once&&c.used.includes(e.id))&&e.when(c)&&e.weight(c)>=1e4).sort((a,b)=>b.weight(c)-a.weight(c));
 const pool=forced.length?forced.slice(0,1):next(r)<.34?EVENTS.filter(e=>!(e.once&&c.used.includes(e.id))&&e.when(c)):[];
 if(!pool.length)return false;const e=forced.length?forced[0]:weighted(r,pool.map(e=>[e,e.weight(c)] as [EventDef,number]));
 c.pending={kind:'event',id:e.id,title:e.title,text:e.text(c),choices:e.choices(c)};return true;
}
function crossMilestones(c:Career,before:number):void{for(const [n,text] of [[100,'登録者100人。'],[1000,'登録者1,000人！'],[10000,'登録者1万人！ 銀の盾が見えてきた。'],[100000,'登録者10万人！ 銀の盾が届いた。'],[1000000,'登録者100万人！ 金の盾。世界の上位、ほんのひと握り。']] as const)if(before<n&&c.subs>=n){log(c,text,'big');mark(c,text.replace(/[！。].*$/,''));}}
function hazard(c:Career,r:Rng):EndReason|null{
 if(c.practice)return null;const s=c.stats;
 let p=.016+(s.health<20?.035:0)+(s.joy<20?.04:s.joy<35?.015:0)+(c.stagnant>=6&&c.subs<1000?.025:0)+(c.month>=6&&c.subs<100?.02:0)+(c.savings<-200000?.03:0)-(s.joy>70?.003:0)-(c.subs>=10000?.006:0)-(c.agency!=='indie'?.002:0);
 p=Math.max(.002,p);
 // Life outside streaming ends many careers no matter how the channel is doing.
 const life=.003+(c.subs<1000?.004:0)+(c.job==='fulltime'&&c.savings<0?.015:0);if(next(r)<life)return 'life';
 if(next(r)>=p)return null;
 if(s.health<20)return 'health';if(c.agency!=='indie'&&next(r)<.25)return 'contract';if(c.subs<1000&&next(r)<.5)return 'fade';return 'graduate';
}
/** Advance one month. Returns false while a decision is pending or the career has ended. */
export function stepMonth(c:Career):boolean{
 if(c.pending||c.ended)return false;const r={seed:c.seed};
 c.month++;applyFocus(c);reception(c,r);const before=c.subs;
 const delta=growth(c,r);c.subs=Math.max(0,Math.round(c.subs+delta-(c.focus==='rest'||c.stats.joy<30?c.subs*.01:0)));
 if(next(r)<.012*(c.focus==='sns'?2.2:1)*(isDir(c,'variety','game','talk')?1.3:1)&&c.month>1){const n=Math.round(Math.max(300,c.subs*(.3+next(r)*2.2)));c.subs+=n;c.viral++;log(c,`切り抜きがバズった！ ${n.toLocaleString()}人増えた。`,'big');mark(c,'切り抜きがバズる');}
 c.stagnant=c.subs-before<Math.max(5,before*.01)?c.stagnant+1:0;c.peakSubs=Math.max(c.peakSubs,c.subs);
 c.ccv=Math.round(c.subs*(.012+c.stats.bond/100*.03)*luck(r,.3)+(c.subs>0?1:0));c.peakCcv=Math.max(c.peakCcv,c.ccv);
 money(c,r);stepPeers(c,r);crossMilestones(c,before);
 const grew=c.subs-before;if(grew!==0&&!c.log.some(l=>l.month===c.month&&l.tone==='big'))log(c,`${FOCUSES.find(f=>f.id===c.focus)!.label}の月。登録者 ${grew>0?'+':''}${grew.toLocaleString()}人。`,grew>Math.max(30,before*.08)?'good':grew<0?'bad':'neutral');
 c.seed=r.seed;
 if(c.practice&&c.month>=6){finishPractice(c);return false;}
 if(c.month>=MAX_MONTHS){finish(c,'cap');return false;}
 const end=hazard(c,r);c.seed=r.seed;
 if(end){if(end==='graduate'||end==='fade'){c.pending={kind:'event',id:'retire',title:'このまま続ける？',text:end==='fade'?'配信を開く手が、重くなってきた。':'ふと、最後の配信のことを考えた。',choices:[{label:'まだ続ける',hint:'楽しさが少し戻る'},{label:'しばらく休止する'},{label:end==='fade'?'静かに配信をやめる':'卒業を決める',hint:'物語が終わる'}]};c.retireKind=end;}else finish(c,end);return false;}
 if(QUESTIONS[c.month]&&!c.practice){c.pending={kind:'question',id:`q${c.month}`,title:monthLabel(c.month),text:QUESTIONS[c.month],choices:[{label:'次へ'}]};return false;}
 if(triggerEvent(c,r)){c.seed=r.seed;return false;}
 c.seed=r.seed;return true;
}
function finishPractice(c:Career):void{c.ended={reason:'cap',month:c.month};c.pending={kind:'end',id:'practice-end',title:'練習はここまで',text:'速度と「今月の重点」、決断の流れはつかめましたか？ 本番では、所属・本業・同期がランダムに決まります。',choices:[{label:'本番でデビューする'}]};}
/** Resolve the pending decision. `note` is used by questions and the farewell. */
export function choose(c:Career,index:number,note=''):string{
 const p=c.pending;if(!p)return '';
 if(p.kind==='question'){const text=cleanNote(note);if(text)c.notes.push({month:c.month,text});c.pending=null;log(c,text?`「${text}」`:'言葉にしないまま、次の月へ。','neutral');return text;}
 if(p.kind==='end'){c.farewell=cleanNote(note)||null;c.pending=null;return c.farewell??'';}
 if(p.id==='retire'){const kind=c.retireKind??'graduate';c.retireKind=null;c.pending=null;
  if(index===0){add(c,{joy:10,health:4});c.stagnant=0;log(c,'もう少しだけ、続けてみる。','good');return '';}
  if(index===1){c.rested+=3;add(c,{health:15,joy:12});c.subs=Math.round(c.subs*.95);log(c,'しばらく活動を休止した。','bad');mark(c,'活動休止');return '';}
  finish(c,kind);return '';}
 const e=EVENTS.find(x=>x.id===p.id);c.pending=null;if(!e)return '';if(e.once)c.used.push(e.id);
 const r={seed:c.seed};const before=c.subs;const text=e.apply(c,Math.max(0,Math.min(index,p.choices.length-1)),r);c.seed=r.seed;c.peakSubs=Math.max(c.peakSubs,c.subs);crossMilestones(c,before);
 if(text&&!c.ended)log(c,`【${e.title}】${text}`,c.subs-before>Math.max(50,before*.05)?'good':/荒れ|倒れ|残っ|頭に|声が出なく|ノイズ/.test(text)?'bad':'neutral');
 return text;
}
/** What the おまかせ toggle picks for the pending decision. */
export function autoChoice(c:Career):number{const p=c.pending;if(!p)return 0;if(p.id==='retire')return c.stats.joy>55?0:c.stats.health<35?1:2;const e=EVENTS.find(x=>x.id===p.id);return e?Math.min(e.auto(c),p.choices.length-1):0;}
/** おまかせ also keeps the streamer alive: rest when worn out, back to streaming when recovered. */
export function autoFocus(c:Career):void{if(c.ended)return;if(c.stats.health<32||c.stats.joy<28)c.focus='rest';else if(c.focus==='rest'&&c.stats.health>72&&c.stats.joy>55)c.focus=c.stats.bond<35?'collab':'stream';}
export function setFocus(c:Career,f:Focus):void{if(!c.ended)c.focus=f;}
export interface Summary {name:string;aim:Genre;direction:Genre;agency:Agency;job:Job;months:number;reason:EndReason;peakSubs:number;finalSubs:number;rank:number;peakCcv:number;monetized:boolean;viral:number;highlights:string[];notes:{month:number;text:string}[];farewell:string|null;peers:Peer[];endedAt:string;}
export function summarize(c:Career,now=new Date()):Summary{return {name:c.name,aim:c.aim,direction:direction(c),agency:c.agency,job:c.job,months:c.month,reason:c.ended?.reason??'cap',peakSubs:c.peakSubs,finalSubs:c.subs,rank:rankOf(c.peakSubs),peakCcv:c.peakCcv,monetized:c.monetized,viral:c.viral,highlights:[...c.highlights],notes:[...c.notes],farewell:c.farewell,peers:c.peers.map(p=>({...p})),endedAt:now.toISOString()};}
