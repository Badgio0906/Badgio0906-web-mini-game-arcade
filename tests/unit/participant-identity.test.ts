import { describe, it, expect, vi, afterEach } from 'vitest';
import { ParticipantIdentity, PARTICIPANT_CREDENTIAL_KEY, credentialFingerprint } from '../../src/records/ParticipantIdentity';
function storage() {
  const map = new Map<string, string>();
  return { map, getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v); } };
}
describe('optional sharing credential lifecycle', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('does not allocate competing new identities without browser cross-tab locks', async () => {
    const db = storage(), identity = new ParticipantIdentity(() => db);
    const prior = await identity.forSharing(() => true);
    vi.stubGlobal('navigator', {});
    expect(await new ParticipantIdentity(() => db).forSharing(() => true)).toBe(prior);
    db.map.clear();
    expect(await identity.forSharing(() => true)).toBeUndefined();
    expect(identity.unavailable()).toBe(true);
    expect(db.map.size).toBe(0);
  });
  it('never creates an identity by reading, or while sharing is OFF', async () => {
    const db = storage(), identity = new ParticipantIdentity(() => db);
    expect(identity.current()).toBeUndefined();
    expect(await identity.forSharing(() => false)).toBeUndefined();
    expect(db.map.size).toBe(0);
  });
  it('reuses one random credential across concurrent requests and service instances', async () => {
    const db = storage(), identity = new ParticipantIdentity(() => db);
    const tokens = await Promise.all(Array.from({ length: 100 }, () => identity.forSharing(() => true)));
    expect(new Set(tokens).size).toBe(1);
    expect(tokens[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(await new ParticipantIdentity(() => db).forSharing(() => true)).toBe(tokens[0]);
    expect(db.map.size).toBe(1);
    expect(await credentialFingerprint(tokens[0]!)).toHaveLength(64);
    expect(await credentialFingerprint(tokens[0]!)).not.toBe(tokens[0]);
  });
  it('does not guess ownership after credential loss or corrupt persisted state', async () => {
    const db = storage(), identity = new ParticipantIdentity(() => db);
    const original = await identity.forSharing(() => true);
    db.map.delete(PARTICIPANT_CREDENTIAL_KEY);
    expect(identity.current()).toBeUndefined();
    expect(await identity.forSharing(() => true)).not.toBe(original);
    db.map.set(PARTICIPANT_CREDENTIAL_KEY, '{corrupt');
    expect(identity.current()).toBeUndefined();
    db.map.set(PARTICIPANT_CREDENTIAL_KEY, JSON.stringify({ schema: 1, credential: 'short' }));
    expect(identity.current()).toBeUndefined();
  });
  it('keeps a stable page-only credential when storage is rejected', async () => {
    const identity = new ParticipantIdentity(() => ({ getItem: () => { throw Error('storage_denied'); }, setItem: () => { throw Error('storage_denied'); } }));
    const token = await identity.forSharing(() => true);
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(identity.storageLimited()).toBe(true);
    expect(identity.current()).toBe(token);
    expect(await identity.forSharing(() => false)).toBeUndefined();
  });
  it('retains page-only identity on quota rejection without a read failure', async () => {
    const identity = new ParticipantIdentity(() => ({ getItem: () => null, setItem: () => { throw Error('quota'); } }));
    const token = await identity.forSharing(() => true);
    expect(identity.current()).toBe(token);
  });
});
