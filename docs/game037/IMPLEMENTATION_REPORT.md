# Game037 お弁当つめつめ！ ～BENTO BOX～ — 実装報告

## Rules v2（箱が大きくなる版）— 2026-10-18 作者の直接指示による改修

- 指示：作者（ユーザー）からClaude Codeへ直接。「4×4の6面→5×5→6×6…と難易度が上がる形」「8×8で終わり」「4マスにこだわらず5マス・8マス等のおかず」「claudeで実装（Codexは完了済み）」。仕様は [IMPLEMENTATION_SPEC](IMPLEMENTATION_SPEC.md) のRules v2節。
- 最終検証ソース：`f253a5440071b60bab30e2029dd22350f9d9337c`（このcommit以降はdocs・manifestの記述のみ。manifestは実行コードから読まれない）。
- **GitHubへの扱い**：作者の指示により、Actions消費を避ける条件確認が済むまでpushしていない（この報告を書いた時点でローカルcommitのみ）。PR #9のCIは未実行。

### 実装
- model：盤面サイズを面ごとに持つ形へ一般化。5×5〜8×8は固定seedのタイル分割で生成（必ず解がある）、汎用exact-cover solver、箱とおかず数に合わせて減点を薄める得点式（4×4はv1と同一）。
- 描画：1マス分の食材の絵（foods.svg、10種）を、マスに沿った角丸の台紙に重ねて任意形のおかずを描く。v1の1枚絵7点は配信から外した。
- 保存：rules2のBEST（弁当ごとに更新）・箱ごとのcheckpoint・mute。v1のBESTキーは読み書きしない。
- UI：n×nの盤とガイド線、最大10個のトレイ（列数を個数で切替）、数字キー1〜9・0、お品書きに箱のはしご表示、つづきから、箱ごとの結果表、2×2固定のHUD。

### 実行した検証（ソース `f253a5440071b60bab30e2029dd22350f9d9337c`、Node v22.22.0、ローカル）
|検証|コマンド|結果|証拠|
|---|---|---|---|
|単体|`npx vitest run tests/unit/game037*.test.ts`|**22 PASS**（model 19・save 3）|[QA/rules2/UNIT_TESTS.txt](QA/rules2/UNIT_TESTS.txt)|
|型|`npx tsc --noEmit`|exit 0|[QA/rules2/BUILD.txt](QA/rules2/BUILD.txt)|
|個別build|`npx vite build --config tests/game037/vite.config.mjs`|成功（js 35.5kB, css 15.2kB, html 5.6kB）|[QA/rules2/BUILD.txt](QA/rules2/BUILD.txt)、[BUILD_HASHES](QA/rules2/BUILD_HASHES.txt)|
|実ブラウザQA|`node tests/game037/browser.mjs`|**PASS 2553 / 0 fail**（約3分）|[QA/rules2/browser/RESULTS.json](QA/rules2/browser/RESULTS.json)＋50 PNG|
|全体vitest（参考）|`npx vitest run`|1109 pass / 3 fail（既存の `participant-identity.test.ts`。Node 22.22のみで失敗、v1時点のPR CI（Node 24）では成功）|このファイル|
|GitHub CI|—|**未実施**（push未実施のため）|—|

### ブラウザQAの範囲（実イベントのみ、ページ書換えフック無し）
- **desktop（1280×720・マウス/キーボード）とphone（390×844・タッチ）**：練習 → 4×4の6弁当（禁止置き・取外し・休憩・blur・hidden擬似・押しっぱなし等の従来項目）→ 5×5へ → タイトルへ戻り「つづきから」→ **30弁当すべてを実際の操作で完走** → 結果。
- **narrow（320×568）とlandscape（844×390）**：4×4の6弁当と5×5の1弁当を実プレイ → **checkpointのfixture**（localStorageに24弁当分の成績を書いた状態。ゲーム自身が保存するのと同じ形式）で8×8から再開 → 8×8の6弁当を実プレイして結果へ。結果画面の4×4〜7×7の行はfixtureの値。
- 各弁当で：盤面の表示「N×N k/6」、配置がモデルの解どおり、完成表示の秒・回転・取外しと得点式の一致（回転・取外しはテストの実入力回数と一致）、お品書きの済み数、箱の終わりのボタン名とcheckpoint保存、BESTが合計に追従、**プレイ中に盤面が動かない**。
- 各箱の最初で：主要ボタン44px以上（トレイ先頭・末尾含む）、盤・トレイ・回すボタンが画面内、横スクロール無し。
- 結果：箱ごと5行の合計＝総合計（0〜30000）、BEST `{best, cleared: 30}`、checkpoint消去、追加された保存キーはrules2の3種だけ、他ゲームとv1 BESTの値は不変、外部通信0・非GET 0・pageerror 0。
- 保存拒否：4×4の6弁当→5×5まで進み、メモリ上のBESTとつづきが出て「保存できません」表示。

### 発見・修正した不具合（v2作業中）
|#|分類|内容|修正|
|---|---|---|---|
|1|製品バグ|スマホ縦でHUD（時間・得点など4つ）が1行にぎりぎり収まっており、数字の桁が増えると2行に折り返して**プレイ中に盤面が約30px下へずれる**。ドラッグ中に起きると1マス下に落ちて「重なり」になる（QAで3回中1回の頻度で再現）|HUDを2×2の固定配置にし、数字の最小幅を固定。QAに「盤面が動かない」チェックを追加。修正後、phone＋narrowを4回連続PASS（`f253a54`）|
|2|レイアウト|おかずが増えるとスマホ縦で縦にはみ出す（390×844で941px、320×568で603px）|おかず5個以上は箱を少し小さくし、トレイ列数を個数で切替、縦向きではお品書きの箱はしご行を省略|

### 未実施・制限
- 人間の試遊（30弁当の実所要時間・難しさの上がり方・8×8の手応え）、物理端末、音、FPS：未実施。
- 320×568の8×8は1マス約27pxと小さい（ドラッグは吸着で置けるが、タップは狙いにくい可能性）。
- GitHub CI、Codexの独立評価：未実施（push前）。
- 生成面の難易度は「おかずの数と大きさ」でしか制御しておらず、面ごとの難しさの揃い方は人間の評価が必要。

## Rules v1（4×4・6面）の記録

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
|全体vitest（参考）|`npx vitest run`|1105 pass / **3 fail**：`tests/unit/participant-identity.test.ts`（共有記録系、game037無関係）。base以降このbranchでは該当ファイルとその依存を変更していない。Node 22.22環境のみの失敗。PR #9 CI `validate`（Node 24、`npm test`全件＋`npm run build`）はhead `a803e4b`でsuccess|このファイル|

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
