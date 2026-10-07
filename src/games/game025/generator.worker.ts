import { generate, candidate, type Difficulty } from './Mines';
self.onmessage = (event: MessageEvent<{ id: number; difficulty: Difficulty; start: number; seed: number }>) => {
  const { id, difficulty, start, seed } = event.data;
  const verified = generate(difficulty, start, seed, difficulty === 'beginner' ? 80 : 12, difficulty === 'beginner' ? 450 : 300);
  self.postMessage({ id, start, mines: verified?.mines ?? (difficulty === 'intermediate' ? candidate(difficulty, start, seed) : null), proof: verified?.proof ?? null });
};
