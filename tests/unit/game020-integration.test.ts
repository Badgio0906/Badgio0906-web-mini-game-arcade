import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { gameCatalog, historicalGameCatalog, NEXT_GAME_NUMBER } from '../../src/data/gameCatalog';
import { gameVersions } from '../../src/data/gameVersions';
import { isAnalyticsEnvelope, sanitizeAnalyticsData, type AnalyticsEnvelope } from '../../src/data/analyticsEnvelope';

const fixture = (event: string): AnalyticsEnvelope => ({
  schema_version: 2,
  event_id: '00000000-0000-4000-8000-000000000001',
  occurred_at: '2026-10-07T12:00:00.000Z',
  game_id: 'game020',
  game_version: 'fixture-only',
  rules_version: '1',
  presentation_version: '1',
  browser_id: '00000000-0000-4000-8000-000000000002',
  visit_id: 'synthetic-visit',
  session_id: 'synthetic-page',
  run_id: 'synthetic-run',
  event_name: 'specific_game_events',
  environment: 'synthetic',
  device_class: 'mobile',
  input_type: 'touch',
  page: 'game020.html',
  data: { event, level: 1, first_id: 3, second_id: 7, remaining: 22, steps: 1 },
});

describe('Game020 isolated common registration', () => {
  it('adds the new ID without reusing the retired ID and preserves018 version', () => {
    expect(gameCatalog.find(game => game.id === 'game020')).toMatchObject({
      titleEn: 'PAIR TILE', route: './game020.html', releaseOrder: 20, difficulty: 'standard',
    });
    expect(gameCatalog.some(game => game.id === 'game010')).toBe(false);
    expect(historicalGameCatalog.find(game => game.id === 'game010')?.status).toBe('retired');
    expect(NEXT_GAME_NUMBER).toBe(Math.max(...historicalGameCatalog.map(game => game.releaseOrder)) + 1);
    expect(gameVersions.game018).toEqual({ rules_version: '1', presentation_version: '2' });
    expect(gameVersions.game020).toEqual({ rules_version: '1', presentation_version: '1' });
  });

  it('accepts new020 events and page through the existing strict envelope and primitive fields', () => {
    for (const event of ['tile_pair', 'hint', 'undo', 'reshuffle']) {
      const row = fixture(event);
      expect(sanitizeAnalyticsData(row.data)).toEqual(row.data);
      expect(isAnalyticsEnvelope(row)).toBe(true);
    }
    expect(isAnalyticsEnvelope({ ...fixture('tile_pair'), game_id: 'game010' })).toBe(false);
    expect(isAnalyticsEnvelope({ ...fixture('tile_pair'), game_id: 'game031', page: 'game031.html' })).toBe(false);
    expect(isAnalyticsEnvelope({ ...fixture('tile_pair'), page: 'game020.html?secret=example' })).toBe(false);
    expect(sanitizeAnalyticsData({ event: 'hint', remaining: 12, tile_id: 1, board_id: 'user-specific', email: 'unused@example.test' }))
      .toEqual({ event: 'hint', remaining: 12 });
  });

  it('keeps new manifest/profile/export aligned without imposing a time limit', () => {
    const manifest = JSON.parse(readFileSync('src/games/game020/game.manifest.json', 'utf8'));
    const profile = JSON.parse(readFileSync('jev_export/game_profiles/game020.json', 'utf8'));
    const exported = JSON.parse(readFileSync('jev_export/game_profiles/catalog.json', 'utf8'));
    expect(manifest.id).toBe('game020');
    expect(manifest.timeLimit).toBeNull();
    expect(manifest.creditMode).toBe('free');
    expect(profile.currentManifest).toEqual(manifest);
    expect(exported.gameCount).toBe(gameCatalog.length);
    expect(exported.gameCatalog).toEqual(gameCatalog);
  });
});
