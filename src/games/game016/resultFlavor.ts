export function loseTitle(correct: number): string {
  const n = Math.max(0, Math.floor(Number.isFinite(correct) ? correct : 0));
  return n === 0 ? '勝つクセ、健在。' : n <= 5 ? '負け下手' : n <= 10 ? '負けの初心者' : n <= 20 ? '立派な敗者' : n <= 30 ? '負けるが勝ち' : n <= 40 ? '敗北のプロ' : n <= 60 ? '連敗王' : n <= 100 ? '負けじゃんけん名人' : '超絶アルティメット敗北神';
}
export function loseComment(correct: number, speedCorrect = Math.max(0, correct - 30)): string {
  if (speedCorrect >= 100) return '勝ち方を忘れていませんか？';
  if (speedCorrect >= 30) return '敗北が身体に染みついています。';
  if (speedCorrect >= 10) return '考える前に負けています。';
  return correct >= 30 ? 'もう負け方は完璧です。' : correct >= 20 ? '文字でも負けられました。' : correct >= 10 ? 'イラストでは負けられました。' : '普通に勝とうとしてませんか？';
}
