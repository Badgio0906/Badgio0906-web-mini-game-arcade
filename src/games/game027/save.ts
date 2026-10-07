import { type World, WIDTH, HEIGHT } from './physics';
import { type Match } from './rules';
import type { Difficulty } from './cpu';
export const SAVE_KEY = 'web-mini-arcade:v1:game027:state';
export interface Snapshot {
    world: World;
    match: Match;
    mode: 'cpu' | 'two';
    difficulty: Difficulty;
    angle: number;
    power: number;
    observerRun: string | null;
    localResultId: string;
}
export interface Saved {
    game_id: 'game027';
    rules_version: '1';
    snapshot: Snapshot | null;
    stats: {
        games: number;
        wins: number;
        fouls: number;
        shots: number;
    };
    reported: string[];
}
export function blankSave(): Saved { return { game_id: 'game027', rules_version: '1', snapshot: null, stats: { games: 0, wins: 0, fouls: 0, shots: 0 }, reported: [] }; }
const number = (x: unknown, min: number, max: number): x is number => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;
const integer = (x: unknown, min: number, max: number) => number(x, min, max) && Number.isInteger(x);
export function validateSave(raw: unknown): Saved | null {
    try {
        const s = raw as Saved;
        if (!s || s.game_id !== 'game027' || s.rules_version !== '1' || !s.stats || !['games', 'wins', 'fouls', 'shots'].every(k => integer(s.stats[k as keyof Saved['stats']], 0, 1e9)) || s.stats.wins > s.stats.games)
            return null;
        if (!Array.isArray(s.reported) || s.reported.length > 100 || !s.reported.every(id => typeof id === 'string' && /^[a-z0-9-]{1,80}$/.test(id)))
            return null;
        const p = s.snapshot;
        if (!p)
            return structuredClone(s);
        if (!['cpu', 'two'].includes(p.mode) || !['easy', 'normal', 'strong'].includes(p.difficulty) || !number(p.angle, -1e6, 1e6) || !number(p.power, 0, 1) || typeof p.localResultId !== 'string' || !/^[a-z0-9-]{1,80}$/.test(p.localResultId) || !(p.observerRun === null || typeof p.observerRun === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(p.observerRun)))
            return null;
        const w = p.world, m = p.match;
        if (!w || typeof w.moving !== 'boolean' || !number(w.shotTime, 0, 20.1) || !Array.isArray(w.balls) || w.balls.length !== 16 || new Set(w.balls.map(b => b.id)).size !== 16 || !w.balls.every(b => integer(b.id, 0, 15) && number(b.x, -24, WIDTH + 24) && number(b.y, -24, HEIGHT + 24) && number(b.vx, -1600, 1600) && number(b.vy, -1600, 1600) && typeof b.pocketed === 'boolean'))
            return null;
        if (!m || ![0, 1].includes(m.turn) || !(m.winner === null || [0, 1].includes(m.winner)) || typeof m.break !== 'boolean' || typeof m.ballInHand !== 'boolean' || m.groups.length !== 2 || !m.groups.every(g => g === null || g === 'solid' || g === 'stripe') || !(m.groups[0] === null ? m.groups[1] === null : m.groups[1] !== null && m.groups[1] !== m.groups[0]) || !m.shots.every(n => integer(n, 0, 1e9)) || m.shots.length !== 2 || m.fouls.length !== 2 || !m.fouls.every(n => integer(n, 0, 1e9)))
            return null;
        const t = w.shot;
        if (w.moving !== !!t)
            return null;
        if (t && (![0, 1].includes(t.shooter) || t.shooter !== m.turn || typeof t.break !== 'boolean' || t.break !== m.break || typeof t.railAfterContact !== 'boolean' || !(t.firstContact === null || integer(t.firstContact, 1, 15)) || !Array.isArray(t.legalTargets) || !t.legalTargets.every(n => integer(n, 1, 15)) || !Array.isArray(t.pocketed) || !t.pocketed.every(n => integer(n, 0, 15)) || new Set(t.pocketed).size !== t.pocketed.length))
            return null;
        if (m.winner !== null && w.moving)
            return null;
        return structuredClone(s);
    }
    catch {
        return null;
    }
}
/** Local outcome identity is gameplay-only, not an invented Analytics RUN identity. */
export function recordOutcome(s: Saved, snapshot: Snapshot): boolean {
    const id = snapshot.localResultId;
    if (s.reported.includes(id))
        return false;
    s.reported = [...s.reported, id].slice(-100);
    s.stats.games++;
    if (snapshot.match.winner === 0)
        s.stats.wins++;
    s.stats.shots += snapshot.match.shots.reduce((a, b) => a + b, 0);
    s.stats.fouls += snapshot.match.fouls.reduce((a, b) => a + b, 0);
    return true;
}
export class PoolStore {
    private memory: string | null = null;
    private memoryOnly = false;
    constructor(private backend?: Pick<Storage, 'getItem' | 'setItem'>) { try {
        this.backend ??= window.localStorage;
    }
    catch {
        this.memoryOnly = true;
    } }
    read(): Saved { try {
        const raw = this.memory ?? (this.memoryOnly ? null : this.backend?.getItem(SAVE_KEY));
        if (!raw)
            return blankSave();
        const valid = raw.length < 100000 ? validateSave(JSON.parse(raw)) : null;
        if (valid)
            return valid;
        this.memoryOnly = true;
        const fallback = blankSave();
        this.memory = JSON.stringify(fallback);
        return fallback;
    }
    catch {
        this.memoryOnly = true;
        const fallback = blankSave();
        this.memory = JSON.stringify(fallback);
        return fallback;
    } }
    write(s: Saved): void { this.memory = JSON.stringify(s); if (!this.memoryOnly)
        try {
            this.backend?.setItem(SAVE_KEY, this.memory);
        }
        catch {
            this.memoryOnly = true;
        } }
}
