/** Public records use fixed integer baseline units; never Analytics identifiers. */
export interface RecordSubmission {
  schema_version: 1;
  submission_key: string;
  run_result_id: string;
  game_id: string;
  board_id: string;
  ruleset_id: string;
  game_build: string;
  environment: 'production';
  value: number;
  withdrawal_receipt: string;
  allowed_result_metadata: {
    finalized: true;
    mode_id: string;
    assistance: 'none' | 'allowed';
    duration_ms: number;
    outcome: 'complete' | 'quit' | 'milestone';
  };
}
export function canonicalValue(value: number, scale: number, maximum: number): number | null {
  if (!Number.isFinite(value) || value < 0 || !Number.isSafeInteger(scale) || scale < 1) return null;
  const integer = Math.round(value * scale);
  return Number.isSafeInteger(integer) && integer <= maximum ? integer : null;
}
export function recordsBase(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return null;
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) return null;
    if (url.pathname !== '/' && url.pathname !== '') return null;
    return url.origin;
  } catch { return null; }
}
export function shareEnvironment(location: Pick<Location, 'hostname' | 'protocol'>, automated: boolean, productionBuild: boolean): boolean {
  return productionBuild && !automated && location.protocol === 'https:' && ['game100garage.com', 'www.game100garage.com'].includes(location.hostname);
}
export function sameBoard(a: { boardId?: string; rulesetId: string; modeId: string }, b: { boardId?: string; rulesetId: string; modeId: string }): boolean {
  return a.boardId === b.boardId && a.rulesetId === b.rulesetId && a.modeId === b.modeId;
}
