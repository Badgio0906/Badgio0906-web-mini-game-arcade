# WEBミニゲーセン — WEB MINI GAME ARCADE

15本のブラウザゲームを選んで遊べる、静的Webゲームセンターです。トップは一覧画面、ゲーム本体は個別ページです。001〜011・015は初回に「説明 → 実操作の練習 → 成功 → 本番」、以後はすぐ本番へ進めます。012〜014は既存のGodot Web版を、そのままのUI・操作で移行しています。

試作版は無制限プレイです。広告・CREDIT減算・補充Stubは表示・実行しません。人間による面白さの最終評価は未実施です。[ポータル仕様](docs/eleven-game/IMPLEMENTATION_SPEC.md)、[実装・検証報告](docs/eleven-game/IMPLEMENTATION_REPORT.md)、[人間プレイテストフォーム](docs/eleven-game/HUMAN_PLAYTEST.md)を参照してください。

## 起動・ビルド

Node.js 20.19以上または22.12以上。この開発環境とCIはNode.js 24を使用します。

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
npm run preview
```

`dist/`にポータル、001〜011・015の個別HTML、012〜014の静的Godot Web出力、画像・ローカルフォントを出力します。サーバー、オンラインランキング、ログイン、本番広告は不要です。

## ゲームと操作

| ゲーム | URL | 操作 |
|---|---|---|
| WEBミニゲーセン | `index.html` または `/` | ゲームカードを選択 |
| 001 軌道をズラせ！ ～ORBIT SHIFT～ | `game001.html` | Space / Enter / タップで軌道切替 |
| 002 ゆううつな月曜日 ～WORKDAY DODGE～ | `game002.html` | ← → / A D / 左右タップでレーン移動 |
| 003 我が国の建築は世界一ぃ！ ～DROP TOWER～ | `game003.html` | Space / Enter / タップでDROP |
| 004 あなたの短期記憶、無事ですか？ ～ECHO GRID～ | `game004.html` | 9マスを順番にタップ / 1〜9 |
| 005 右往左往の仕分け術 ～SORT SHIFT～ | `game005.html` | ← → / A D / 左右タップ。日本語・英語切替 |
| 006 ギリギリ駐車 ～PARK IT!～ | `game006.html` | Space / タップで角度、その次に強さ |
| 007 まだ乗れます ～ELEVATOR OVERLOAD～ | `game007.html` | 左/Aで見送る、右/Dで乗せる |
| 008 コーヒーこぼすな ～COFFEE WALK～ | `game008.html` | 左右を短く押す・離す。傾きの逆へ補正 |
| 009 印鑑どこですか ～STAMP HUNT～ | `game009.html` | 依頼に合う机の物をクリック / タップ |
| 010 会議、聞いてます？ ～MEETING SURVIVAL～ | `game010.html` | Space / タップで聞く・内職を切替 |
| 011 ウンコかウコンかゲーム ～UNKO or UKON～ | `game011.html` | ← → / A D / 同じ見た目の左右ボタン |
| 012 澤野さんの横取りデイズ | `games/yokodori-days/` | Enter / 画面タップ |
| 013 立花さんのタスク天国 | `games/tachibana-task-heaven/` | 1〜4 / 4色の画面タップ。スマートフォンは横向き |
| 014 畑島さんの指ハートチャレンジ | `games/finger-heart-challenge/` | Enter / Space / クリック / タップ |
| 015 落下キング ～FALL KING～ | `game015.html` | ← → / A Dで移動、↓ / S / SpaceでDROP。ジャンプなし |

001〜011・015でポーズ・音声切替、全15ゲームで一覧へ戻る操作ができます。012〜014の機能・UIは元ゲームを保持します。練習は本番モデルから独立し、スコア・BEST・CREDIT・run_start/run_endに影響しません。`tutorialCompleted`はゲームごとの保存領域に記録します。秘密の後半モードは練習で紹介しません。

011は画像10問、文章10問、選んだ言葉を答え続けるFinalです。通算1〜20問は2秒・100点、21〜50問は1.5秒・200点、51問以降は0.5秒・500点。文章を読む時間・Finalの選択時間は無制限です。左右配置は毎問独立してランダム、画像・文章は各20問から重複なしで10問です。得点基準変更前のBESTは別記録として保持します。

015は連続落下距離による着地衝撃と空中の慣性を扱う、無限下降のピクセルアートアクションです。キャラ1.5倍・早期のトゲ床・予兆のある壁の針・揺れる鳥の追加は[改訂01](docs/game015/revision-01/IMPLEMENTATION_REPORT.md)に記録しています。改訂01は181単体テスト・ビルド・独立Game Feel・実入力8ケース・公開用ビルド4ケースが成功しました。初版のVisual84点などの結果は初版報告に保持しています。[015実装・検証報告](docs/game015/IMPLEMENTATION_REPORT.md)に記録しています。[仕様](docs/game015/IMPLEMENTATION_SPEC.md)と[人間プレイテスト](docs/game015/HUMAN_PLAYTEST.md)を参照してください。

## GitHub Pagesへの公開

公開中の試作版：**[WEBミニゲーセン](https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/)**。

15本版：[落下キング](https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/game015.html)を追加済み。[公開run 37216230347](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37216230347)で175単体テスト・ビルド・Pages公開が成功し、公開先13ページの検証も成功しました。[015検証記録](docs/game015/IMPLEMENTATION_REPORT.md)を参照してください。

14本版の[GitHub Actionsの公開run](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37210140560)で`npm ci`、155単体テスト、ビルド、Pages公開が成功しました。公開先で旧3作品の6件の実入力・配信検証と、ポータル＋001〜011の12ページ検証が成功しています。[14本版のQA](docs/fourteen-game/QA/README.md)、[今回の変更](docs/migration/IMPLEMENTATION_REPORT.md)を参照してください。

更新する場合：

1. このリポジトリの`main`へ変更を反映します。
2. Settings → Pages → Build and deploymentのSourceは **GitHub Actions** にします（設定済み）。
3. `main`へのpush、またはActionsの **Build and deploy arcade** を手動実行します。
4. CIは`npm ci` → 単体テスト → ビルド → `dist/`のPages artifact → 公開を実行します。

構成は[.github/workflows/pages.yml](.github/workflows/pages.yml)。Viteの`base: './'`、相対リンク、同じ階層にある個別HTMLでリポジトリ配下からJS/CSS/画像/フォントを読み込みます。ゲームのURLを直接更新しても実在するHTMLを開きます。SPAの404用リダイレクトは不要です。

## 検証

```sh
npm run check
npm test
npm run build
node tests/eleven-game/audit-gameplay.mjs
node tests/eleven-game/audit-art.mjs --dist --final
npx playwright test --config tests/eleven-game/eleven.playwright.config.ts
```

Chromiumが未導入なら`npx playwright install chromium`。この環境では`/usr/bin/chromium`を使用します。実行したケース・失敗後の修正・PC/スマホ実画面・`/repo/`での配信確認は[今回のQA](docs/eleven-game/QA)へ記録します。旧`test:e2e`・`test:production`は10本時代の仕様を含む履歴です。001〜011の回帰確認には11本版のテストを使い、012〜014は移行専用の検証を行います。

## ゲーム追加・サムネイル更新

`src/data/gameCatalog.ts`の各項目は`id / titleJa / titleEn / tagline / thumbnail / route / releaseOrder`です。新しい項目を加えると一覧カードが増えます。新作は個別HTML・固有実装・練習シナリオを作り、Viteの入力対象にも追加してください。練習は`src/arcade/PracticeSession.ts`と`onboarding.ts`で定義します。

サムネイルは実ゲームの`#stage`を撮影した画像から作ります。実装にない演出の広告画像にはしません。`public/assets/portal/gameNNN.webp`を更新し、原本・矩形・hash・採用状態を`assets/portal/thumbnails/asset-index.json`へ記録します。[素材パイプライン](docs/eleven-game/art/ASSET_PIPELINE_DECISIONS.md)を参照してください。

001〜011とポータルの配信画像は採用したWebPです。012〜014は元ゲームのPNG・WASM・PCK・音声をそのまま同梱します。ImageGen原本・atlas・生成ログ・ライセンスは`assets/`と`docs/`に保存します。011の20アイコン、010のLISTEN/WORK前景2枚は実際にImageGenで生成しました。フォントは同梱のM PLUS Rounded 1c由来subsetで、OFLを同梱しています。通常のnpmビルドにPythonは不要です。

## CREDIT・保存・接続境界

`src/arcade/config.ts`の`creditsEnabled`は **false** です。保存済みCREDITが0でも開始・再挑戦できます。OFF時は残高の上書き、減算イベント、RewardAdapter呼出しをしません。

将来ONへ戻す場合は`creditsEnabled: true`にして、`CreditService.requestRewardedCredit(adapter)`へ実広告SDKを接続します。3CREDIT・失敗時の1減算・補充の重複防止は既存サービスと有効モードの回帰テストに残しています。011の広告UI接続もその段階で追加してください。本番広告の接続前に試作版のフラグをONにしないでください。

保存名前空間は001の`orbit-shift:v1:`を保持し、002〜011は`web-mini-arcade:v1:gameNNN:`です。BEST、音、練習完了をゲーム別に保存し、保存拒否時はページ内メモリで継続します。自己ベストはこのブラウザ内の記録です。011の新配点BESTは`best:v2`、旧配点は従来の`best`に保持します。012〜014の保存は各Godotゲームの既存仕様を保持します。

001〜011では`TelemetryService.trackEvent()`を通してgame_open、run_start/end、score、retry、quit等を記録します。練習はtutorial_start/step_complete/complete/skip、一覧はportal_open/game_card_click/game_launch/return_to_portalです。現在のadapterはconsoleと最大200件のメモリ履歴で、ゲームIDを付与します。オンラインサービスへの置換はこの境界で行います。

## 構造と学び

- `src/core/`：保存、CREDIT、RewardAdapter、音、Telemetry。
- `src/arcade/`：試作フラグ、初回導線、独立した実操作練習。
- `src/portal/` / `src/data/`：一覧と登録データ。
- `src/game/`：001の固有モデルとPhaser。
- `src/games/game002/`〜`game011/`：ゲームごとの固有ルール・描画・UI。
- `public/games/`：012〜014の既存Godot Web出力。独立した相対パスで配信します。
- `docs/eleven-game/`：11本版の仕様・実装報告・独立レビュー・QA・人間評価。
- `docs/migration/`：回答時間・得点改修、既存3ゲーム統合と旧サイト停止の記録。

既存10本の純粋ゲームモデルを維持し、007/008の情報表示、010の実画像前景を改善しました。汎用ゲームSDKや同じ結果UIへの統一はしていません。共通化する範囲は[次期仕様草案](docs/eleven-game/COMMON_SPEC_NEXT_DRAFT.md)とゲーム別LESSONSで検討します。

## 旧3サイトの公開停止

3ゲームの移行・公開・実配信での操作確認は完了しました。元リポジトリは保持しています。旧GitHub Pages削除は接続APIとGitHub Actionsの両方で403となり、管理者による「Unpublish site」が必要です。自動停止用に追加した一時workflowは削除し、タスク天国と指ハートの旧配信workflowは無効化しました。川俣さんのゲームと公開設定は未変更です。[実行監査](docs/migration/PAGES_RETIREMENT_AUDIT.json)。

- [横取りデイズのPages設定](https://github.com/Badgio0906/yokodori-days/settings/pages)
- [タスク天国のPages設定](https://github.com/Badgio0906/tachibana-task-heaven/settings/pages)
- [指ハートのPages設定](https://github.com/Badgio0906/finger-heart-challenge/settings/pages)
