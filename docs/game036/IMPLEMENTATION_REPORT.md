# Game036 もちっと連鎖 — 実装報告（Claude Code、2026-10-21）

> Codex統合追補（2026-10-21）：一覧・個人BEST・正式thumbnailと公開検証の現状は [公開準備報告](PUBLICATION_PREPARATION_20261021.md) を参照。以下はClaude受領時の実装記録。統合候補は未push・未公開で、今回の費用不明点判断待ち。

状態：**ゲーム固有実装は完了・未統合**。Catalog / Vite / Portal / 記録 / サムネイル / CURRENT_STATUS は未変更（Codex統合担当の所有）。本番未公開。人間試遊は未実施。

- branch：`claude/game036-mochi-drop`（base main `ac5304fa81361f592942c472c7fa04f668d3b4bc`）
- 仕様：[IMPLEMENTATION_SPEC](IMPLEMENTATION_SPEC.md)　引き継ぎ：[HANDOFF](../agent-tasks/game036-mochi-drop/HANDOFF.md)

## 追加ファイル

| path | 内容 |
|---|---|
| `game036.html` | 物理HTML（共通ヘッダー・`arcade-navigation`、`viewport-fit=contain`） |
| `src/games/game036/model.ts` | 純粋モデル：生成（seed付きmulberry32）、移動・回転（キック／クイックターン）、重力・固定猶予、列落下、4連結判定、こんぺいとう、連鎖得点、全消し、着地プレビュー |
| `src/games/game036/save.ts` | 保存の検証・メモリfallback |
| `src/games/game036/main.ts` | Canvas描画・演出・音・入力（キー／タッチジェスチャ／パッド）・画面遷移・Telemetry |
| `src/games/game036/style.css` | PC／縦スマホ／320px／横向き短辺のレイアウト |
| `src/games/game036/game.manifest.json` | Genre・Core Mechanic・Skill・入力・得点・保存 |
| `tests/unit/game036-model.test.ts` | モデル・保存の単体テスト12件 |
| `tests/game036/vite.config.mjs` | 共有Viteに触れない単独ビルド設定（出力はOSの一時フォルダ） |
| `tests/game036/browser.mjs` | 通常入力のブラウザ検証（4画面） |
| `docs/game036/**` | 本報告・仕様・試遊票・作業記録・QA |

## 実行した検証（Windows 11 / Node v24.19.0）

| コマンド | 結果 |
|---|---|
| `npm ci` | 成功 |
| `npm run check` | 成功 |
| `npx vitest run tests/unit/game036-model.test.ts` | **12/12 PASS** |
| `npm test`（全体） | 984 PASS / **4 FAIL**。失敗は `catalog-publication`（recordDefinitions.tsのsha1）と `legacy-shell-delivery`（012〜014 shellのbytes）。原因：このWindows作業ツリーが `core.autocrlf=true` でCRLF化されているため。`git hash-object src/data/recordDefinitions.ts` は期待値 `7bd2bf67…` と一致し、`git ls-files --eol` は `i/lf w/crlf`。今回の変更とは無関係の環境要因で、Linux CIでの再確認が必要 |
| `npm run build`（共有設定） | 成功（game036は未登録のため出力に含まれない＝想定どおり） |
| `npx vite build --config tests/game036/vite.config.mjs` | 成功（JS 97.65kB / gzip 35.08kB、CSS 7.7kB） |
| `node tests/game036/browser.mjs`（devサーバー） | **4/4 PASS**：desktop 1365×900、phone 390×844（touch）、small 320×640（touch）、landscape 844×390（touch）。[results.json](QA/browser-20261021/results.json) |

ブラウザ検証で通常入力によって確認した内容：タイトル→練習→パッド「すとん」／Spaceで2連鎖成立→練習完了（BEST不変）→本番→盤面・パッドが画面内・全ボタン44px以上→積み上げて終了→結果1回だけ記録→表示直後の誤タップを無視→Enterで再開→休憩→再読込で休憩画面から再開→再開、page error 0。

## 検証で見つけて直した問題

1. **横向き短辺で操作パッドが画面外**（landscape 844×390）。横向き専用のgrid配置に変更して解消。
2. **初回0点で「BESTまで あと0点」**。初回・同点・未達で文言を分けた。
3. **ゲームオーバー直後の連打が結果画面のボタンを押す**。横向きでは「タイトルへ」がちょうど「すとん」の位置に出て、意図せずタイトルへ戻った（デバッグで `elementFromPoint` が `title` を返すことを確認）。ダイアログ表示後450msはclick/pointerdown/keydownを捕捉して無視するよう修正。
4. 横向きで結果画面の「もう1回」がスクロールしないと見えない → 横向きのダイアログを詰め、フォーカス先を表示範囲へ寄せるよう変更。
5. スマホでのタップハイライトの灰色残り → ボタンの `-webkit-tap-highlight-color` を透明に。

## 未実施・制約（PASS扱いしない）

- **独立したFeel／Visualレビューは未実施**。実装者本人がスクリーンショットを見た確認だけ。Visual点数は付けていない。
- 実機（iPhone/Android）、音の聞こえ方、長時間プレイの面白さ、難度曲線の実測：未実施。
- Jev Shadow：未実行。
- 画像生成ツール：未使用（Canvasの手続き描画で意図的に制作）。正式サムネイル：未作成（候補はQAの実画面）。
- Codexの `ASSIGNMENT.md` なし。`.claude/settings.json` のdeny動作試験は未実施（共有ファイルは編集していない）。
