import { describe, expect, it } from 'vitest';
import { words, wordById, kanaGroups, allKana, validateWords } from '@game023/words';
import { createQuestion, guess, letterHint, nextQuestion, restoreQuestion, visibleLetters } from '@game023/model';
import { emptySave, markReported, QuestionStore, validateSave } from '@game023/persistence';
const id='11111111-2222-4333-8444-555555555555';
describe('Independent Game023 source model and persistence review',()=>{
 it('independently counts and checks all data, complete keys and spoken hiragana format',()=>{
  expect(words).toHaveLength(180);expect(new Set(words.map(w=>w.word_id)).size).toBe(180);expect(new Set(words.map(w=>w.reading)).size).toBe(180);expect(validateWords()).toEqual([]);
  expect(allKana.size).toBe(kanaGroups.flatMap(g=>g.keys).length);
  for(const w of words){expect(w.reading.normalize('NFC')).toBe(w.reading);expect([...w.reading].length).toBeGreaterThanOrEqual(3);expect([...w.reading].length).toBeLessThanOrEqual(8);expect(w.reading).toMatch(/^[\u3041-\u3096ー]+$/u);for(const c of w.reading)expect(allKana.has(c)).toBe(true);}
 });
 it('each initial word can be solved, hinted on the final distinct character, and semantically restored',()=>{
  for(const word of words){const unique=[...new Set([...word.reading])];let q=createQuestion(word.word_id,65535);for(const letter of unique.slice(0,-1))q=guess(q,letter).question;
   const old=structuredClone(q);const result=letterHint(q);expect(q).toEqual(old);expect(result.question.outcome).toBe('correct');expect(result.question.remaining).toBe(8);expect(visibleLetters(result.question).join('')).toBe(word.reading);expect(restoreQuestion(result.question)).toEqual(result.question);expect(letterHint(result.question).changed).toBe(false);expect(guess(result.question,'あ').changed).toBe(false);
  }
 });
 it('all initial words allow eight unique misses and duplicate misses/hits never change state',()=>{
  for(const w of words){let q=createQuestion(w.word_id,65535);const miss=[...allKana].filter(c=>!w.reading.includes(c)).slice(0,8);q=guess(q,w.reading[0]).question;expect(guess(q,w.reading[0]).changed).toBe(false);for(const c of miss){q=guess(q,c).question;expect(guess(q,c).changed).toBe(false);}expect(q.outcome).toBe('ended');expect(q.remaining).toBe(0);expect(restoreQuestion(q)).toEqual(q);expect(guess(q,w.reading.at(-1)!).changed).toBe(false);}
 });
 it('cycles long histories without immediate repeat and resets a full exhausted history safely',()=>{
  let cycle=nextQuestion(987654),last=cycle.question.word_id;for(let i=0;i<1000;i++){cycle=nextQuestion(cycle.seed,cycle.history);expect(cycle.question.word_id).not.toBe(last);expect(cycle.history.at(-1)).toBe(cycle.question.word_id);last=cycle.question.word_id;expect(cycle.history.length).toBeLessThanOrEqual(180);}
 });
 it('restores same UUID/word for paused ongoing question and finished flag stops duplicate reports',()=>{
  const save=emptySave(44);save.history=['w_food_001'];save.current={run_id:id,question:createQuestion('w_food_001',44),reported:false};save.state='paused';let raw='';const backend={getItem:()=>raw,setItem:(_k:string,v:string)=>{raw=v;}};
  new QuestionStore(backend).write(save);const ongoing=new QuestionStore(backend).read()!;expect(ongoing.current!.run_id).toBe(id);expect(ongoing.current!.question.word_id).toBe('w_food_001');
  for(const c of wordById.get(ongoing.current!.question.word_id)!.reading)ongoing.current!.question=guess(ongoing.current!.question,c).question;
  ongoing.state='result';expect(markReported(ongoing)).toBe(true);new QuestionStore(backend).write(ongoing);const restored=new QuestionStore(backend).read()!;expect(markReported(restored)).toBe(false);expect(restored.current!.run_id).toBe(id);expect(restored.reportedLedger).toEqual([id]);expect(validateSave(restored)).toEqual(restored);
 });
});
