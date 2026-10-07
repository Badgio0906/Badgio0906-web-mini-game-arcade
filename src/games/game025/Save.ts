import { Mines, RULES, counts, type Difficulty, type Proof, type Action } from './Mines';
export type Stats = { won: number; lost: number; reported: string[] };
export type Snapshot = { save_version: 2; firstOpenPending: number | null; resultId: string | null; game_id: 'game025'; rules_version: string; board: { difficulty: Difficulty; mines: boolean[]; numbers: number[]; opened: boolean[]; flags: boolean[]; outcome: string; start: number | null; proof: Proof | null; history: Action[] }; elapsedMs: number; hints: number; runId: string | null; reported: boolean; stats: Stats };
export function snapshot(board: Mines, elapsedMs: number, hints: number, runId: string | null, reported: boolean, stats: Stats, resultId: string | null = runId, firstOpenPending: number | null = null): Snapshot {
  return { save_version: 2, firstOpenPending, resultId, game_id: 'game025', rules_version: RULES, board: { difficulty: board.difficulty, mines: [...board.mines], numbers: [...board.numbers], opened: [...board.opened], flags: [...board.flags], outcome: board.outcome, start: board.start, proof: board.proof, history: board.history.map(a => ({ ...a })) }, elapsedMs, hints, runId, reported, stats: { ...stats, reported: [...stats.reported] } };
}
const integer = (n: unknown, max: number) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max;
const id = (v: unknown) => typeof v === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
export function restore(value: unknown): { board: Mines; saved: Snapshot } | null {
  try {
    const s = value as Snapshot, b = s.board;
    if (s.save_version !== 2 || s.resultId !== null && !id(s.resultId) || s.game_id !== 'game025' || s.rules_version !== RULES || !b || !['beginner','intermediate'].includes(b.difficulty) || !integer(s.hints, 1000000) || typeof s.elapsedMs !== 'number' || !Number.isFinite(s.elapsedMs) || s.elapsedMs < 0 || s.elapsedMs > 31536000000 || s.runId !== null && !id(s.runId) || typeof s.reported !== 'boolean') return null;
    if (!s.stats || !integer(s.stats.won, 1000000) || !integer(s.stats.lost, 1000000) || !Array.isArray(s.stats.reported) || s.stats.reported.length > 100 || !s.stats.reported.every(id) || new Set(s.stats.reported).size !== s.stats.reported.length || s.stats.reported.length > s.stats.won + s.stats.lost) return null;
    if (s.reported && (!s.resultId || !s.stats.reported.includes(s.resultId) || !['won','lost'].includes(b.outcome))) return null;
    if (!s.reported && s.resultId && s.stats.reported.includes(s.resultId)) return null;
    if (s.runId !== null && s.resultId === null) return null;
    const board = new Mines(b.difficulty);
    if (!Array.isArray(b.mines) || !Array.isArray(b.numbers) || !Array.isArray(b.history) || b.history.length > 20000 || !Array.isArray(b.opened) || !Array.isArray(b.flags)) return null;
    if (b.mines.length) {
      if (b.start === null || !board.initialize(b.mines, b.start, b.proof) || b.difficulty === 'beginner' && !b.proof || JSON.stringify(b.numbers) !== JSON.stringify(counts(b.mines, board.width, board.height))) return null;
    } else if (b.start !== null || b.proof !== null || b.numbers.length || b.history.some(a => a.type !== 'flag')) return null;
    for (const a of b.history) if (!a || !['open','flag','chord'].includes(a.type) || !board.act(a.type, a.cell)) return null;
    if (s.firstOpenPending !== null && (!s.resultId || !board.initialized || !board.valid(s.firstOpenPending) || s.firstOpenPending !== b.start || board.outcome !== 'active' || board.flags[s.firstOpenPending] || b.history.some(a => a.type === 'open'))) return null;
    if (board.initialized && s.firstOpenPending === null && b.history.find(a => a.type === 'open')?.cell !== b.start) return null;
    if (JSON.stringify(board.opened) !== JSON.stringify(b.opened) || JSON.stringify(board.flags) !== JSON.stringify(b.flags) || board.outcome !== b.outcome || board.outcome === 'active' && s.reported) return null;
    if (board.outcome !== 'active' && (!s.reported || !s.resultId)) return null;
    if (board.history.length && !s.resultId) return null;
    return { board, saved: s };
  } catch { return null; }
}
/** One atomic JSON write holds board, outcome and reported ledger together. */
export class SaveStore {
  private memory: Snapshot | null = null;
  private memoryOnly = false;
  readonly key = 'web-mini-arcade:v1:game025:snapshot';
  read(): ReturnType<typeof restore> {
    if (this.memoryOnly) return this.memory ? restore(this.memory) : null;
    try { const raw = localStorage.getItem(this.key); if (raw && raw.length <= 1000000) return restore(JSON.parse(raw)); } catch { /* memory boundary */ }
    return this.memory ? restore(this.memory) : null;
  }
  write(value: Snapshot): void { this.memory = value; try { localStorage.setItem(this.key, JSON.stringify(value)); } catch { this.memoryOnly = true; /* current page never rereads stale storage after denied writes */ } }
}

/** The result ledger belongs to gameplay, independent from the optional observer run. */
export function reportResult(board: Mines, resultId: string, stats: Stats): Stats {
  if (board.outcome === 'active' || !id(resultId) || stats.reported.includes(resultId)) return stats;
  return {won: stats.won + (board.outcome === 'won' ? 1 : 0),lost: stats.lost + (board.outcome === 'lost' ? 1 : 0),reported:[...stats.reported,resultId].slice(-100)};
}
