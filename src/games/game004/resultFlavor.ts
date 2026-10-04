export const MEMORY_JOKE_LABEL = 'ゲーム内のネタです';
export const MEMORY_COMMENT_SUFFIX = '（わが家の子供調べ）';
export const MEMORY_COMMENT_BANDS = [
  { minLevel: 1, comment: '5歳相当の記憶力です' },
  { minLevel: 4, comment: 'うちの甥っ子といい勝負です' },
  { minLevel: 7, comment: '16歳相当の記憶力です' },
  { minLevel: 10, comment: 'まだまだ現役です' },
  { minLevel: 14, comment: '28歳相当の記憶力です' },
  { minLevel: 18, comment: 'かなり冴えています' },
  { minLevel: 24, comment: '人類上位クラスの記憶力かもしれません' },
  { minLevel: 32, comment: 'もはや記憶装置です' },
] as const;

/** A game joke selected by reached LEVEL, not a medical or scientific assessment. */
export function memoryComment(level: number): string {
  const reached = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  let comment: string = MEMORY_COMMENT_BANDS[0].comment;
  for (const band of MEMORY_COMMENT_BANDS) if (reached >= band.minLevel) comment = band.comment;
  return comment + MEMORY_COMMENT_SUFFIX;
}
