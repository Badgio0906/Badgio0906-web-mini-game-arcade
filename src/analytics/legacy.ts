import { TelemetryService } from '../core/TelemetryService';
import { installGameTouchGuards } from '../core/installGameTouchGuards';
import { isTelemetryEvent } from '../data/telemetrySchema';
const ids:Record<string,string>={'yokodori-days':'game012','tachibana-task-heaven':'game013','finger-heart-challenge':'game014'};
const game = Object.entries(ids).find(([folder])=>location.pathname.includes(`/${folder}/`))?.[1];
if(game) {
  const readyAt=performance.now();
  const telemetry=new TelemetryService(undefined,game); telemetry.trackEvent('game_open',{coverage:'legacy-shell-only'});
  window.addEventListener('arcade-legacy-event',e=>{ const detail=(e as CustomEvent).detail; if(isTelemetryEvent({name:detail?.name,at:new Date().toISOString(),data:detail?.data??{}}))telemetry.trackEvent(detail.name,{...detail.data,coverage:'legacy-shell-only',...(detail.name==='page_exit'?{session_duration_ms:Math.round(performance.now()-readyAt)}:{})}); });
  document.addEventListener('visibilitychange',()=>telemetry.trackEvent(document.visibilityState==='hidden'?'pause':'resume',{coverage:'legacy-shell-only'}));
  const frame=document.querySelector<HTMLIFrameElement>('iframe');
  frame?.addEventListener('load',()=>{ try{if(frame.contentDocument)installGameTouchGuards(frame.contentDocument);}catch{/* sameorigin expected */} });
}
