import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validatedEvents } from '../src/data/telemetrySchema.ts';
/** Device-local retained observations only. Missing starts/outcomes are never guessed. */
export function summarizeGame019(input) {
  const events = validatedEvents(input, 400).filter(e => e.data.game_id === 'game019');
  const groups = new Map(), jumps = [], landings = [], falls = [];
  for (const e of events) {
    const d=e.data;
    if (typeof d.run_id !== 'number' || !Number.isInteger(d.run_id) || d.run_id < 1 || typeof d.session_id !== 'string' || !d.session_id) continue;
    const key=`${d.session_id}:${d.run_id}`;
    if (!groups.has(key)) groups.set(key, { start:false, end:false, reached50:false, well:false, sky:false, space:false, declaredJumps:null, seenJumps:0 });
    const r=groups.get(key);
    if(e.name==='run_start')r.start=true;
    if(e.name==='run_end'){r.end=true;r.declaredJumps=typeof d.jumps==='number'?d.jumps:null; if(Number(d.score)>=50)r.reached50=true;}
    if(e.name==='phase_reached'){if(d.phase==='shore')r.well=true;if(d.phase==='sky')r.sky=true;if(d.phase==='space')r.space=true;}
    if(e.name!=='specific_game_events')continue;
    if(d.event==='well_clear')r.well=true;
    if(d.event==='chapter_reached'&&d.chapter==='sky')r.sky=true;
    if(d.event==='space_clear')r.space=true;
    if(d.event==='section_reached'&&Number(d.height)>=50)r.reached50=true;
    if(d.event==='jump' && typeof d.jump_charge_ms==='number' && d.jump_charge_ms>=0 && d.jump_charge_ms<=700 && typeof d.jump_power_normalized==='number' && d.jump_power_normalized>=0 && d.jump_power_normalized<=1){jumps.push(d);r.seenJumps++;if(Number(d.jump_start_height)>=50)r.reached50=true;}
    if(d.event==='jump_end'&&typeof d.landing_success==='boolean'){landings.push(d);if(Number(d.jump_end_height)>=50)r.reached50=true;}
    if(d.event==='fall_end'&&typeof d.fall_distance==='number'&&d.fall_distance>=0)falls.push(d);
  }
  const complete=[...groups.values()].filter(r=>r.start&&r.end), n=complete.length;
  const bands={short:0,medium:0,long:0};for(const j of jumps)if(Object.hasOwn(bands,j.jump_band))bands[j.jump_band]++;
  const failuresByHeight={};for(const d of landings.filter(d=>!d.landing_success)){const h=Number(d.jump_start_height);if(!Number.isFinite(h))continue;const bin=`${Math.floor(h/10)*10}-${Math.floor(h/10)*10+10}m`;failuresByHeight[bin]=(failuresByHeight[bin]??0)+1;}
  const rate=k=>({numerator:complete.filter(r=>r[k]).length,denominator:n,value:n?complete.filter(r=>r[k]).length/n:null});
  return { schemaVersion:1,gameId:'game019',provenance:'retained-device-local-observed-events',scope:'Single browser retained maximum400 events; not global analytics or human fun evidence',
    window:{events:events.length,runsWithStart:[...groups.values()].filter(r=>r.start).length,completeObservedRuns:n,runsMissingStart:[...groups.values()].filter(r=>!r.start).length,runsMissingEnd:[...groups.values()].filter(r=>!r.end).length,completeJumpCoverageRuns:complete.filter(r=>r.declaredJumps!==null&&r.declaredJumps===r.seenJumps).length},
    charge:{observedJumps:jumps.length,averageMs:jumps.length?jumps.reduce((s,j)=>s+j.jump_charge_ms,0)/jumps.length:null,bandCounts:bands,bandShare:Object.fromEntries(Object.entries(bands).map(([k,v])=>[k,jumps.length?v/jumps.length:null]))},
    landing:{observed:landings.length,failed:landings.filter(d=>!d.landing_success).length,failuresByStartHeight:failuresByHeight},
    falls:{observed:falls.length,recordedDropMeters:falls.reduce((s,d)=>s+d.fall_distance,0),progressLostMeters:falls.reduce((s,d)=>s+Number(d.progress_lost??0),0),heightPairs:falls.map(d=>({attempt:d.attempt_id??null,from:d.fall_start_height??null,to:d.fall_end_height??null,distance:d.fall_distance,progressLost:d.progress_lost??null}))},
    reachRates:{height50:rate('reached50'),well100:rate('well'),skyChapter:rate('sky'),space200:rate('space')},
    limitations:['Reach-rate denominator requires both run_start and run_end within this window; unfinished or truncated runs are excluded and counted separately.','Charge and fall statistics cover retained observations, not omitted earlier jumps. Jump count coverage is compared to run_end.jumps.','A failed landing means lost progress or a wall/ceiling bump; normal post-apex descent contributes to TOTAL FALL without necessarily losing progress.','No player identity, external transmission, human fun judgment or global rate is inferred.'] };
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (!process.argv[2]) throw new Error('Usage: node tools/analyze-game019.mjs device-export.json [output.json]');
  const input=JSON.parse(await readFile(process.argv[2],'utf8'));
  const result=summarizeGame019(Array.isArray(input)?input:input.events??[]);
  if (!Array.isArray(input) && typeof input.provenance === 'string') result.provenance=input.provenance;
  if (/synthetic/i.test(result.provenance)) result.scope='Synthetic schema example only; not observed play or player analytics';
  const json=JSON.stringify(result,null,2)+'\n';if(process.argv[3])await writeFile(process.argv[3],json);else process.stdout.write(json);
}
