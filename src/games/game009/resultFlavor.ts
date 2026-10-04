export function stampTitle(correct: number, clutterLevel: number): string {
  const count = Number.isFinite(correct) ? Math.max(0, Math.floor(correct)) : 0;
  if (count >= 80) return '銀河級書類迷宮アルティメット発掘大博士';
  if (count >= 50) return '超次元デスク発掘大博士';
  if (count >= 30) return '書類の海の航海士';
  if (count >= 15) return '机上考古学者';
  if (count >= 5) return 'デスク探索員';
  return clutterLevel >= 12 ? '整理整頓をおすすめします' : 'デスク探索見習い';
}
