/** 50% visibility continuously for 1s, once per consenting portal visit. */
export function observeCardImpressions(cards: Iterable<HTMLElement>, seen: (id:string)=>boolean, mark: (id:string)=>void, record: (id:string,position:number)=>void, consent: ()=>boolean):()=>void {
  const visible = new Set<HTMLElement>(), timers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
  const start = (card:HTMLElement)=> {
    const id=card.dataset.gameId!;
    if (seen(id) || timers.has(card) || !consent() || document.visibilityState==='hidden') return;
    timers.set(card,setTimeout(()=>{ timers.delete(card); if (!visible.has(card)||!consent()||document.visibilityState==='hidden'||seen(id)) return; mark(id); record(id,Number(card.dataset.cardPosition)); },1000));
  };
  const observer = new IntersectionObserver(entries=>{ for (const entry of entries) { const card=entry.target as HTMLElement;
    if(entry.isIntersecting&&entry.intersectionRatio>=.5) { visible.add(card); start(card); }
    else {visible.delete(card); const timer=timers.get(card); if(timer!==undefined)clearTimeout(timer);timers.delete(card);} } },{threshold:[0,.5,1]});
  for (const card of cards) observer.observe(card);
  const visibility=()=>{for(const timer of timers.values())clearTimeout(timer);timers.clear();if(document.visibilityState!=='hidden')for(const card of visible)start(card);};
  document.addEventListener('visibilitychange',visibility);
  // Grant may occur after the IntersectionObserver callback; restart its full one-second window.
  const interval=setInterval(()=>{if(!consent())visibility();else for(const card of visible)start(card);},250);
  return()=>{observer.disconnect();clearInterval(interval);for(const timer of timers.values())clearTimeout(timer);document.removeEventListener('visibilitychange',visibility);};
}
