import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gameCatalog } from '../src/data/gameCatalog.ts';
import { tagCatalog } from '../src/data/tagCatalog.ts';
import { eventNames, TELEMETRY_SCHEMA_VERSION } from '../src/data/telemetrySchema.ts';

const design = {
  game001: ['スコアアタック', 'Space / クリック / タップで軌道を切り替える', '障害物を一回の入力で避け、連続回避を狙う', '軌道の切り替えと障害物への接触', '軌道と障害物を明快に描いた宇宙アーケード'],
  game002: ['回避ランナー', '左右キー / 左右タップで車線移動', '3車線を読み、出社か続行かを選ぶ', '障害物への接触', '漫画風の通勤者と4地区の街'],
  game003: ['タイミング・積み上げ', 'Space / クリック / タップで床を落とす', '位置と支持を読んで建物を積み上げる', '落下位置と重心による崩壊', '建築クレーンと実寸の長方形の階層'],
  game004: ['記憶パズル', '光った順番で9マスをタップ', '順番を記憶し再現する', '記憶順の間違い', '真鍮と黒鉛の記憶装置、点灯キー'],
  game005: ['判断・仕分け', '左右キー / 左右タップで二択仕分け', '途中で変わる分類ルールを読み替える', '誤仕分けまたは時間切れ', '紫色の工場、色と形の荷物、分類看板'],
  game006: ['物理・タイミング', 'Space / タップで角度、次に強さを止める', '車全体が区画に入る角度と距離を予測する', '車体が駐車区画からはみ出す', '俯瞰の車とコードで一致させた駐車枠'],
  game007: ['重量管理', '左右キー / 乗せる・見送るボタン', '次の荷物と降りる階を見ながら容量を予約する', '過積載などの運搬失敗', '真鍮枠とワイン色のオフィスエレベーター'],
  game008: ['バランス・物理', '左右キー / 左右ボタンを押して体を支える', '加速度と液面の揺れを読みながら歩く', 'コーヒーをこぼしてカップが空になる', '一人称の街路とクリップ描画した液面'],
  game009: ['探索', '指定された印鑑をクリック / タップ', '机を片づけるか倍率を取るかを選ぶ', '違う印鑑または時間切れ', '暖かい木の机と個別の印鑑・文具'],
  game010: ['注意切り替え', 'Space / クリック / タップで聞く・作業を切り替える', '仕事で得点を取り、質問の時は聞く', '質問された時に作業している', '会議室、部長の表情、タイピングする手'],
  game011: ['クイズ・反射神経', '左右キー / 二択ボタン', '絵と文字を区別し、速くなる二択へ進む', '選び間違いまたは時間切れ', '20枚のアイコンと対等な二択ボタン'],
  game012: ['タイミング', 'ゲーム内の横取り操作。詳細は既存Godotの説明画面が正本', '同僚の仕事とバナナを今だの瞬間に横取りする', '横取りタイミングの失敗', '移行済みGodotのオフィス画面'],
  game013: ['記憶・リズム', '1〜4キー / 画面の操作ボタン', '上司のお手本を覚えて仕事を奏でる', 'お手本と違う仕事の入力', '移行済みGodotの仕事と上司'],
  game014: ['タイミング・ポーズ', 'クリック / タップで指ハートを止める', '全5段階で25回の指ハート成功を目指す', '指ハートの瞬間を外す', '移行済みGodotのキャラクターとポーズ'],
  game015: ['縦スクロール・落下', '左右移動 / 下キー・DROPホールドで連続降下', '刻む安全ルートと深い欲張り落下を選び、追う画面上端から逃げる', '落下距離超過 / 危険物 / スクロールに追いつかない', '王冠、白ひげ、紫衣装、赤マント、金色装飾の黒縁ドット絵'],
  game016: ['逆じゃんけん', '左グー / 下チョキ / 右パー、または固定ボタン', '勝ちたい反射を抑え、相手に負ける手を選ぶ', 'うっかり勝利 / あいこ / 時間切れ', '固定された三択と手のイラスト'],
  game017: ['経路計画・回避', 'クリック / タップ / ドラッグで経路を描く', '止まった時間で雨の予報を見て避ける道を描く', '雨に触れるまたは経路計画の失敗', '雨予報と上からの計画、ダッシュ視点'],
  game018: ['物理・距離競技', 'Space / タップで角度→足首ひねり→パワーを決定', '角度、実物理スピン、パワー、靴選びを試して飛距離を伸ばす', '飛距離の伸びない設定、MAXボーナスのタイミングずれ', '赤シャツと青い短パンの少年、素足の蹴り、飛ぶ青い靴'],
  game019: ['精密ジャンプ・上昇', '左右方向＋小 / 中 / 大ジャンプ（キー・画面ボタン）', '小で位置調整し、中・大で登り、100m以降は風を読んで宇宙を目指す', '着地を外して下へ戻る / 崩れる足場 / 風に流される', '緑の太い輪郭のカエル、苔の石壁、上空の雲と宇宙'],
};
const difficultyLabels = { standard: '標準', rising: 'じわじわ難化', hard: '高難度' };
await Promise.all(['game_profiles','design_notes','telemetry_samples','analytics_summary'].map(folder => mkdir(`jev_export/${folder}`, { recursive: true })));
for (const game of gameCatalog) {
  let manifest = null;
  const source = `src/games/${game.id}/game.manifest.json`;
  try { manifest = JSON.parse(await readFile(source, 'utf8')); } catch { /* original001 / legacy / not yet generated */ }
  const [genre, controls, mechanics, failures, visual] = design[game.id];
  const expected = manifest?.expected_run_seconds ?? manifest?.runSecondsDesignTarget ?? null;
  const profile = { schemaVersion: 1, id: game.id, title: game.titleJa, titleJa: game.titleJa.replace(/ ～.*～$/, ''), titleEn: game.titleEn, tagline: game.tagline, tags: game.tags, genre: manifest?.genre ?? genre,
    controls: { summary: controls, evidence: 'current game source / manifest / native UI; exact key bindings remain in game instructions' },
    expectedRunSeconds: expected, expectedRunSecondsBasis: expected ? 'design-hypothesis; not human measured' : 'unknown; not inferred from QA or other games',
    difficulty: { label: difficultyLabels[game.difficulty], basis: 'design assessment; human difficulty feedback pending' }, mainMechanics: mechanics, description: mechanics,
    failureModes: failures, route: game.route, thumbnail: game.thumbnail,
    design: { thumbnailDescription: `${game.titleJa}の実プレイ画面。${visual}`, majorVisuals: visual, directionNotes: 'Keep each game identity; code and assets determine collision and input. Thumbnail is captured from gameplay, not a fictional composition.',
      referenceImageUse: game.id === 'game015' ? 'Prior user king reference: crown, beard, purple robe and red cape; independently authored pixel sprites, not pasted image.' : game.id === 'game018' ? 'User shoe-kicking boy reference: pose, red shirt, blue shorts and flying shoe; authored game character and kick states.' : game.id === 'game019' ? 'User green pixel frog reference: recognizable green silhouette and cream belly; authored game sprite states.' : 'No new user reference for this game in this task.',
      uiPolicy: 'Responsive native input; portal shows four primary tag badges; explanation/practice remain optional.' },
    telemetryCoverage: game.releaseOrder >= 12 && game.releaseOrder <= 14 ? 'legacy shell only; native Godot game loop does not report runs, scores or deaths' : 'native event schema; fields and coverage vary by game; unreported values stay unknown',
    sourceEvidence: { catalog: 'src/data/gameCatalog.ts', manifest: manifest ? source : null, details: game.id === 'game001' ? 'src/game and src/main.ts' : game.releaseOrder >= 12 && game.releaseOrder <= 14 ? game.route : `src/games/${game.id}/` },
    humanEvaluation: 'pending; do not infer fun or real-device comfort from synthetic QA', currentManifest: manifest };
  await writeFile(`jev_export/game_profiles/${game.id}.json`, JSON.stringify(profile, null, 2) + '\n');
}
await writeFile('jev_export/game_profiles/catalog.json', JSON.stringify({ schemaVersion: 1, gameCount: gameCatalog.length, gameCatalog, tagCatalog }, null, 2) + '\n');
await writeFile('jev_export/telemetry_samples/schema.json', JSON.stringify({ schemaVersion: TELEMETRY_SCHEMA_VERSION, eventNames, envelope: { name: 'EventName', at: 'ISO UTC string', data: 'up to40 primitive string/number/boolean fields including game_id and session_id' }, limitations: 'Values must be finite; strings max300 characters. No identity or external transmission. Session ID is ephemeral per page load, not a user ID.' }, null, 2) + '\n');
