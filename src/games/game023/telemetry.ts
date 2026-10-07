import { wordById } from './words';
import { wrongCount, type QuestionState } from './model';
/** IDs and controlled category tokens only. Answers and guessed kana never cross this boundary. */
export function questionTelemetry(question: QuestionState): Record<string, string | number | boolean> {
  const word = wordById.get(question.word_id)!;
  return { word_id: word.word_id, category: word.category, count: question.selections, wrong_count: wrongCount(question), hint_used: question.hintUsed, remaining: question.remaining };
}
