/** Remove an ID only after its existing Worker production registration is verified.
 * Portal-selected games share this gate with their own page, so pending IDs never
 * reach the production ingest API through impressions, clicks or launches.
 */
export const PENDING_WORKER_GAME_IDS: ReadonlySet<string> = new Set(['game021', 'game022', 'game023', 'game024', 'game025', 'game026', 'game027', 'game028', 'game029', 'game030', 'game031', 'game032']);
export function isRemoteGameRegistered(game: string): boolean {
  return !PENDING_WORKER_GAME_IDS.has(game);
}
