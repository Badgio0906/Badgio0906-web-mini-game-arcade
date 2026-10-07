# Game030 implementation report

担当author: /root/batch_two_030。基準commit7c3d089d69da1ff076c63acb7c3ba96449728a1d、専用branch codex/batch-two-030、既存未commit作業は別worktreeのまま。自身の変更はgame030.html、src/games/game030、tests/unit/game030*、tests/game030、docs/game030のみ。catalog/Portal/Worker/候補表/公開は親統合担当。

独自20経路パズル、swept衝突・長さbudget・自己交差禁止・最終線分だけの巻き戻し、keyboard＋pointer、指上preview、任意説明／実練習、stageBEST/解放とatomic ledger、null observer対応、pausedrestore、fresh-menu-epoch入力を実装。時間制限・広告・CREDITなし。

実行済み：npx vitest run tests/unit/game030.test.ts 39tests PASS（20primary+alternate解法、+4clearance、>=70budget、wall sweep/corners、backtrack、crossing、save/memory/idempotentclear）；npm run check PASS；npx vite build --config tests/game030/vite.config.ts PASS（isolatedcompiled）。初回numeric alternate006 fixture collisionの原本と修正理由はQA/initial-model.txtとNUMERIC_FIXTURE_CHECK.md。

追加の保存検証：semantic-invalid／oversize readとdeniedwrite後はmemoryOnlyを固定し、有効な最新memoryをcloneで保持。backend古い値の再読・拒否write再試行を禁止する3回帰を追加。受動的stage chooser／任意練習はinactive savednormalを保持、通常の明示開始／abandonは置換・破棄。exact-production-handler fixture（passive-save／terminal-return／practice-continuation）PASS。実ブラウザ確認とは分離。最新SOURCE_FREEZE_BROWSER_READY_STORAGE_PRACTICE.jsonにownsource／compiled assets／親SDK依存hashを保存。

描画プラグmax axis22.5に合わせ衝突padding25へ修正後、後半13 primary810.8495 vs alternate870、14 782.7567 vs830、18 789.2697 vs870、20 778.0807 vs865。単純な同じManhattan長のルートから、実際の斜め経路の長さ差へ修正し、両方のfinger+4clearanceをモデルで確認。

初回報告時点ではブラウザ通常操作・独立Feel/Visual・公開操作は未実施だった。下記に再開後の実行を追記する。本人・物理端末主観評価は未実施。初回のJevは受動的selection保存喪失、lateルート長さ差、terminal selection戻り、描画plug footprint／paddingの各code/spec観測に1回ずつShadow（現時点計4 author実API（親のSaveStorefindingは別）、HTTP200＋valid4、resolved typesafe/jev-1.13-20260917）。回答を見ない親の独立判断を記録して限定修正／再検証、falsepass/riskmissなし。LIVE_INTERACTION routingとの方法差は、独立コード／モデル証拠と実操作証拠を区別し、後で有効性を評価する。PASS/数値比較だけの回数消化は行っていない。本番Worker未認証は親の一度の確認を継承し、当ゲームはremoteCollectionEnabled:false。

再現：linked dependenciesまたはnpm ci、npm run check、対象Vitest、独立vite build、npx vite preview --config tests/game030/vite.config.ts --port4930、GAME030_BASE/GAME030_REPORT指定でnode tests/game030/native.mjs。出力先は既存ディレクトリを拒否しsourcehash/run単位、一時4930serverを引継ぎ前提にしない。公開commit/URL/配信/Sheetは親の完成後証拠へリンクする。


## 2026-10-08（日本時間）再開後の通常入力QA

再開担当 `/root/resume_030`。初回 compiled 通常操作は PC の20ステージ・短経路／長経路・保存・練習・選択を通過したが、phone のドラッグ直後のヒントタップで `Single hint recorded` を観測し即停止。before の source/build、画像・trace を `QA/finding-phone-hint-before/` に保持し、C を1回だけ実送信した。原本の失敗時 localStorage snapshot／精密座標が欠けていたことは preservation.json に明示する。

許可された2つの fresh-context 診断では、最後の drag 61ms → 同じ最初の hint tap 0.4ms で click 未発生、最後の drag だけ +125ms（実測184ms）→ 同じ hint tap 0.4ms で native click／hints1／marker 表示。hint の座標・有効性・hit-test・single-touch・focus・defaultPrevented は同じ。独立判定は元 UNKNOWN を保持したうえで TEST_INFRA_BUG に更新。Chromium内部原因／実機の高速タッチまで断定しない。ゲームの入力処理は修正せず、collector のドラッグに +125ms の接触時間だけを加えた。診断原本は `QA/hint-touch-diagnostic/8592935b4152/2026-10-07T19-24-46-183Z/`。

既に観測済みの共通 practice-production exclusion の同原因追補として、Portal へ出るとき `training` を消さず、後続 SDK page_exit／client_error まで production 練習を除外する。元の normal continuation と通常 Portal イベントは保持。exact handler／constructor ignoreEvent predicate の synthetic regression `tests/game030/practice-portal.mjs`、39対象単体、check／isolated build は PASS。新規 API・物理／描画／保存schema変更なし。

最終 compiled asset `game030-COBvQ1ht.js`、source `255b8090f7f0c49fbbedced5201ad5ffeca8b3cd021b97a454123a5e4685efde`。`QA/SOURCE_FREEZE_FINAL_NATIVE_MEASURED.json`、実行 `QA/255b8090f7f0/2026-10-07T19-39-55-736Z/`、要約 `QA/NATIVE_FINAL_SUMMARY.json`。1365×1000／390×844／320×720／844×390、78チェック／50通常viewport画像／pageerror0。PC・phone は注入なしの通常入力で全20＋明示retryを完走（21clear）。全4画面で通常retry、新しいlocal result identity、BEST保持、cancel／capture-loss／noWarp／resize／pause／reload／任意練習が保持する normal continuation／held Enter を確認。盤面は実 viewport／settingsTop の双方より上に全体表示、主要操作幅・高さ44px以上。テストは独自 Levels.ts の既知waypointsを入力し、人間の初見ルート判断／面白さを評価していない。実行後 source/test/build/root SDK dependency の全freezehash一致、browser finally closed。

author 自身の Jev は5回、各 api_attempted=true／AVAILABLE／HTTP200／resolved typesafe/jev-1.13-20260917／有効4回答。独立判断との PRIMARY4/5、NEXT0/5、CODEX false pass0、risk miss0。routing不一致をそのまま誤回答と断定せず、元独立方法と実際の診断を保持。親の SaveStore C、共通 practice C は別ログで重複計上しない。JevをVisual点・公開許可・ゲームの面白さに使用していない。

最終独立 Visual／Gameplay、正式統合／root全テスト／public通常入力／Portal／Sheet／CIは親担当として別証拠が必要。本人・物理端末の試遊は未実施のまま。

Root integration 2026-10-07T20:26:44.792019+00:00:39target/root736tests66files/check/build andWorkeractualD138events12RUN PASS. Allreviewedproductfiles byte-identical; originalnative78checks/all20normalPCphone+retry preserved, independentactualPC900/phone390 Visual82 F13 H12. RootpublicdriveronlychangesrequiredPC900/small740; beforedriverarchived. PublicexpectedCIversion/fullnative requiredsizes pending. Independent1260perturbed routes and5736denseactualrouteinputs confirm20+practice paths, ownnamespace/BEST no oldsavechanges. Actualnormalgame screenshotthumb640x360 noImagegen. Humanfun/physicalphoneunperformed, WorkerauthblockednewremoteOFF.
