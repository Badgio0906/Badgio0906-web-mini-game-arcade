# 100ガレ Step 2 — Claude Code 1本完成制作・固定割当

> **企画・担当範囲・受入基準はCodexが事前確定。** Claudeはこの課題を最初から完成候補まで実装する。Game037はこの専用branchだけの暫定予約。作者の採用判断・試遊・公式公開・完成版認定を意味しない。

## 識別・開始前の事実
- task_id: `game037-claude-full-build-20261018`
- game_id: `game037`（暫定。mainはGame035まで、main `NEXT_GAME_NUMBER=36`。Game036はDraft PR #8の引き継ぎパイロットで使用中のため衝突を避け037を割り当てる。統合時に再確認）
- owner: `claude-code`
- integrator: `codex-cloud`
- status: `assigned`（Claudeの実行はまだ開始していない）
- base_branch: `main`
- base_sha: `9e96d557779c5de099fe54c51731ceb131e591a1`
- task_branch: `claude/game037-bento-full-build-20261018`
- assigned_at: `2026-10-18T02:23:04Z`
- upstream_pr: 同branchのDraft PR（作成後にHANDOFFへURL記録）
- source_of_truth: このASSIGNMENT、GitHub commit済みのソースとHANDOFF。Claude会話、auto memory、未pushローカルファイル、外部Skillは不要な状態で納品する。
- prerequisite: `AGENTS.md`、`CLAUDE.md`、`docs/PROJECT_CONTEXT.md`、`docs/CURRENT_STATUS.md`、`docs/AGENT_COLLABORATION.md`、`docs/GAME_DEVELOPMENT_RULES.md`、`GAME_COMMON_SPEC.md`を読んで矛盾を確認。実際の編集はこの割当が優先する。

## 企画（完成まで制作する対象）
- 日本語仮題：**お弁当つめつめ！**／英題：**BENTO BOX**。
- 独自性：4×4の漆塗り弁当箱へ形の異なる4つのおかずピースを**回転して隙間なく詰める**。落ち物、単なる色合わせ、Game030の配線、Game036のタイミング停止とは別の有限空間パッキング／操作体験。
- core_loop：タイトル→任意の説明/練習→本番6面→結果とBEST→もう一度。各面4個の4マス形ピースを配置し、16マス全て埋まればクリア、自動で次へ進まず「次の弁当」で確定移行。
- 設計上の1プレイ想定：90〜180秒（仮説・人間の実測ではない）。制限時間／ゲームオーバーは無し。アクティブ時間の短さと操作精度が得点になる。
- 盤面：縦横4×4、座標0〜3、1つの食品ピースは4マス。形状を回転可能、鏡映は禁止。全ピースのpositionとrotationの整合をpure TypeScript modelが決定、UIに配置判定を置かない。
- 初期形状（`[x,y]`のローカル座標、正規化して時計回り90°回転）：
  - `I=[[0,0],[0,1],[0,2],[0,3]]`
  - `O=[[0,0],[1,0],[0,1],[1,1]]`
  - `L=[[0,0],[0,1],[0,2],[1,2]]`
  - `J=[[1,0],[1,1],[0,2],[1,2]]`
  - `T=[[0,0],[1,0],[2,0],[1,1]]`
  - `S=[[1,0],[2,0],[0,1],[1,1]]`
  - `Z=[[0,0],[1,0],[1,1],[2,1]]`
- 本番6面の4ピースを順番固定で採用：`IIOO` → `OOLL` → `IOLL` → `ILTT` → `ILJZ` → `JTTS`。**Codex側で各面を回転のみ・鏡映なしのexact-cover探索により少なくとも1解存在すると検証済み**。Claudeは各面の解の存在と重複禁止を単体テストで再検証する。静的面を追加/差し替えない。
- ピースにおかずの独自ビジュアルを割当：I=卵焼き、O=おにぎり、L=海老フライ、J=ウインナー、T=からあげ、S=ブロッコリー、Z=プチトマト。マス形状を優先し、色のみで識別させない。複数同形は個体IDを持つ。
- 操作：PCマウス/タッチのdrag-and-drop（ピース選択→持ち上げ→グリッドに吸着→指を離す）、スマホでのtap選択→tap配置も可能。選択したピースの回転は44px以上の画面内ボタンとキーボードR。配置済みのピースは再選択で取り外せる。キーボードはピース選択・矢印で配置位置移動・Enterで確定、Escで選択取消／RUN中ポーズ、Tab/focus可視。どの入力方式も**同じモデル関数**を呼ぶ。
- 誤操作：範囲外・重なり・pointercancelは確定しない。dragのpointerup後にclick/tapが二重配置されない。画面切替・pause・blur・document.hidden・retryでactive pointerや押しっぱなしキーを解除し、旧入力を次面に持ち越さない。
- 練習：最初の`IIOO`盤面を何回でも試せる独立practice。配置と回転ができ、全マス埋まれば達成メッセージ。終了してタイトル／本番へ行ける。**practiceは本番スコア/BEST/保存/外部通信に一切影響しない**。
- スコア：各面 `stageScore = max(0,1000 - 3*floor(activeMilliseconds/1000) - 20*successfulRotateCount - 50*undoCount)`。successfulRotateCountは操作として受理された90°回転、undoCountは配置済みピースの取り外し数。無効placementは罰点なし。タイマーはプレイ画面が操作可能な時間のみ進み、pause/blur/backgroundでは停止。得点は面クリア時1回だけ確定。合計0〜6000、6面完走時だけBEST更新。retryは新RUNを作り、古い入力・面スコアを持ち越さない。
- 保存：この新作に限定した `web-mini-arcade:v1:game037:best:rules1` とmute設定だけを安全なLocalStorage wrapperで扱う。拒否・破損時はメモリfallbackで動作し、永続保存成功と誤認しない。他gameの保存キー、BEST、boardにアクセスしない。音声はユーザーgesture起点の簡素な効果音でよいがmuteとcleanupを実装。
- mode：無料の試作。**CREDIT/Ads/Rewards/Analytics/Telemetry/Cloudflare/D1/ランキング/外部POSTは接続しない**。共有クライアント・本番認証をimportしない。

## アート・デザイン受入要件
- コンセプト：「昭和レトロの小さなお弁当屋さん」／赤漆箱・生成り紙・木目・山吹のあしらい。落ち着いた和の色数で、視認性を優先。背景は明るい生成り、盤面は濃い漆黒／茶、食材は温かい立体感、手書きの輪郭強弱とディテール。スマホで一目で目的が分かる。
- **素材品質を軽視しないこと。** 主ビジュアル（弁当箱、7種類のおかず、完成時の演出）の実制作必須。絵文字・無地色矩形・汎用グラデーションだけの仮置きを美術完成としない。既存ゲーム素材や外部IPの無断転用禁止。
- 第一候補は権利が明確な**オリジナルSVG（輪郭・ハイライト・陰影・細部を意図的に設計）**をClaudeが手作りすること。画像生成ツールが本当に使える場合のみ適切に使用し、実model/tool/プロンプト/採否を記録。使っていないImageGenを使用済みと報告しない。描画元 `assets/game037/**`、配信用 `public/assets/game037/**`、hash/ライセンス/素材記録は `docs/game037/ASSET_INDEX.md`。
- 背景装飾とgameplay hitboxを一致させ、drag preview・合法/非合法配置・完成時の気持ちよさを伝える。実スクリーンショットに基づきVisual確認。基準：総合80/100以上、可読性F 12/15以上、完成感H 12/15以上。数値は実際の画面を見てつける。独立レビューができなければ「自己評価」と明記し、後続Codexが独立判定する。
- 画面幅は1280×720、390×844、320×568、844×390。主要操作44CSSpx以上。文字折返し・盤面と食材リストのclip・横長時のボタン遮蔽・safe areaとscroll領域・focus・prefers-reduced-motionを確認。低性能端末でも操作中フレーム毎のDOM再生成や不要なRAFを避ける。

## 生成物と実装順序
1. pure-model（回転／衝突／埋まり／exact-cover確認／タイマー／score／pause／6面遷移）、最低12件の**意味のある**unit testsを先に用意。
2. `src/games/game037/**`、`game037.html`、`src/games/game037/game.manifest.json` に独立したnative Vite作品を実装。`tests/game037/vite.config.mjs`はGame037だけをビルドし、共有 `vite.config.ts` を変更しない。巨大な `public/` 全体コピーを避け、必要な `public/assets/game037/**` と既存読み取り専用の `public/arcade-navigation.css/.js` のみ個別distへ含める。プレビュー／再構築commandを記録。
3. 原画／配信素材の制作・最適化・来歴、画面演出、pointer/keyboard/touch、説明・練習・本番・pause・result・retry・mute/保存を完成させる。手抜きのCSSだけでVisual gateに合格したとしない。
4. `tests/game037/**` 内に実ローカルHTTP Vite画面のPlaywright QAを用意。Chromeの有無を事前検出し、無ければ**UNTESTED**とする（無理にPASSにしない）。mouse drag＋tap-select/placement＋keyboard回転／選択、禁止置き・undo、pause/blur/hidden、stage transition、practice隔離、6面クリア、retry、拒否storage、44px、4画面幅、POST0、pageerror0を確認する。正解へ到達するfixture/手順は単体の解探索結果を利用し、ブラウザ上でも本当のイベントで操作する。dev helperがクリックを飛ばして盤面を書換える試験を通常操作合格と混同しない。
5. `docs/game037/IMPLEMENTATION_SPEC.md`、`IMPLEMENTATION_REPORT.md`、`GAME_FEEL_REVIEW.md`、`VISUAL_REVIEW.md`、`HUMAN_PLAYTEST.md`、`ASSET_INDEX.md`、`WORK_LOG.jsonl`、`QA/**` と最新HANDOFFをGit管理する。画像QAはdesktop/phone/narrow/landscapeの実screenshots。独立QAは本当に別実行者/agentが行った場合のみ独立と記載。
6. 節目（モデル、最初の動作、素材、ブラウザQA前後、完成前）ごとに許可pathのみcommit/pushし、HANDOFFの`done / incomplete / open_decisions / next_3_actions`を更新。未pushのソースやバイナリを必須依存としない。最後に`ready_for_integration`または`blocked`を明示して停止（公開はしない）。

## 明確な受入ゲート
- git差分が以下のallowed paths**だけ**。他game/共通ファイル改変0、既存保存とサムネイルへ影響0。
- 6面すべてに厳密な解があり、解の実ブラウザ操作で完走できる。盤外／重なりを拒否し、UNDO/ROTATE/drag/keyboard/tapがモデルと整合。
- unitテスト12件以上PASS、TypeScriptと個別build成功、4幅の通常ブラウザE2E/Visual実画面（未実施なら完了宣言不可）。
- 全面スコアの0〜6000、BEST更新は本番完走のみ、練習と他gameのデータ隔離、外部POST0。長押し/キーrepeat/blur/retry入力持越し無し。
- title / 任意説明 / 練習 / 通常RUN / pause / result / retry / portal帰還を実装。暫定ページを公式Catalog/Pagesへ登録しない。
- 実素材をコミットし出典/採否/hash確認。Visual総合80以上、F/H各12以上を実画面評価し、不足する場合`blocked_visual`として正直に報告。**人間試遊/公式公開/作者によるcomplete判定は常に別**。
- 検証記録は実行したコマンド・commit・件数・失敗原因・未実施を区別。token/cost/wall-timeは直接観測できた場合のみ値と出典を残し、不明はnull。比較対象Codex単独実装を試験していない以上、Claudeが優秀/安価とは結論しない。

## Claudeの編集を許可するpath
- `src/games/game037/**`、`game037.html`
- `tests/game037/**`、`tests/unit/game037*.test.ts`
- `docs/game037/**`、`assets/game037/**`、`public/assets/game037/**`
- `docs/agent-tasks/game037-claude-full-build-20261018/HANDOFF.md`
- ASSIGNMENT.mdは**Codexだけが変更する**。追加の共有変更希望はHANDOFFの`integration_requests`に記載する。

## 変更・操作禁止
- `main`へのpush/merge、既存の別ゲーム、共通 `src/data/**`、`src/portal/**`、`src/records/**`、`src/analytics/**`、`src/arcade/**`、`src/core/**`、`src/game/**`、`GAME_COMMON_SPEC.md`、`AGENTS.md`、`CLAUDE.md`、`.claude/**`、`package*.json`、`vite.config.ts`、`index.html`、`docs/CURRENT_STATUS.md`、`.github/**`、`scripts/**`、`tools/**`、`assets/portal/**`、`public/assets/portal/**`、サムネイル台帳と共通docs/templatesの編集。
- Analytics、Cloudflare、D1、Worker、Secret、AdSense、GA4、CREDIT、ランキング/記録API等の参照・更新・本番送信・本番deployをしない。
- 共有navbarの既存CSS/JSは読み込み・個別buildへ**コピーのみ**可、編集はしない。

## Codexの後続業務
- remote head取得→fresh worktree再構築→allowed paths監査→unit/tsc/isolated Vite/ブラウザQA独立実行→Feel/Visualのレビュー→必要な修正・品質判断。
- 掲載すると判断した場合だけ、Codexが別工程でCatalog/Vite/Portal/正式サムネイル/記録/Analytics登録・公開検証を行う。この割当では何も登録しない。
