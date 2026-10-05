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

const originalGames = entries.map(([titleJa, titleEn, tagline], index) => {
  const id = `game${String(index + 1).padStart(3, '0')}`;
  return Object.freeze({ id, titleJa, titleEn, tagline, thumbnail: `./assets/portal/${id}.webp`, route: `./${id}.html`, releaseOrder: index + 1 });
});

const legacyGames: readonly GameCatalogEntry[] = [
  { id: 'game012', titleJa: '澤野さんの横取りデイズ', titleEn: 'YOKODORI DAYS', tagline: '「今だ！」の瞬間に、同僚の仕事とバナナを横取り。', thumbnail: './assets/portal/game012.webp', route: './games/yokodori-days/index.html', releaseOrder: 12 },
  { id: 'game013', titleJa: '立花さんのタスク天国', titleEn: 'TASK HEAVEN', tagline: '上司のお手本を覚えて、1〜4キーで仕事を奏でよう。', thumbnail: './assets/portal/game013.webp', route: './games/tachibana-task-heaven/index.html', releaseOrder: 13 },
  { id: 'game014', titleJa: '畑島さんの指ハートチャレンジ', titleEn: 'FINGER HEART CHALLENGE', tagline: '指ハートの瞬間でストップ。全5段階、25回成功を目指せ。', thumbnail: './assets/portal/game014.webp', route: './games/finger-heart-challenge/index.html', releaseOrder: 14 },
];

export const gameCatalog: readonly GameCatalogEntry[] = Object.freeze([...originalGames, ...legacyGames,
  { id: 'game015', titleJa: '落下キング', titleEn: 'FALL KING', tagline: '上を目指すな。うまく落ちろ。', thumbnail: './assets/portal/game015.webp', route: './game015.html', releaseOrder: 15 },
  { id: 'game016', titleJa: '負けじゃんけん ～LOSE TO WIN～', titleEn: 'LOSE TO WIN', tagline: '勝ったら負け。負ければ勝ち。', thumbnail: './assets/portal/game016.webp', route: './game016.html', releaseOrder: 16 },
  { id: 'game017', titleJa: '雨って避けたら濡れないよね ～RAINSHIFT～', titleEn: 'RAINSHIFT', tagline: '雨？ 当たらなければ晴れです。', thumbnail: './assets/portal/game017.webp', route: './game017.html', releaseOrder: 17 },
].map(game => Object.freeze(game)));
