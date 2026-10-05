import { writeFile } from 'node:fs/promises';
import { summarizeEvents } from '../src/data/telemetryAnalytics.ts';
const at = '2026-10-05T00:00:00.000Z';
const row = (game_id, session_id, name, data = {}) => ({ name, at, data: { game_id, session_id, ...data } });
const events = [
  row('game015', 'SYNTHETIC-fall-page', 'game_open'),
  row('game015', 'SYNTHETIC-fall-page', 'tutorial_skip'),
  row('game015', 'SYNTHETIC-fall-page', 'run_start', { runId: 'SYNTHETIC-fall-1' }),
  row('game015', 'SYNTHETIC-fall-page', 'specific_game_events', { runId: 'SYNTHETIC-fall-1', event: 'drop_hold', depth: 9 }),
  row('game015', 'SYNTHETIC-fall-page', 'death_reason', { runId: 'SYNTHETIC-fall-1', reason: 'fall_distance', depth: 18 }),
  row('game015', 'SYNTHETIC-fall-page', 'run_end', { runId: 'SYNTHETIC-fall-1', outcome: 'over', reason: 'fall_distance', time: 15, depth: 18, score: 18 }),
  row('game019', 'SYNTHETIC-frog-page', 'game_open'),
  row('game019', 'SYNTHETIC-frog-page', 'practice_start'),
  row('game019', 'SYNTHETIC-frog-page', 'practice_complete'),
  row('game019', 'SYNTHETIC-frog-page', 'run_start', { runId: 'SYNTHETIC-frog-1' }),
  row('game019', 'SYNTHETIC-frog-page', 'phase_reached', { runId: 'SYNTHETIC-frog-1', phase: 'sky', height: 100 }),
  row('game019', 'SYNTHETIC-frog-page', 'specific_game_events', { runId: 'SYNTHETIC-frog-1', event: 'fall_recovered', distance: 15 }),
  row('game019', 'SYNTHETIC-frog-page', 'run_end', { runId: 'SYNTHETIC-frog-1', outcome: 'quit', time: 120, height: 110 }),
  row('game018', 'SYNTHETIC-shoe-page', 'game_open'),
  row('game018', 'SYNTHETIC-shoe-page', 'run_start', { runId: 'SYNTHETIC-shoe-1', shoe: 'sneaker' }),
  row('game018', 'SYNTHETIC-shoe-page', 'phase_reached', { runId: 'SYNTHETIC-shoe-1', phase: 'spin' }),
  row('game018', 'SYNTHETIC-shoe-page', 'specific_game_events', { runId: 'SYNTHETIC-shoe-1', event: 'spin_choice', spin: -0.5 }),
  row('game018', 'SYNTHETIC-shoe-page', 'run_end', { runId: 'SYNTHETIC-shoe-1', outcome: 'clear', time: 23, score: 150, distance: 123 }),
  row('game018', 'SYNTHETIC-shoe-page', 'best_update', { runId: 'SYNTHETIC-shoe-1', best: 150 }),
];
await writeFile('jev_export/telemetry_samples/synthetic.json', JSON.stringify({ schemaVersion: 1, provenance: 'synthetic-example-not-real-player-observations', purpose: 'Schema and aggregator fixture only; no popularity or completion claims', events }, null, 2) + '\n');
await writeFile('jev_export/analytics_summary/synthetic.json', JSON.stringify({ provenance: 'synthetic-example-not-real-player-observations', analytics: summarizeEvents(events) }, null, 2) + '\n');
await writeFile('jev_export/analytics_summary/observed_status.json', JSON.stringify({ schemaVersion: 1, provenance: 'no-player-dataset-collected-for-this-repository', realUserAnalytics: null, sampleSize: null, note: 'Each browser can export its own bounded records. No central analytics endpoint exists. Use those exported events only with their retained-window limitation.' }, null, 2) + '\n');
