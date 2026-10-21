import './style.css';
import {StorageService} from '../../core/StorageService';
import {AudioService} from '../../core/AudioService';
import {TelemetryService} from '../../core/TelemetryService';
import {createCareer,stepMonth,choose,autoChoice,autoFocus,setFocus,direction,rankOf,summarize,monthLabel,genreLabel,genreShort,cleanName,GENRES,FOCUSES,STATS,AGENCY_LABEL,JOB_LABEL,END_LABEL,POPULATION,MAX_MONTHS,NOTE_MAX,type Career,type Genre,type Summary} from './model';
import {CareerStore,HISTORY_MAX} from './save';
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const app=el('app'),menu=el<HTMLDialogElement>('menu');
const storage=new StorageService(undefined,'web-mini-arcade:v1:game038:'),audio=new AudioService(storage),store=new CareerStore();let saved=store.read();
let training=false;
const telemetry=new TelemetryService(storage,'game038',undefined,{remoteCollectionEnabled:false,ignoreEvent:()=>training});
let career:Career|null=saved.snapshot,phase:'title'|'setup'|'play'|'paused'|'decide'|'card'='title',paused=false;
let speed:1|2|4|0=1,previous:number|null=null,acc=0,autoTimer=0,aim:Genre=saved.lastAim;
const MONTH_MS={1:1400,2:700,4:350,0:70} as const;
const EMOJI:Record<Genre,string>={song:'🎤',game:'🎮',talk:'💬',asmr:'🎧',art:'🎨',variety:'🎉',study:'📚'};
const REGION={ja:'日本語圏',en:'英語圏',other:'その他の言語圏'} as const;
const BUDGET=['機材予算 少なめ','機材予算 ふつう','機材予算 たっぷり'];
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const fmt=(n:number)=>n.toLocaleString('ja-JP');
const topShare=(rank:number)=>{const p=rank/POPULATION*100;return p<1?p.toFixed(2):p<10?p.toFixed(1):Math.round(p).toString();};
const hue=(s:string)=>[...s].reduce((h,ch)=>(h*31+ch.codePointAt(0)!)%360,17);
const button=(id:string,text:string,primary=false,hint='')=>`<button id="${id}" type="button" class="${primary?'primary':''}">${esc(text)}${hint?`<small>${esc(hint)}</small>`:''}</button>`;
// A tap meant for the play screen must not land on a dialog button that just appeared in its place.
let shownAt=0;const GUARD_MS=450;for(const type of ['click','pointerdown','keydown'])menu.addEventListener(type,e=>{if(performance.now()-shownAt<GUARD_MS){e.preventDefault();e.stopImmediatePropagation();}},true);
function setPhase(next:typeof phase):void{phase=next;app.dataset.state=next;for(const [id,owner] of [['setup','setup'],['stage','play'],['card','card']] as const)el(id).hidden=!(owner===next||(owner==='play'&&(next==='paused'||next==='decide')));render();}
function show(title:string,body:string,buttons:string,next:typeof phase,focus?:string):void{clearTimeout(autoTimer);setPhase(next);shownAt=performance.now();menu.innerHTML=`<p class="eyebrow">ONE IN 60,000</p><h2 id="menu-title">${title}</h2>${body}<div class="menu-actions">${buttons}</div>${next==='decide'?'':'<p><a id="menu-portal" class="arcade-portal-return" href="./index.html">← ゲーム一覧へ</a></p>'}`;if(!menu.open)menu.show();menu.scrollTop=0;el('menu-title').tabIndex=-1;if(focus)el(focus).focus();else el('menu-title').focus({preventScroll:true});const portal=document.getElementById('menu-portal');if(portal)portal.onclick=quit;}
function closeMenu():void{if(menu.open)menu.close();}
function persist():void{if(training||!career||saved.reported)return;saved.snapshot=structuredClone(career);store.write(saved);}
function abandon():void{if(!training&&career&&!saved.reported){saved.reported=true;telemetry.trackEvent('quit',{source:phase,months:career.month,peak_subs:career.peakSubs});telemetry.trackEvent('run_end',{outcome:'quit',completed:false,months:career.month,peak_subs:career.peakSubs});}saved.snapshot=null;store.write(saved);}
// ---------- title / setup ----------
function title():void{abandon();training=false;career=null;show('6万分の1','<p class="lead">世界にいるVTuberは、約6万人。<br>そのうちの、ひとりになる。</p><p>名前と目指すジャンルを決めてデビュー。所属・本業・同期は選べません。<br>月日は自動で進み、ときどき決断がやってきます。</p>'+(saved.bestRank?`<p class="best-line">これまでの最高：6万人中 ${fmt(saved.bestRank)}位</p>`:''),button('play','デビューする',true)+button('practice','練習する',false,'半年だけのお試し')+button('explain','遊び方')+(saved.history.length?button('history','これまでの活動'):''),'title','play');el('play').onclick=setup;el('practice').onclick=practice;el('explain').onclick=()=>help(false);const h=document.getElementById('history');if(h)h.onclick=history;}
function setup():void{training=false;closeMenu();setPhase('setup');const name=el<HTMLInputElement>('name');name.value=saved.lastName;renderGenres();name.focus();}
function renderGenres():void{el('genres').innerHTML=GENRES.map(g=>`<label class="genre"><input type="radio" name="genre" value="${g.id}"${g.id===aim?' checked':''}><span><b>${EMOJI[g.id]}</b>${esc(g.label)}</span></label>`).join('');for(const input of el('genres').querySelectorAll<HTMLInputElement>('input'))input.onchange=()=>{aim=input.value as Genre;};}
function debut():void{
 const name=cleanName(el<HTMLInputElement>('name').value);abandon();training=false;career=createCareer(name,aim);saved.lastName=name==='名もなき新人'?'':name;saved.lastAim=aim;
 telemetry.trackEvent('run_start',{mode:'career',aim,agency:career.agency});saved.runId=telemetry.getActiveRunId();saved.reported=false;saved.snapshot=structuredClone(career);store.write(saved);void audio.unlock();audio.tone(523,784,.25,'triangle',0,.04);
 debutCard();
}
function practice():void{abandon();training=true;career=createCareer('練習さん','talk',12345,true);debutCard();}
function debutCard():void{const c=career!;const peers=c.peers.map(p=>`<li>${esc(p.name)}（${esc(genreShort(p.genre))}）</li>`).join('');
 show(`${esc(c.name)}、デビュー決定`,`<div class="debut-card" style="--hue:${hue(c.name)}"><div class="avatar big">${esc([...c.name][0])}</div><p class="aim">${EMOJI[c.aim]} 目指すのは「${esc(genreLabel(c.aim))}」</p><ul class="facts"><li>${AGENCY_LABEL[c.agency]}</li><li>本業：${JOB_LABEL[c.job]}</li><li>${REGION[c.region]}</li><li>${BUDGET[c.budget]}</li><li>${c.veteran?'配信経験あり':'配信は初めて'}</li><li>スタート時の登録者 ${fmt(c.subs)}人</li></ul><p class="peers-title">同じ月にデビューした3人</p><ul class="facts">${peers}</ul></div>${training?'<p class="note">練習：半年で終わり、記録には残りません。</p>':''}`,button('start','活動をはじめる',true),'paused','start');el('start').onclick=()=>{resume();};}
function help(inRun:boolean):void{show('遊び方','<ol><li>名前（自由入力）と目指すジャンルを決めてデビュー。所属（個人勢〜大手）、本業、言語圏、機材予算、同期はランダムです。</li><li>月日は自動で進みます。上の速度ボタンで 停止 / 1× / 2× / 4× / 次の決断まで。</li><li><b>今月の重点</b>をいつでも切り替えられます。配信多めは伸びるけれど疲れ、休むと体と心が戻ります。</li><li>ときどき決断がやってきます。<b>おまかせ</b>をONにすると、決断と重点をおまかせで選びます。</li><li>目指すジャンルは方向性に影響しますが、視聴者に届くのは別のジャンルかもしれません。「いまの方向性」を見てみてください。</li><li>節目には問いかけがあり、ひとことを残せます。卒業・引退・転生などで物語は終わり、最後に「活動の記録」が残ります。</li></ol><p class="note">VTuber人口約6万人を前提にした、100ガレ独自のフィクションです。登録者の分布や確率はゲーム上の仮定で、実在の統計・人物・事務所とは関係ありません。</p>',button('continue',inRun?'再開する':'デビューする',true)+(inRun?'':button('title','タイトルへ')),inRun?'paused':'title','continue');el('continue').onclick=inRun?resume:setup;if(!inRun)el('title').onclick=title;}
function history():void{const rows=saved.history.map(s=>`<li><b>${esc(s.name)}</b> ${EMOJI[s.direction]} ${monthLabel(s.months)}・${esc(END_LABEL[s.reason])}<br>最高 ${fmt(s.peakSubs)}人・6万人中 ${fmt(s.rank)}位</li>`).join('');show('これまでの活動',`<ol class="history">${rows}</ol><p class="note">直近${HISTORY_MAX}回まで、このブラウザに保存されます。</p>`,button('play','デビューする',true)+button('title','タイトルへ'),'title','play');el('play').onclick=setup;el('title').onclick=title;}
// ---------- play ----------
function pause(source:'user'|'auto'='user'):void{if(phase!=='play')return;if(!training)telemetry.trackEvent('pause',{source});persist();
 show('ひと休み','<p>時間は止まっています。<br>この月から再開できます。</p>',button('resume','再開する',true)+button('rules','遊び方')+button('title','タイトルへ'),'paused','resume');el('resume').onclick=resume;el('rules').onclick=()=>help(true);el('title').onclick=title;}
function resume():void{closeMenu();setPhase('play');if(career?.pending)openDecision();else if(!training)telemetry.trackEvent('resume');void audio.unlock();previous=null;}
function setSpeed(next:typeof speed|null):void{if(next===null){paused=!paused;}else{speed=next;paused=false;}render();}
function openDecision():void{
 const c=career!,p=c.pending!;audio.tone(660,880,.12,'sine',0,.03);
 if(p.kind==='question'){show(esc(p.title),`<p class="question">${esc(p.text)}</p><label class="note-input"><span>ひとこと（${NOTE_MAX}文字まで・空欄でも進めます）</span><input id="note" maxlength="${NOTE_MAX}" autocomplete="off"></label>`,button('answer','次へ',true),'decide','note');el('answer').onclick=()=>resolve(0,el<HTMLInputElement>('note').value);el('note').onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();resolve(0,el<HTMLInputElement>('note').value);}};return;}
 if(p.kind==='end'){if(p.id==='practice-end'){show(esc(p.title),`<p>${esc(p.text)}</p>`,button('real','本番でデビューする',true)+button('title','タイトルへ'),'decide','real');el('real').onclick=()=>{training=false;career=null;setup();};el('title').onclick=title;return;}
  show(esc(p.title),`<p>${esc(p.text)}</p><label class="note-input"><span>最後に、${esc(c.name)}へひと声（${NOTE_MAX}文字まで）</span><input id="note" maxlength="${NOTE_MAX}" autocomplete="off"></label>`,button('answer','活動の記録を見る',true),'decide','note');el('answer').onclick=()=>resolve(0,el<HTMLInputElement>('note').value);el('note').onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();resolve(0,el<HTMLInputElement>('note').value);}};return;}
 const auto=el<HTMLInputElement>('auto').checked,pickIndex=autoChoice(c);
 show(esc(p.title),`<p class="event-text">${esc(p.text)}</p>${auto?'<p class="note">おまかせで選んでいます…</p>':''}`,p.choices.map((x,i)=>button(`choice-${i}`,x.label,auto&&i===pickIndex,x.hint)).join(''),'decide',auto?undefined:'choice-0');
 p.choices.forEach((_,i)=>{el(`choice-${i}`).onclick=()=>resolve(i);});
 if(auto)autoTimer=window.setTimeout(()=>{if(phase==='decide'&&career?.pending===p)resolve(pickIndex);},1300);
}
function resolve(index:number,note=''):void{
 const c=career!,kind=c.pending?.kind;clearTimeout(autoTimer);choose(c,index,note);audio.tone(523,659,.08,'triangle',0,.02);
 if(kind==='end'){finishCareer();return;}if(speed===0)speed=1;
 if(c.pending){persist();openDecision();return;}persist();closeMenu();setPhase('play');previous=null;
}
function finishCareer():void{
 const c=career!,s=summarize(c);
 if(!training){const improved=saved.bestRank===null||s.rank<saved.bestRank;saved.runs++;saved.reported=true;saved.bestRank=Math.min(saved.bestRank??POPULATION,s.rank);saved.history=[s,...saved.history].slice(0,HISTORY_MAX);saved.snapshot=null;store.write(saved);
  telemetry.trackEvent('score',{score:s.peakSubs,rank:s.rank,months:s.months});telemetry.trackEvent('run_end',{outcome:s.reason,completed:true,months:s.months,peak_subs:s.peakSubs,rank:s.rank,aim:s.aim,direction:s.direction,drifted:s.aim!==s.direction});if(improved)telemetry.trackEvent('best_update',{rank:s.rank});}
 closeMenu();renderCard(s);setPhase('card');el('again').focus();audio.tone(392,523,.5,'triangle',0,.04);audio.tone(523,659,.5,'sine',.18,.03);
}
function cardText(s:Summary):string{return [`【6万分の1】${s.name}`,`目指した：${genreLabel(s.aim)} → いまの方向性：${genreLabel(s.direction)}`,`${monthLabel(s.months)}・${END_LABEL[s.reason]}`,`最高登録者 ${fmt(s.peakSubs)}人／6万人中 ${fmt(s.rank)}位（上位${topShare(s.rank)}%）`,...(s.farewell?[`最後のひと声：「${s.farewell}」`]:[]),'#6万分の1 #100ガレ'].join('\n');}
function renderCard(s:Summary):void{
 const drift=s.aim!==s.direction;
 el('card-body').innerHTML=`<div class="record-card" style="--hue:${hue(s.name)}"><p class="eyebrow">活動の記録</p><div class="card-head"><div class="avatar big">${esc([...s.name][0])}</div><div><h2>${esc(s.name)}</h2><p>${AGENCY_LABEL[s.agency]}・本業 ${JOB_LABEL[s.job]}</p></div></div>
 <p class="journey">${EMOJI[s.aim]} 目指した「${esc(genreLabel(s.aim))}」 → ${EMOJI[s.direction]} ${drift?'たどり着いた':'貫いた'}「${esc(genreLabel(s.direction))}」</p>
 <dl class="numbers"><div><dt>活動期間</dt><dd>${monthLabel(s.months)}</dd></div><div><dt>終わり方</dt><dd>${esc(END_LABEL[s.reason])}</dd></div><div><dt>最高登録者</dt><dd>${fmt(s.peakSubs)}人</dd></div><div><dt>6万人中</dt><dd>${fmt(s.rank)}位<small>上位${topShare(s.rank)}%</small></dd></div><div><dt>最高同接</dt><dd>${fmt(s.peakCcv)}人</dd></div><div><dt>収益化</dt><dd>${s.monetized?'達成':'まだ'}</dd></div></dl>
 ${s.highlights.length?`<h3>主な出来事</h3><ul class="highlights">${s.highlights.map(h=>`<li>${esc(h)}</li>`).join('')}</ul>`:''}
 ${s.notes.length?`<h3>残したことば</h3><ul class="notes">${s.notes.map(n=>`<li><span>${monthLabel(n.month)}</span>「${esc(n.text)}」</li>`).join('')}</ul>`:''}
 ${s.farewell?`<p class="farewell">最後のひと声「${esc(s.farewell)}」</p>`:''}
 <h3>同期の3人</h3><ul class="peer-list">${s.peers.map(p=>`<li>${esc(p.name)}（${esc(genreShort(p.genre))}）最高 ${fmt(p.subs)}人・${p.ended!==null?`${monthLabel(p.ended)}に卒業`:'活動中'}</li>`).join('')}</ul></div>`;
 el('card-actions').innerHTML=button('again','もう一度デビューする',true)+button('copy','テキストをコピー')+button('card-title','タイトルへ');
 el('again').onclick=setup;el('card-title').onclick=title;el('copy').onclick=async()=>{try{await navigator.clipboard.writeText(cardText(s));el('copy').textContent='コピーしました';}catch{el('copy').textContent='コピーできませんでした';}};
}
function render():void{
 const c=career;const playing=phase==='play'||phase==='paused'||phase==='decide';
 el<HTMLButtonElement>('pause').disabled=phase!=='play';
 if(!c||!playing)return;
 const dir=direction(c),rank=rankOf(c.subs);
 el('when').textContent=monthLabel(c.month)+(training?'（練習）':'');
 for(const [id,v] of [['speed-pause',null],['speed-1',1],['speed-2',2],['speed-4',4],['speed-next',0]] as const){const b=el(id);b.setAttribute('aria-pressed',String(v===null?paused:!paused&&speed===v));}
 el('avatar').textContent=[...c.name][0];el('profile').style.setProperty('--hue',String(hue(c.name)));el('vt-name').textContent=c.name;
 el('vt-tags').textContent=`${AGENCY_LABEL[c.agency]}・${JOB_LABEL[c.job]}・${REGION[c.region]}`;
 el('subs').textContent=fmt(c.subs);el('rank').textContent=`6万人中 ${fmt(rank)}位（上位${topShare(rank)}%）`;el('ccv').textContent=`同接 ${fmt(c.ccv)}`;el('income').textContent=c.monetized?`月収 ${fmt(c.income)}円`:'収益化まだ';el('savings').textContent=`貯金 ${fmt(c.savings)}円`;
 el('aim').textContent=`${EMOJI[c.aim]} ${genreShort(c.aim)}`;el('dir').textContent=`${EMOJI[dir]} ${genreShort(dir)}`;el('dir').classList.toggle('drift',dir!==c.aim);
 const total=GENRES.reduce((n,g)=>n+c.affinity[g.id],0)||1;el('affinity').innerHTML=GENRES.map(g=>`<i style="width:${(c.affinity[g.id]/total*100).toFixed(1)}%" class="g-${g.id}" title="${esc(g.label)}"></i>`).join('');
 for(const s of STATS){const v=Math.round(c.stats[s.id]);el(`stat-${s.id}`).style.width=`${v}%`;el(`stat-${s.id}`).parentElement!.setAttribute('aria-valuenow',String(v));el(`stat-${s.id}-v`).textContent=String(v);el(`stat-${s.id}`).classList.toggle('low',v<30);}
 for(const f of FOCUSES)el(`focus-${f.id}`).setAttribute('aria-pressed',String(c.focus===f.id));
 const map=el('map');if(map.childElementCount!==MAX_MONTHS)map.innerHTML=Array.from({length:MAX_MONTHS},()=>'<i></i>').join('');
 [...map.children].forEach((cell,i)=>{const tone=i<c.month?(c.tones[i]??'neutral'):'';(cell as HTMLElement).className=tone?`t-${tone}`:'';});
 el('peers').innerHTML=c.peers.map(p=>`<li><span>${esc(p.name)}</span><span>${EMOJI[p.genre]} ${p.ended!==null?'卒業':fmt(p.subs)+'人'}</span></li>`).join('');
 const log=el('log');const key=`${c.month}:${c.log.length}:${c.log[0]?.text??''}`;if(log.dataset.key!==key){log.dataset.key=key;log.innerHTML=c.log.slice(0,40).map(l=>`<li class="t-${l.tone}"><span>${monthLabel(l.month)}</span>${esc(l.text)}</li>`).join('');}
}
// ---------- controls ----------
el('debut').onclick=debut;el('name').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();debut();}});el('back').onclick=title;
el('speed-pause').onclick=()=>setSpeed(null);el('speed-1').onclick=()=>setSpeed(1);el('speed-2').onclick=()=>setSpeed(2);el('speed-4').onclick=()=>setSpeed(4);el('speed-next').onclick=()=>setSpeed(0);
el('focus').innerHTML=FOCUSES.map(f=>`<button id="focus-${f.id}" type="button" aria-pressed="false">${esc(f.label)}<small>${esc(f.hint)}</small></button>`).join('');
for(const f of FOCUSES)el(`focus-${f.id}`).onclick=()=>{if(career){setFocus(career,f.id);render();persist();}};
el('stats').innerHTML=STATS.map(s=>`<div class="stat"><span>${esc(s.label)}</span><div class="bar" role="meter" aria-label="${esc(s.label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="stat-${s.id}"></i></div><b id="stat-${s.id}-v">0</b></div>`).join('');
el<HTMLInputElement>('auto').onchange=()=>{render();};
el('pause').onclick=()=>pause('user');el('mute').onclick=()=>{el('mute').textContent=audio.toggle()?'音 OFF':'音 ON';};el('mute').textContent=audio.muted?'音 OFF':'音 ON';
document.addEventListener('keydown',e=>{if(phase!=='play'||(e.target as HTMLElement).closest('input,textarea,select,dialog'))return;if(e.key==='Escape'){pause('user');return;}if(e.key===' '&&!(e.target as HTMLElement).closest('button')){e.preventDefault();setSpeed(null);}});
function quit():void{abandon();telemetry.trackEvent('return_to_portal',{source:phase});}el('portal-link').onclick=quit;menu.addEventListener('cancel',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('auto');});window.addEventListener('blur',()=>pause('auto'));window.addEventListener('pagehide',event=>{persist();if(!event.persisted)audio.destroy();});
function frame(now:number):void{const dt=previous===null?0:now-previous;previous=now;
 if(phase==='play'&&career&&!paused&&!career.pending&&!career.ended){if(dt>1000){pause('auto');}else{acc+=dt;const interval=MONTH_MS[speed];
  if(acc>=interval){acc=0;if(el<HTMLInputElement>('auto').checked)autoFocus(career);const before=career.subs;stepMonth(career);if(career.subs>=10000&&before<10000||career.subs>=100000&&before<100000)audio.tone(784,1175,.4,'triangle',0,.04);persist();if(career.pending){if(speed===0)speed=1;openDecision();}render();}}}
 requestAnimationFrame(frame);}
telemetry.trackEvent('game_open');
if(career){if(saved.runId&&!saved.reported)telemetry.restoreRun(saved.runId);setPhase('play');pause('user');}else title();requestAnimationFrame(frame);
if(import.meta.env.DEV)Object.defineProperty(window,'__game038',{get:()=>({phase,training,paused,speed,career:structuredClone(career),saved:structuredClone(saved)})});
