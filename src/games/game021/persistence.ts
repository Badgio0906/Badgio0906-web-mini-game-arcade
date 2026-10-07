import { defaultSettings, FourBoard, GAME_ID, RULES_VERSION, humanPlayer, type Settings } from './model';
export const SAVE_KEY = 'web-mini-arcade:v1:game021:state';
export interface Counts { wins: number; losses: number; draws: number }
export interface SavedRun { moves: number[]; settings: Settings; runId: string | null; seed: number; hints: number; undos: number; reported: boolean; outcome: 'win' | 'loss' | 'draw' | 'quit' | 'reset' | null }
export interface Archive { game_id: typeof GAME_ID; rules_version: typeof RULES_VERSION; settings: Settings; stats: Record<string, Counts>; saved: SavedRun | null }
export function freshArchive(): Archive { return { game_id: GAME_ID, rules_version: RULES_VERSION, settings: { ...defaultSettings }, stats: {}, saved: null }; }
const int = (value: unknown, max = 1000000): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
function isSettings(value: unknown): value is Settings {
  if (!value || typeof value !== 'object') return false;
  const s = value as Settings;
  return ['cpu', 'two'].includes(s.mode) && ['easy', 'normal', 'strong'].includes(s.difficulty) && typeof s.first === 'boolean';
}
export function statKey(run: SavedRun): string { return `${run.settings.mode}:${run.settings.difficulty}:${run.settings.first ? 'first' : 'second'}:${run.hints || run.undos ? 'assisted' : 'unassisted'}`; }
export function outcomeFor(board: FourBoard, settings: Settings): 'win' | 'loss' | 'draw' | null {
  if (board.result === 'playing') return null;
  if (board.result === 'draw') return 'draw';
  return board.result === (humanPlayer(settings) === 1 ? 'green' : 'amber') ? 'win' : 'loss';
}
export function parseArchive(value: unknown): Archive | null {
  if (!value || typeof value !== 'object') return null;
  const archive = value as Archive;
  if (archive.game_id !== GAME_ID || archive.rules_version !== RULES_VERSION || !isSettings(archive.settings) || !archive.stats || typeof archive.stats !== 'object' || Array.isArray(archive.stats)) return null;
  const stats: Archive['stats'] = {};
  const entries = Object.entries(archive.stats); if (entries.length > 24) return null;
  for (const [key, counts] of entries) {
    if (!/^(cpu|two):(easy|normal|strong):(first|second):(assisted|unassisted)$/.test(key) || !counts || !int(counts.wins) || !int(counts.losses) || !int(counts.draws)) return null;
    stats[key] = { wins: counts.wins, losses: counts.losses, draws: counts.draws };
  }
  let saved: SavedRun | null = null;
  if (archive.saved !== null) {
    const run = archive.saved, board = run && FourBoard.fromMoves(run.moves);
    if (!run || !board || !isSettings(run.settings) || !int(run.seed, 0xffffffff) || !int(run.hints) || !int(run.undos) || typeof run.reported !== 'boolean' || !(run.runId === null || typeof run.runId === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(run.runId))) return null;
    const calculated = outcomeFor(board, run.settings);
    if (run.outcome !== null && !['win','loss','draw','quit','reset'].includes(run.outcome)) return null;
    if (calculated && run.outcome !== null && run.outcome !== calculated || !calculated && run.outcome !== null && !['quit','reset'].includes(run.outcome) || run.reported && run.outcome === null) return null;
    saved = { moves: [...run.moves], settings: { ...run.settings }, runId: run.runId, seed: run.seed, hints: run.hints, undos: run.undos, reported: run.reported, outcome: run.outcome };
  }
  return { game_id: GAME_ID, rules_version: RULES_VERSION, settings: { ...archive.settings }, stats, saved };
}
/** Mark and count in one JSON transaction. Re-displaying a result never increments stats. */
export function finalize(archive: Archive, outcome: NonNullable<SavedRun['outcome']>): boolean {
  const run = archive.saved;
  if (!run || run.reported) return false;
  run.outcome = outcome; run.reported = true;
  if (['win','loss','draw'].includes(outcome)) {
    const key = statKey(run), counts = archive.stats[key] ?? { wins: 0, losses: 0, draws: 0 };
    const field = outcome === 'win' ? 'wins' : outcome === 'loss' ? 'losses' : 'draws';
    counts[field] = Math.min(1000000, counts[field] + 1); archive.stats[key] = counts;
  }
  return true;
}
export class GameStore {
  private memory: Archive | null = null;
  constructor(private readonly backend?: Pick<Storage, 'getItem' | 'setItem'>) {}
  load(): Archive {
    if (this.memory) return this.memory;
    try { const raw = this.backend?.getItem(SAVE_KEY); if (raw && raw.length < 40000) this.memory = parseArchive(JSON.parse(raw)); } catch { /* reject corruption and denied storage */ }
    return this.memory ??= freshArchive();
  }
  save(archive: Archive): void { this.memory = archive; try { this.backend?.setItem(SAVE_KEY, JSON.stringify(archive)); } catch { /* the live memory remains authoritative */ } }
}
