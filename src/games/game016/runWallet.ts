/** Narrow start-only adapter. The shared service keeps the other games' existing semantics. */
export interface StartCreditService { readonly enabled: boolean; readonly canPlay: boolean; consume(runId: string): boolean }
export interface RunWallet { readonly creditsEnabled: boolean; start(runId: string): boolean }
export function createRunWallet(credits: StartCreditService): RunWallet {
  // Lifetime IDs prevent a delayed duplicate callback spending again after any number of retries.
  // This is a page-session ledger of runs, never a per-question collection.
  const started = new Set<string>();
  return {
    get creditsEnabled() { return credits.enabled; },
    start(runId: string): boolean {
      if (!runId || started.has(runId) || !credits.canPlay) return false;
      if (credits.enabled && !credits.consume(runId)) return false;
      started.add(runId); return true;
    },
  };
}
