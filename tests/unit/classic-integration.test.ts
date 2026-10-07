import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { gameCatalog, retiredGameCatalog } from '../../src/data/gameCatalog';
import { gameVersions } from '../../src/data/gameVersions';
import { sanitizeAnalyticsData, isAnalyticsDataField } from '../../src/data/analyticsEnvelope';
import { PENDING_WORKER_GAME_IDS } from '../../src/analytics/remoteRegistration';

describe('ordered classic registrations', () => {
  it.each(gameCatalog.filter(game => game.releaseOrder >= 21))('$id has its own immutable namespace and prototype version', game => {
    const manifest = JSON.parse(readFileSync(`src/games/${game.id}/game.manifest.json`, 'utf8'));
    const profile = JSON.parse(readFileSync(`jev_export/game_profiles/${game.id}.json`, 'utf8'));
    expect(manifest.id).toBe(game.id);
    expect(manifest.storagePrefix).toContain(`${game.id}:`);
    expect(manifest.creditMode).toBe('free');
    expect(gameVersions[game.id]).toEqual({ rules_version: '1', presentation_version: 'prototype-1' });
    expect(profile.id).toBe(game.id);
    expect(profile.route).toBe(game.route);
    expect(profile.currentManifest).toEqual(manifest);
    expect(game.route).toBe(`./${game.id}.html`);
    expect(PENDING_WORKER_GAME_IDS.has(game.id)).toBe(true);
  });
  it('keeps old versions and retired identity separate from the added games', () => {
    expect(gameVersions.game018).toEqual({ rules_version: '1', presentation_version: '2' });
    expect(gameVersions.game019).toEqual({ rules_version: '2', presentation_version: '2' });
    expect(gameVersions.game020).toEqual({ rules_version: '1', presentation_version: '1' });
    expect(retiredGameCatalog.map(game => game.id)).toEqual(['game010']);
  });
  it('retains documented classic primitives and existing numeric completion compatibility, never private IDs or hidden cards', () => {
    const data = { event: 'hint', difficulty: 'normal', first: true, assisted: true, hints: 1, undos: 2, draw: 3, deal_mode: 'daily', daily_id: '2026-10-07', moves: 12, foundation_count: 4, assists: 1, record_added: false, completed: true, word_id: 'w_food_001', category: 'food', wrong_count: 2, hint_used: true, foods: 3, length: 6 };
    expect(sanitizeAnalyticsData({ ...data, run_id: 'private', seed: 'private', cards: [1, 2, 3], word: 'private' })).toEqual(data);
    expect(isAnalyticsDataField('completed', 3)).toBe(true);
    expect(isAnalyticsDataField('daily_id', 'https://example.test/?private=yes')).toBe(false);
  });
});
