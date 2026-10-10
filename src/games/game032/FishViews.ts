import {FISH,type FishCatch} from './FishingModel';
import {FishingCatchRecordsStore} from './CatchRecords';
import {drawAquarium} from './Aquarium';
const node=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const fishPath=(id:string)=>'./assets/game032/fish-'+(id==='lord'?'nijimasu':id)+'.webp';
const dateLabel=(iso:string)=>new Intl.DateTimeFormat('ja-JP',{dateStyle:'medium',timeStyle:'medium'}).format(new Date(iso));
interface ViewHooks { suspend:()=>()=>void; clearInput:()=>void; catches:()=>readonly FishCatch[]; ready:()=>boolean; playing:()=>boolean; }
/** Display-only modes. Records are local; no fish coordinates or dates leave this module. */
export class FishViews {
 private viewer=node<HTMLDialogElement>('fish-viewer');
 private app=node('app');
 private restore:(()=>void)|null=null;
 private kind:'records'|'aquarium'|null=null;
 private scope:'saved'|'current'='saved';
 private galleryTime=0;
 private priorFocus:HTMLElement|null=null;
 private riverFull=false;
 private nativeActive=false;
 private requestEpoch=0;
 constructor(private store:FishingCatchRecordsStore,private images:Record<string,HTMLImageElement>,private hooks:ViewHooks){
  node('records-open').onclick=()=>this.open('records');node('aquarium-open').onclick=()=>this.open('aquarium');
  node('river-fullscreen').onclick=()=>this.riverFull?this.exitRiver():this.enterRiver();node('viewer-close').onclick=()=>this.close();
  this.viewer.addEventListener('cancel',e=>{e.preventDefault();this.close();});
  document.addEventListener('fullscreenchange',()=>{const was=this.nativeActive;this.nativeActive=document.fullscreenElement===this.app;if(was&&!this.nativeActive){this.close(false);this.exitRiver(false);}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!this.viewer.open&&this.riverFull){e.preventDefault();e.stopImmediatePropagation();this.exitRiver();}},true);
 }
 refresh(){node<HTMLButtonElement>('river-pause').disabled=!this.hooks.playing();node<HTMLButtonElement>('aquarium-open').disabled=!this.hooks.ready();node<HTMLButtonElement>('river-fullscreen').disabled=!this.hooks.ready()||!this.hooks.playing();}
 private requestNative(){
  if(document.fullscreenElement||!this.app.requestFullscreen)return;
  const token=++this.requestEpoch;
  try{void this.app.requestFullscreen().then(()=>{
   // Native fullscreen adds app to the top layer asynchronously. Re-raise an
   // already-open modal after it, otherwise DOM hit tests can pass for hidden art.
   if(token===this.requestEpoch&&this.viewer.open&&document.fullscreenElement===this.app){this.viewer.close();this.viewer.showModal();node('viewer-close').focus({preventScroll:true});}
   else if(token!==this.requestEpoch&&!this.riverFull&&!this.viewer.open&&document.fullscreenElement===this.app)void document.exitFullscreen().catch(()=>{});
  }).catch(()=>{/* CSS viewport mode remains available on unsupported/denied devices. */});}catch{/* viewport fallback */}
 }
 private leaveNative(){this.requestEpoch++;if(document.fullscreenElement===this.app)void document.exitFullscreen().catch(()=>{});}
 enterRiver(){if(!this.hooks.playing()||!this.hooks.ready())return;this.hooks.clearInput();this.riverFull=true;this.app.classList.add('river-full');this.app.dataset.displayMode='river';node('river-fullscreen').textContent='通常表示に戻す';this.requestNative();}
 exitRiver(exitNative=true){if(!this.riverFull)return;this.hooks.clearInput();this.riverFull=false;this.app.classList.remove('river-full');this.app.dataset.displayMode='normal';node('river-fullscreen').textContent='釣り場を全画面';if(exitNative&&!this.viewer.open)this.leaveNative();}
 open(kind:'records'|'aquarium'){
  if(this.viewer.open||!this.hooks.ready())return;
  this.priorFocus=document.activeElement as HTMLElement;this.restore=this.hooks.suspend();this.kind=kind;this.scope=this.store.records().length?'saved':'current';this.galleryTime=0;
  node('viewer-title').textContent=kind==='records'?'釣った魚の記録':'川辺の水槽';this.viewer.dataset.kind=kind;
  if(kind==='records')this.renderRecords();else this.renderGallery();
  this.viewer.showModal();node('viewer-close').focus({preventScroll:true});this.requestNative();
 }
 close(exitNative=true){if(!this.viewer.open)return;this.viewer.close();this.kind=null;const restore=this.restore;this.restore=null;restore?.();this.priorFocus?.focus({preventScroll:true});if(exitNative&&!this.riverFull)this.leaveNative();}
 private renderRecords(){
  const saved=this.store.records();const body=node('viewer-body');body.innerHTML='<p class="record-note">この端末の本番釣果を、釣り上げた時点で保存します。練習の魚は記録しません。日時は端末の時刻で表示します。</p><p id="record-storage-note" class="record-note"></p><div id="fish-records" class="record-grid"></div><details class="recent-records"><summary>直近100匹の釣果履歴</summary><div id="catch-history"></div></details>';
  node('record-storage-note').textContent=this.store.storageStatus==='persistent'?'ブラウザ内の記録です。別端末へは同期されません。':'保存できていない可能性があります。このページを閉じると記録を失う場合があります。';
  for(const f of FISH){const r=saved.find(x=>x.fishId===f.id);const card=document.createElement('article');card.className='fish-record';card.dataset.fishId=f.id;
   card.innerHTML='<img src="'+fishPath(f.id)+'" alt=""><h3>'+f.name+'</h3>'+(r?'<p class="record-size">最大 '+r.maxSizeCm.toFixed(1)+' cm</p><p>最大の魚を釣った日時<br><time datetime="'+r.caughtAt+'">'+dateLabel(r.caughtAt)+'</time></p><p>釣った数 '+r.count+'匹<br>最後に釣った日時<br><time datetime="'+r.latestCaughtAt+'">'+dateLabel(r.latestCaughtAt)+'</time></p>':'<p class="uncaught">まだ釣っていません</p>');node('fish-records').append(card);
  }
  const recent=this.store.recentCatches();node('catch-history').innerHTML=recent.length?recent.slice().reverse().map(r=>'<p>'+r.catch.name+' · '+r.catch.sizeCm.toFixed(1)+' cm<br><time datetime="'+r.caughtAt+'">'+dateLabel(r.caughtAt)+'</time></p>').join(''):'<p>これから釣った魚を記録します。</p>';
 }
 private renderGallery(){
  node('viewer-body').innerHTML='<div class="gallery-controls"><button id="gallery-saved">記録の魚</button><button id="gallery-current">今回の魚</button></div><canvas id="gallery-aquarium" aria-label="釣った魚が泳ぐ全画面水槽"></canvas><p id="gallery-legend" class="record-note"></p>';
  node('gallery-saved').onclick=()=>{this.scope='saved';this.galleryLabels();};node('gallery-current').onclick=()=>{this.scope='current';this.galleryLabels();};this.galleryLabels();
 }
 private galleryLabels(){const fish=this.scope==='saved'?this.store.galleryCatches():this.hooks.catches();node('gallery-saved').setAttribute('aria-pressed',String(this.scope==='saved'));node('gallery-current').setAttribute('aria-pressed',String(this.scope==='current'));node('gallery-legend').textContent=fish.length?(this.scope==='saved'?'魚種ごとの最大の魚。':'今回の釣果。最新12匹まで表示。')+' '+fish.map(f=>f.name+' '+f.sizeCm.toFixed(1)+' cm').join(' / '):(this.scope==='saved'?'本番で釣った魚が、ここで泳ぎます。':'今回の釣行では、まだ魚を釣っていません。');}
 frame(dt:number){if(!this.viewer.open||this.kind!=='aquarium')return;this.galleryTime+=Math.min(.05,Math.max(0,dt));drawAquarium(node<HTMLCanvasElement>('gallery-aquarium'),this.images.aquarium,this.images,this.scope==='saved'?this.store.galleryCatches():this.hooks.catches(),this.galleryTime);}
}
