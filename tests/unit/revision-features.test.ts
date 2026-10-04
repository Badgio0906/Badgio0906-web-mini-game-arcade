import { describe, expect, it } from 'vitest';
import { NICE_DODGE_WINDOW_SECONDS, PLAYER_Y, PREVIEW_SECONDS, WorkdayRun } from '../../src/games/game002/WorkdayRun';
import { bonusPercentForDodges, calculateWorkdayScore } from '../../src/games/game002/scoring';
import { buildingTitle } from '../../src/games/game003/resultFlavor';
import { MEMORY_COMMENT_SUFFIX, memoryComment } from '../../src/games/game004/resultFlavor';

function advance(run: WorkdayRun, time: number) {
  while (run.alive && run.time < time - 1e-10) run.step(Math.min(1 / 240, time - run.time));
}
function opening(lead: number) {
  const events: string[] = [];
  const run = new WorkdayRun(event => events.push(event.type), () => 0);
  run.start();
  const enemy = run.enemies[0];
  const entry = enemy.encounterTime - 32 * PREVIEW_SECONDS / (PLAYER_Y + 40);
  advance(run, entry - lead);
  run.move(-1);
  return { run, entry, events };
}

describe('Workday genuine NICE DODGE', () => {
  it('counts a real late escape only after its threat safely passes; no input-time reward', () => {
    const {run, entry, events} = opening(.3);
    expect(run.snapshot().dodges).toBe(0);
    advance(run, entry + .25);
    expect(run.alive).toBe(true);
    expect(run.snapshot().dodges).toBe(0);
    advance(run, run.enemies[0].encounterTime + .3);
    expect(run.snapshot().dodges).toBe(1);
    expect(events.filter(e => e === 'dodge')).toHaveLength(1);
    advance(run, run.time + .7);
    expect(run.snapshot().dodges).toBe(1);
  });

  it('accepts the inclusive late-window boundary and rejects an escape just outside it', () => {
    expect(NICE_DODGE_WINDOW_SECONDS).toBe(.65);
    for (const [lead, expected] of [[.65, 1], [.65 - 1e-7, 1], [.65 + 1e-7, 0]] as const) {
      const {run} = opening(lead);
      advance(run, 9.31);
      expect(run.alive).toBe(true);
      expect(run.snapshot().dodges, `lead=${lead}`).toBe(expected);
    }
  });

  it('idle safe placement, a safe-lane wiggle and fatal delayed input cannot farm bonuses', () => {
    const idle = opening(2).run;
    advance(idle, 9.31);
    expect(idle.snapshot().dodges).toBe(0);
    // RNG0 puts the second ordinary opponent in lane0. A move lane1→2 never escapes its threat.
    idle.move(1); advance(idle, 10);
    const next = idle.waves.find(w => w.id === 1)!;
    advance(idle, next.encounterTime - .5); idle.move(1);
    advance(idle, next.encounterTime + .31);
    expect(idle.alive).toBe(true);
    expect(idle.snapshot().dodges).toBe(0);
    const fatal = opening(.001).run;
    advance(fatal, 9.31);
    expect(fatal.alive).toBe(false);
    expect(fatal.result()!.dodges).toBe(0);
  });

  it('returning to the threat before entry invalidates the earlier escape', () => {
    const {run, entry} = opening(.6);
    advance(run, entry - .4); run.move(1);
    advance(run, entry + .01);
    expect(run.alive).toBe(false);
    expect(run.result()!.dodges).toBe(0);
  });

  it('many late escapes count once per wave, including two-person waves, and terminal score uses actual run values', () => {
    const events: string[] = [];
    const run = new WorkdayRun(event => events.push(event.type), () => 0);
    const positioned = new Set<number>(); const escaped = new Map<number, number>(); const multi = new Set<number>();
    run.start();
    for (let frame = 0; frame < 110 * 240 && run.alive; frame++) {
      if (run.snapshot().pending === 'company') { expect(run.choose('office')).toBe(true); break; }
      const wave = run.waves.find(w => w.encounterTime + .3 >= run.time);
      if (wave) {
        const entry = wave.encounterTime - 32 * PREVIEW_SECONDS / (PLAYER_Y + 40);
        const lead = entry - run.time;
        const threat = wave.blockedLanes.find(l => Math.abs(l - wave.safeLane) === 1)!;
        if (lead < 1 && lead > .7 && !positioned.has(wave.id)) {
          if (run.targetLane !== threat) run.move(run.targetLane < threat ? 1 : -1);
          if (run.lane === threat && !run.snapshot().moving) positioned.add(wave.id);
        }
        if (lead <= .3 && lead > .2 && positioned.has(wave.id) && !escaped.has(wave.id)) {
          expect(run.move(run.lane < wave.safeLane ? 1 : -1)).toBe(true);
          escaped.set(wave.id, wave.encounterTime); if (wave.blockedLanes.length === 2) multi.add(wave.id);
        }
      }
      run.step(1 / 240);
    }
    expect(run.result()).toMatchObject({cleared: true, distance: 1000});
    expect(multi.size).toBeGreaterThan(5);
    // A last escape that has not fully passed at the 1000m clear is deliberately not rewarded.
    const safelyPassed = [...escaped.values()].filter(encounter => run.time > encounter + 35 * PREVIEW_SECONDS / (PLAYER_Y + 40)).length;
    expect(run.result()!.dodges).toBe(safelyPassed);
    expect(events.filter(e => e === 'dodge')).toHaveLength(safelyPassed);
    expect(run.result()).toMatchObject(calculateWorkdayScore(1000, safelyPassed));
    const result = run.result(); run.step(.05); run.move(-1);
    expect(run.result()).toEqual(result);
  });
});

describe('Workday score tiers', () => {
  it('uses stage bonuses rather than distance × dodge count, at every threshold', () => {
    const examples = [[0,100],[2,100],[3,110],[5,110],[6,125],[9,125],[10,145],[14,145],[15,170],[100,170]] as const;
    for (const [dodges, percent] of examples) {
      expect(bonusPercentForDodges(dodges)).toBe(percent);
      expect(calculateWorkdayScore(648, dodges)).toMatchObject({distance:648,dodges,bonusPercent:percent,score:Math.floor(648*percent/100)});
    }
    expect(calculateWorkdayScore(648,8).score).toBe(810);
    expect(calculateWorkdayScore(101,3).score).toBe(111);
  });
});

describe('Result flavor helpers', () => {
  it('gives stable nonempty Tower ranks and increasingly extravagant high-floor titles', () => {
    expect(buildingTitle(0)).toBeTruthy();
    expect(buildingTitle(18)).not.toBe(buildingTitle(0));
    const mega = buildingTitle(1000);
    expect(mega.length).toBeGreaterThan(buildingTitle(0).length);
    expect(mega).toMatch(/スーパー|ウルトラ|銀河|ハイパー|アルティメット/);
    expect(buildingTitle(1000)).toBe(mega);
  });
  it('switches titles at the published accepted-floor thresholds', () => {
    const boundaries = [2,5,12,24,32,40,50,60,80,100,140];
    for (const threshold of boundaries) {
      expect(buildingTitle(threshold)).not.toBe(buildingTitle(threshold - 1));
      expect(buildingTitle(threshold + .9)).toBe(buildingTitle(threshold));
    }
    expect(buildingTitle(18)).toBe('一流棟梁');
    expect(buildingTitle(60)).toBe('超スーパーエグゼクティブウルトラ神大工');
  });
  it('switches joke bands at reached levels with the suffix retained', () => {
    for (const threshold of [4,7,10,14,18,24,32]) {
      expect(memoryComment(threshold)).not.toBe(memoryComment(threshold - 1));
      expect(memoryComment(threshold + .9)).toBe(memoryComment(threshold));
    }
    expect(memoryComment(1)).toBe('5歳相当の記憶力です（わが家の子供調べ）');
    expect(memoryComment(32)).toBe('もはや記憶装置です（わが家の子供調べ）');
  });
  it('keeps the family-joke disclaimer in every memory band, with distinct progression', () => {
    const comments = [1,4,8,16,1000].map(memoryComment);
    for (const comment of comments) expect(comment).toContain(MEMORY_COMMENT_SUFFIX);
    expect(new Set(comments).size).toBeGreaterThanOrEqual(3);
    expect(MEMORY_COMMENT_SUFFIX).toContain('わが家の子供調べ');
  });
});
