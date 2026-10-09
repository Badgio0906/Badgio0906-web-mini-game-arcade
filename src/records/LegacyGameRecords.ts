import { createGameRecordSession } from './RecordSharing';
import { validateLegacyMessage, legacyIds, type LegacyId } from './legacyProtocol';
import { mirrorNativeBest } from './legacyStore';
import shareStyles from './share.css?inline';

/** Parent owns trust/lifecycle; child can report only this iframe's fixed game and current session. */
export function installLegacyRecords(gameId:string){
  if(!legacyIds.includes(gameId as LegacyId))return;
  const frame=document.querySelector<HTMLIFrameElement>('#legacy-game-frame');if(!frame)return;
  const style=document.createElement('style');style.textContent=shareStyles;document.head.append(style);
  const sharing=createGameRecordSession(gameId),host=document.createElement('section');host.id='legacy-record-result';host.hidden=true;host.setAttribute('aria-label','この結果の記録');
  document.querySelector('.legacy-navigation')?.after(host);
  let active:string|undefined,mode:string|undefined,currentSession:string|undefined,runPractice=false;
  const finalized=new Set<string>();
  const reset=()=>{active=undefined;mode=undefined;sharing.clear();host.replaceChildren();host.hidden=true;document.body.classList.remove('legacy-has-record-result');};
  const onMessage=(event:MessageEvent)=>{try{
    if(event.origin!==location.origin||event.source!==frame.contentWindow||frame.hidden)return;
    const url=new URL(frame.src);if(url.origin!==location.origin||!url.pathname.endsWith('/game.html'))return;
    const session=url.searchParams.get('records_session')??'',p=validateLegacyMessage(event.data,gameId,session);if(!p)return;
    if(session!==currentSession){reset();currentSession=session;finalized.clear();}
    if(p.kind==='scope_end'){reset();return;}
    if(p.kind==='storage_error'){host.hidden=false;host.textContent='元ゲームの記録保存を確認できません。プレイは続けられます。';document.body.classList.add('legacy-has-record-result');return;}
    if(p.kind==='legacy_best'||p.kind==='current_best'){
      if(p.practice)return;void mirrorNativeBest(p.game_id,p.kind==='legacy_best'?'legacy':'normal',p.value!);return;
    }
    if(p.kind==='start'){if(finalized.has(p.run_result_id!))return;reset();active=p.run_result_id;mode=p.mode_id;runPractice=p.practice;if(!p.practice)sharing.startRun(undefined,{requireAutomaticAtStart:true});return;}
    if(!active||active!==p.run_result_id||finalized.has(active)||mode==='ojt'&&p.mode_id!=='ojt')return;
    finalized.add(active);while(finalized.size>64)finalized.delete(finalized.values().next().value!);active=undefined;
    if(p.practice||runPractice){reset();return;}
    // A RUN can become assisted, but cannot regain normal eligibility by switching OJT off.
    const normal=p.mode_id==='normal';void mirrorNativeBest(p.game_id,normal?'normal':'ojt',p.value!).then(ok=>{if(!ok&&host.isConnected){const warning=document.createElement('p');warning.textContent='ポータル用の記録を保存できませんでした。元ゲームの結果はそのままです。';host.append(warning);}});
    host.hidden=false;document.body.classList.add('legacy-has-record-result');
    if(normal){sharing.complete(p.value!,{modeId:'normal',metadata:{outcome:'complete'}});sharing.mount(host,{compactWhenUnavailable:true});}
    else{sharing.clear();host.textContent='OJT補助ありの結果です。通常BEST・みんなのBESTとは比較しません。';}
  }catch{/* optional record layer cannot interrupt the game */}};
  window.addEventListener('message',onMessage);
  window.addEventListener('arcade-legacy-event',event=>{const name=(event as CustomEvent<{name?:string}>).detail?.name;if(name==='return_to_portal'||name==='game_launch')reset();});
  const observer=new MutationObserver(()=>{if(frame.hidden)reset();});observer.observe(frame,{attributes:true,attributeFilter:['hidden']});
  window.addEventListener('pagehide',()=>{reset();});
}
