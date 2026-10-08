import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gameCatalog, historicalGameCatalog, NEXT_GAME_NUMBER } from '../../src/data/gameCatalog';
import { gameVersions } from '../../src/data/gameVersions';
import { isAnalyticsEnvelope, sanitizeAnalyticsData, type AnalyticsEnvelope } from '../../src/data/analyticsEnvelope';
import { isRemoteGameRegistered, PENDING_WORKER_GAME_IDS } from '../../src/analytics/remoteRegistration';
import { fetchAnalyticsContext, parseOptions } from '../../scripts/fetch-analytics-context.mjs';

const summary = { event: 'session_summary', active_seconds: 60, blocks_mined: 14, blocks_placed: 5, max_depth: 12, material_types_found: 3, return_to_surface_count: 1, quality_tier: 'light', save_error_code: 'none' };
const fixture: AnalyticsEnvelope = {
  schema_version: 2, event_id: '00000000-0000-4000-8000-000000000001', occurred_at: '2026-10-07T12:00:00.000Z',
  game_id: 'game031', game_version: 'prototype-1', rules_version: '1', presentation_version: 'prototype-1',
  browser_id: '00000000-0000-4000-8000-000000000002', visit_id: 'synthetic-visit', session_id: 'synthetic-page', run_id: 'synthetic-run',
  event_name: 'specific_game_events', environment: 'synthetic', device_class: 'mobile', input_type: 'touch', page: 'game031.html', data: summary,
};

describe('Game031 sandbox registration boundaries', () => {
  it('registers only the implemented new ID and retains retired010 and existing versions', () => {
    expect(gameCatalog).toHaveLength(30);
    expect(historicalGameCatalog).toHaveLength(31);
    expect(NEXT_GAME_NUMBER).toBe(32);
    expect(gameCatalog.at(-1)).toMatchObject({ id: 'game031', titleJa: '掘って、置くだけ。', titleEn: 'DIG & PLACE', route: './game031.html', releaseOrder: 31 });
    expect(historicalGameCatalog.find(game => game.id === 'game010')?.status).toBe('retired');
    expect(gameVersions.game031).toEqual({ rules_version: '1', presentation_version: 'prototype-1' });
    expect(gameVersions.game018).toEqual({ rules_version: '1', presentation_version: '2' });
    expect(isAnalyticsEnvelope(fixture)).toBe(true);
    expect(isAnalyticsEnvelope({ ...fixture, game_id: 'game032', page: 'game032.html' })).toBe(false);
    expect(isAnalyticsEnvelope({ ...fixture, game_id: 'game010', page: 'game010.html' })).toBe(false);
  });
  it('keeps coarse summaries and strips worlds, locations, files, private identities and free text', () => {
    expect(sanitizeAnalyticsData({ ...summary, seed: 'private', world_id: 'private', world: [1], save_file: '{}', position_x: 2, coordinates: '2,3,4', player_path: [1], message: 'free text', run_id: 'private' })).toEqual(summary);
    expect(isAnalyticsEnvelope({ ...fixture, data: { ...summary, seed: 'private' } })).toBe(false);
    expect(isAnalyticsEnvelope({ ...fixture, data: { ...summary, blocks_mined: Infinity } })).toBe(false);
    expect(isAnalyticsEnvelope({ ...fixture, data: { ...summary, quality_tier: 'https://private.example' } })).toBe(false);
    for (const data of [{quality_tier:'free text'}, {save_error_code:'user supplied'}, {blocks_mined:-1}, {blocks_placed:1.5}, {material_types_found:NaN}]) expect(isAnalyticsEnvelope({...fixture,data:{...summary,...data}})).toBe(false);
  });
  it('preserves every pending earlier game and blocks new031 until actual Worker production registration', () => {
    for (let n = 21; n <= 31; n++) expect(PENDING_WORKER_GAME_IDS.has(`game${String(n).padStart(3, '0')}`)).toBe(true);
    expect(isRemoteGameRegistered('game031')).toBe(false);
    expect(isRemoteGameRegistered('game020')).toBe(true);
  });
  it('fetches031 only via anonymous Codex GET and rejects reserved032 without network access', async () => {
    const now = new Date('2026-10-07T12:00:00.000Z'), token = 'local-game031-fixture-only';
    expect(parseOptions(['--game', 'game031']).game).toBe('game031');
    expect(() => parseOptions(['--game', 'game032'])).toThrow('invalid_game');
    const result = await fetchAnalyticsContext(['--game', 'game031', '--days', '7', '--environment', 'synthetic'], { ANALYTICS_CODEX_TOKEN: token }, async (url: URL, options: RequestInit) => {
      expect(url.pathname).toBe('/v1/codex/game/game031');
      expect(options.method).toBe('GET');
      expect(url.href).not.toContain(token);
      return Response.json({ schema_version: 1, environment: 'synthetic', period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') }, game: { game_id: 'game031', run_count: 0 } });
    }, now);
    expect(result.data.game.game_id).toBe('game031');
  });
  it('matches the real manifest/profile/catalog once the game source is ready', () => {
    const manifest = JSON.parse(readFileSync('src/games/game031/game.manifest.json', 'utf8'));
    const profile = JSON.parse(readFileSync('jev_export/game_profiles/game031.json', 'utf8'));
    const catalog = JSON.parse(readFileSync('jev_export/game_profiles/catalog.json', 'utf8'));
    expect(manifest.id).toBe('game031');
    expect(manifest.creditMode).toBe('free');
    expect(manifest.timeLimit).toBeNull();
    expect(profile.currentManifest).toEqual(manifest);
    expect(catalog.gameCatalog).toEqual(gameCatalog);
    expect(catalog.gameCount).toBe(30);
  });
});
