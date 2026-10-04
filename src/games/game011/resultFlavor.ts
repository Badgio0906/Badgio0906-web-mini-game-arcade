import type { UnkoResult } from './contracts';

export function resultComment(result: Pick<UnkoResult, 'imageCorrect' | 'textCorrect' | 'finalMode' | 'finalStreak'>): string {
  if (result.finalStreak >= 100) return '何のためにここまで？';
  if (result.finalStreak >= 50) return 'ウンコとウコンに人生を捧げています。';
  if (result.finalStreak >= 30) return '判断が速すぎます。';
  if (result.finalMode) return 'ここから先に知識は必要ありません。';
  if (result.imageCorrect === 10) return '知識はある。反射が足りない。';
  return 'まずは落ち着いて見ましょう。';
}
