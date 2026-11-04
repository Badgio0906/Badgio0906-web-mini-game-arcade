import { it, expect } from 'vitest';
import { newChallenge, scoreChallenge, validChallenge } from '../../src/games/game027/challenge';
import { blankSave, validateSave } from '../../src/games/game027/save';
import { rack } from '../../src/games/game027/physics';
import { newMatch } from '../../src/games/game027/rules';
it('ten-shot round awards consecutive pockets, penalizes scratches, and stops exactly at ten', () => {
  let round = newChallenge();
  round = scoreChallenge(round, [1]); expect(round.score).toBe(100);
  round = scoreChallenge(round, [2, 3]); expect(round.score).toBe(350);
  round = scoreChallenge(round, [0]); expect(round.score).toBe(200); expect(round.combo).toBe(0);
  while (round.shots < 10) round = scoreChallenge(round, []);
  expect(scoreChallenge(round, [1, 2])).toEqual(round);
});
it('challenge state roundtrips with old saves while rejecting corrupt challenge data', () => {
  const saved = blankSave();
  saved.snapshot = { world: rack(), match: newMatch(), mode: 'cpu', difficulty: 'normal', angle: 0, power: .75, observerRun: null, localResultId: 'challenge-1', challenge: newChallenge() };
  expect(validateSave(saved)?.snapshot?.challenge).toEqual(newChallenge());
  saved.snapshot.challenge!.shots = 11;
  expect(validateSave(saved)).toBeNull();
  expect(validChallenge({shots: 0, score: Infinity, pocketed: 0, combo: 0})).toBe(false);
  delete saved.snapshot.challenge;
  expect(validateSave(saved)).not.toBeNull();
});
