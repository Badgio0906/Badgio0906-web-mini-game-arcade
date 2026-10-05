# 任意の説明・練習と初回スキップ

2026-10-05（日本時間）。今回の統合依頼の第4章を実装した。初回でもタイトル上の「すぐ遊ぶ」「説明を見る」「練習する」を別々に選べる。スキップは tutorialCompleted を変更しない。説明と独立練習は保存している。

## 実装境界

- 001〜011・015: 既存の共通 onboarding がタイトルだけに3択を配置する。通常開始の intercept は説明を強制せず開始を許可する。MutationObserver は app の title 状態と hidden 要素を確認し、プレイ中には追加ボタンを残さない。共通独立練習は現行 run、score、BEST、CREDITへ触れない。練習を終えたら明示的にタイトルへ戻り、次の「すぐ遊ぶ」を選ぶ。
- 015: DROP/↓/S/Space のホールド、release/cancel/blur、6段階の練習コピーへ対応。左右移動、中央危険、連続降下、やわらかい床、着地衝撃、追う天井を説明する。
- 016・017: 固有の練習を維持し、初回強制ゲートを取り除いた。説明と練習はタイトルで別ボタン、practice_start/complete/viewを明示的に記録する。開始入力の epoch とキーホールド保護は維持する。
- 018・019: 固有担当が同じ3択ラベル/IDを採用。018の「すぐ遊ぶ」は説明・練習を飛ばして従来の5種類の靴選択へ進む。
- 012〜014: index.html の帰還shellに3択と説明、得点/BESTと隔離した短い操作練習を追加した。本番 iframe は選ぶまで読み込まず、練習中はengineを起動しない。012はよそ見を待って横取り、013は光る4パネルを順に選ぶ、014は指ハートの表示だけ押すsandbox。これは元ゲームの絵/音を使った練習ではないことを画面にも示す。元game.html/PCKの説明と013の音付き練習は保存する。「すぐ遊ぶ」は元exportを起動し、012/013では元のタイトル上のSTART/Enterを押す。014は元通り開始する。

## Game013の必要なnative変更

元の START は初回に強制的にhelpへ移り、native練習を完了しないと本番へ進めなかった。START を `request_start(1)` に変更し、helpの「練習してはじめる」からの `request_start(0)` と tutorial保存はそのままにした。スキップに偽の完了記録は書かない。

`tools/patch_legacy_start_choices.py` は正確な4.5.1.stable.official.f62fdbde1で元ソースをコンパイルし、`scripts/game_manager.gdc` だけを既存の改名済みPCKへ差し替える。82個の他のpacked resources、WASM、JS、audio、worklet、画像はそのまま。game.htmlは既存engineのPCKバイト数だけ修正。[監査](GAME013_PACKED_RESOURCE_AUDIT.json)と[ソース差分](game_manager.gd.patch)を保存した。Game012/014には初回強制練習ゲートがなくPCK変更はない。

legacy shell は共有localStorageの400件上限フォーマットに game_open/tutorial_view/tutorial_skip/practice_start/practice_complete/game_launch/return_to_portal/page_exit を記録する。`measurement: legacy-shell` と明示し、native run_start/run_end/scoreを観測したとは主張しない。保存不可でも操作を継続する。

## 検証

- `npm run check`: PASS（統合作業中の実行）。
- Game016独立練習unit3件: PASS。
- `node tests/fourteen-game/audit-legacy-migration.mjs`: 元42ファイル、3export、意図しない差分0。
- Game013 fresh desktop/mobile横画面のshell→native STARTを実操作し、初回から stage1/playing、console/page errors0を確認。[native記録](QA/native-capture.json)。元の音付き練習へ進むことも既存help導線に残る。
- Game019は実際の本番開始後のcanvasとdesktop画面をQAへ保存した。カメラ/scoreを変更していない。[実play原本](QA/game019-actual-source.png)。
- `playwright.start-choices.config.ts` / `tests/e2e/start-choices.spec.ts` に全19タイトルのdesktop/mobile3択、native初回スキップと偽完了禁止、shared heldkey、legacy独立練習の検証を追加した。最終78ケースPASS（desktop/mobile各39）。初回75PASS/3FAILはsandboxの2回目入力が前回の表示を見て早く押されるテスト待機の問題。テストだけを待機→成功表示の順に修正し、対象6ケースを同じproductソースで再実行して全PASS。[要約](QA/COMMON_CHOICES_SUMMARY.json)／[再検証JSON](QA/legacy-retest.json)。

人間によるテンポ/初心者の理解、実機の絵文字フォント（legacy補助練習）、親指操作感は未評価。全変更の公開結果は統合報告を正本とする。
