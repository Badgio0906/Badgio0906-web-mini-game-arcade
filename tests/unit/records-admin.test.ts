import { describe, expect, it } from 'vitest';
import { recordsAdminUrl, reviewChoices, reviewReason, adminRecordValue } from '../../src/analytics-admin/records';

describe('record moderation boundary', () => {
  it('shows scaled units rather than treating distance storage integers as meters', () => {
    expect(adminRecordValue('game018.distance.r1.all-shoes', 1234)).toBe('123.4 m');
    expect(adminRecordValue('game019.height.r2.all', 1234)).toBe('123.4 m');
    expect(adminRecordValue('game001.score.r1.all', 1234)).toBe('1,234 点');
    expect(adminRecordValue('unknown', 1234)).toContain('条件未対応');
  });
  it('uses exact record routes and rejects credentialed, query, fragmented or nonlocal HTTP endpoints', () => {
    expect(recordsAdminUrl('https://records.example', '/admin/submissions', { status: 'pending', limit: '100' }).href).toBe('https://records.example/v1/records/admin/submissions?status=pending&limit=100');
    expect(recordsAdminUrl('http://127.0.0.1:8787/v1/records', '/public/bests').href).toBe('http://127.0.0.1:8787/v1/records/public/bests');
    for (const endpoint of ['', 'http://records.example', 'https://user:pass@records.example', 'https://records.example?token=x', 'https://records.example#x', 'https://records.example/v1/events']) expect(() => recordsAdminUrl(endpoint, '/admin/submissions')).toThrow();
    for (const path of ['/admin/summary', '/codex/summary', '/admin/submissions?token=x', '/public/bests/../admin/summary', '/admin/boards/../../summary/recalculate']) expect(() => recordsAdminUrl('https://records.example', path)).toThrow();
  });
  it('never offers a direct restore into accepted or actions on user-withdrawn candidates', () => {
    expect(reviewChoices('pending')).toEqual(['accept', 'reject']);
    expect(reviewChoices('accepted')).toEqual(['revoke']);
    expect(reviewChoices('rejected')).toEqual(['restore']);
    expect(reviewChoices('revoked')).toEqual(['restore']);
    expect(reviewChoices('withdrawn')).toEqual([]);
    expect(reviewChoices('unknown')).toEqual([]);
  });
  it('requires a short operator reason without control characters', () => {
    expect(reviewReason('  条件と結果を照合した  ')).toBe('条件と結果を照合した');
    expect(reviewReason('あ'.repeat(240))).toHaveLength(240);
    for (const reason of ['', ' ', 'あ'.repeat(241), '改行\n禁止', '制御\u0000文字']) expect(() => reviewReason(reason)).toThrow();
  });
});
