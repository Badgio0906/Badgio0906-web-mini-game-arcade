# GAME_COMMON_SPEC 次期候補 — 説明 → 実操作練習 → 本番

2026-10-04 / **DRAFT・人間検証前**。[今回のspec](IMPLEMENTATION_SPEC.md)3〜20・115〜117から得た次期候補。[現行GAME_COMMON_SPEC](../../GAME_COMMON_SPEC.md)をこの草案で置き換えず、旧ゲーム固有の分岐/score/physicsを共通テンプレートへ変換しない。Game012以降の基本操作練習を設計するための候補である。

## 最小の共通契約

初回タイトル→短い説明→実操作Practice→成功→本番。再訪は本番へすぐ進む選択と再練習の両方を用意する。説明は目的と1〜2操作に絞り、Practiceではその操作と結果を実際に体験する。説明を閉じるだけ、放置、highlightされたボタンへの同意だけを成功にしない。

通常の成功は5〜20秒が目安。長文/多数step/長い到達条件を課さず、誤操作には短い理由と再試行を用意する。読む速度が遅い人に強制終了を課すことは意味しない。失敗してもGame Over/CREDIT消費にしない。例外が必要なゲームでは理由と人間実測を記録する。

教えるのは最低限遊ぶ方法だけ。002の旅/バイク、003のC国、008の追加cup、010の役員会等は最初の説明に明かさない。Practiceを特殊展開の紹介ツアーへ変えず、上達した人の発見を残す。今回011のpracticeも画像1問だけで、FINAL攻略の説明を必須にしない。

## 状態・保存・入力の候補

|状態/境界|候補の責任|
|---|---|
|Explanation|短い目的/操作を示す。本番model時計と入力は停止|
|Practice|別sessionで実操作・視覚結果・失敗説明。練習の得点例は明確に練習用|
|Success|達成した操作を短く伝え、本番開始/タイトル帰還を明示|
|Main start|本番を通常の初期状態へreset。最後の練習入力を持ち越さない|
|Repeat|ゲーム別`tutorialCompleted`を読み、直接開始と再練習を提供|
|Close/Blur|操作停止・held pointer/key解除・適切なfocus復帰。閉じただけで成功保存しない|

保存namespaceは各gameの既存StorageServiceと分離せず衝突を避ける。`tutorialCompleted`は成功と明示的な完了行動後に保存する方針。説明の中断は未完了。再練習は既存BESTを消さない。LocalStorage不可でも当該session内の練習→本番を続けられる挙動を最終QAで確認し、理解度をbooleanだけで保証したと言わない。

入力はゲームの本番と同じ意味を使う。左/右の意味をpracticeだけ反転しない。押す/離すが必要な008、WATCH中入力を無効にする004、2回のstop後に車の移動を待つ006、表示ラベルを読む011など、固有の入力段階は残す。終了/再開時は入力epochやrelease等で直前gestureの二重消費を防ぐ。実native成功を必須とし、handler存在だけで認定しない。

## SCORE / BEST / CREDIT / 計測の分離

Practiceは本番SCORE/BESTを変えず、本番runId・run_start/run_end・credit_used/credit_zeroを発火しない。Game010のscore増加例等は別のpractice数値として描画する。tutorial_start / tutorial_step_complete / tutorial_complete / tutorial_skipを`trackEvent()`経由で記録する候補。skip/中断と成功を区別し、tutorialイベントだけを本番開始率/生存時間の分母へ混ぜない。

今回試作版は`creditsEnabled:false`で広告と制限を無効化する。保存0でも遊べ、消費やreward requestを行わない。旧CreditService/Rewarded Stubの将来契約は残すが、今回の無料リトライを+3CREDIT付与として実装しない。将来再有効化した時のCREDITは本番の契約であり、Practiceを広告機会へ変えない。

## UI / 情報設計の候補

Practiceの世界観は各gameへ合わせ、同じ外枠の存在を理由に描画全体を同一化しない。説明/操作/成功がscreen内で読め、main control≥44CSSpx、keyboard/focusとphone縦横を確認する。PCはgameを主役にして余白を取りすぎず、viewportの80〜90%有効利用を目安に実制約から調整する。読みやすさを犠牲に無条件で拡大しない。

重要な操作情報をgame領域に集める。007では現在/MAX/残枠・対象kg・乗せた合計・選択を同時に読める。008では実液面の高い側/危険cupを示し、慣性で反対になるbodyLeanを液面方向の代用にしない。全杯の残量と距離mを領域内に残す。これらは情報設計の教訓で、全ゲームへ重量meter/tilt HUDを追加する共通仕様ではない。

Portalはcatalog一箇所のid/邦題/英題/tagline/actual thumbnail/route/releaseOrderから一覧を作る。安全なheader/pause/resultから戻れ、game操作領域内の誤tapを避ける。MPAの物理HTMLとVite `base:'./'`は今回の配信選択であり、全プロジェクトへ同じrouting方式を強制しない。GitHub Pagesのroot/subpath/refresh/asset証拠は別QAで残す。

## 将来追加時の納品候補

新conceptには本番のCore Loop/操作/Skill/Score/Failure/Replay/想定時間/リスク/Artに加え、**5〜20秒の実Practice**を記載する。最低限、見せる状況・必要な操作・成功の観測条件・誤操作への返答・本番へ戻す状態・ネタバレしない内容を具体化する。Gameごとの比較は[11本練習表](HUMAN_PLAYTEST.md)と[Concept Designer学習資料](../ten-game/CONCEPT_DESIGNER_LEARNING.md)を参考にし、全genreに同じ成功条件を当てはめない。

現段階で共有候補はdialog/focus、入力の隔離、完了保存、tutorial telemetry、prototype credit flag、catalog/安全帰還。PracticeSessionの各scene・駐車幾何・液体の遅れ・記憶sequence・正誤pool・人物の質問前兆は固有のまま。新SDKや全scene基底classの抽出は、この草案だけを理由に行わない。

## 採否を決める証拠

1. 保護モデル/scoreが意図せず変わらず、全11が初回説明→native実操作→成功→fresh本番へ進む。
2. practice中SCORE/BEST/本番events/walletが変わらず、未完了/再訪/再練習・キー/タッチの境界が正しい。
3. 最低1440×900/390×844の実画面で読む情報と操作が分かり、追加viewportでもpractice/success/result等が収まる。
4. 独立Feel/VisualとQAの証拠を分ける。Visual80以上、F/H各12以上の実候補だけを合格とする。素材採用/モデルsimulation/DOM-only fixtureは実到達・楽しさの代替にしない。
5. 人間の新K説明理解、新L操作理解、新M練習の長さ、新N本番の目的を測り、game別の要改善を反映してから安定した共通契約へ昇格する。

旧ten-game K〜N（発見/選択/追加の面白さ/笑い）を新項目へ改名して結果を流用しない。[人間フォーム](HUMAN_PLAYTEST.md)に両者を区別して保存する。

現checkpointはRoot報告の153unit/候補build/check PASS、QA45/47 distinct valid native PASS。Desktop/portrait全11practice分離/保存/再訪/再練習、全11保存0から3回終了/retry、両011 FINAL到達を含む。明示source bridgeで別sliceを保持した結果で、52 duplicate skipsや自動plannerの成功を人間の理解へ加算しない。176 actual pause/result観測はPASS。Clip-aware352 matrixは009practice320幅の隠しwindow内clip修正、011終了時`remaining:null` harnessは厳密なtimeout/late-answer再検証が未完了。Production24context・独立Feel/Visualはこれから。

[元の64FAIL観測](QA/INITIAL_ONBOARDING_LAYOUT_AUDIT.json)は保存する。viewport外へ出ないだけでは、overflow hiddenの祖先で実操作対象が切れない保証にならない。Practice gridの実clip境界まで確かめ、誤ったexpected値のharness修正と実layout修正を分ける。これらはQAの教訓であり、whole SDK抽出やart iterationの追加理由ではない。素材audit89WebP PASSと最終11actual thumbの採用は、UI判読/独立Visual合格を意味しない。

公開先repositoryは[Badgio0906/Badgio0906-web-mini-game-arcade](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade)、予定URLは[GitHub Pages](https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/)。Rootが接続後のremote README更新とActions Pages設定を確認済みだが、Arcade統合source push/deploy/remote動作確認はQA/Feel gate後でまだ未実施。全11の人間評価・実機FPS・楽しさ・共通仕様の安定採用も未確認。

[実装途中報告](IMPLEMENTATION_REPORT.md)、[QA ledger](QA/README.md)、[実行checkpoint](QA/EXECUTION_LEDGER.json)、[事前risk](reviews/DESIGN_RISK_REVIEW.md)を出典とし、Rootの実証後に更新する。
