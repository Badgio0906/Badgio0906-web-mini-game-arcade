import type { AnalyticsEnvelope } from '../../src/data/analyticsEnvelope';
import type { GameMetrics, Metrics, Period, Ratio, StoredEvent } from './types';
type Event = AnalyticsEnvelope;
export function ratio(numerator: number, denominator: number): Ratio { return { numerator, denominator, rate: denominator ? numerator / denominator : null, sample_size_small: denominator < 20 }; }
function unique<T>(rows: readonly T[], key: (row:T)=>string): T[] { const result=new Map<string,T>();for(const row of rows)if(!result.has(key(row)))result.set(key(row),row);return [...result.values()]; }
function median(values: number[]): number | null { if (!values.length) return null; const sorted=[...values].sort((a,b)=>a-b), mid=Math.floor(sorted.length/2); return sorted.length%2 ? sorted[mid] : (sorted[mid-1]+sorted[mid])/2; }
const runKey = (e:Event) => `${e.browser_id}:${e.visit_id}:${e.session_id}:${e.game_id}:${e.run_id}`;
const visitGameKey = (e:Event) => `${e.browser_id}:${e.visit_id}:${e.game_id}`;
const browserGameKey = (e:Event) => `${e.browser_id}:${e.game_id}`;
function subtype(e:Event): string { return String(e.data.event ?? e.data.event_type ?? e.data.type ?? e.event_name); }
function countBy(rows:Event[], key:(e:Event)=>string):Record<string,number> { const out:Record<string,number>=Object.create(null); for(const e of rows){const label=key(e);out[label]=(out[label]??0)+1;}return out; }
function top(counts:Record<string,number>){return Object.entries(counts).map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label)).slice(0,10);}
function cohort(starts:Event[], key:(e:Event)=>string){const counts=new Map<string,number>();for(const e of starts)counts.set(key(e),(counts.get(key(e))??0)+1);const values=[...counts.values()];return {values,one:values.length,two:values.filter(n=>n>=2).length,three:values.filter(n=>n>=3).length};}
function isFailure(e:Event){ return e.event_name==='run_end' && ['over','failed','failure','timeout','collision','outside'].includes(String(e.data.outcome)); }
function returnRate(rows:Event[], byBrowser:Map<string,Event[]>, period:Period, days:number):Ratio {
 const first=new Map<string,Event>();for(const e of rows)if(!first.has(e.browser_id))first.set(e.browser_id,e);
 let numerator=0,denominator=0;const end=Date.parse(period.to);
 for(const [browser,initial] of first){const day=Date.parse(initial.occurred_at.slice(0,10)+'T00:00:00.000Z');if(day+(days+1)*86400000>end)continue;denominator++;if((byBrowser.get(browser)??[]).some(e=>e.visit_id!==initial.visit_id&&Date.parse(e.occurred_at)>=day+86400000&&Date.parse(e.occurred_at)<day+(days+1)*86400000))numerator++;}
 return ratio(numerator,denominator);
}
export function computeMetrics(rows:Event[], all:Event[], period:Period):Metrics {
 const byBrowser=new Map<string,Event[]>(),latestStartByVisitGame=new Map<string,string>(),latestGameStartByVisit=new Map<string,Map<string,string>>(),latestContinuationByRun=new Map<string,string>();
 for(const e of all){const b=byBrowser.get(e.browser_id)??[];b.push(e);byBrowser.set(e.browser_id,b);if(e.event_name==='run_start'&&e.run_id!==null){const key=visitGameKey(e),visitKey=`${e.browser_id}:${e.visit_id}`;if(e.occurred_at>(latestStartByVisitGame.get(key)??''))latestStartByVisitGame.set(key,e.occurred_at);const games=latestGameStartByVisit.get(visitKey)??new Map<string,string>();if(e.occurred_at>(games.get(e.game_id)??''))games.set(e.game_id,e.occurred_at);latestGameStartByVisit.set(visitKey,games);}if(['jump','jump_committed','post_fall_continue','progress_recovered','section_reached'].includes(subtype(e))&&e.occurred_at>(latestContinuationByRun.get(runKey(e))??''))latestContinuationByRun.set(runKey(e),e.occurred_at);}
 const starts=unique(rows.filter(e=>e.event_name==='run_start'&&e.run_id!==null),runKey);
 const ends=unique(rows.filter(e=>e.event_name==='run_end'&&e.run_id!==null),runKey);
 const visits=cohort(starts,visitGameKey), browsers=cohort(starts,browserGameKey), siteVisits=cohort(starts,e=>`${e.browser_id}:${e.visit_id}`);
 const impressions=unique(rows.filter(e=>e.event_name==='game_card_impression'),e=>`${e.visit_id}:${e.browser_id}:${e.game_id}`);
 const clicks=rows.filter(e=>e.event_name==='game_card_click');
 const launches=unique(rows.filter(e=>e.event_name==='game_launch'||e.event_name==='game_open'),visitGameKey);
 const started=new Set(starts.map(visitGameKey));
 const launchStarted=launches.filter(e=>started.has(visitGameKey(e))).length;
 const clickedCards=new Set(clicks.map(e=>`${e.visit_id}:${e.browser_id}:${e.game_id}`));
 const clickedImpressions=impressions.filter(e=>clickedCards.has(`${e.visit_id}:${e.browser_id}:${e.game_id}`)).length;
 const endByRun=new Map(ends.map(e=>[runKey(e),e]));
 const durations:number[]=[];
 for(const s of starts){const e=endByRun.get(runKey(s));if(!e)continue;const reported=e.data.seconds??e.data.time;const duration=typeof reported==='number'?reported:(Date.parse(e.occurred_at)-Date.parse(s.occurred_at))/1000;if(Number.isFinite(duration)&&duration>=0&&duration<=86400)durations.push(duration);}
 const bestRuns=new Set(rows.filter(e=>e.event_name==='best_update'||subtype(e)==='best_updated').filter(e=>e.run_id!==null).map(runKey));
 const matchedBest=starts.filter(e=>bestRuns.has(runKey(e))).length;
 const returned=rows.filter(e=>e.event_name==='return_to_portal');const returnVisits=new Set(returned.map(visitGameKey));
 const firstStarts=unique(starts,visitGameKey);const cross=firstStarts.filter(s=>[...(latestGameStartByVisit.get(`${s.browser_id}:${s.visit_id}`)??new Map<string,string>()).entries()].some(([id,time])=>id!==s.game_id&&time>s.occurred_at)).length;
 const failures=ends.filter(isFailure);const retried=failures.filter(f=>(latestStartByVisitGame.get(visitGameKey(f))??'')>f.occurred_at).length;
 const largeFalls=unique(rows.filter(e=>e.game_id==='game019'&&['fall_end','fall_stopped'].includes(subtype(e))&&(typeof e.data.progress_lost==='number'?e.data.progress_lost:typeof e.data.height_before_fall==='number'&&typeof e.data.height_after_fall==='number'?e.data.height_before_fall-e.data.height_after_fall:0)>=10),e=>e.event_id);
 const recoveries=largeFalls.filter(f=>(latestContinuationByRun.get(runKey(f))??'')>f.occurred_at).length;
 const failureRows=unique([...failures,...rows.filter(e=>e.event_name==='death_reason')],runKey);
 const exits=unique(rows.filter(e=>e.event_name==='page_exit'||(e.event_name==='run_end'&&e.data.outcome==='quit')),e=>`${e.session_id}:${e.run_id??''}`);
 const deviceRows=unique(rows,e=>`${e.browser_id}:${e.visit_id}`);
 const trafficByVisit=new Map<string,string>();for(const e of all){const key=`${e.browser_id}:${e.visit_id}`;if(typeof e.data.utm_source==='string')trafficByVisit.set(key,e.data.utm_source);else if(!trafficByVisit.has(key))trafficByVisit.set(key,typeof e.data.referrer_host==='string'?e.data.referrer_host:'unknown');}
 return {observed_browser_count:new Set(rows.map(e=>e.browser_id)).size,visit_count:new Set(rows.map(e=>`${e.browser_id}:${e.visit_id}`)).size,
 portal_view_count:unique(rows.filter(e=>e.event_name==='portal_view'||e.event_name==='portal_open'),e=>`${e.browser_id}:${e.visit_id}:${e.session_id}`).length,
 game_card_impressions:impressions.length,game_card_clicks:clicks.length,ctr:ratio(clickedImpressions,impressions.length),
 game_starts:launches.length,run_count:starts.length,run1:visits.one,run2:visits.two,run3:visits.three,
 second_run_rate:ratio(visits.two,visits.one),third_run_rate:ratio(visits.three,visits.two),browser_second_run_rate:ratio(browsers.two,browsers.one),browser_third_run_rate:ratio(browsers.three,browsers.two),
 launch_to_run_rate:ratio(launchStarted,launches.length),average_runs_per_visit:siteVisits.one?starts.length/siteVisits.one:null,median_runs_per_visit:median(siteVisits.values),
 median_run_duration:median(durations),measured_duration_count:durations.length,best_updates:bestRuns.size,best_update_rate:ratio(matchedBest,starts.length),
 return_to_portal_count:returned.length,return_to_portal_rate:ratio(firstStarts.filter(e=>returnVisits.has(visitGameKey(e))).length,firstStarts.length),cross_game_rate:ratio(cross,firstStarts.length),
 client_error_count:rows.filter(e=>e.event_name==='client_error').length,retry_count:rows.filter(e=>e.event_name==='retry').length,failure_retry_rate:ratio(retried,failures.length),
 large_fall_count:largeFalls.length,large_fall_recovery_rate:ratio(recoveries,largeFalls.length),next_day_return_rate:returnRate(rows,byBrowser,period,1),seven_day_return_rate:returnRate(rows,byBrowser,period,7),
 device_split:countBy(deviceRows,e=>e.device_class),traffic_source_split:countBy(deviceRows,e=>{const source=trafficByVisit.get(`${e.browser_id}:${e.visit_id}`)??'unknown';return ['instagram','tiktok','x','youtube','direct','other','unknown'].includes(source)?source:'other';}),
 top_failure_reasons:top(countBy(failureRows,e=>String(e.data.failure_reason??e.data.failureCause??e.data.cause??e.data.reason??'unknown'))),top_exit_phases:top(countBy(exits,e=>String(e.data.phase??'unknown')))};
}
function funnel(rows:Event[], gameId:string):({step:string}&Ratio)[]{
 const starts=unique(rows.filter(e=>e.event_name==='run_start'&&e.run_id!==null),runKey);const measured=new Set(starts.map(runKey));
 const step=(label:string,predicate:(e:Event)=>boolean)=>({step:label,...ratio(new Set(rows.filter(e=>e.run_id!==null&&measured.has(runKey(e))&&predicate(e)).map(runKey)).size,starts.length)});
 if(gameId==='game019')return [{step:'run_start',...ratio(starts.length,starts.length)},...[25,50,75].map(h=>step(`${h}m`,e=>Math.max(Number(e.data.height??0),Number(e.data.section_from??0),Number(e.data.jump_end_height??0))>=h)),step('well_clear',e=>['well_clear','well_cleared'].includes(subtype(e))||e.data.phase==='shore'),step('sky',e=>['sky_reached','chapter_reached'].includes(subtype(e))&&e.data.chapter==='sky'||e.data.phase==='sky'),step('space',e=>['space_clear','space_reached'].includes(subtype(e))||e.data.phase==='space')];
 if(gameId==='game018')return [{step:'run_start',...ratio(starts.length,starts.length)},step('shoe',e=>typeof e.data.shoe==='string'),step('JUST',e=>e.data.just===true||e.data.just_power===true),step('space',e=>e.data.phase==='space'||e.data.special==='ORBITAL SHOE'||e.event_name==='space_reached'),step('spaceship',e=>e.event_name==='spaceship_collision'||e.data.special==='UFO INCIDENT'),step('rare_eligible',e=>e.data.eligible===true),step('rare_won',e=>e.data.won===true),step('rare_shown',e=>e.data.shown===true||e.event_name==='rare_effect_shown'),step('landing',e=>e.event_name==='run_end'&&e.data.outcome==='clear')];
 if(gameId==='game015')return [{step:'run_start',...ratio(starts.length,starts.length)},...[50,100,200,500].map(d=>step(`${d}m`,e=>typeof e.data.depth==='number'&&e.data.depth>=d))];
 return [{step:'run_start',...ratio(starts.length,starts.length)},step('run_end',e=>e.event_name==='run_end')];
}
export function unpack(rows:StoredEvent[]):Event[]{return rows.map(({data_json,received_at,...row})=>{void received_at;return {...row,data:JSON.parse(data_json)};});}
export function summarizeGames(events:Event[],period:Period,includeRetired=false,context=events):GameMetrics[]{
 const ids=Array.from({length:20},(_,i)=>`game${String(i+1).padStart(3,'0')}`).filter(id=>includeRetired||id!=='game010');
 return ids.map(game_id=>{const rows=events.filter(e=>e.game_id===game_id);const versions=new Map<string,{game_version:string;rules_version:string;presentation_version:string;event_count:number}>();for(const e of rows){const key=`${e.game_version}:${e.rules_version}:${e.presentation_version}`;const v=versions.get(key)??{game_version:e.game_version,rules_version:e.rules_version,presentation_version:e.presentation_version,event_count:0};v.event_count++;versions.set(key,v);}
 return {...computeMetrics(rows,context,period),game_id,status:game_id==='game010'?'retired':'active',versions:[...versions.values()],funnel:funnel(rows,game_id),measurement_coverage:['game012','game013','game014'].includes(game_id)?'legacy_uninstrumented: shell opens/navigation; native RUN/progress not measured':rows.length?'consented observed events; missing endpoints and milestones remain unknown':'not_measured'};});
}
