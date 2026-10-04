export function elevatorTitle(floor: number, deliveredPeople: number, deliveredCargo: number): string {
  const delivered = Math.max(0, deliveredPeople) + Math.max(0, deliveredCargo);
  if (!Number.isFinite(delivered) || delivered === 0) return '見送りの達人';
  if (floor >= 100 && delivered >= 50) return '銀河級の超業務用昇降機大明神';
  if (floor >= 60 && delivered >= 30) return '天空配送エグゼクティブ';
  if (floor >= 40 && delivered >= 20) return 'コピー機も冷蔵庫も任せろ';
  if (floor >= 20 && delivered >= 10) return 'ビルの縁の下の力持ち';
  if (delivered >= 5) return '社内配送の職人';
  return 'エレベーター見習い';
}
