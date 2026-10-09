import { recordBoards, type RecordDefinition } from '../data/recordDefinitions';
import { recordsEndpoint } from './PublicBests';

export interface LeaderboardEntry { rank: number; public_label: string; value: number; received_at: string; }
export interface Leaderboard {
  schema_version: 1; board_id: string; game_id: string; metric_label: string; mode_label: string;
  ruleset_id: string; direction: 'higher' | 'lower'; unit: string; generated_at: string;
  revision: number; cache_ttl_seconds: 60; entries: LeaderboardEntry[];
}
export interface LeaderboardState { status: 'preparing' | 'ready' | 'failed' | 'stale'; board?: Leaderboard; }
const iso = (v: unknown): v is string => typeof v === 'string' && v.length <= 40 && Number.isFinite(Date.parse(v));

/** Validate and project public fields before rendering or retaining a response. */
export function validateLeaderboard(input: unknown, definition: RecordDefinition): Leaderboard {
  if (!input || typeof input !== 'object' || !definition.publicEnabled) throw Error('invalid_leaderboard');
  const d = input as Leaderboard;
  if (d.schema_version !== 1 || d.board_id !== definition.boardId || d.game_id !== definition.gameId ||
      d.metric_label !== definition.metricLabel || d.mode_label !== definition.modeLabel || d.ruleset_id !== definition.rulesetId ||
      d.direction !== definition.direction || d.unit !== definition.unit || d.cache_ttl_seconds !== 60 ||
      !iso(d.generated_at) || !Number.isSafeInteger(d.revision) || d.revision < 0 || !Array.isArray(d.entries) || d.entries.length > 10) throw Error('invalid_leaderboard');
  const names = new Set<string>();
  const entries = d.entries.map((e, i) => {
    if (!e || e.rank !== i + 1 || typeof e.public_label !== 'string' || !/^ガレージ住人 [0-9]{12}$/.test(e.public_label) ||
        names.has(e.public_label) || !Number.isSafeInteger(e.value) || e.value < 0 || e.value > definition.maxValue || !iso(e.received_at)) throw Error('invalid_leaderboard_entry');
    names.add(e.public_label);
    const prev = d.entries[i - 1];
    if (prev && (definition.direction === 'higher' ? prev.value < e.value : prev.value > e.value) ||
        prev && prev.value === e.value && Date.parse(prev.received_at) > Date.parse(e.received_at)) throw Error('invalid_leaderboard_order');
    return {rank: e.rank, public_label: e.public_label, value: e.value, received_at: e.received_at};
  });
  return {schema_version:1,board_id:d.board_id,game_id:d.game_id,metric_label:d.metric_label,mode_label:d.mode_label,
    ruleset_id:d.ruleset_id,direction:d.direction,unit:d.unit,generated_at:d.generated_at,revision:d.revision,cache_ttl_seconds:60,entries};
}

export class Leaderboards {
  private cache = new Map<string, { board: Leaderboard; fetchedAt: number }>();
  private pending = new Map<string, Promise<LeaderboardState>>();
  constructor(private readonly base = recordsEndpoint, private readonly fetcher: typeof fetch = (...args) => fetch(...args), private readonly now = Date.now) {}
  async load(boardId: string, expectedRevision = 0): Promise<LeaderboardState> {
    const definition = recordBoards.find(d => d.boardId === boardId);
    if (!definition) throw Error('unknown_board');
    if (!this.base) return {status:'preparing'};
    const cached = this.cache.get(boardId);
    if (cached && cached.board.revision >= expectedRevision && this.now() - cached.fetchedAt < 60000) return {status:'ready',board:cached.board};
    let pending = this.pending.get(boardId);
    if (!pending) {
      pending = this.fetchBoard(definition).finally(() => this.pending.delete(boardId));
      this.pending.set(boardId, pending);
    }
    const state = await pending;
    // A concurrently refreshed BEST can require a newer snapshot than this GET.
    return state.board && state.board.revision < expectedRevision ? {status:'failed'} : state;
  }
  private async fetchBoard(definition: RecordDefinition): Promise<LeaderboardState> {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await this.fetcher(`${this.base}/v1/records/public/leaderboard?board_id=${encodeURIComponent(definition.boardId)}`,
        {method:'GET',credentials:'omit',referrerPolicy:'no-referrer',cache:'no-cache',redirect:'error',signal:controller.signal});
      if (response.status === 503) return {status:'preparing'};
      if (!response.ok || Number(response.headers.get('Content-Length') || 0) > 32768) throw Error('leaderboard_fetch_failed');
      const body = await response.text(); if (body.length > 32768) throw Error('leaderboard_response_too_large');
      const board = validateLeaderboard(JSON.parse(body), definition), previous = this.cache.get(definition.boardId);
      if (previous && previous.board.revision > board.revision) throw Error('older_leaderboard_revision');
      this.cache.set(definition.boardId, {board,fetchedAt:this.now()});
      return {status:'ready',board};
    } catch {
      const cached = this.cache.get(definition.boardId);
      return cached ? {status:'stale',board:cached.board} : {status:'failed'};
    } finally { clearTimeout(timer); }
  }
}
