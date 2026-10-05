import { HANDS } from './types';
import type { Hand, TextQuestion } from './types';

export const HAND_LABELS: Readonly<Record<Hand, string>> = Object.freeze({ rock: 'グー', scissors: 'チョキ', paper: 'パー' });
export const HIRAGANA_LABELS: Readonly<Record<Hand, string>> = Object.freeze({ rock: 'ぐー', scissors: 'ちょき', paper: 'ぱー' });
export const LOSING_HAND: Readonly<Record<Hand, Hand>> = Object.freeze({ rock: 'scissors', scissors: 'paper', paper: 'rock' });
/** Opponent first, player second. A draw or the usual winning answer never counts. */
export function loseCorrect(opponent: Hand, player: Hand): boolean { return HANDS.includes(opponent) && LOSING_HAND[opponent] === player; }
export type HandClue = { kind: 'exclude'; hands: readonly Hand[] } | { kind: 'beats' | 'losesTo' | 'draw' | 'named'; hand: Hand } | { kind: 'all'; clauses: readonly HandClue[] };
export interface SemanticQuestion extends TextQuestion { question: string; meaning: HandClue }
function matches(hand: Hand, clue: HandClue): boolean {
  switch (clue.kind) {
    case 'exclude': return !clue.hands.includes(hand);
    case 'beats': return loseCorrect(hand, clue.hand);
    case 'losesTo': return loseCorrect(clue.hand, hand);
    case 'draw': case 'named': return hand === clue.hand;
    case 'all': return clue.clauses.every(c => matches(hand, c));
  }
}
export function semanticHands(clue: HandClue): Hand[] { return HANDS.filter(h => matches(h, clue)); }
const named = (hand: Hand): HandClue => ({ kind: 'named', hand });
const exclude = (...hands: Hand[]): HandClue => ({ kind: 'exclude', hands });
const beats = (hand: Hand): HandClue => ({ kind: 'beats', hand });
const losesTo = (hand: Hand): HandClue => ({ kind: 'losesTo', hand });
const draw = (hand: Hand): HandClue => ({ kind: 'draw', hand });
const all = (...clauses: HandClue[]): HandClue => ({ kind: 'all', clauses });
const definitions: readonly [string, Hand, HandClue][] = [
  ['グーとパー以外を出すよ。', 'scissors', exclude('rock', 'paper')],
  ['チョキには勝てる手を出すよ。', 'rock', beats('scissors')],
  ['パーに負ける手を出すよ。', 'rock', losesTo('paper')],
  ['グーには負けない手で、グーではないよ。', 'paper', all(exclude('scissors'), exclude('rock'))],
  ['チョキでもパーでもないよ。', 'rock', exclude('scissors', 'paper')],
  ['紙を切れる手を出すよ。', 'scissors', named('scissors')],
  ['石に勝てる手だよ。', 'paper', beats('rock')],
  ['はさみに負ける手を出すよ。', 'paper', losesTo('scissors')],
  ['パーとあいこになるよ。', 'paper', draw('paper')],
  ['グーに勝つけどチョキには負けるよ。', 'paper', all(beats('rock'), losesTo('scissors'))],
  ['指を全部握りこんだ手だよ。', 'rock', named('rock')],
  ['五本の指をまっすぐ開いた手だよ。', 'paper', named('paper')],
  ['人差し指と中指だけを伸ばすよ。', 'scissors', named('scissors')],
  ['石の手とあいこになるよ。', 'rock', draw('rock')],
  ['はさみの手とあいこになるよ。', 'scissors', draw('scissors')],
  ['石の手に負けるよ。', 'scissors', losesTo('rock')],
  ['紙の手に勝てるよ。', 'scissors', beats('paper')],
  ['石でもはさみでもない手だよ。', 'paper', exclude('rock', 'scissors')],
  ['手のひらを閉じて、こぶしにするよ。', 'rock', named('rock')],
  ['手のひらを全部見せる形にするよ。', 'paper', named('paper')],
  ['伸ばす指は二本。はさみの形にするよ。', 'scissors', named('scissors')],
  ['はさみを壊せるけど、紙には包まれる手だよ。', 'rock', all(beats('scissors'), losesTo('paper'))],
  ['紙は切れるけど、石には壊される手だよ。', 'scissors', all(beats('paper'), losesTo('rock'))],
  ['石の形でも紙の形でもないよ。', 'scissors', exclude('rock', 'paper')],
  ['五本の指をひとつのこぶしにまとめるよ。', 'rock', named('rock')],
  ['にぎりこぶしの手と同じ手を出すよ。', 'rock', draw('rock')],
  ['二本の指を伸ばした手とあいこになるよ。', 'scissors', draw('scissors')],
  ['二本の指を伸ばした手に勝つよ。', 'rock', beats('scissors')],
  ['二本の指を伸ばした手に負けるよ。', 'paper', losesTo('scissors')],
  ['にぎりこぶしに勝てるよ。', 'paper', beats('rock')],
];
function freezeClue(c: HandClue): HandClue {
  if (c.kind === 'all') return Object.freeze({ ...c, clauses: Object.freeze(c.clauses.map(freezeClue)) });
  if (c.kind === 'exclude') return Object.freeze({ ...c, hands: Object.freeze([...c.hands]) });
  return Object.freeze({ ...c });
}
export const TEXT_QUESTIONS: readonly SemanticQuestion[] = Object.freeze(definitions.map(([text, opponentHand, meaning], index) => Object.freeze({
  id: `text-${String(index + 1).padStart(2, '0')}`, question: text, text, opponentHand, meaning: freezeClue(meaning),
  explanation: `相手は${HAND_LABELS[opponentHand]}。${HAND_LABELS[LOSING_HAND[opponentHand]]}なら負けます。`,
})));
export function questionDataIssues(pool: readonly SemanticQuestion[] = TEXT_QUESTIONS): string[] {
  const issues: string[] = [], ids = new Set<string>(), texts = new Set<string>();
  for (const q of pool) {
    if (!q.id || ids.has(q.id)) issues.push('duplicate or empty id'); ids.add(q.id);
    if (!q.question || q.question !== q.text || texts.has(q.text)) issues.push('duplicate, empty or inconsistent text'); texts.add(q.text);
    if (!HANDS.includes(q.opponentHand)) issues.push('invalid opponentHand');
    const answers = semanticHands(q.meaning);
    if (answers.length !== 1 || answers[0] !== q.opponentHand) issues.push(`ambiguous or inconsistent meaning: ${q.id}`);
  }
  return issues;
}
