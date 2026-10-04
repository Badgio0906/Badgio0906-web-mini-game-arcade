export function coffeeTitle(distance: number, cupCount: number): string {
  const meters = Number.isFinite(distance) ? Math.max(0, distance) : 0;
  if (cupCount >= 3 && meters >= 2000) return '三杯同時運搬超絶バランス神';
  if (cupCount >= 3 && meters >= 1200) return '会長も部長も任せろ';
  if (meters >= 1500) return '一滴も許さぬ運搬職人';
  if (meters >= 800) return 'カフェイン運搬職人';
  if (meters >= 350) return '安定の給湯室係';
  return 'コーヒー初心者';
}
