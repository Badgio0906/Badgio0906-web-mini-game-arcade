import { describe, expect, it } from 'vitest';
import { createQuestion, guess, letterHint } from '../../src/games/game023/model';
import { emptySave, markReported, QuestionStore, SAVE_KEY, validateSave, validRunId } from '../../src/games/game023/persistence';
const runId = '12345678-1234-4234-8234-123456789abc';
const active = () => { const save = emptySave(23); save.history = ['w_food_001']; save.current = { question: createQuestion('w_food_001', 23), run_id: runId, reported: false }; save.state = 'playing'; return save; };
describe('Game023 one JSON save and once-only result ledger', () => {
  it('restores exactly the same question, history and existing RUN after reload', () => {
    const save = active(); save.current!.question = letterHint(guess(save.current!.question, 'あ').question).question;
    let raw = ''; const backend = { getItem: (key: string) => key === SAVE_KEY ? raw : null, setItem: (key: string, value: string) => { expect(key).toBe(SAVE_KEY); raw = value; } };
    new QuestionStore(backend).write(save); const restored = new QuestionStore(backend).read()!;
    expect(restored).toEqual(save); expect(restored.current!.run_id).toBe(runId); expect(restored.current!.question.word_id).toBe('w_food_001');
  });
  it('persists completed question and report ledger atomically and never reports again', () => {
    const save = active(); for (const kana of 'おにぎり') save.current!.question = guess(save.current!.question, kana).question;
    save.state = 'result'; expect(markReported(save)).toBe(true); expect(markReported(save)).toBe(false);
    const writes: string[] = []; const backend = { getItem: () => writes.at(-1) ?? null, setItem: (_key: string, value: string) => { writes.push(value); } };
    new QuestionStore(backend).write(save); expect(writes).toHaveLength(1);
    const restored = new QuestionStore(backend).read()!; expect(restored.current!.question.outcome).toBe('correct'); expect(markReported(restored)).toBe(false); expect(restored.reportedLedger).toEqual([runId]);
  });
  it('rejects wrong game/version, wrong history, tampered report flags and invalid UUIDs', () => {
    const save = active();
    for (const bad of [{ ...save, game_id: 'game020' }, { ...save, rules_version: 'other' }, { ...save, seed: NaN }, { ...save, history: ['w_food_002'] }, { ...save, reportedLedger: [runId] }, { ...save, state: 'result' }, { ...save, current: { ...save.current!, run_id: 'free text' } }, { ...save, history: ['w_food_001', 'w_food_001'] }]) expect(validateSave(bad)).toBeNull();
    expect(validRunId(runId)).toBe(true); expect(validRunId('abc')).toBe(false);
  });
  it('rejects result snapshots that have not atomically recorded their report', () => {
    const save = active(); for (const kana of 'おにぎり') save.current!.question = guess(save.current!.question, kana).question;
    save.state = 'result'; expect(validateSave(save)).toBeNull(); markReported(save); expect(validateSave(save)).toEqual(save);
  });
  it('treats malformed, huge, missing and denied storage as optional', () => {
    for (const raw of ['', '{', 'null', 'x'.repeat(60001)]) expect(new QuestionStore({ getItem: () => raw, setItem: () => {} }).read()).toBeNull();
    const store = new QuestionStore({ getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } });
    expect(store.read()).toBeNull(); store.write(active()); expect(store.read()).toEqual(active()); expect(store.memoryOnly).toBe(true);
  });
  it('does not reread stale storage after a denied write or expose mutable page-memory data', () => {
    const stale = JSON.stringify(emptySave(42)); let count = 0;
    const store = new QuestionStore({ getItem: () => stale, setItem: () => { count++; throw new Error('denied'); } });
    store.write(active()); const resumed = store.read()!; resumed.current!.question.remaining = 0;
    expect(store.read()).toEqual(active()); store.write(active()); expect(count).toBe(1);
  });
  it('bounds the ledger and permits title snapshots with no current question', () => {
    const save = active(); save.reportedLedger = Array.from({ length: 200 }, (_, i) => `${i.toString(16).padStart(8, '0')}-1234-4234-8234-123456789abc`);
    markReported(save); expect(save.reportedLedger).toHaveLength(200); expect(save.reportedLedger.at(-1)).toBe(runId);
    expect(validateSave(emptySave(23))).toEqual(emptySave(23));
  });
});
