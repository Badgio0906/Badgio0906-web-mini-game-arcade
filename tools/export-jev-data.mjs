import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { gameCatalog, retiredGameCatalog } from '../src/data/gameCatalog.ts';
import { tagCatalog } from '../src/data/tagCatalog.ts';
import { eventNames, TELEMETRY_SCHEMA_VERSION } from '../src/data/telemetrySchema.ts';

const design = {
  game001: ['スコアアタック', 'Space / クリック / タップで軌道を切り替える', '障害物を一回の入力で避け、連続回避を狙う', '軌道の切り替えと障害物への接触', '軌道と障害物を明快に描いた宇宙アーケード'],
  game002: ['回避ランナー', '左右キー / 左右タップで車線移動', '3車線を読み、出社か続行かを選ぶ', '障害物への接触', '漫画風の通勤者と4地区の街'],
  game003: ["タイミング・釣り合い建築", "Space / タップで建物を落とす", "全支持面の釣り合いを読み、中央PERFECTと回復する左右の芸術ペアを積む", "接触なし、上部合成重心が支持区間外へ出る", "張り出しを保持した建築と最危険の支持面・釣り合いの印"],
  game004: ['記憶パズル', '光った順番で9マスをタップ', '順番を記憶し再現する', '記憶順の間違い', '真鍮と黒鉛の記憶装置、点灯キー'],
  game005: ['判断・仕分け', '左右キー / 左右タップで二択仕分け', '途中で変わる分類ルールを読み替える', '誤仕分けまたは時間切れ', '紫色の工場、色と形の荷物、分類看板'],
  game006: ["角度・枠選択・制動", "安全/挑戦枠を選び、Space / タップで角度→パワー。走行中の新しい入力で一度ブレーキ", "同じ円弧の到達距離と停止位置、車体の接近を読み狙う枠と止めどころを選ぶ", "角度違い、手前、行き過ぎ、車体衝突、指定外枠", "車体形状に一致した俯瞰駐車と色と文字で分かる安全・挑戦枠"],
  game007: ["輸送・先読み判断", "乗せる・見送る・出発をキー / タップで選ぶ", "目的階と時間・重量・次階の依頼を見て容量を予約し、届けて得点する", "未配達、期限切れ、便の制限時間", "目的階と依頼点の大きな乗客カード、次階の待機、輸送中の一覧"],
  game008: ["配達・バランス判断", "左右ホールドで支え、速度ボタン / Spaceで慎重と急ぐを切替", "予告段差や曲がり角の前で落ち着かせ、安全な直線で急いでコーヒーを届ける", "残量不足・空カップ・配達締切", "白い陶器と独立した濃い液面、両手・袖・木トレー、前方廊下"],
  game009: ["物探し・机の記憶", "道具をタップ、紙端をめくる、整頓する", "26種の形と特徴を見分け、同じ机の置き場所を覚えて探す", "誤答の時間損失、時間切れ、整理の時間コスト", "26専用文具・職場道具のベクター形状と重なった書類の机"],
  game010: ["読解・議事録判断", "発言カードをキー / タップで記録、聞き返し、議事録提出", "提案と確定と訂正を読み、誰・作業・期限の最新決定を記録する", "古い決定、未採用の提案、雑談による誤記", "話者と短い発言履歴、同時に見える議事録3欄"],
  game011: ['クイズ・反射神経', '左右キー / 二択ボタン', '絵と文字を区別し、速くなる二択へ進む', '選び間違いまたは時間切れ', '20枚のアイコンと対等な二択ボタン'],
  game012: ['タイミング', 'ゲーム内の横取り操作。詳細は既存Godotの説明画面が正本', '同僚の仕事とバナナを今だの瞬間に横取りする', '横取りタイミングの失敗', '移行済みGodotのオフィス画面'],
  game013: ['記憶・リズム', '1〜4キー / 画面の操作ボタン', '上司のお手本を覚えて仕事を奏でる', 'お手本と違う仕事の入力', '移行済みGodotの仕事と上司'],
  game014: ['タイミング・ポーズ', 'クリック / タップで指ハートを止める', '全5段階で25回の指ハート成功を目指す', '指ハートの瞬間を外す', '移行済みGodotのキャラクターとポーズ'],
  game015: ['縦スクロール・落下', '左右移動 / 下キー・DROPホールドで連続降下', '刻む安全ルートと深い欲張り落下を選び、追う画面上端から逃げる', '落下距離超過 / 危険物 / スクロールに追いつかない', '王冠、白ひげ、紫衣装、赤マント、金色装飾の黒縁ドット絵'],
  game016: ['逆じゃんけん', '左グー / 下チョキ / 右パー、または固定ボタン', '勝ちたい反射を抑え、相手に負ける手を選ぶ', 'うっかり勝利 / あいこ / 時間切れ', '固定された三択と手のイラスト'],
  game017: ['経路計画・回避', 'クリック / タップ / ドラッグで経路を描く', '止まった時間で雨の予報を見て避ける道を描く', '雨に触れるまたは経路計画の失敗', '雨予報と上からの計画、ダッシュ視点'],
  game018: ["物理・距離競技", "Space / タップで角度→自然な足首ひねりと靴の回転preview→パワーを決定", "5種の既存靴の角度・スピン・パワーを試す。JUSTは炎/速度線/擬音、正規条件で一度のレア演出", "距離の伸びない設定・JUSTタイミングずれ。レア落選は失敗や得点減ではない", "固定長の自然な少年キック、飛距離mの主HUD、漫画発射と宇宙船の1050msカットイン"],
  game019: ['チャージ精密・上昇', '左右を押しながらSpace / JUMPを溜め、離して跳ぶ。空中修正なし', '短い跳躍で位置を整え、溜め量と方向を覚えて手作り井戸100mから予測可能な風の空200mへ登る', '溜め不足・過剰・壁や梁で失敗し地形に応じて後退。同じRUNで再登りできる', '緑の大きな目のカエルと3チャージ姿勢、井戸のランドマーク、旗の風、海・鳥・宇宙'],
  game020: ['穏やかな重なり牌合わせ', 'クリック / タップ / キーボードで同柄の空いた牌を2枚選ぶ', '上が塞がれず左右どちらかが空いた同柄2枚を取り、自分のペースで独自盤面を片付ける', '無効選択は罰なし。詰まりは戻す・解法検証済み並べ替えで継続。時間切れ・ミス終了なし', '独自の幾何学アイコン、手触りのある軽い影、明確な重なり'],
};
const difficultyLabels = { standard: '標準', rising: 'じわじわ難化', hard: '高難度' };
await Promise.all(['game_profiles','retired_game_profiles','design_notes','telemetry_samples','analytics_summary'].map(folder => mkdir(`jev_export/${folder}`, { recursive: true })));
// Preserve historical profiles byte-for-byte; remove retired IDs from active exports.
for (const game of retiredGameCatalog) {
  try { await rename(`jev_export/game_profiles/${game.id}.json`, `jev_export/retired_game_profiles/${game.id}.json`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const selectedIds=new Set(process.argv.slice(2));
for (const game of gameCatalog) {
  if(selectedIds.size&&!selectedIds.has(game.id))continue;
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
await writeFile('jev_export/game_profiles/catalog.json', JSON.stringify({ schemaVersion: 1, gameCount: gameCatalog.length, gameCatalog, retiredGameCatalog, tagCatalog }, null, 2) + '\n');
await writeFile('jev_export/telemetry_samples/schema.json', JSON.stringify({ schemaVersion: TELEMETRY_SCHEMA_VERSION, eventNames, envelope: { name: 'EventName', at: 'ISO UTC string', data: 'up to40 primitive string/number/boolean fields including game_id and session_id' }, limitations: 'Values must be finite; strings max300 characters. This is the device-local debugging schema only, not the external analytics envelope. Production uploads require consent and configured endpoint; past local records are never replayed. Session ID is ephemeral per page load. External schema_version2 is documented in src/data/analyticsEnvelope.ts.' }, null, 2) + '\n');
