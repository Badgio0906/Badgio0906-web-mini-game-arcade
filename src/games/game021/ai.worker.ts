import { chooseMove } from './ai';
import { FourBoard, seededRandom, type Difficulty } from './model';
interface Request { generation: number; revision: number; moves: number[]; difficulty: Difficulty; seed: number }
self.onmessage = (event: MessageEvent<Request>) => {
  const { generation, revision, moves, difficulty, seed } = event.data;
  const board = FourBoard.fromMoves(moves);
  const column = board ? chooseMove(board, difficulty, { random: seededRandom(seed) }) : null;
  self.postMessage({ generation, revision, column });
};
