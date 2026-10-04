export const PARKING_TITLE_BANDS = [
  { min: 0, title: '初心者ドライバー' },
  { min: 3, title: '車庫入れ見習い' },
  { min: 7, title: '駐車場の住人' },
  { min: 12, title: '車庫入れ職人' },
  { min: 20, title: 'ミリ単位の魔術師' },
  { min: 30, title: '超絶アルティメット縦列駐車神' },
  { min: 50, title: '銀河無双のミラクル車庫入れ大明神' },
] as const;
export function parkingTitle(parked: number): string {
  const count = Number.isFinite(parked) ? Math.max(0, Math.floor(parked)) : 0;
  let title: string = PARKING_TITLE_BANDS[0].title;
  for (const band of PARKING_TITLE_BANDS) if (count >= band.min) title = band.title;
  return title;
}
