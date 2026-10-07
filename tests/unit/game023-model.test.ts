import { describe, expect, it } from 'vitest';
import { allKana, categories, kanaGroups, normalizeKana, validateWords, words, wordById } from '../../src/games/game023/words';
import { createQuestion, guess, letterHint, nextQuestion, nextSeed, restoreQuestion, visibleLetters } from '../../src/games/game023/model';
import { questionTelemetry } from '../../src/games/game023/telemetry';

const byReading = (reading: string) => words.find(word => word.reading === reading)!.word_id;
describe('Game023 vocabulary and full fixed kana keyboard', () => {
  it('has 180 unique original 3–8-character reads and valid IDs, clues and categories', () => {
    expect(words).toHaveLength(180); expect(validateWords()).toEqual([]);
    expect(new Set(words.map(word => word.reading)).size).toBe(180);
    for (const category of Object.keys(categories)) expect(words.filter(word => word.category === category)).toHaveLength(30);
  });
  it('offers independent complete清音, voiced/semi voiced, small and long kana sets', () => {
    expect(kanaGroups[0].keys.join('')).toBe('あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん');
    expect(kanaGroups[1].keys.join('')).toBe('がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゔ');
    expect(kanaGroups[2].keys.join('')).toBe('ぁぃぅぇぉっゃゅょゎゕゖー');
    expect(allKana.size).toBe(kanaGroups.flatMap(group => group.keys).length);
    for (const word of words) for (const kana of word.reading) expect(allKana.has(kana)).toBe(true);
  });
  it('normalizes decomposed dakuten as one character and keeps small/large kana distinct', () => {
    expect(normalizeKana('か\u3099')).toBe('が'); expect([...normalizeKana('は\u309a')]).toHaveLength(1);
    expect([...words.find(word => word.reading === 'おにぎり')!.reading]).toHaveLength(4);
    expect([...words.find(word => word.reading === 'きって')!.reading]).toHaveLength(3);
    expect([...words.find(word => word.reading === 'きゃべつ')!.reading]).toHaveLength(4);
  });
  it('detects invalid IDs, duplicates, impossible keys, length and metadata', () => {
    expect(validateWords([{ ...words[0], reading: 'カナ', clue: '', difficulty: 'impossible' as never }]).length).toBeGreaterThan(0);
    expect(validateWords([words[0], words[0]])).toContain(`duplicate:${words[0].word_id}`);
  });
});
describe('Game023 pure question model', () => {
  it('reveals every occurrence of a matching letter with one guess', () => {
    const q = guess(createQuestion(byReading('しんかんせん'), 23), 'ん').question;
    expect(visibleLetters(q)).toEqual([null, 'ん', null, 'ん', null, 'ん']); expect(q.remaining).toBe(8); expect(q.selections).toBe(1);
  });
  it('ignores duplicate hits and misses without spending chances or selection counts', () => {
    let q = guess(createQuestion(byReading('おにぎり'), 1), 'お').question;
    expect(guess(q, 'お').question).toBe(q); q = guess(q, 'あ').question;
    expect(q.remaining).toBe(7); expect(guess(q, 'あ').changed).toBe(false); expect(guess(q, 'あ').question).toBe(q);
  });
  it('accepts normalized voiced kana and distinguishes unvoiced guesses', () => {
    let q = createQuestion(byReading('おにぎり'), 1); q = guess(q, 'き').question;
    expect(q.remaining).toBe(7); q = guess(q, 'き\u3099').question; expect(q.remaining).toBe(7); expect(visibleLetters(q)[2]).toBe('ぎ');
    expect(guess(q, 'ぎ').changed).toBe(false);
  });
  it('handles semi voiced, small tsu/ya and long marks independently', () => {
    let q = createQuestion(byReading('しょくぱん'), 1); q = guess(q, 'は').question; q = guess(q, 'ぱ').question;
    expect(q.remaining).toBe(7); expect(visibleLetters(q)[3]).toBe('ぱ');
    q = createQuestion(byReading('きって'), 1); q = guess(q, 'つ').question; expect(visibleLetters(q)[1]).toBe(null);
    q = guess(q, 'っ').question; expect(visibleLetters(q)[1]).toBe('っ');
    q = createQuestion(byReading('きゃべつ'), 1); q = guess(q, 'ゃ').question; expect(visibleLetters(q)[1]).toBe('ゃ');
    q = createQuestion(byReading('くっきー'), 1); q = guess(q, 'ー').question; expect(visibleLetters(q)[3]).toBe('ー');
  });
  it('ignores invalid, multi-character, katakana and free text input', () => {
    const q = createQuestion(words[0].word_id, 1);
    for (const input of ['おにぎり', 'カ', '', '<script>', 'a']) expect(guess(q, input).question).toBe(q);
  });
  it('ends exactly on the eighth new miss and rejects later input and hints', () => {
    let q = createQuestion(byReading('おにぎり'), 1);
    const wrong = [...allKana].filter(kana => !wordById.get(q.word_id)!.reading.includes(kana));
    for (let i = 0; i < 8; i++) { q = guess(q, wrong[i]).question; expect(q.outcome).toBe(i === 7 ? 'ended' : 'playing'); }
    expect(q.remaining).toBe(0); expect(guess(q, 'お').question).toBe(q); expect(letterHint(q).question).toBe(q);
  });
  it('correct completion is terminal without changing remaining chances', () => {
    let q = createQuestion(byReading('きって'), 1); for (const kana of 'きって') q = guess(q, kana).question;
    expect(q.outcome).toBe('correct'); expect(q.remaining).toBe(8); expect(guess(q, 'あ').changed).toBe(false);
  });
  it('permits one seeded free letter hint, reveals repeats, and completes the last letter', () => {
    let q = createQuestion(byReading('しんかんせん'), 123); for (const kana of 'しかせ') q = guess(q, kana).question;
    q = letterHint(q).question; expect(q.hintLetter).toBe('ん'); expect(q.outcome).toBe('correct'); expect(q.remaining).toBe(8); expect(q.selections).toBe(3);
    expect(letterHint(q).question).toBe(q);
    const a = letterHint(createQuestion(words[0].word_id, 42)).question, b = letterHint(createQuestion(words[0].word_id, 42)).question;
    expect(a).toEqual(b); expect(letterHint(a).changed).toBe(false);
  });
  it('solves every initial word through the same selectable keyboard', () => {
    for (const word of words) {
      let q = createQuestion(word.word_id, 23); for (const kana of word.reading) q = guess(q, kana).question;
      expect(q.outcome, word.word_id).toBe('correct'); expect(visibleLetters(q).join('')).toBe(word.reading); expect(restoreQuestion(q)).toEqual(q);
    }
  });
  it('serializes and restores exact question, hint, misses and seed', () => {
    let q = createQuestion(byReading('くっきー'), 1234); q = guess(q, 'あ').question; q = letterHint(q).question;
    expect(restoreQuestion(JSON.parse(JSON.stringify(q)))).toEqual(q); expect(letterHint(restoreQuestion(q)!).changed).toBe(false);
  });
  it('rejects corrupted semantic snapshots and guesses after terminal completion', () => {
    const q = createQuestion(words[0].word_id, 1);
    for (const bad of [{ ...q, remaining: 7 }, { ...q, guessed: ['か\u3099'] }, { ...q, guessed: ['お', 'お'] }, { ...q, hintUsed: true, hintLetter: 'あ' }, { ...q, outcome: 'correct' }, { ...q, seed: -1 }, { ...q, selections: 5 }]) expect(restoreQuestion(bad)).toBeNull();
    let finished = q; for (const kana of 'おにぎり') finished = guess(finished, kana).question;
    expect(restoreQuestion({ ...finished, guessed: [...finished.guessed, 'あ'], selections: finished.selections + 1, remaining: 7 })).toBeNull();
  });
  it('never mutates the input state or recent history', () => {
    const q = createQuestion(words[0].word_id, 1), original = structuredClone(q); guess(q, 'あ'); letterHint(q); expect(q).toEqual(original);
    const history = [q.word_id]; nextQuestion(1, history); expect(history).toEqual([q.word_id]);
  });
});
describe('Game023 deterministic cycle and privacy', () => {
  it('replays the same seed/history sequence including cycle boundaries', () => {
    let a = nextQuestion(99), b = nextQuestion(99); expect(a).toEqual(b);
    for (let i = 0; i < 400; i++) { a = nextQuestion(a.seed, a.history); b = nextQuestion(b.seed, b.history); expect(a).toEqual(b); }
    expect(nextSeed(0)).not.toBe(0);
  });
  it('asks all 180 words once before safely cycling without an immediate repeat', () => {
    let cycle = nextQuestion(123), last = cycle.question.word_id; const seen = new Set([last]);
    for (let i = 1; i < 180; i++) { cycle = nextQuestion(cycle.seed, cycle.history); expect(cycle.question.word_id).not.toBe(last); expect(seen.has(cycle.question.word_id)).toBe(false); seen.add(cycle.question.word_id); last = cycle.question.word_id; }
    expect(seen.size).toBe(180); cycle = nextQuestion(cycle.seed, cycle.history); expect(cycle.question.word_id).not.toBe(last); expect(cycle.history).toHaveLength(2);
  });
  it('filters unknown history IDs and still suppresses the current word', () => {
    expect(nextQuestion(123, ['unknown', words[0].word_id, words[0].word_id]).history.filter(id => id === words[0].word_id)).toHaveLength(1);
  });
  it('exports only controlled word IDs/category tokens and meaningful numeric/hint fields', () => {
    for (const word of words) {
      const q = guess(createQuestion(word.word_id, 23), word.reading[0]).question, payload = questionTelemetry(q);
      expect(Object.keys(payload).sort()).toEqual(['category', 'count', 'hint_used', 'remaining', 'word_id', 'wrong_count']);
      expect(payload.word_id).toBe(word.word_id); expect(payload.category).toBe(word.category); expect(payload.count).toBe(1);
      expect(JSON.stringify(payload)).not.toContain(word.reading); expect(Object.values(payload).filter(value => typeof value === 'string')).toEqual([word.word_id, word.category]);
    }
  });
});
