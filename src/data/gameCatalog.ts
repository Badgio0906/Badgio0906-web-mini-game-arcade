import { tagsFor, type GameTag, type TagId } from './tagCatalog.ts';
export interface GameCatalogEntry {
  readonly id: string;
  readonly status: 'active' | 'retired';
  readonly titleJa: string;
  readonly titleEn: string;
  readonly tagline: string;
  readonly thumbnail: string;
  readonly route: string;
  readonly releaseOrder: number;
  readonly tags: readonly GameTag[];
  readonly difficulty: 'standard' | 'rising' | 'hard';
}

const entries = [
  ['軌道をズラせ！', 'ORBIT SHIFT', '押すのは一回。間違うのは一瞬。'],
  ['ゆううつな月曜日', 'WORKDAY DODGE', '弊社まで1000m。出勤するか、人生を変えるか。'],
  ['我が国の建築は世界一ぃ！', 'DROP TOWER', 'まっすぐ積むか、左右で釣り合う芸術建築か。'],
  ['あなたの短期記憶、無事ですか？', 'ECHO GRID', '光った順番、覚えてますよね？'],
  ['右往左往の仕分け術', 'SORT SHIFT', 'ルールは簡単。途中で変わるまでは。'],
  ['ギリギリ駐車', 'PARK IT!', '安全枠か、挑戦枠か。止めどころまで、腕の見せどころ。'],
  ['まだ乗れます', 'ELEVATOR OVERLOAD', '誰を乗せ、どこで降ろす？次の階も待っている。'],
  ['コーヒーこぼすな', 'COFFEE WALK', '急ぐなら直線。曲がる前に、落ち着いて。'],
  ['印鑑どこですか', 'STAMP HUNT', '頼まれた物を探せ。紙の下も、机の記憶も。'],
  ['会議、聞いてます？', 'MEETING SURVIVAL', '提案、決定、訂正。最後に決まったのは？'],
  ['ウンコかウコンかゲーム', 'UNKO or UKON', '絶対わかる。0.5秒になるまでは。'],
] as const;

const originalGames = entries.map(([titleJa, titleEn, tagline], index) => {
  const id = `game${String(index + 1).padStart(3, '0')}`;
  return Object.freeze({ id, titleJa, titleEn, tagline, thumbnail: `./assets/portal/${id}.webp`, route: `./${id}.html`, releaseOrder: index + 1 });
});

const legacyGames = [
  { id: 'game012', titleJa: 'お前の仕事は俺の仕事', titleEn: 'YOUR WORK IS MY WORK', tagline: '「今だ！」の瞬間に、同僚の仕事とバナナを横取り。', thumbnail: './assets/portal/game012.webp', route: './games/yokodori-days/index.html', releaseOrder: 12 },
  { id: 'game013', titleJa: 'タスク天国', titleEn: 'TASK HEAVEN', tagline: '上司のお手本を覚えて、1〜4キーで仕事を奏でよう。', thumbnail: './assets/portal/game013.webp', route: './games/tachibana-task-heaven/index.html', releaseOrder: 13 },
  { id: 'game014', titleJa: '指ハートチャレンジ', titleEn: 'FINGER HEART CHALLENGE', tagline: '指ハートの瞬間でストップ。全5段階、25回成功を目指せ。', thumbnail: './assets/portal/game014.webp', route: './games/finger-heart-challenge/index.html', releaseOrder: 14 },
];

// 012/013 remain bound to their actual titles; the request's numbered examples
// invert these two IDs, but must never invert existing routes or records.
const gameTagIds: Readonly<Record<string, readonly TagId[]>> = {
  game001: ['reflex','dodge','score-attack','short'],
  game002: ['dodge','office','commute','endless','absurd'],
  game003: ['timing','stacking','architecture','score-attack','absurd'],
  game004: ['memory','decision','brain-training','short'],
  game005: ['decision','rule-change','brain-training','office'],
  game006: ['physics','timing','precision','vehicle'],
  game007: ['decision','office','puzzle','weight'],
  game008: ['balance','office','drink','precision'],
  game009: ['search','office','desk','score-attack'],
  game010: ['decision','office','meeting','memory'],
  game011: ['quiz','reflex','absurd','decision'],
  game012: ['timing','office','absurd','reflex'],
  game013: ['office','rhythm','decision','absurd'],
  game014: ['timing','pose','absurd','short'],
  game015: ['fall','precision','pixel-art','retro','hard'],
  game016: ['reflex','decision','quiz','absurd','short'],
  game017: ['dodge','weather','absurd','endless'],
  game018: ['physics','multi-step','distance','absurd'],
  game019: ['jump','rise','pixel-art','animal','hard','precision','space','wind'],
  game020: ['puzzle','decision','brain-training'],
  game021: ['puzzle','decision','brain-training'],
  game022: ["puzzle", "decision", "brain-training"],
  game023: ["quiz", "decision", "brain-training"],
};

const difficultyBands = ['standard','standard','standard','standard','standard','standard','standard','standard','standard','standard','rising','standard','standard','rising','hard','rising','rising','standard','hard','standard','standard','standard','standard'] as const;

export const historicalGameCatalog: readonly GameCatalogEntry[] = Object.freeze([...originalGames, ...legacyGames,
  { id: 'game015', titleJa: '落下キング', titleEn: 'FALL KING', tagline: '上を目指すな。うまく落ちろ。', thumbnail: './assets/portal/game015.webp', route: './game015.html', releaseOrder: 15 },
  { id: 'game016', titleJa: '負けじゃんけん ～LOSE TO WIN～', titleEn: 'LOSE TO WIN', tagline: '勝ったら負け。負ければ勝ち。', thumbnail: './assets/portal/game016.webp', route: './game016.html', releaseOrder: 16 },
  { id: 'game017', titleJa: '雨って避けたら濡れないよね ～RAINSHIFT～', titleEn: 'RAINSHIFT', tagline: '雨？ 当たらなければ晴れです。', thumbnail: './assets/portal/game017.webp', route: './game017.html', releaseOrder: 17 },
  { id: 'game018', titleJa: '靴とばそ ～Shoe fly in the sky～', titleEn: 'Shoe fly in the sky', tagline: '靴は履くもの？ それ誰が決めた？', thumbnail: './assets/portal/game018.webp', route: './game018.html', releaseOrder: 18 },
  { id: 'game019', titleJa: '井の中の蛙、大海を目指す ～WELL TO SPACE～', titleEn: 'WELL TO SPACE', tagline: '井戸を出たら、今度は宇宙でした。', thumbnail: './assets/portal/game019.webp', route: './game019.html', releaseOrder: 19 },
  { id: 'game020', titleJa: 'すっきり牌合わせ ～PAIR TILE～', titleEn: 'PAIR TILE', tagline: '同じ柄を、ひと組ずつ。時間を気にせず、盤面すっきり。', thumbnail: './assets/portal/game020.webp', route: './game020.html', releaseOrder: 20 },
  { id: 'game021', titleJa: 'ならべて4つ ～FOUR IN A ROW～', titleEn: 'FOUR IN A ROW', tagline: 'ひとつ置いて、先を読む。4つつながる、静かな勝負。', thumbnail: './assets/portal/game021.webp', route: './game021.html', releaseOrder: 21 },
  {"id": "game022", "titleJa": "ひと息ソリティア ～KLONDIKE～", "titleEn": "KLONDIKE", "tagline": "一枚ずつ、すっきり。いつものカードで、ひと息。", "thumbnail": "./assets/portal/game022.webp", "route": "./game022.html", "releaseOrder": 22},
  {"id": "game023", "titleJa": "伏字ことば ～KANA GUESS～", "titleEn": "KANA GUESS", "tagline": "一文字わかると、ことばが見える。", "thumbnail": "./assets/portal/game023.webp", "route": "./game023.html", "releaseOrder": 23},
].map(game => Object.freeze({ ...game, status: game.id === 'game010' ? 'retired' as const : 'active' as const, tags: tagsFor(gameTagIds[game.id]), difficulty: difficultyBands[game.releaseOrder - 1] })));

/** Stable IDs and releaseOrder survive retirement; new releases never fill retired IDs. */
export const gameCatalog: readonly GameCatalogEntry[] = Object.freeze(historicalGameCatalog.filter(game => game.status === 'active'));
export const retiredGameCatalog: readonly GameCatalogEntry[] = Object.freeze(historicalGameCatalog.filter(game => game.status === 'retired'));
export const NEXT_GAME_NUMBER = Math.max(...historicalGameCatalog.map(game => Number(game.id.slice(4)))) + 1;

export function filterCatalog(tagIds: readonly TagId[] = []): readonly GameCatalogEntry[] {
  return gameCatalog.filter(game => tagIds.every(id => game.tags.some(tag => tag.id === id)));
}
