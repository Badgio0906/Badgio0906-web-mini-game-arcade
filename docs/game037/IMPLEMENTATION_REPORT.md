# Game037 お弁当つめつめ！ ～BENTO BOX～ — 実装報告

- task：`game037-claude-full-build-20261018`、担当 Claude Code（`agent_tool: claude-code`）、統合 Codex。
- branch：`claude/game037-bento-full-build-20261018`、base `9e96d557779c5de099fe54c51731ceb131e591a1`、Draft PR https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/9（未マージ）。
- 最終検証ソース：`fd3eca9ce3f05653f3bfed0d3fa95d0b184ddd15`（その後のcommitは文書・HANDOFF・QA証跡のみ）。
- 仕様：[IMPLEMENTATION_SPEC](IMPLEMENTATION_SPEC.md)／素材：[ASSET_INDEX](ASSET_INDEX.md)／Visual：[VISUAL_REVIEW](VISUAL_REVIEW.md)（自己評価）／Feel：[GAME_FEEL_REVIEW](GAME_FEEL_REVIEW.md)（自己評価）／人間：[HUMAN_PLAYTEST](HUMAN_PLAYTEST.md)（未実施）。

## 実装したもの
- pure model（回転・衝突・充填・exact-cover solver・時計・得点・pause・6面遷移・練習隔離）、保存wrapper、効果音、piece描画、main UI。
- title／遊び方／練習／本番6面／休憩／面完成（次の弁当へ）／結果（BEST・内訳）／retry／一覧へ戻る。
- 手書きオリジナルSVG 13点（弁当箱、おかず7種、のれん、和紙・木目タイル、朱印、光）。画像生成は不使用。
- 個別Vite build、Playwrightの実ブラウザQA。

## 実行した検証（最終ソース `fd3eca9`、2026-10-18 UTC）
|検証|コマンド|結果|証拠|
|---|---|---|---|
|単体|`npx vitest run tests/unit/game037*.test.ts`|2 files / **18 tests PASS**|[QA/UNIT_TESTS.txt](QA/UNIT_TESTS.txt)|
|型|`npx tsc --noEmit`（`src`全体）|exit 0|[QA/BUILD.txt](QA/BUILD.txt)|
|個別build|`GAME037_BUILD_DIR=/tmp/game037-dist npx vite build --config tests/game037/vite.config.mjs`|成功（html 5.36kB, css 14.35kB, js 27.88kB＋SVG13点＋navbar2点）|[QA/BUILD.txt](QA/BUILD.txt)、[QA/BUILD_HASHES.txt](QA/BUILD_HASHES.txt)|
|実ブラウザQA|`node tests/game037/browser.mjs`|**PASS 574 checks / 0 fail**（desktop・phone・narrow・landscape＋保存拒否）|[QA/browser-final/RESULTS.json](QA/browser-final/RESULTS.json)＋35 PNG|
|全体vitest（参考）|`npx vitest run`|1105 pass / **3 fail**：`tests/unit/participant-identity.test.ts`（共有記録系、game037無関係）。base以降このbranchでは該当ファイルとその依存を変更していない。Node 22.22環境（CIはNode 24）での既存失敗と推定、未切り分け|このファイル|

ビルド時の警告 `arcade-navigation.js can't be bundled without type="module"`／`arcade-navigation.css doesn't exist at build time` は既存ゲームと同じ共有navbarの静的読み込みに由来し、配信物にはコピー済み（BUILD_HASHES参照）。

### ブラウザQAの内容（全て実イベント。ページ状態の書換えフック無し）
- 解は単体と同じ`solveStage()`をVite SSRで読み込んで使用し、盤面への入力はmouse drag／mouse click／touch tap（Playwright touchscreen）／CDP touch drag／keyboardで実施。viewportごとに面ごとの入力方式を変えて6面完走。
- 盤外drop・重なりdropの拒否と理由表示、合法drop後に二重配置が無いこと、配置済みのtapで取外し（-50がHUDに反映、選択状態で戻る）、touch pointercancelは配置しない。
- 押しっぱなしRで1回だけ回転、休憩で時計停止、drag中のblurで配置されず自動休憩、hidden（`visibilityState`を上書きしたvisibilitychangeイベント＝**擬似**）で自動休憩・時計停止、押しっぱなしEscで休憩が閉じない。
- 面クリア後に自動で進まず時計停止、お品書き札の済み数、結果表の回転数・取外し数がテストの実入力回数と一致、各面の点が式と一致、合計=和で0〜6000、BEST保存、他gameのlocalStorage値不変、game037以外のキー書込み無し。
- retryで面・合計・選択・配置がリセット、mute保存と再読込後の復元、BEST再読込、一覧リンクの通常クリックで`./index.html`へ遷移（isolated buildにportalが無いため、`index.html`はテストがstubで応答）。
- 主要操作44px以上、盤とトレイがviewport内、横スクロール無し、外部リクエスト0、非GETリクエスト0、pageerror/console error 0。
- 保存拒否（`localStorage`アクセスで例外）：タイトルに「保存できません」、キーボードで6面完走、BESTはページ内メモリのみ。

## 発見・修正した不具合（ブラウザQA中）
|#|分類|内容|修正|
|---|---|---|---|
|1|製品バグ|「次の弁当へ」後、時計は再開するが再描画されずトレイのボタンが無効のまま|時計の稼働状態が変わったら`render()`（`9461704`）|
|2|製品バグ|配置済みL/T/S等の矩形ボタンがbboxの空きマスまで覆い、空きマスのタップで別のおかずが外れる|当たり判定をモデルの`occupancy`で行い、配置済みボタンは`pointer-events:none`（keyboard用に残す）（`9461704`）|
|3|製品バグ|タッチのタップ後に合成されるclickが`detail 0`で、キーボード操作扱い（盤にカーソルプレビュー）になる|pointer操作直後700msのclickを無視（`5bddf87`）|
|4|製品バグ|盤タップでChromeモバイルのタップハイライトが盤全体に出る|`-webkit-tap-highlight-color: transparent`（`5bddf87`）|
|5|レイアウト|320幅で3px縦スクロール、landscapeの盤が小さい、landscape結果のボタンが画面外、320結果表の折返し|CSS調整（`9461704`、`b3ce2ec`）|
|6|テスト基盤|hero（タイトルの見本弁当）の`.placed`を盤の配置数に数えていた／重なり試験が配置済みをタップしていた／portal先404|セレクタ限定、drag試験へ変更、stub応答|

## 未実施・制限
- 独立Feel/Visual/QA：未実施（すべて実装者の自己評価）。Codexの独立実行が必要。
- 人間試遊・実機・音の聴感・実FPS：未実施。
- 本物のブラウザタブ切替による`document.hidden`は未試験（イベント擬似のみ）。
- 効果音はAudioContextの作成/再生を自動試験していない（エラー0のみ確認）。
- 公式Catalog/Vite/Portal/サムネイル/記録/Analytics登録、`CURRENT_STATUS.md`更新、公開：**していない**（Codex担当）。
- token/cost/wall-time：Claude側で直接取得できる値なし → null。
