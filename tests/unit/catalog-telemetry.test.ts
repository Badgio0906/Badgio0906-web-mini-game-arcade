import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gameCatalog, filterCatalog } from '../../src/data/gameCatalog';
import { tagCatalog } from '../../src/data/tagCatalog';
import { isTelemetryEvent, validatedEvents, type TelemetryEvent } from '../../src/data/telemetrySchema';
import { TelemetryService, TELEMETRY_KEY } from '../../src/core/TelemetryService';
import { summarizeEvents } from '../../src/data/telemetryAnalytics';

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}
const event = (name: TelemetryEvent['name'], data: TelemetryEvent['data']): TelemetryEvent => ({ name, at: '2026-10-05T00:00:00.000Z', data: { game_id: 'game015', session_id: 'test-page', ...data } });
beforeEach(() => vi.spyOn(console, 'debug').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe('catalog identity and future tag filtering', () => {
  it('keeps legacy routes/tags attached to the actual title and appends020', () => {
    expect(new Set(gameCatalog.map(game => game.id)).size).toBe(gameCatalog.length);
    const work = gameCatalog.find(game => game.id === 'game012')!;
    const tasks = gameCatalog.find(game => game.id === 'game013')!;
    expect(work.titleJa).toBe('お前の仕事は俺の仕事');
    expect(work.route).toContain('yokodori-days');
    expect(work.tags.some(tag => tag.id === 'timing')).toBe(true);
    expect(tasks.titleJa).toBe('タスク天国');
    expect(tasks.tags.some(tag => tag.id === 'rhythm')).toBe(true);
    expect(gameCatalog.at(-1)?.route).toBe('./game020.html');
    expect(gameCatalog.at(-1)?.tags.map(tag => tag.id)).toEqual(['puzzle','decision','brain-training']);
    expect(gameCatalog.every(game => game.tags.length >= 3 && game.tags.every(tag => tagCatalog.some(known => known.id === tag.id && known.label === tag.label)))).toBe(true);
    expect(filterCatalog(['jump','animal']).map(game => game.id)).toEqual(['game019']);
  });
});

describe('local telemetry boundary', () => {
  it('rejects corrupt/unknown/nonfinite/object data and copies valid records', () => {
    expect(isTelemetryEvent(event('score', { score: Infinity }))).toBe(false);
    expect(isTelemetryEvent({ ...event('score', {}), name: 'unknown' })).toBe(false);
    expect(isTelemetryEvent({ ...event('score', {}), at: 'broken' })).toBe(false);
    expect(isTelemetryEvent({ ...event('score', {}), data: { nested: {} } })).toBe(false);
    expect(isTelemetryEvent(event('specific_game_events', { event: 'drop_hold', depth: 25 }))).toBe(true);
    const original = event('score', { score: 12 });
    const records = validatedEvents([null, original]); records[0].data.score = 999;
    expect(original.data.score).toBe(12);
  });
  it('retains cross-page game records in a bounded400window without changing200memory', () => {
    const backend = new MemoryStorage();
    const first = new TelemetryService(undefined, 'game015', backend);
    for (let score = 0; score < 420; score++) first.trackEvent('score', { score });
    expect(first.getEvents()).toHaveLength(200);
    const next = new TelemetryService(undefined, 'game018', backend);
    next.trackEvent('game_open');
    const records = next.exportRecords();
    expect(records.events).toHaveLength(400);
    expect(records.events[0].data.score).toBe(21);
    expect(records.events.at(-1)?.data.game_id).toBe('game018');
    expect(records.events.at(-1)?.data.session_id).not.toBe(records.events[0].data.session_id);
    expect(records.provenance).toBe('device-local-observed-events');
  });
  it('recovers from corrupt and denied storage without stale resurrection', () => {
    const backend = new MemoryStorage(); backend.setItem(TELEMETRY_KEY, 'corrupt');
    const first = new TelemetryService(undefined, 'game015', backend);
    first.trackEvent('game_open');
    vi.spyOn(backend, 'setItem').mockImplementation(() => { throw Error('quota'); });
    first.trackEvent('run_start', { runId: 'test' });
    first.trackEvent('run_end', { runId: 'test', time: 4, outcome: 'over' });
    expect(first.exportRecords().events.map(row => row.name)).toEqual(['game_open','run_start','run_end']);
  });
});

describe('retained-window analytics', () => {
  it('preserves a later page departure after quitting and beginning another run', () => {
    const rows = [event('run_start'), event('run_end', { outcome: 'quit' }), event('run_start'), event('page_exit', { phase: 'playing' })];
    const game = summarizeEvents(rows).byGame.find(row => row.gameId === 'game015')!;
    expect(game.exitPhases.playing).toBe(2);
  });
  it('counts a restarted ascent as interrupted rather than completed', () => {
    const rows = [event('run_start'), event('run_end', { outcome: 'restart', seconds: 4 }), event('run_start'), event('run_end', { outcome: 'clear', seconds: 8 })];
    const game = summarizeEvents(rows).byGame.find(row => row.gameId === 'game015')!;
    expect(game.playCount).toBe(2); expect(game.completedRunCount).toBe(1); expect(game.measuredDurationCount).toBe(2);
  });
  it('does not double count quits/deaths or fabricate unreported positions and durations', () => {
    const rows = [event('run_start', { runId: 'r1' }), event('phase_reached', { phase: 'cavern' }),
      event('death_reason', { runId: 'r1', reason: 'spikes', depth: 20 }), event('run_end', { runId: 'r1', outcome: 'over', reason: 'spikes', time: 8 }),
      event('run_start', { runId: 'r2' }), event('run_end', { runId: 'r2', outcome: 'quit', time: 2 }), event('page_exit', { phase: 'playing' })];
    const summary = summarizeEvents(rows);
    const game = summary.byGame.find(row => row.gameId === 'game015')!;
    expect(game.playCount).toBe(2); expect(game.averagePlaySeconds).toBe(5);
    expect(game.deathReasons.spikes).toBe(1); expect(game.firstDeathLocations[0].position).toBe(20);
    expect(Object.values(game.exitPhases).reduce((a,b) => a+b,0)).toBe(1);
    expect(summary.byGame.find(row => row.gameId === 'game012')?.averagePlaySeconds).toBeNull();
    expect(summary.byTag.find(row => row.tagId === 'fall')?.playCount).toBe(2);
  });
});
