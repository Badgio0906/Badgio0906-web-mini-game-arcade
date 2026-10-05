import { describe,it,expect } from 'vitest';
import { summarizeGame019 } from '../../tools/analyze-game019.mjs';
const event=(name:string,data:Record<string,string|number|boolean>,session='test-session')=>({name,at:'2026-10-05T22:00:00.000Z',data:{game_id:'game019',session_id:session,run_id:1,...data}});
describe('Game019 offline retained data analysis',()=>{
 it('reports observed charge bands, failed height bins, fall pairs and explicit reach denominators',()=>{
 const events=[event('run_start',{}),event('specific_game_events',{event:'jump',jump_charge_ms:80,jump_power_normalized:80/700,jump_band:'short',jump_start_height:0}),event('specific_game_events',{event:'jump',jump_charge_ms:450,jump_power_normalized:450/700,jump_band:'medium',jump_start_height:0}),event('specific_game_events',{event:'jump_end',jump_start_height:0,jump_end_height:3.6,landing_success:true}),event('specific_game_events',{event:'fall_end',fall_start_height:4.94,fall_end_height:3.6,fall_distance:1.34,progress_lost:0}),event('run_end',{score:4.94,jumps:2,outcome:'quit'})];
 const s=summarizeGame019(events);expect(s.charge.averageMs).toBe(265);expect(s.charge.bandCounts).toEqual({short:1,medium:1,long:0});expect(s.falls.heightPairs[0].from).toBe(4.94);expect(s.window.completeJumpCoverageRuns).toBe(1);expect(s.reachRates.height50).toEqual({numerator:0,denominator:1,value:0});expect(s.reachRates.space200.value).toBe(0);
 });
 it('does not invent a reach denominator or zero average when retained starts/measurements are missing',()=>{
 const s=summarizeGame019([event('run_end',{score:200,jumps:54,outcome:'clear'}),event('specific_game_events',{event:'space_clear',height:200})]);expect(s.reachRates.space200.value).toBeNull();expect(s.reachRates.space200.denominator).toBe(0);expect(s.charge.averageMs).toBeNull();expect(s.window.runsMissingStart).toBe(1);
 });
 it('keeps different page sessions separate, ignores practice/non019 records and rejects invalid envelope values',()=>{
 const s=summarizeGame019([event('run_start',{}),event('run_end',{score:10,jumps:0}),event('run_start',{},'second'),event('run_end',{score:200,jumps:0},'second'),{name:'practice_complete',at:'2026-10-05T22:00:00Z',data:{game_id:'game019',session_id:'test-session'}},event('specific_game_events',{event:'jump',jump_charge_ms:NaN,jump_power_normalized:.5,jump_band:'medium'}),{...event('run_start',{}),data:{game_id:'game015',session_id:'other',run_id:1}}]);
 expect(s.window.completeObservedRuns).toBe(2);expect(s.charge.observedJumps).toBe(0);expect(s.reachRates.height50.value).toBe(.5);
 });
});
