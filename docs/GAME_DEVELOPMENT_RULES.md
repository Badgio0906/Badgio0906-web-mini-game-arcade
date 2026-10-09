# GAME_DEVELOPMENT_RULES — 実装・レビュー・継承

現在の入口は [PROJECT_CONTEXT](PROJECT_CONTEXT.md)、対象と残課題は [CURRENT_STATUS](CURRENT_STATUS.md)。共通技術仕様は [GAME_COMMON_SPEC](../GAME_COMMON_SPEC.md) に集約し、この文書は作業手順を管理する。

## 企画と変更範囲

企画はタイトルだけでなくCore Loop、操作、想定1プレイ時間、Skill、Score、Failure、Replay理由、独自性、実練習の成功条件を示す。想定時間は設計仮説で、実測値と分ける。題材だけ違う既存ゲームの複製を避け、現行カタログの操作とSkillを比較する。

対象の仕様・最新改修・manifest・コードを照合する。変更しないゲーム、保存互換性、旧exportを把握してから編集する。現在のユーザー指示に明確な変更があれば実装し、古い仕様の例外という理由だけで確認を求めない。新しい仕様はゲーム別文書へ残す。

固有モデルと描画／保存／音／広告境界を分ける。2〜5本等の実績を見て共通化を判断し、将来使えそうという理由だけで基底scene・ライフサイクルSDK・統一結果画面を作らない。既存の異なる操作・判定・Skillを保つ。

## 実装と独立した判定

必要な作業だけを分担する。Mainは仕様・所有ファイル・統合・最終確認、Gameplayはモデルと入力、UIは画面／練習、Assetは素材、Art Directorは方針と実画像、Feelは遊びの成立、QAはコード／検証を担当する。小さい文書修正で全役割を起動する必要はない。

ゲーム実装では実装者だけで完成扱いしない。サブエージェントが使える場合は必要なレビューを委任し、同じファイルの同時編集を避ける。使えない場合は実装→Feel→Visual→QA→修正→再検証を明示的に分け、独立workerで実施したと偽らない。

ブラウザの長いRUN中はレビュー対象を固定する。branch／commit／source hashを記録し、同じVite serverでHMRを起こす編集を止める。ブラウザ枠は順次受け渡し、終了時にcontext／browserを閉じる。並列のソース読み取りや別ファイルの実装と、固定した実プレイの検証を混同しない。

## 実装から受入まで

1. 指示・対象・完了条件・リスク・既存保存／操作の保護範囲を記録。
2. Visual Briefと固有の練習を設計し、必要な素材を制作・最適化・実view。
3. モデル、描画、入力、練習、保存、結果、サウンド、計測を実装。
4. 対象の単体テストとTypeScript／build、必要な回帰確認。
5. 固定したソースで通常キー／クリック／タップによるFeelレビュー、desktop／mobile画像による独立Visualレビュー。
6. QAで入力・タイマー・画面・保存・配信を確認。失敗の原因を分類し、限定修正後に影響範囲を再検証。
7. 技術的に確認したプレビュー／試作版を人間に渡す。人間の面白さ・実機評価が未実施ならその状態を残す。
8. 公開が依頼範囲ならCI／配信URLも確認。公開成功を人間合格へ読み替えない。

素材承認、単体モデル成功、browser実操作、Visual点、人間評価、公開を別の結果として記録する。[過去の独立手順](ten-game/reviews/REVIEW_PROTOCOL.md)。

## 素材と情報設計

Art Director→Visual Brief→必要に応じた実ImageGen／意図的pixel authoring→素材採用→実装→desktop／mobile screenshot→独立Visual→修正→QAを行う。生成回数・prompt・原本・採用／不採用・最適化・出典・ライセンス・hashを残す。原本を配信せず必要なWebP等を`public/`へ置く。

Visualはゲームごとのidentityと瞬時の判読性を優先する。既存の評価gateは80/100以上、可読性Fと完成感H各12/15以上。数値は実画像を見た結果だけを付け、CSS変更・素材の存在だけで加点しない。Jevの文章判断からVisual点を生成しない。

サムネイルは実際のプレイ画面由来。架空の豪華な画面を合成しない。[採用台帳](../assets/portal/thumbnails/asset-index.json)へ原本・crop・hashを保存する。日本語追加時は[font index](../assets/fonts/font-index.json)のsubset coverageとOFLを確認する。既存文字を失わせない。

## 新規ゲームの登録

- ポータルカードはサムネイル→個人／全体BEST→黄色PLAY→タイトル／紹介／タグ→補助TOP10。ゲームを遊ぶ操作を最も目立たせ、非競争作品にはTOP10の空枠を作らない。リンクとランキングbuttonを入れ子にせず、計測は1操作1回を保つ。
- 一覧への帰還は左上の通常フローヘッダーに **← ゲーム一覧へ**。`arcade-game-header`／`arcade-portal-return` と `public/arcade-navigation.css`／`.js` を使用し、44px以上・safe-area・390／320／844pxでもゲーム操作を覆わない。Godot shellは階層に合う相対URLを使い生成templateも同期する。
- ゲーム内タイトル／リトライ／練習の戻りとは区別し、固有の終了・保存処理を維持する。モーダルがヘッダーをinertにする場合は共通部品が同じヘッダー位置で元リンクへクリックを渡す。keyboard shortcutを隔離し、pointer captureでのfresh-gesture検証とrelease cleanupを止めない。通常click／tap／Enterで実際の到着を検証する。[設計とQA](navigation/IMPLEMENTATION_REPORT.md)／[全作品調査表](navigation/GAME_NAVIGATION_MATRIX.md)。

- native gameは`gameNNN.html`、`src/games/gameNNN/`、固有manifest、対象テストを用意する。001の既存構造は移動しない。
- [カタログschema](../src/data/gameCatalog.ts)の`id/titleJa/titleEn/tagline/thumbnail/route/releaseOrder`に従う。Genre／Core Mechanic／Skillは固有manifestで記録する。
- [Vite入力](../vite.config.ts)は現在番号を列挙するregex。新HTMLだけ作ってビルドに入ると仮定しない。
- ポータルmeta／fallback件数、採用サムネイル台帳、route検証の番号・期待カタログ数も変更の影響に応じて更新する。
- 初回は説明→独立実練習→成功→本番、再訪は即開始と再練習。特殊展開を最初から全て説明せず、ゲーム固有の操作を同じ位置・意味で学べるようにする。
- 練習は本番score／BEST／CREDIT／run_start／run_endを変更しない。読了・練習完了・phase切替に使ったgestureを本番回答へ持ち越さない。
- 012〜014の旧UI移行は既存例外。新native gameの練習を旧exportへ注入しない。

## 検証の選択と証拠

```sh
npm ci
npm run check
npm test
npm run build
```

必要な依存が準備済みなら毎回`npm ci`を繰り返さない。コード変更に応じて対象テストを先に実行し、共有境界／登録／保存変更は既存回帰も確認する。新規ゲームの最終統合では単体群とbuildを確認する。合格後に追加変更や未解決の懸念がなければ同じ検証を繰り返さない。文書だけの改訂ではリンク・根拠・差分の検証を行い、196件を再実行したと書かない。

| 対象 | 使用する検証／注意 |
|---|---|
| 固有モデル | `tests/unit/gameNNN*.test.ts`。ゲームルール・9勝敗・絶対期限・保存等、意味のある境界を確認 |
| 001〜011の共通導線 | `tests/eleven-game/eleven.playwright.config.ts`。固定candidate serverが必要。昔のassertionが現行配点／件数に合うか実行前に読む |
| 012〜014 | `tests/fourteen-game/migration.playwright.config.ts`と移行監査。WASM hashだけで操作成功としない |
| 015 | `tests/game015/probe.mjs`と`probe-revision.mjs`。初版と改訂01の証拠を分ける |
| 016 | `tests/game016/review.mjs`、`probe.mjs`、`probe-production.mjs` |
| 共通の配信 | `tests/eleven-game/probe-production.mjs`の明示番号・件数・root／subpath。001〜011・015・016の現在14経路を指定できる |

`npm run test:e2e`／`test:production`のdefaultには過去の期待値がある。コマンド名だけで現行16本を全て検証したとしない。ブラウザがなければ実行不能と人間チェック項目を残す。`/usr/bin/chromium`に固定したprobeは新環境で実行可能性を確認する。

既存collectorのreport既定値は過去のQAファイルを上書きする。新実行は`GAME016_REPORT`、`GAME016_PRODUCTION_REPORT`、`GAME015_REVISION_REPORT`、`ELEVEN_STATIC_REPORT`等を新しい対象の出力先へ指定する。既存失敗・合格記録を消さない。環境変数名・起動portは各scriptから確認し、一時サーバーを引継ぎの前提にしない。

PC・portrait phone・小画面・short landscapeでtitle／practice／main／pause／choice／result／retry／帰還を確認。主要操作44CSSpx以上、viewportとoverflow-hidden祖先双方のclipを検査する。ヘッダーfocus、長押し、repeat、画面を跨ぐpointer release、pause／非表示、保存拒否、BEST／mute再読込を対象に含める。

DEVのreadonly診断で答えを選ぶ自動入力は、操作とタイマーの技術証拠。人間の認知・反応・楽しさではない。表示fixture、モデル高速simulation、通常入力での到達を区別する。productionには診断hookを出さず、実HTTP／console／必要assetを確認する。

失敗は製品バグ、テスト基盤、仕様不一致、要求変更等に分ける。2000msの浮動小数誤差や遷移中CDP body収集を製品バグへ転用しない。一方、練習到達不能やpointerの持越しをテスト都合として隠さない。失敗の原本と修正後の記録を別に保持する。

## FindingとJev Shadow

finding発生時は[JEV_REVIEW_RULES](JEV_REVIEW_RULES.md)の正本に従い、1問題ずつ同時点の観測で4質問を実行する。Jevは原因と次の証拠へのroutingだけで、通常の独立Codex／Visual／Feel／Human／Release Gateを代行しない。0.45未満でもCodex確認を継続し、CODEX FALSE PASSとRELEASE RISK MISSを別に保存する。key不足やAPI失敗はUNAVAILABLEとして通常QAへ続ける。単純PASS/FAIL、HTTP、build確認はスクリプトで行い、全PASSの回数消化をしない。

## 会話に依存しない納品と作業記録

新native gameは`docs/gameNNN/`に少なくとも次を残す。既存ゲームを改修する場合は既存pathを保ち、revisionの最新報告から過去資料へリンクする。

- `IMPLEMENTATION_SPEC.md`：ユーザー要件、固有ルール、今回の変更範囲。
- `IMPLEMENTATION_REPORT.md`：実装、実行したcommand、commit／hash、成功／失敗、未検証、人間評価、公開結果。
- `GAME_FEEL_REVIEW.md`／`VISUAL_REVIEW.md`／`QA/`：独立判定と必要な実画面／実行証拠。単にファイルを作っただけで独立レビュー済みとしない。
- `HUMAN_PLAYTEST.md`：未実施項目と実際の結果を分ける。学びは既存LESSONS形式またはゲーム別LESSONSへ。
- `WORK_LOG.jsonl`：今後の比較用記録。[入力template](templates/WORK_LOG_ENTRY.json)を参照し、実際に確認できた項目だけを追記する。

作業ログは一つの実行／工程につきID、対象ゲーム、implementation／review／revision／qa／deployment等のstage、担当role、開始・終了（offset付きISO）、基準commit、command／結果、修正分類、証拠pathを残す。workerの起動／追加依頼は実際のイベントを数え、役割数と混同しない。共有テストの失敗は対象ゲームと原因を分離する。

料金・入力／cached／出力tokens・model／Reasoning／Speed・task／turnは直接取得できる時だけ記録し、取得元も残す。未取得は`null`、表示は「取得不可」。in-game CREDIT、待ち時間、コミット数からCodex使用量を推定しない。cached入力を合計入力へ二重加算しない。

経過時間は明示した作業開始から対象scopeの完了までの壁時計。休止／外部接続待ちは別記録。並列worker時間を足して開発時間にしない。修正は実行ごとに記録し、事前修正を一つの公開commitへまとめても失わない。[過去baseline](development-baseline/BASELINE_2026-10-05.json)は確認分の下限で、完全な使用量データではない。

CURRENT_STATUSへ最新報告と残課題をリンクし、根拠のない「全ゲーム合格」「人間合格」「Jev評価済み」を書かない。runtime変更・保存・公開先・本番機能を変えたときだけ該当正本を更新し、全履歴を複製しない。
新native HTMLのviewportは `viewport-fit=contain` を基本とし、切り欠きの内側のviewportで既存100dvhのプレイ領域・下部操作を計算する。`cover`を採用する場合はheaderだけでなく全viewport高さ予算にもsafe-areaを反映し、物理端末で確認する。
