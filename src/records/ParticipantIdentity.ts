/** Sharing identity is independent from personal saves and Analytics identifiers. */
export const PARTICIPANT_CREDENTIAL_KEY = 'game100:records:participant-credential:v1';
const TOKEN = /^[a-f0-9]{64}$/;
type CredentialStorage = Pick<Storage, 'getItem' | 'setItem'>;
export function randomCredential(): string {
  return [...crypto.getRandomValues(new Uint8Array(32))].map(n => n.toString(16).padStart(2, '0')).join('');
}
export async function credentialFingerprint(credential: string): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(credential)))].map(n => n.toString(16).padStart(2, '0')).join('');
}
export class ParticipantIdentity {
  private memory?: string;
  private memoryOnly = false;
  private unsupportedLock = false;
  constructor(private readonly storage: () => CredentialStorage = () => localStorage) {}
  storageLimited(): boolean { return this.memoryOnly; }
  unavailable(): boolean { return this.unsupportedLock; }
  /** Reading must never create credentials, including during public ranking views. */
  current(): string | undefined {
    let raw: string | null;
    try {
      raw = this.storage().getItem(PARTICIPANT_CREDENTIAL_KEY);
    } catch { this.memoryOnly = true; return this.memory; }
    if (!raw && this.memoryOnly) return this.memory;
    try {
      if (!raw || raw.length > 256) { this.memory = undefined; return undefined; }
      const data = JSON.parse(raw) as { schema?: unknown; credential?: unknown };
      this.memory = data.schema === 1 && typeof data.credential === 'string' && TOKEN.test(data.credential) ? data.credential : undefined;
      return this.memory;
    } catch { this.memory = undefined; return undefined; }
  }
  /** Caller supplies live consent: it is rechecked inside the cross-tab lock. */
  async forSharing(permitted: () => boolean): Promise<string | undefined> {
    const obtain = () => {
      if (!permitted()) return undefined;
      const existing = this.current();
      if (existing) return existing;
      const credential = randomCredential();
      try {
        this.storage().setItem(PARTICIPANT_CREDENTIAL_KEY, JSON.stringify({ schema: 1, credential }));
        this.memory = credential;
        return this.current();
      } catch { this.memoryOnly = true; this.memory = credential; return credential; }
    };
    if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request('game100-record-participant-v1', obtain);
    // Without a cross-document lock localStorage read/write cannot atomically
    // allocate one identity. Existing credentials remain usable; never split a
    // first-time participant into two identities in concurrent old-browser tabs.
    if (!permitted()) return undefined;
    const existing = this.current();
    if (existing) return existing;
    this.unsupportedLock = true;
    return undefined;
  }
}
