import { getRecordDefinition, recordBoards } from '../data/recordDefinitions';
/** Client transport stays closed per new board until its existing production Worker
 * registration has been verified. Definitions remain shared with Worker local tests.
 * This is separate from Analytics consent/registration and never disables old boards.
 */
export const PENDING_RECORD_GAME_IDS: ReadonlySet<string> = new Set(['game002','game003','game015','game024','game032']);
export function isPublicRecordRegistered(gameId: string): boolean {
  return !PENDING_RECORD_GAME_IDS.has(gameId);
}

/** A pending replacement must not disable already registered historical boards. */
export function isPublicBoardRegistered(boardId: string): boolean {
  const board=recordBoards.find(item=>item.boardId===boardId);
  return !!board && (!PENDING_RECORD_GAME_IDS.has(board.gameId) || getRecordDefinition(board.gameId)?.boardId!==boardId);
}
