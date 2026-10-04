import { describe, expect, it, vi } from 'vitest';
import { StorageService } from '../../src/core/StorageService';
import { CreditService } from '../../src/core/CreditService';
import { TelemetryService } from '../../src/core/TelemetryService';
import { MOVE_SECONDS, WorkdayRun, districtAt, laneX, speedAt, validateWaves, type EnemyType } from '../../src/games/game002/WorkdayRun';

function seeded(seed: number) {
  let value = seed;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}

function backend(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => [...values.keys()][index] ?? null,
    removeItem: key => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

describe('Game002 shared services isolation', () => {
  it('preserves legacy Game001 data and isolates credits, best and mute per game', () => {
    const shared = backend();
    shared.setItem('orbit-shift:v1:best', '987');
    shared.setItem('orbit-shift:v1:credits', '2');
    const orbit = new StorageService(shared);
    const workday = new StorageService(shared, 'web-mini-arcade:v1:game002:');
    const tower = new StorageService(shared, 'web-mini-arcade:v1:game003:');
    expect(orbit.readNumber('best', 0)).toBe(987);
    expect(orbit.readNumber('credits', 3)).toBe(2);
    workday.writeNumber('credits', 0);
    workday.writeNumber('best', 438);
    workday.writeBoolean('muted', true);
    expect(orbit.readNumber('credits', 3)).toBe(2);
    expect(orbit.readNumber('best', 0)).toBe(987);
    expect(orbit.readBoolean('muted', false)).toBe(false);
    expect(tower.readNumber('credits', 3)).toBe(3);
    const reloaded = new StorageService(shared, 'web-mini-arcade:v1:game002:');
    expect(reloaded.readNumber('credits', 3)).toBe(0);
    expect(reloaded.readNumber('best', 0)).toBe(438);
    expect(reloaded.readBoolean('muted', false)).toBe(true);
  });

  it('same run IDs in different games consume their own credit', () => {
    const silence = vi.spyOn(console, 'debug').mockImplementation(() => {});
    try {
      const shared = backend();
      const firstStorage = new StorageService(shared);
      const secondStorage = new StorageService(shared, 'web-mini-arcade:v1:game002:');
      const first = new CreditService(firstStorage, new TelemetryService(firstStorage, 'game001'), true);
      const second = new CreditService(secondStorage, new TelemetryService(secondStorage, 'game002'), true);
      first.consume('run-1');
      second.consume('run-1');
      second.consume('run-2');
      expect(first.credits).toBe(2);
      expect(second.credits).toBe(1);
      expect(new CreditService(new StorageService(shared), new TelemetryService()).credits).toBe(2);
    } finally { silence.mockRestore(); }
  });

  it('all telemetry events carry the authoritative game ID and durations remain numeric', () => {
    const silence = vi.spyOn(console, 'debug').mockImplementation(() => {});
    try {
      const telemetry = new TelemetryService(undefined, 'game002');
      telemetry.trackEvent('game_open');
      telemetry.trackEvent('run_start', { game_id: 'game001' });
      telemetry.trackEvent('run_duration', { seconds: 45.5 });
      telemetry.trackEvent('office_clear', { distance: 1000 });
      expect(telemetry.getEvents().every(event => event.data.game_id === 'game002')).toBe(true);
      expect(telemetry.getEvents().find(event => event.name === 'run_duration')?.data.seconds).toBe(45.5);
      const legacy = new TelemetryService();
      legacy.trackEvent('game_open');
      expect(legacy.getEvents()[0].data).toMatchObject({ game: 'orbit-shift', game_id: 'game001' });
    } finally { silence.mockRestore(); }
  });
});

describe('WORKDAY DODGE model', () => {
  it('moves one interpolated lane per input, bounds queued movement and prevents edge overshoot', () => {
    const run = new WorkdayRun();
    expect(run.move(-1)).toBe(false);
    run.start();
    expect(run.move(-1)).toBe(true);
    expect(run.targetLane).toBe(0);
    run.step(0.05);
    expect(run.playerX).toBeLessThan(laneX(1));
    expect(run.playerX).toBeGreaterThan(laneX(0));
    run.step(0.05); run.step(0.05);
    expect(run.lane).toBe(0);
    expect(run.move(-1)).toBe(false);
    expect(run.move(1)).toBe(true);
    expect(run.move(1)).toBe(true);
    expect(run.move(1)).toBe(false);
    run.step(0.05);
    expect(run.playerX).toBeLessThan(laneX(1));
    for (let n = 0; n < 6; n++) run.step(0.05);
    expect(run.lane).toBe(2);
    expect(run.playerX).toBeCloseTo(laneX(2));
    expect(run.snapshot().queuedDirection).toBeNull();
    expect(run.move(1)).toBe(false);
    expect(MOVE_SECONDS).toBeGreaterThanOrEqual(0.1);
    expect(MOVE_SECONDS).toBeLessThanOrEqual(0.18);
  });

  it('does not catch up invisible seconds, collides once after a clear tutorial preview and resets cleanly', () => {
    const events: string[] = [];
    const run = new WorkdayRun(event => events.push(event.type), seeded(7));
    run.start();
    run.step(Infinity); run.step(NaN); run.step(-1);
    expect(run.time).toBe(0);
    run.step(30);
    expect(run.time).toBeCloseTo(0.05);
    for (let n = 0; n < 12 * 60 && run.alive; n++) run.step(1 / 60);
    expect(run.alive).toBe(false);
    expect(run.result()).toMatchObject({ cleared: false });
    expect(run.result()!.time).toBeGreaterThan(8);
    expect(events.filter(event => event === 'collision')).toHaveLength(1);
    const result = run.result();
    run.step(1); run.move(-1);
    expect(run.result()).toEqual(result);
    const copy = run.result()!;
    copy.distance = 999;
    expect(run.result()).toEqual(result);
    run.reset();
    expect(run.snapshot()).toMatchObject({ distance: 0, time: 0, lane: 1, targetLane: 1, alive: false, outcome: null });
    expect(run.result()).toBeNull();
    expect(run.enemies).toHaveLength(0);
    expect(events.filter(event => event === 'collision')).toHaveLength(1);
  });

  it('rejects all-lane blockade, invalid lanes and waves without a human reaction margin', () => {
    expect(validateWaves([{ encounterTime: 4, blockedLanes: [0, 1, 2] }])).toBe(false);
    expect(validateWaves([{ encounterTime: 4, blockedLanes: [1, 1] }])).toBe(false);
    expect(validateWaves([{ encounterTime: NaN, blockedLanes: [1] }])).toBe(false);
    expect(validateWaves([{ encounterTime: 4, blockedLanes: [-1 as 0] }])).toBe(false);
    expect(validateWaves([
      { encounterTime: 4, blockedLanes: [0, 1] }, { encounterTime: 5, blockedLanes: [1, 2] },
    ])).toBe(false);
    expect(validateWaves([
      { encounterTime: 4, blockedLanes: [0, 1] }, { encounterTime: 6.25, blockedLanes: [1, 2] },
    ])).toBe(true);
  });

  it('five seeded reactive runs reach 1000m, cover all four opponent types and keep generation bounded', () => {
    const seen = new Set<EnemyType>();
    for (const seed of [1, 17, 77, 12345, 4294967295]) {
      const events: string[] = [];
      const run = new WorkdayRun(event => events.push(event.type), seeded(seed));
      const seenWaves = new Set<number>();
      const seenEnemies = new Set<number>();
      run.start();
      for (let frame = 0; frame < 125 * 60 && run.alive; frame++) {
        if (run.snapshot().pending === 'company') { expect(run.choose('office')).toBe(true); break; }
        const wave = run.waves.find(candidate => candidate.encounterTime + 0.3 >= run.time);
        if (wave && wave.encounterTime - run.time < 1.15 && run.targetLane !== wave.safeLane) {
          run.move(run.targetLane < wave.safeLane ? 1 : -1);
        }
        run.step(1 / 60);
        expect(run.enemies.length).toBeLessThanOrEqual(12);
        expect(run.waves.length).toBeLessThanOrEqual(6);
        let generated = false;
        for (const current of run.waves) {
          if (seenWaves.has(current.id)) continue;
          seenWaves.add(current.id);
          generated = true;
          seen.add(current.type);
          expect(current.blockedLanes).not.toContain(current.safeLane);
        }
        if (generated) expect(validateWaves(run.waves)).toBe(true);
        for (const enemy of run.enemies) {
          if (seenEnemies.has(enemy.id)) continue;
          seenEnemies.add(enemy.id);
          if (enemy.type === 'B') {
            expect(enemy.warningStart).toBeLessThan(enemy.changeStart);
            expect(enemy.changeStart - enemy.warningStart).toBeGreaterThanOrEqual(0.6);
            expect(enemy.encounterTime - enemy.changeEnd).toBeGreaterThanOrEqual(1.2 - 1e-8);
            expect(Math.abs(enemy.fromLane - enemy.finalLane)).toBe(1);
          }
          if (enemy.type === 'C') {
            expect(enemy.fromLane).toBe(enemy.finalLane);
            expect(enemy.encounterTime - enemy.changeEnd).toBeGreaterThanOrEqual(1.2 - 1e-8);
          }
        }
      }
      expect(run.result(), `seed ${seed}`).toMatchObject({ cleared: true, distance: 1000 });
      expect(run.result()!.time).toBeGreaterThan(90);
      expect(run.result()!.time).toBeLessThan(120);
      expect(events.filter(event => event === 'clear')).toHaveLength(1);
      expect(events.filter(event => event === 'collision')).toHaveLength(0);
      expect(events.filter(event => event === 'district')).toHaveLength(3);
      const result = run.result();
      run.step(5);
      expect(run.result()).toEqual(result);
    }
    expect([...seen].sort()).toEqual(['A', 'B', 'C', 'D']);
  }, 15_000);

  it('changes district at quarter-route milestones and limits walking speed', () => {
    expect([0, 250, 500, 750, 1000].map(districtAt)).toEqual(['住宅街', '商店街', '駅周辺', 'オフィス街', 'オフィス街']);
    expect(speedAt(0)).toBe(9);
    expect(speedAt(1000)).toBe(12);
    expect(speedAt(99999)).toBe(12);
    for (let distance = 0; distance < 1000; distance++) expect(speedAt(distance + 1) - speedAt(distance)).toBeLessThan(0.004);
  });
});
