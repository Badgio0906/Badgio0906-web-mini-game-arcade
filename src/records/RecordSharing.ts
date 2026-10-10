import './share.css';
import { isPublicRecordRegistered } from './remoteRegistration';
import { getRecordDefinition } from '../data/recordDefinitions';
import { gameVersions } from '../data/gameVersions';
import { canonicalValue, shareEnvironment, type RecordSubmission } from './protocol';
import { recordsEndpoint } from './PublicBests';
import { safeSubmission } from './submissionValidation';
import { storeCurrentRule } from './currentRules';
import { ParticipantIdentity, credentialFingerprint } from './ParticipantIdentity';

const SETTINGS_KEY='game100:records:sharing:v1', QUEUE_PREFIX='game100:records:pending:v1:', RECEIPT_PREFIX='game100:records:receipt:v1:', WITHDRAWN_PREFIX='game100:records:withdrawn:v1:';
const CHANGED='game100:records:changed', DAY=86400000;
interface Queued { payload:RecordSubmission; createdAt:number; attempts:number; nextAt:number; automatic:boolean; permissionEpoch:string; credentialHash:string; }
interface Receipt { key:string; receipt:string; gameId:string; boardId:string; status:string; receivedAt:string; }
interface Candidate { payload:RecordSubmission; sealed:boolean; status:string; }
function validReceipt(input:unknown):input is Receipt {if(!input||typeof input!=='object')return false;const r=input as Partial<Receipt>;return typeof r.key==='string'&&/^[a-f0-9-]{36}$/.test(r.key)&&typeof r.receipt==='string'&&/^[a-f0-9]{64}$/.test(r.receipt)&&typeof r.gameId==='string'&&typeof r.boardId==='string'&&typeof r.status==='string'&&typeof r.receivedAt==='string';}
export interface ResultOptions { modeId?:string; practice?:boolean; metadata?:Record<string,number|string|boolean>; }
function read<T>(key:string,fallback:T):T { try { const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } }
function write(key:string,value:unknown):boolean { try {localStorage.setItem(key,JSON.stringify(value));return true;} catch {return false;} }
function remove(key:string){try{localStorage.removeItem(key);}catch{/* current memory state still cleared */}}
function entries(prefix:string,maximum:number):unknown[]{try{const out:unknown[]=[];for(let i=0;i<localStorage.length&&out.length<maximum;i++){const key=localStorage.key(i);if(key?.startsWith(prefix)){const raw=localStorage.getItem(key);if(raw&&raw.length<16384)try{out.push(JSON.parse(raw));}catch{/* corrupt entry */}}}return out;}catch{return[];}}
function storedEpoch():string{const state=read<{epoch?:unknown}>(SETTINGS_KEY,{});return typeof state.epoch==='string'?state.epoch:'initial';}
function autoEnabled():boolean { const state=read<unknown>(SETTINGS_KEY,null);return !!state&&typeof state==='object'&&(state as {schema?:unknown}).schema===1&&(state as {automatic?:unknown}).automatic===true; }
function isProduction():boolean { try {return shareEnvironment(location,navigator.webdriver,import.meta.env.PROD);} catch {return false;} }
function receiptToken():string { const bytes=crypto.getRandomValues(new Uint8Array(32));return [...bytes].map(v=>v.toString(16).padStart(2,'0')).join(''); }
function notices() { window.dispatchEvent(new CustomEvent(CHANGED)); }
const labels:Record<string,string>={unsent:'未送信',sending:'送信中',accepted:'受付済み',pending:'確認中',failed:'送信失敗',withdrawn:'撤回済み',rejected:'共有対象外',revoked:'取り消し済み'};

/** Independent from Analytics consent/observer/identifiers. At most one payload per finalized RUN. */
class Sharing {
  private identity=new ParticipantIdentity();
  private registeredCredentialHash?:string;
  private queue:Queued[]=[];
  private receipts:Receipt[]=[];
  private memoryAutomatic=false;
  private deniedStorage=false;
  private storageWarning=false;
  private epoch=0;
  private busy=false;
  private controller?:AbortController;
  private timer?:ReturnType<typeof setTimeout>;
  private candidates=new Map<string,Candidate>();
  constructor() {
    try { const raw=localStorage.getItem(SETTINGS_KEY);this.memoryAutomatic=autoEnabled();this.deniedStorage=raw===undefined; } catch {this.deniedStorage=true;this.storageWarning=true;}
    this.reloadReceipts();
    for(const input of entries(QUEUE_PREFIX,200)){if(this.validQueued(input)&&(!input.automatic||this.enabled())&&isProduction()){if(this.queue.length<50)this.queue.push(input);}else if(input&&typeof input==='object'&&(input as Queued).payload?.submission_key)remove(QUEUE_PREFIX+(input as Queued).payload.submission_key);}
    window.addEventListener('storage',event=>{if(event.key===SETTINGS_KEY||event.key===null){this.memoryAutomatic=autoEnabled();this.deniedStorage=false;if(!this.enabled())this.stop();else void this.flush();notices();}else if(event.key?.startsWith(RECEIPT_PREFIX)||event.key?.startsWith(WITHDRAWN_PREFIX)){this.reloadReceipts();notices();}});
    window.addEventListener('online',()=>void this.flush());
    window.addEventListener('pageshow',()=>void this.flush());
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void this.flush();});
    window.addEventListener('pagehide',()=>{this.controller?.abort();clearTimeout(this.timer);});
  }
  private validQueued(input:unknown):input is Queued {
    if(!input||typeof input!=='object')return false;const q=input as Queued,p=q.payload;
    if(!p||typeof p!=='object'||!isPublicRecordRegistered(p.game_id)||!Number.isFinite(q.createdAt)||Date.now()-q.createdAt>DAY||q.createdAt>Date.now()+60000||!Number.isInteger(q.attempts)||q.attempts<0||q.attempts>=5||typeof q.automatic!=='boolean'||!Number.isFinite(q.nextAt))return false;
    return typeof q.credentialHash==='string'&&/^[a-f0-9]{64}$/.test(q.credentialHash)&&q.permissionEpoch===storedEpoch()&&safeSubmission(p)!==null;
  }
  enabled():boolean { return this.deniedStorage ? this.memoryAutomatic : autoEnabled(); }
  storageLimited():boolean{return this.storageWarning||this.deniedStorage||this.identity.storageLimited();}
  identityUnavailable():boolean{return this.identity.unavailable();}
  setAutomatic(enabled:boolean) {this.memoryAutomatic=enabled;this.deniedStorage=!write(SETTINGS_KEY,{schema:1,automatic:enabled,epoch:crypto.randomUUID()});if(this.deniedStorage)this.storageWarning=true;if(!enabled)this.stop();notices();}
  private stop(){this.epoch++;this.controller?.abort();clearTimeout(this.timer);for(const q of this.queue)remove(QUEUE_PREFIX+q.payload.submission_key);for(const q of entries(QUEUE_PREFIX,200))if(q&&typeof q==='object'&&(q as Queued).payload?.submission_key)remove(QUEUE_PREFIX+(q as Queued).payload.submission_key);this.queue=[];for(const c of this.candidates.values())if(c.status==='sending')c.status='failed';}
  private reloadReceipts(){const found=entries(RECEIPT_PREFIX,200).filter(validReceipt);for(const r of found){if(read<boolean>(WITHDRAWN_PREFIX+r.key,false))r.status='withdrawn';const index=this.receipts.findIndex(old=>old.key===r.key);if(index<0)this.receipts.push(r);else if(this.receipts[index].status!=='withdrawn')this.receipts[index]=r;}this.receipts=this.receipts.slice(-200);}
  private persist(){for(const q of this.queue)if(q.permissionEpoch===storedEpoch()&&read(QUEUE_PREFIX+q.payload.submission_key,null)!==null&&!write(QUEUE_PREFIX+q.payload.submission_key,q))this.storageWarning=true;for(const r of this.receipts){const prior=read<Receipt|null>(RECEIPT_PREFIX+r.key,null);if(prior?.status==='withdrawn'||read<boolean>(WITHDRAWN_PREFIX+r.key,false))r.status='withdrawn';if(!write(RECEIPT_PREFIX+r.key,r))this.storageWarning=true;}this.reloadReceipts();notices();}
  remember(candidate:Candidate){this.candidates.set(candidate.payload.submission_key,candidate);while(this.candidates.size>100)this.candidates.delete(this.candidates.keys().next().value!);}
  getReceipts():readonly Receipt[]{this.reloadReceipts();return this.receipts;}
  async submit(candidate:Candidate,automatic:boolean){
    if(!recordsEndpoint||!isProduction()||!isPublicRecordRegistered(candidate.payload.game_id)||(automatic&&!this.enabled()))return;
    if(candidate.sealed&&candidate.status!=='failed')return;
    this.reloadReceipts();if(this.queue.length>=50||entries(QUEUE_PREFIX,50).length>=50||this.receipts.length>=200){candidate.status='failed';notices();return;}
    const permissionEpoch=storedEpoch(),epoch=this.epoch;
    const permitted=()=>epoch===this.epoch&&permissionEpoch===storedEpoch()&&(!automatic||this.enabled());
    candidate.sealed=true;candidate.status='sending';notices();
    const credential=await this.identity.forSharing(permitted);
    if(!credential||!permitted()){candidate.status='failed';notices();return;}
    const credentialHash=await credentialFingerprint(credential);
    if(!permitted()){candidate.status='failed';notices();return;}
    if(!this.queue.some(q=>q.payload.submission_key===candidate.payload.submission_key)){const q={payload:candidate.payload,createdAt:Date.now(),attempts:0,nextAt:Date.now(),automatic,permissionEpoch,credentialHash};this.queue.push(q);if(!write(QUEUE_PREFIX+candidate.payload.submission_key,q))this.storageWarning=true;}
    this.persist();await this.flush();
  }
  private async flush(){
    if(this.busy||!recordsEndpoint||!isProduction())return;this.busy=true;const epoch=this.epoch;
    try {
      this.queue=this.queue.filter(q=>this.validQueued(q)&&(!q.automatic||this.enabled()));
      while(this.queue.length&&epoch===this.epoch){
        const q=this.queue[0];if(q.nextAt>Date.now()){clearTimeout(this.timer);this.timer=setTimeout(()=>void this.flush(),Math.min(q.nextAt-Date.now(),60000));break;}
        if(q.automatic&&!this.enabled()){this.queue.shift();continue;}
        this.controller=new AbortController();const timeout=setTimeout(()=>this.controller?.abort(),10000);q.attempts++;
        try {
          // Recheck current cross-tab permission immediately before sending.
          if(q.permissionEpoch!==storedEpoch()||(q.automatic&&!this.enabled())){remove(QUEUE_PREFIX+q.payload.submission_key);this.queue.shift();continue;}
          const credential=this.identity.current();
          if(!credential||await credentialFingerprint(credential)!==q.credentialHash){const c=this.candidates.get(q.payload.submission_key);if(c)c.status='rejected';remove(QUEUE_PREFIX+q.payload.submission_key);this.queue.shift();continue;}
          if(q.permissionEpoch!==storedEpoch()||epoch!==this.epoch||(q.automatic&&!this.enabled()))continue;
          if(this.registeredCredentialHash!==q.credentialHash){
            const registration=await fetch(`${recordsEndpoint}/v1/records/participants`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({schema_version:1,credential}),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',redirect:'error',signal:this.controller.signal});
            if(!registration.ok){
              if(registration.status===429||registration.status>=500){const retry=Number(registration.headers.get('Retry-After'));q.nextAt=Date.now()+Math.max(1000*2**q.attempts,Number.isFinite(retry)?Math.min(retry*1000,DAY):0);throw Error('registration_retry');}
              const c=this.candidates.get(q.payload.submission_key);if(c)c.status='rejected';remove(QUEUE_PREFIX+q.payload.submission_key);this.queue.shift();continue;
            }
            const text=await registration.text();if(text.length>2048)throw Error('invalid_registration');
            const d=JSON.parse(text) as {schema_version?:unknown;public_label?:unknown};
            if(d.schema_version!==1||typeof d.public_label!=='string'||!/^ガレージ住人 [0-9]{12}$/.test(d.public_label))throw Error('invalid_registration');
            this.registeredCredentialHash=q.credentialHash;
          }
          // Consent can change while registration is in flight. No score follows OFF.
          if(q.permissionEpoch!==storedEpoch()||epoch!==this.epoch||(q.automatic&&!this.enabled())||this.identity.current()!==credential)continue;
          const response=await fetch(`${recordsEndpoint}/v1/records/submissions`,{method:'POST',headers:{'Content-Type':'application/json','X-Record-Credential':credential},body:JSON.stringify(q.payload),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',redirect:'error',signal:this.controller.signal});
          if(response.ok){
            const d=await response.json() as Record<string,unknown>;
            if(d.submission_key!==q.payload.submission_key||!['accepted','pending','withdrawn','rejected','revoked'].includes(String(d.status))||typeof d.received_at!=='string')throw Error('invalid_receipt_response');
            const receipt:Receipt={key:q.payload.submission_key,receipt:q.payload.withdrawal_receipt,gameId:q.payload.game_id,boardId:q.payload.board_id,status:String(d.status),receivedAt:d.received_at};
            const existing=this.receipts.findIndex(r=>r.key===receipt.key);if(existing>=0)this.receipts[existing]=receipt;else this.receipts.push(receipt);
            const c=this.candidates.get(receipt.key);if(c)c.status=receipt.status;
            remove(QUEUE_PREFIX+q.payload.submission_key);if(epoch===this.epoch)this.queue.shift();
          }else if(response.status===429||response.status>=500){const retry=Number(response.headers.get('Retry-After'));q.nextAt=Date.now()+Math.max(1000*2**q.attempts,Number.isFinite(retry)?Math.min(retry*1000,DAY):0);throw Error('retry_later');}
          else{const c=this.candidates.get(q.payload.submission_key);if(c)c.status='rejected';remove(QUEUE_PREFIX+q.payload.submission_key);if(epoch===this.epoch)this.queue.shift();}
        }catch{const c=this.candidates.get(q.payload.submission_key);if(c)c.status='failed';if(epoch===this.epoch){q.nextAt=Math.max(q.nextAt,Date.now()+1000*2**q.attempts);if(q.attempts>=5){remove(QUEUE_PREFIX+q.payload.submission_key);this.queue.shift();}else{clearTimeout(this.timer);this.timer=setTimeout(()=>void this.flush(),Math.min(q.nextAt-Date.now(),60000));}}break;}
        finally{clearTimeout(timeout);this.controller=undefined;this.persist();}
      }
    }finally{this.busy=false;}
  }
  async withdraw(key:string):Promise<boolean>{
    const receipt=this.receipts.find(r=>r.key===key);if(!receipt||!recordsEndpoint)return false;
    // Remove any retry first. The server tombstone prevents the same RUN/key reviving.
    this.queue=this.queue.filter(q=>q.payload.submission_key!==key);remove(QUEUE_PREFIX+key);this.persist();
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{const response=await fetch(`${recordsEndpoint}/v1/records/submissions/withdraw`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submission_key:receipt.key,withdrawal_receipt:receipt.receipt}),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',redirect:'error',signal:controller.signal});if(!response.ok)return false;const body=await response.json() as {status?:string};if(body.status!=='withdrawn')return false;if(!write(WITHDRAWN_PREFIX+key,true))this.storageWarning=true;receipt.status='withdrawn';const current=this.receipts.find(r=>r.key===key);if(current)current.status='withdrawn';const c=this.candidates.get(key);if(c)c.status='withdrawn';this.persist();return true;}catch{return false;}finally{clearTimeout(timer);}
  }
}
let sharing:Sharing|undefined;
function service(){return sharing??=new Sharing();}

export function createGameRecordSession(gameId:string){
  let runId:string|undefined,started=0,candidate:Candidate|undefined,active:HTMLElement|undefined,dispose:()=>void=()=>{},identity:string|undefined,strictAutomatic=false,automaticAtStart=false,startEpoch='';
  const activeKey=`game100:records:eligible:v1:${gameId}`;
  const persistRun=()=>{if(identity&&isProduction())write(activeKey,{schema:1,identity,runId,started,rulesetId:getRecordDefinition(gameId)?.rulesetId,candidate});};
  const clear=()=>{candidate=undefined;runId=undefined;identity=undefined;dispose();dispose=()=>{};active?.remove();active=undefined;};
  return {
    startRun(localIdentity?:string,options:{requireAutomaticAtStart?:boolean}={}){try{clear();if(!isPublicRecordRegistered(gameId))return;strictAutomatic=!!options.requireAutomaticAtStart;automaticAtStart=service().enabled();startEpoch=storedEpoch();runId=crypto.randomUUID();started=Date.now();identity=localIdentity;persistRun();}catch{/* records cannot break gameplay */}},
    resumeRun(localIdentity:string){try{clear();if(!isProduction()||!isPublicRecordRegistered(gameId))return;const saved=read<Record<string,unknown>>(activeKey,{});const def=getRecordDefinition(gameId);if(saved.schema!==1||saved.identity!==localIdentity||saved.rulesetId!==def?.rulesetId||typeof saved.runId!=='string'||!/^[a-f0-9-]{36}$/.test(saved.runId)||typeof saved.started!=='number'||!Number.isFinite(saved.started)||saved.started>Date.now())return;runId=saved.runId;started=saved.started;identity=localIdentity;if(saved.candidate&&typeof saved.candidate==='object'){const old=saved.candidate as Candidate;const payload=safeSubmission(old.payload);if(payload&&payload.run_result_id===runId&&typeof old.sealed==='boolean'&&typeof old.status==='string'){candidate={payload,sealed:old.sealed,status:old.status};service().remember(candidate);}}}catch{/* malformed/old eligibility never grants sharing */}},
    complete(value:number,options:ResultOptions={}){try{
      const def=getRecordDefinition(gameId);if(!def?.publicEnabled||!isPublicRecordRegistered(gameId)||options.practice||!runId||(options.modeId??def.modeId)!==def.modeId)return;
      const integer=canonicalValue(value,def.storageScale,def.maxValue);if(integer===null)return;
      if(isProduction())void storeCurrentRule(gameId,integer);
      if(!isProduction()||candidate?.sealed)return;
      const metadata=options.metadata??{},outcome=metadata.outcome;
      const payload:RecordSubmission={schema_version:1,submission_key:candidate?.payload.submission_key??crypto.randomUUID(),run_result_id:runId,game_id:gameId,board_id:def.boardId!,ruleset_id:def.rulesetId,game_build:`records-v1.${gameVersions[gameId]?.rules_version??'1'}.${gameVersions[gameId]?.presentation_version??'1'}`,environment:'production',value:integer,withdrawal_receipt:candidate?.payload.withdrawal_receipt??receiptToken(),allowed_result_metadata:{finalized:true,mode_id:def.modeId,assistance:def.assistancePolicy==='none'?'none':'allowed',duration_ms:Math.min(86400000,Math.max(0,Math.round(Date.now()-started))),outcome:outcome==='milestone'||outcome==='quit'?outcome:'complete'}};
      candidate={payload,sealed:false,status:'unsent'};service().remember(candidate);
      persistRun();
      if(recordsEndpoint&&service().enabled()&&(!strictAutomatic||automaticAtStart&&startEpoch===storedEpoch())){void service().submit(candidate,true);persistRun();}
    }catch{/* optional records never prevents result/save/retry */}},
    mount(host:HTMLElement, options:{compactWhenUnavailable?:boolean}={}){try{
      dispose();active?.remove();const def=getRecordDefinition(gameId);if(!def?.publicEnabled)return;
      const controls=document.createElement('div');controls.className='record-share-controls';controls.dataset.recordGame=gameId;const button=document.createElement('button');button.type='button';
      const current=candidate;const status=document.createElement('p');status.setAttribute('role','status');
      const render=()=>{button.textContent='この記録を共有';button.disabled=!recordsEndpoint||!isPublicRecordRegistered(gameId)||!current||current.sealed&&current.status!=='failed';status.textContent=!recordsEndpoint||!isPublicRecordRegistered(gameId)?'記録共有：準備中':service().identityUnavailable()?'このブラウザでは共有参加情報を安全に作れません。新しいブラウザでお試しください。':!current?'練習・自動検証などの記録は共有対象外です。':labels[current.status]??'確認中';};
      button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(!current||!recordsEndpoint||!isPublicRecordRegistered(gameId))return;if(!confirm('このゲームの記録を、みんなのBEST・TOP10へ送信します。自動発行の「ガレージ住人」名が公開されます。共有しなくてもゲームと個人記録はそのまま利用できます。送信しますか？'))return;void service().submit(current,false).then(()=>{persistRun();render();});persistRun();render();});
      controls.addEventListener('keydown',event=>event.stopPropagation());controls.addEventListener('click',event=>event.stopPropagation());
      const change=()=>{if(!controls.isConnected){window.removeEventListener(CHANGED,change);return;}persistRun();render();};window.addEventListener(CHANGED,change);dispose=()=>window.removeEventListener(CHANGED,change);render();if((!recordsEndpoint||!isPublicRecordRegistered(gameId))&&options.compactWhenUnavailable){controls.classList.add("record-share-preparing");controls.append(status);}else controls.append(button,status);host.append(controls);active=controls;
    }catch{/* optional UI only */}}, clear
  };
}

export function mountRecordSharingSettings(host:HTMLElement){
  const details=document.createElement('details');details.className='record-sharing-settings';const summary=document.createElement('summary');summary.textContent='あなたのBEST・記録共有設定';details.append(summary);
  const explanation=document.createElement('p');explanation.textContent='あなたのBESTはこのブラウザの記録です。みんなのBESTは収集開始後に共有・受付された同じ条件の最高記録です。TOP10は共有資格情報を持つ同じブラウザにつき1枠です。PCとスマホや保存削除後は別参加者になり得ます。全プレイヤーの過去記録や完全な不正防止を意味しません。解析の許可と記録共有は別です。';
  const label=document.createElement('label'),checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=service().enabled();checkbox.disabled=!recordsEndpoint;label.append(checkbox,document.createTextNode('今後の新しい記録を自動共有する（初期OFF）'));
  const notice=document.createElement('p');notice.setAttribute('role','status');const policy=document.createElement('p');policy.textContent='OFFにすると以後の自動送信と待機キューを停止します。送信済み記録は別の撤回操作で扱います。共有時だけ専用のランダム資格情報を保存し、自動発行の「ガレージ住人」名で参加します。保存を消すと同じ参加者として継続できず、撤回情報も失われます。撤回情報は最大200件まで端末内に保持します。';const privacy=document.createElement('a');privacy.href='./privacy.html';privacy.textContent='プライバシーと保存方針';
  const list=document.createElement('ul');
  const render=()=>{checkbox.checked=service().enabled();notice.textContent=recordsEndpoint?'共有は任意です。過去のBESTをまとめて送信することはありません。':'みんなのBEST・記録共有は準備中です。個人記録は共有せず利用できます。';if(service().storageLimited())notice.textContent+=' この環境では設定・撤回情報を保存できません。このページ内の選択だけを維持し、別ページ・別タブでは引き継げない場合があります。';list.replaceChildren();for(const r of service().getReceipts()){const li=document.createElement('li');li.textContent=`${r.gameId}：${labels[r.status]??'確認中'} `;if(r.status!=='withdrawn'){const button=document.createElement('button');button.type='button';button.textContent='この投稿を撤回';button.disabled=!recordsEndpoint;button.addEventListener('click',async()=>{if(!confirm('共有側のこの投稿を撤回します。個人BESTは消しません。続けますか？'))return;button.disabled=true;const ok=await service().withdraw(r.key);if(ok)render();else{notice.textContent='撤回できませんでした。接続状態を確認して再試行してください。';button.disabled=false;}});li.append(button);}list.append(li);}};
  checkbox.addEventListener('change',()=>{if(checkbox.checked&&!confirm('今後この機能で確定した新しい記録を自動共有します。過去の記録は送信しません。許可しますか？')){checkbox.checked=false;return;}service().setAutomatic(checkbox.checked);render();});
  window.addEventListener(CHANGED,render);render();details.append(explanation,label,notice,policy,privacy,list);host.append(details);
}
