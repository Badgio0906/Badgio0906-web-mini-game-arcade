import { recordBoards } from '../data/recordDefinitions';
import { recordsBase } from './protocol';
import { isPublicRecordRegistered } from './remoteRegistration';

export const recordsEndpoint = recordsBase(import.meta.env.VITE_RECORDS_ENDPOINT);
export interface PublicBoard {
  game_id: string; board_id: string; metric_id: string; value: number | null;
  unit: string; mode_label: string; ruleset_id: string; status: 'accepted' | 'empty';
  collected_since: string; revision: number;
}
export interface PublicBestState { status: 'preparing' | 'loading' | 'ready' | 'failed' | 'stale'; boards: Map<string, PublicBoard>; fetchedAt?: string; }
export function validatePublicBests(input: unknown): Map<string, PublicBoard> {
  if (!input || typeof input !== 'object') throw Error('invalid_public_response');
  const data = input as Record<string, unknown>;
  if (data.schema_version !== 1 || data.definition_version !== '1' || data.cache_ttl_seconds !== 60 || !Array.isArray(data.boards) || data.boards.length > recordBoards.length || typeof data.generated_at !== 'string' || !Number.isFinite(Date.parse(data.generated_at))) throw Error('invalid_public_response');
  const out = new Map<string, PublicBoard>();
  for (const item of data.boards) {
    if (!item || typeof item !== 'object') throw Error('invalid_public_board');
    const b = item as PublicBoard, def = recordBoards.find(d => d.boardId === b.board_id);
    if (!def || out.has(b.board_id) || b.game_id !== def.gameId || b.metric_id !== def.metricId || b.ruleset_id !== def.rulesetId || b.unit !== def.unit || b.mode_label !== def.modeLabel) throw Error('invalid_public_board');
    if (!Number.isSafeInteger(b.revision) || b.revision < 0 || !Number.isFinite(Date.parse(b.collected_since))) throw Error('invalid_public_board');
    if (b.status === 'empty' ? b.value !== null : b.status !== 'accepted' || b.value === null || !Number.isSafeInteger(b.value) || b.value < 0 || b.value > def.maxValue) throw Error('invalid_public_value');
    // Rebuild allowed fields; never expose accidental server internal metadata.
    out.set(b.board_id, {game_id:b.game_id,board_id:b.board_id,metric_id:b.metric_id,value:b.value,unit:b.unit,mode_label:b.mode_label,ruleset_id:b.ruleset_id,status:b.status,collected_since:b.collected_since,revision:b.revision});
  }
  if (recordBoards.some(def => isPublicRecordRegistered(def.gameId) && !out.has(def.boardId))) throw Error('missing_public_board');
  return out;
}
export class PublicBests {
  private state: PublicBestState = {status: recordsEndpoint ? 'loading' : 'preparing', boards: new Map()};
  private lastFetch = 0;
  private pending?: Promise<PublicBestState>;
  constructor(private readonly base = recordsEndpoint, private readonly fetcher: typeof fetch = (...args) => fetch(...args)) { if (!base) this.state.status = 'preparing'; }
  getState(): PublicBestState { return this.state; }
  acceptLeaderboardSnapshot(boardId: string, revision: number, value: number | null, generatedAt: string): boolean {
    const def = recordBoards.find(d => d.boardId === boardId), current = this.state.boards.get(boardId);
    if (!def || current && (current.revision > revision || current.revision === revision && current.value !== value)) return false;
    const boards = new Map(this.state.boards);
    boards.set(boardId,{game_id:def.gameId,board_id:boardId,metric_id:def.metricId,value,unit:def.unit,mode_label:def.modeLabel,
      ruleset_id:def.rulesetId,status:value===null?'empty':'accepted',collected_since:current?.collected_since??generatedAt,revision});
    this.state = {...this.state,boards,status:this.state.status==='stale'?'stale':'ready',fetchedAt:this.state.fetchedAt??generatedAt};
    return true;
  }
  refresh(): Promise<PublicBestState> {
    if (!this.base) return Promise.resolve(this.state);
    if (this.pending) return this.pending;
    if (Date.now() - this.lastFetch < 60000 && this.state.status === 'ready') return Promise.resolve(this.state);
    this.pending = this.load().finally(() => {this.pending = undefined;});
    return this.pending;
  }
  private async load(): Promise<PublicBestState> {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await this.fetcher(`${this.base}/v1/records/public/bests`, {method:'GET', credentials:'omit', referrerPolicy:'no-referrer', cache:'no-cache', redirect:'error', signal:controller.signal});
      if (response.status === 503) { this.state = {status:'preparing',boards:new Map()}; return this.state; }
      if (!response.ok || Number(response.headers.get('Content-Length') || 0) > 65536) throw Error('public_fetch_failed');
      const body = await response.text(); if (body.length > 65536) throw Error('public_response_too_large');
      const boards = validatePublicBests(JSON.parse(body));
      for (const [id, current] of this.state.boards) {
        if ((boards.get(id)?.revision ?? -1) < current.revision) boards.set(id,current);
      }
      this.state = {status:'ready',boards,fetchedAt:new Date().toISOString()}; this.lastFetch=Date.now();
    } catch { this.state = {...this.state,status:this.state.boards.size ? 'stale' : 'failed'}; }
    finally { clearTimeout(timer); }
    return this.state;
  }
}
