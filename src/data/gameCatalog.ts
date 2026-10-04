export interface GameCatalogEntry {
  readonly id: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly tagline: string;
  readonly thumbnail: string;
  readonly route: string;
  readonly releaseOrder: number;
}

const entries = [
  ['軌道をズラせ！', 'ORBIT SHIFT', '押すのは一回。間違うのは一瞬。'],
  ['ゆううつな月曜日', 'WORKDAY DODGE', '弊社まで1000m。出勤するか、人生を変えるか。'],
  ['我が国の建築は世界一ぃ！', 'DROP TOWER', '積め。15mを超えた先は、責任を持てません。'],
  ['あなたの短期記憶、無事ですか？', 'ECHO GRID', '光った順番、覚えてますよね？'],
  ['右往左往の仕分け術', 'SORT SHIFT', 'ルールは簡単。途中で変わるまでは。'],
  ['ギリギリ駐車', 'PARK IT!', 'あと3cm。たぶん入る。たぶん。'],
  ['まだ乗れます', 'ELEVATOR OVERLOAD', 'あと82kg。乗せる？見送る？責任はあなたです。'],
  ['コーヒーこぼすな', 'COFFEE WALK', '一滴もこぼさず、部長の分まで持っていけ。'],
  ['印鑑どこですか', 'STAMP HUNT', '片づけるか、倍率を取るか。印鑑はたぶんそこ。'],
  ['会議、聞いてます？', 'MEETING SURVIVAL', '聞くふりをしながら、仕事を進めろ。'],
  ['ウンコかウコンかゲーム', 'UNKO or UKON', '絶対わかる。0.5秒になるまでは。'],
] as const;

export const gameCatalog: readonly GameCatalogEntry[] = Object.freeze(entries.map(([titleJa, titleEn, tagline], index) => {
  const id = `game${String(index + 1).padStart(3, '0')}`;
  return Object.freeze({ id, titleJa, titleEn, tagline, thumbnail: `./assets/portal/${id}.webp`, route: `./${id}.html`, releaseOrder: index + 1 });
}));
