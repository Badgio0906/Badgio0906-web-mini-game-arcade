import { ConsentService, CONSENT_KEY } from '../core/ConsentService';
import { TelemetryUploadService, UPLOAD_QUEUE_KEY } from '../core/TelemetryUploadService';
import { GoogleAnalyticsService } from '../core/GoogleAnalyticsService';
import { ANALYTICS_SCHEMA_VERSION, sanitizeAnalyticsData, type AnalyticsEnvelope, type AnalyticsEventName } from '../data/analyticsEnvelope';
import { analyticsConfig } from './config';
import { gameVersions } from '../data/gameVersions';
import { isAnalyticsDataField } from '../data/analyticsEnvelope';
import { sanitizeAttribution, type Attribution } from './attribution';
import { installConsentUI } from './consentUI';
import type { TelemetryEvent } from '../data/telemetrySchema';
export const BROWSER_ID_KEY = 'game100garage:browser-id:v1';
export const VISIT_KEY = 'game100garage:visit:v1';
const IMPRESSION_KEY = 'game100garage:impressions:v1';

interface PageContext { game: string; session: string; run: string | null; phase: string; currentSection:string; samples:Map<string,number>; progressLoss:number|null; awaitingContinuation:boolean; }
function optionalStorage(kind:'localStorage'|'sessionStorage'): Storage | undefined { try { return window[kind]; } catch { return undefined; } }
export function uuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes=crypto.getRandomValues(new Uint8Array(16)); bytes[6]=(bytes[6]&15)|64; bytes[8]=(bytes[8]&63)|128;
  const hex=[...bytes].map(n=>n.toString(16).padStart(2,'0')).join(''); return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
let singleton: AnalyticsRuntime | undefined;
export function analyticsRuntime(): AnalyticsRuntime | undefined {
  if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
  return singleton ??= new AnalyticsRuntime();
}
export class AnalyticsRuntime {
  readonly consent = new ConsentService();
  readonly upload: TelemetryUploadService;
  private ga: GoogleAnalyticsService;
  private local = optionalStorage('localStorage');
  private session = optionalStorage('sessionStorage');
  private attribution: Attribution = sanitizeAttribution(location.search, document.referrer);
  private browser = '';
  private visit = '';
  private input: AnalyticsEnvelope['input_type'] = 'unknown';
  private impressions = new Set<string>();
  readonly environment = analyticsConfig.environment;
  constructor() {
    this.upload = new TelemetryUploadService(this.consent, analyticsConfig.endpoint, this.local);
    this.consent.subscribe(state => { if (state === 'granted') this.identify(); else this.revoke(); });
    if (this.consent.getState() === 'granted') this.identify(); else this.revoke(false);
    this.ga = new GoogleAnalyticsService(this.consent, analyticsConfig.measurementId, this.environment === 'production', () => this.attribution);
    window.addEventListener('storage', e => { if (e.key === CONSENT_KEY) this.consent.synchronize(e.newValue); });
    document.addEventListener('pointerdown', e => { if (!e.composedPath().some(node=>node instanceof HTMLElement && node.id==='analytics-settings-host')) this.setInput(e.pointerType === 'touch' ? 'touch' : 'unknown'); }, {passive:true});
    document.addEventListener('keydown', ()=>this.setInput('keyboard'), {passive:true});
    window.addEventListener('pagehide', () => { void this.upload.flush(true); });
    const legacy = location.pathname.includes('/games/'); installConsentUI(this.consent, legacy ? '../../privacy.html' : './privacy.html');
  }
  private setInput(type: AnalyticsEnvelope['input_type']): void { if (type==='unknown') return; this.input = this.input==='unknown'||this.input===type ? type : 'mixed'; }
  private identify(): void {
    try { this.browser = this.local?.getItem(BROWSER_ID_KEY) ?? ''; } catch { /* memory */ }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(this.browser)) { this.browser=uuid(); try { this.local?.setItem(BROWSER_ID_KEY,this.browser); } catch { /* memory */ } }
    try { const saved = JSON.parse(this.session?.getItem(VISIT_KEY) ?? 'null'); if (saved && /^[0-9a-f-]{36}$/i.test(saved.id) && Number.isFinite(saved.at) && Date.now()-saved.at>=0 && Date.now()-saved.at<1800000) { this.visit=saved.id; this.attribution={...sanitizeAttribution(new URLSearchParams(saved.attribution).toString()), ...(isAnalyticsDataField('referrer_host',saved.attribution?.referrer_host) ? {referrer_host:saved.attribution.referrer_host} : {})}; } } catch { /* new visit */ }
    if (!this.visit) this.visit=uuid(); this.saveVisit();
    try { const saved=JSON.parse(this.session?.getItem(IMPRESSION_KEY)??'null'); if(saved?.visit===this.visit&&Array.isArray(saved.games)) this.impressions=new Set(saved.games.filter((id:unknown)=>typeof id==='string')); } catch { /* empty */ }
  }
  private saveVisit(): void { try { this.session?.setItem(VISIT_KEY,JSON.stringify({id:this.visit,at:Date.now(),attribution:this.attribution})); } catch { /* memory */ } }
  private revoke(discardAttribution=true): void {
    this.browser=''; this.visit=''; this.impressions.clear(); this.upload.clear(); if (discardAttribution || this.consent.getState()==='denied') this.attribution={};
    for (const key of [BROWSER_ID_KEY,UPLOAD_QUEUE_KEY]) try { this.local?.removeItem(key); } catch { /* storage optional */ }
    for (const key of [VISIT_KEY,IMPRESSION_KEY]) try { this.session?.removeItem(key); } catch { /* storage optional */ }
  }
  createContext(game:string, session:string): PageContext { return { game, session, run:null, phase:'title', currentSection:'none', samples:new Map(), progressLoss:null, awaitingContinuation:false }; }
  persistLocal(): boolean { return this.environment !== 'production' || this.consent.getState()==='granted'; }
  seenImpression(game:string):boolean { return this.impressions.has(game); }
  markImpression(game:string):void { this.impressions.add(game); if(this.consent.getState()==='granted') try { this.session?.setItem(IMPRESSION_KEY,JSON.stringify({visit:this.visit,games:[...this.impressions]})); } catch { /* memory */ } }
  record(context: PageContext, event: TelemetryEvent):void {
    if(event.name==='run_start') { context.run=uuid(); context.samples.clear(); context.progressLoss=null; context.awaitingContinuation=false; context.phase='playing'; }
    if(event.name==='practice_start') context.phase='practice';
    if(event.name==='tutorial_start'||event.name==='tutorial_view') context.phase='explanation';
    if(event.name==='phase_reached'&&typeof event.data.phase==='string') context.phase=event.data.phase;
    const specific=String(event.data.event??event.data.event_type??'');
    if(context.game==='game019'&&specific==='section_reached') context.currentSection=String(event.data.section_id??'none');
    if(event.name==='portal_open') return; // Preserve legacy local name without duplicating the external portal_view.
    if(this.consent.getState()==='granted') {
      if(context.game==='game019') {
        if(specific==='fall_end'&&Number(event.data.progress_lost)>=3) { context.progressLoss=Number(event.data.fall_start_height); if(Number(event.data.progress_lost)>=10) context.awaitingContinuation=true; }
        if(specific==='jump'&&context.awaitingContinuation) { this.send(context,'specific_game_events',{event:'post_fall_continue',height:event.data.jump_start_height}); context.awaitingContinuation=false; }
        if(specific==='fall_start'&&context.progressLoss!==null&&Number(event.data.fall_start_height)>=context.progressLoss) { this.send(context,'progress_recovered',{height:event.data.fall_start_height,progress_recovered:true}); context.progressLoss=null; }
        if(['charge_start','charge_cancel','land','wall_bump','ceiling_bump'].includes(specific)) return;
        if(['jump','jump_end','fall_start','fall_end'].includes(specific)) {
          const key=`${context.currentSection}:${specific}`,count=context.samples.get(key)??0;
          if(count>=3 && !(specific==='fall_end'&&Number(event.data.progress_lost)>=3)) return;
          context.samples.set(key,count+1);
        }
      }
      this.send(context,event.name,event.data);
      this.ga.track(event.name,context.game==='portal'?String(event.data.selected_game??'portal'):context.game,this.attribution);
    }
    if(event.name==='run_end') context.phase=event.data.outcome==='quit'?context.phase:'result';
  }
  private send(context:PageContext,name:AnalyticsEventName,data:TelemetryEvent['data']):void {
    if(!this.browser||!this.visit)return; this.saveVisit();
    const selected = context.game==='portal' && typeof data.selected_game==='string' ? data.selected_game : context.game;
    const version = gameVersions[selected] ?? {rules_version:'1',presentation_version:'1'};
    const page = context.game==='portal'?'index.html': context.game==='game012'?'games/yokodori-days/index.html':context.game==='game013'?'games/tachibana-task-heaven/index.html':context.game==='game014'?'games/finger-heart-challenge/index.html':`${context.game}.html`;
    const device:AnalyticsEnvelope['device_class'] = matchMedia('(pointer: coarse)').matches ? (Math.min(screen.width,screen.height)<600?'mobile':'tablet') : 'desktop';
    const envelope:AnalyticsEnvelope={schema_version:ANALYTICS_SCHEMA_VERSION,event_id:uuid(),occurred_at:new Date().toISOString(),game_id:selected,game_version:'2026-10-06-analytics-1',rules_version:version.rules_version,presentation_version:version.presentation_version,browser_id:this.browser,visit_id:this.visit,session_id:context.session,run_id:context.run,event_name:name,environment:this.environment,device_class:device,input_type:this.input,page,data:sanitizeAnalyticsData({...data,phase:typeof data.phase==='string'?data.phase:context.phase,...this.attribution})};
    this.upload.enqueue(envelope);
  }
}
