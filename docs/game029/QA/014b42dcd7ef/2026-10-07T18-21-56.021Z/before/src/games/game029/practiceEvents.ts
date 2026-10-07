/** The optional lesson has no production diagnostics, even after remote registration is later enabled. */
export function practiceEvent(recorder:{trackEvent:(name:'practice_start'|'practice_complete',data:{mode:string})=>void},name:'practice_start'|'practice_complete',environment:string):void {
  if(environment!=='production')recorder.trackEvent(name,{mode:'practice'});
}
