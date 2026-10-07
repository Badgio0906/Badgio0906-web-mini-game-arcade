import { RULES_VERSION, restoreQuestion, type QuestionState } from './model';
import { wordById, words } from './words';
export const SAVE_KEY = 'web-mini-arcade:v1:game023:question';
export const validRunId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export interface SavedQuestion { question: QuestionState; run_id: string; reported: boolean }
export interface SaveData { game_id: 'game023'; rules_version: string; seed: number; history: string[]; current: SavedQuestion | null; state: 'title' | 'playing' | 'paused' | 'result'; reportedLedger: string[] }
export function emptySave(seed: number): SaveData { return { game_id: 'game023', rules_version: RULES_VERSION, seed: seed >>> 0, history: [], current: null, state: 'title', reportedLedger: [] }; }
export function validateSave(value: unknown): SaveData | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const save = value as SaveData;
  if (save.game_id !== 'game023' || save.rules_version !== RULES_VERSION || !Number.isInteger(save.seed) || save.seed < 0 || save.seed > 0xffffffff) return null;
  if (!Array.isArray(save.history) || save.history.length > words.length || save.history.some(id => !wordById.has(id)) || new Set(save.history).size !== save.history.length) return null;
  if (!Array.isArray(save.reportedLedger) || save.reportedLedger.length > 200 || save.reportedLedger.some(id => !validRunId(id)) || new Set(save.reportedLedger).size !== save.reportedLedger.length || !['title', 'playing', 'paused', 'result'].includes(save.state)) return null;
  let current: SavedQuestion | null = null;
  if (save.current !== null) {
    if (!save.current || !validRunId(save.current.run_id) || typeof save.current.reported !== 'boolean') return null;
    const question = restoreQuestion(save.current.question);
    if (!question || save.history.at(-1) !== question.word_id || save.current.reported !== save.reportedLedger.includes(save.current.run_id)) return null;
    if (save.state === 'title' || (question.outcome === 'playing' ? save.state === 'result' || save.current.reported : save.state !== 'result' || !save.current.reported)) return null;
    current = { question, run_id: save.current.run_id, reported: save.current.reported };
  } else if (save.state !== 'title') return null;
  return { game_id: 'game023', rules_version: RULES_VERSION, seed: save.seed, history: [...save.history], current, state: save.state, reportedLedger: [...save.reportedLedger] };
}
/** One JSON write includes the result flag and ledger. Storage denial stays in page memory. */
export class QuestionStore {
  private memory: SaveData | null = null;
  private denied = false;
  constructor(private backend?: Pick<Storage, 'getItem' | 'setItem'>) {}
  read(): SaveData | null {
    if (this.memory) return validateSave(this.memory);
    try { const raw = this.backend?.getItem(SAVE_KEY); if (!raw || raw.length > 60000) return null; return validateSave(JSON.parse(raw)); } catch { return null; }
  }
  write(save: SaveData): void {
    this.memory = structuredClone(save);
    if (this.denied) return;
    try { this.backend?.setItem(SAVE_KEY, JSON.stringify(save)); } catch { this.denied = true; }
  }
  get memoryOnly(): boolean { return !this.backend || this.denied; }
}
export function markReported(save: SaveData): boolean {
  if (!save.current || save.current.reported || save.reportedLedger.includes(save.current.run_id)) return false;
  save.current.reported = true;
  save.reportedLedger = [...save.reportedLedger, save.current.run_id].slice(-200);
  return true;
}
