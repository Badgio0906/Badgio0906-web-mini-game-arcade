import { calculateDeskLayout, StampRun } from './StampRun';
import { ITEMS, itemName } from './items';
import type { DeskObject, StampController, StampHooks } from './contracts';
const NS='http://www.w3.org/2000/svg';
export function createStampGame(parent:HTMLElement,hooks:StampHooks):StampController {
 const root=document.createElement('div');root.className='stamp-board';root.innerHTML='<div class="request-slip"><span class="request-sample"></span><div><small>頼まれた物</small><strong></strong></div><span class="timer"></span></div><div class="desk-scroll"><svg class="desk-field" aria-label="机の上の道具"></svg></div><div class="desk-controls"><span class="desk-note" role="status"></span><button id="tidy-button" type="button">整頓する <small>−2.5秒</small></button></div>';parent.append(root);
 const field=root.querySelector<SVGSVGElement>('.desk-field')!,sample=root.querySelector<HTMLElement>('.request-sample')!,request=root.querySelector<HTMLElement>('.request-slip strong')!,timer=root.querySelector<HTMLElement>('.timer')!,note=root.querySelector<HTMLElement>('.desk-note')!,tidyButton=root.querySelector<HTMLButtonElement>('#tidy-button')!;
 const run=new StampRun(e=>hooks.onEvent(e));let paused=false,title=true,destroyed=false,ended=false,frame=0,last=performance.now(),signature='',guard=0,width=300;
 const assets=new Map<string,string>();const abort=new AbortController();
 const ready=Promise.all(ITEMS.map(async item=>{const response=await fetch(`./assets/game009/desk-v2/${item.kind}.svg`);if(!response.ok)throw new Error(`Missing item artwork ${item.kind}`);const svg=new DOMParser().parseFromString(await response.text(),'image/svg+xml');assets.set(item.kind,svg.documentElement.innerHTML);})).then(()=>draw(true));
 const available=()=>!destroyed&&!title&&!paused&&run.snapshot().alive&&run.snapshot().phase==='searching'&&performance.now()>=guard;
 const publish=()=>{draw();hooks.onUpdate(run.snapshot());};
 const pick=(id:number)=>{if(!available())return false;const accepted=run.pick(id);guard=performance.now()+120;publish();return accepted;};
 const lift=(id:number)=>{if(!available())return false;const accepted=run.lift(id);guard=performance.now()+120;publish();return accepted;};
 const tidy=()=>{if(!available())return false;const accepted=run.tidy();guard=performance.now()+120;publish();return accepted;};
 function activate(g:SVGGElement,action:()=>void):void {
  let press:{id:number;x:number;y:number;round:number}|null=null;
  g.addEventListener('pointerdown',event=>{if(!event.isPrimary||event.button!==0||event.altKey||event.ctrlKey||event.metaKey||!available())return;event.stopPropagation();g.focus({preventScroll:true});press={id:event.pointerId,x:event.clientX,y:event.clientY,round:run.snapshot().roundId};});
  g.addEventListener('pointerup',event=>{const candidate=press;press=null;if(!candidate||candidate.id!==event.pointerId||candidate.round!==run.snapshot().roundId||Math.hypot(event.clientX-candidate.x,event.clientY-candidate.y)>8)return;event.stopPropagation();action();});
  g.addEventListener('pointercancel',()=>{press=null;});g.addEventListener('lostpointercapture',()=>{press=null;});
  g.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;event.preventDefault();event.stopPropagation();if(!event.repeat&&!event.altKey&&!event.ctrlKey&&!event.metaKey)action();});
  g.addEventListener('click',event=>{if(event.detail===0&&!('pointerType' in event))action();});
 }
 function artwork(object:DeskObject):string {
  let body=assets.get(object.kind)??'';
  if(object.kind==='pen'&&object.capped)body+='<path d="M58 22L68 9L87 26L77 39Z" fill="#245670" stroke="#283a3d" stroke-width="2.8"/><path d="M70 16L79 25L73 31" fill="none" stroke="#a6cddd" stroke-width="2.4"/>';
  if(object.kind==='pen'&&!object.capped)body=body.replace('M58 25L72 39M65 16L70 10L85 25L79 30','M58 25L72 39')+'<path d="M65 16L68 8L73 20Z" fill="#d3dcd7" stroke="#283a3d" stroke-width="2.8"/>';
  return body;
 }
 function draw(force=false):void {
  const s=run.snapshot();const layout=calculateDeskLayout(s.objects,width);const key=[s.deskId,s.roundId,s.phase,s.lastPicked,s.tidy,s.liftedPapers.join(','),width,title,paused,assets.size].join('|');
  request.textContent=s.request.text;timer.textContent=s.practice?'練習':`${s.remaining.toFixed(1)}秒`;note.textContent=s.note||'名前と形で探そう。';tidyButton.disabled=!available()||s.tidy;
  if(key!==signature||force){signature=key;field.setAttribute('viewBox',`0 0 ${layout.width} ${layout.height}`);field.style.height=`${layout.height}px`;field.replaceChildren();
   sample.innerHTML=s.request.sample?`<svg viewBox="0 0 96 96" aria-hidden="true">${artwork(s.objects.find(o=>o.kind===s.request.kind)!)}</svg>`:'';
   sample.hidden=!s.request.sample;
   for(const bound of layout.bounds){const o=s.objects.find(object=>object.id===bound.id)!;const group=document.createElementNS(NS,'g');group.setAttribute('transform',`translate(${bound.left} ${bound.top}) scale(${bound.width/96})`);
    const art=document.createElementNS(NS,'g');art.dataset.object=String(o.id);art.dataset.kind=o.kind;art.setAttribute('role','button');art.setAttribute('aria-label',`${itemName(o.kind)}${o.kind==='pen'?o.capped?' キャップ付き':' キャップなし':''}`);art.setAttribute('tabindex',!title&&!paused&&s.alive?'0':'-1');art.setAttribute('transform',`rotate(${s.tidy?0:o.rotation} 48 48)`);art.classList.add('item-art');art.innerHTML=artwork(o);activate(art,()=>pick(o.id));group.append(art);
    if(s.phase==='feedback'&&s.lastPicked===o.id){const mark=document.createElementNS(NS,'text');mark.setAttribute('x','48');mark.setAttribute('y','51');mark.setAttribute('text-anchor','middle');mark.setAttribute('class','found-mark');mark.textContent='✓';group.append(mark);}
    if(o.paper!==null&&!s.tidy&&!s.liftedPapers.includes(o.paper)){
     const paper=document.createElementNS(NS,'g');paper.classList.add('cover-paper');paper.innerHTML='<path d="M0 0H96V96H0Z" fill="#f5ecd8" stroke="#b9ad8e" stroke-width="2"/><path d="M12 15H74M12 25H80M12 35H74M12 45H68" fill="none" stroke="#c3b79b" stroke-width="2"/>';
     paper.addEventListener('pointerdown',event=>{event.stopPropagation();note.textContent='折れた紙の端「めくる」を押そう。';});
     const edge=document.createElementNS(NS,'g');edge.dataset.paper=String(o.paper);edge.setAttribute('role','button');edge.setAttribute('tabindex',!title&&!paused&&s.alive?'0':'-1');edge.setAttribute('aria-label','紙の端をめくる');edge.innerHTML='<path d="M32 96L96 32V96Z" fill="#d9c797" stroke="#9f906b" stroke-width="2"/><path d="M32 96L32 32L96 32Z" fill="#fff8e3" stroke="#9f906b" stroke-width="2"/><text x="67" y="80" text-anchor="middle" font-size="13" fill="#4d574c">めくる</text>';activate(edge,()=>lift(o.paper!));paper.append(edge);group.append(paper);
     art.setAttribute('tabindex','-1');art.setAttribute('aria-hidden','true');
    }
    field.append(group);
   }
  }
  field.style.pointerEvents=available()?'auto':'none';
 }
 tidyButton.addEventListener('click',tidy,{signal:abort.signal});
 const resize=new ResizeObserver(()=>{width=root.querySelector<HTMLElement>('.desk-scroll')!.clientWidth||300;draw(true);});resize.observe(root.querySelector('.desk-scroll')!);
 function tick(now:number):void {if(destroyed)return;const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(!title&&!paused){run.step(dt);publish();if(!run.snapshot().alive&&!ended){ended=true;const result=run.result();if(result)hooks.onEnd(result);}}frame=requestAnimationFrame(tick);}
 frame=requestAnimationFrame(tick);void ready;
 return {start(practice=false){title=false;paused=false;ended=false;guard=performance.now()+200;run.start(practice);publish();},title(){title=true;paused=false;publish();},pick,lift,tidy,pause(value){paused=value;guard=performance.now()+150;publish();},snapshot:()=>run.snapshot(),inspection:()=>({...run.inspection(),layout:calculateDeskLayout(run.snapshot().objects,width)}),destroy(){destroyed=true;cancelAnimationFrame(frame);resize.disconnect();abort.abort();root.remove();}};
}
