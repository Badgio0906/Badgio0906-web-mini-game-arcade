/** Client transport stays closed per new board until its existing production Worker
 * registration has been verified. Definitions remain shared with Worker local tests.
 * This is separate from Analytics consent/registration and never disables old boards.
 */
export const PENDING_RECORD_GAME_IDS: ReadonlySet<string> = new Set(['game032']);
export function isPublicRecordRegistered(gameId: string): boolean {
  return !PENDING_RECORD_GAME_IDS.has(gameId);
}
