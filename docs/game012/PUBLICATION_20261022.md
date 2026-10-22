# Game012横向き専用化：本番反映準備

2026-10-22 JST。対象PR [#13](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/13)。**ローカル統合検証済み。未push・未merge・本番未反映。** 作者の公開承認は受領済み。ただし以前の費用条件「必要な条件が不明ならpush前に停止」は今回も継続しており、Webhook/billingの403について今回分の判断を待つ。

## 対象・保全

- 対象：内部game012「お前の仕事は俺の仕事」。Game015＝表示012「落下キング」と区別する。
- 承認済みremote PR HEAD `dfae1107b7c8ed8440fe8e44e239ca5840638532`。
- 開始時live main/fetch後origin/main `537c6c384e0008da428ec395a3673c0fd63ae5dd`。未公開PR11/13と、最終監査の別worktree未commit成果物を保護。
- 最新mainを取り込んだ保全済みローカル候補 `3173faff26c9625be65f2cd7543417b067315f34`。**製品・Game012テストbytesは承認HEADと同一**。mainの進行はGame036/038等で、PR13が変更する経路へ製品競合なし。CURRENT_STATUS文書のみ双方の履歴を保持して解消済み。
- この工程では重複実装、HUD/ルール/物理/得点の再設計なし。追加するのは本書・QA・現行状態の記録だけ。
- 公開28 / 完成9 / 試遊19、036/038公開、031保留、026/028/029/030削除、retired4、037未公開を保持。Game015/PR11、広告/CMP、Analytics/Telemetry、Worker/D1、記録投稿・BEST形式を変更しない。[scope](publication-20261022/QA/SCOPE.json)。

## 既存実装を採用する範囲

primary coarse/hover none＋screen短辺600未満をphone相当とし、その縦向きで回転案内を表示する。PC/fine pointerや600以上tabletを単なる縦viewportだけで止めない。端末判定はheuristicで、すべての端末識別を保証するものではない。

- 縦は「横向きで遊んでください」、ゲーム一覧・遊び方・解析設定/プライバシーを利用可能。本編HTML/WASMをロードしない。
- 横の新しい明示開始でのみnativeをロード。元960×540 / 16:9を実Canvas矩形にcontainし、人物3人・横取り対象・HUDを全景に収める。ゲーム本体PCK/WASM/JSはmainと同一。
- 途中の縦回転は現在のセッションをアンロードして中断する。これは続きからの一時停止ではない。確定済みBESTは維持し、未完RUNの継続は保証しない。
- 横へ戻しただけでは自動再開しない。古いtouch/pointer/Space/Enterのreleaseも起動へ持ち越さず、新しい操作で最初から開始する。
- 直接game.htmlを開いてもengine起動前に管理入口へ戻り、縦向きgateを迂回しない。
- 詳細は[横専用仕様](LANDSCAPE_ONLY_20261021.md)と承認HEADの差分を正本とする。

## 今回のローカル検証

|項目|結果|
|---|---|
|`npm run check`|成功|
|`npm test`|**106 files / 1013 tests成功**|
|`VITE_RECORDS_ENDPOINT=https://analytics.game100garage.com npm run build`|成功。既存のnavigation解決/大きいchunk警告は記録し、設定を緩和しない|
|offline helper|25 tests成功。Jev/OpenRouter呼出しなし|
|Game012表示matrix|13ケース成功（指定5サイズ＋375/932、PC/tablet境界、直接runtimeの迂回防止）|
|回転gesture|pointer/touch/Space/Enterの4ケース成功。起動境界はstub resourceによる旧gesture試験。本編実プレイはmatrix/lifecycleで別確認|
|Game012 lifecycle|DPR3、練習完了→実native結果0→確定0保存→touch保持中回転・旧context破棄→横復帰は停止→新操作で再開→旧session記録拒否→一覧0点とreloadを確認|
|Game013/014|[native回帰記録](publication-20261022/QA/godot013014/REPORT.json)参照。原本と同じruntimeでPC/phone相当の4ケース・30項目が成功。通常入力・結果/retry/保存/一覧を確認した。013は0点、014は実入力で1回成功の確定記録をそれぞれreload後にも保持。外部の全体BEST取得は遮断しているため「取得できません」を正常な外部遮断結果として区別する。014の成功タイミング観測は元exportのopt-in QA observerを使用し、state/得点/時刻を注入しない|
|ビルド・保護|Game012 public/dist 3ファイルbytes一致、013/014を含むruntime45ファイルはmainと同一。036/038や公開28入口、削除/保留/037不配信を確認|
|実iPhone Safari|**未実施**。Chromium touchエミュレーションと区別|

log・JSON・画像は `publication-20261022/QA/`。main取り込みに伴うsource比較の初回scriptは、承認HEADから全testsを比較して上流の036/038テストを差分に数えたため停止した。実際の承認済みPR13経路へ絞って確認し、scopeに訂正を記録。製品の差分を消したりテストを無効化したものではない。

ローカル画像：[390縦案内](publication-20261022/QA/matrix/390x844-guide.png)、[844横プレイ](publication-20261022/QA/matrix/844x390-play.png)、[667横プレイ](publication-20261022/QA/matrix/667x375-play.png)、[PC](publication-20261022/QA/matrix/1440x900-play.png)。**これらは本番画像ではない**。

## 公開処理の確認と停止理由

repoは現在PUBLIC。対象branchは `codex/game012-mobile-visibility-fix`。通常branch pushで既存PR validationが実行される。最新headのCI成功後にDraftをReadyへ変更し、通常mergeでmainへ統合すると既存Pages build/deployが起動する計画。

- 全ジョブは固定 `ubuntu-latest`、matrix・再利用workflow・larger/custom/GPU runnerなし。
- PRはcheckout/setup-node/npm ci/check/test/offline helper/build、deployなし。
- Pagesはcheckout/setup-node/npm ci/test/offline helper/endpoint検査/build/configure-pages/upload-pages-artifact/deploy-pages。課金APIの呼出しなし。package scriptsを変更していない。
- **標準runnerの公開repo実行時間が無料という条件は確認**。ただしsetup-node npm cache、Pages artifactの保存容量の課金条件、push連動Webhook/外部サービスは別。
- Webhook一覧、billing usage取得は今回もHTTP403。必要な契約/上限/連動内容を確認できず **UNKNOWN**。[GitHub・費用確認](publication-20261022/QA/GITHUB_BEFORE.json)。新サービス・プラン・課金設定・workflowを変更して解決しない。
- 今回の公開依頼は承認として尊重するが、過去の別タスクだけの費用不明点了承を転用しない。**今回のPR13 branch push/自動PR検証と、main merge/Pages各1回**について不明点了承を得るまで停止する。

現在のGitHub PR13は旧HEAD/draft/文書競合あり。旧HEAD CIは成功だが、**新候補のCIではない**。ローカル候補はmainが祖先で文書競合なし、ただし未pushなのでGitHubの競合表示はまだ解消していない。Ready変更・merge・manual CI・Pagesを起動していない。

## 承認後の手順（まだ実行していない）

1. live main537c6c3とPR13旧HEADを再確認。変化があれば差分を再評価。
2. このbranchを通常pushし、PRの新HEADを固定。準備したPR本文へ更新し、自動validateの成功と競合なしを確認。成功まで無条件に再実行しない。
3. DraftをReadyにし、確認したhead SHAを条件に `merge` 方式で通常統合する。force/squash/rebaseで既存履歴を消さない。
4. 既存Pagesのbuild/deploy成功・head SHA一致を確認。手動workflow起動や設定変更なし。
5. 本番Game012の縦案内・native未取得、横/PC全景・結果/retry、Game013/014、28/9/19、削除/031保留を検証。広告・解析・記録POSTを遮断し、実機未確認は区別する。`QA/production-verify-prepared.mjs` を本番base用に準備済み。
6. main SHA、Pages URL、本番の縦/横画像を報告。現在は本番未反映なので、その成功や画像を偽って記載しない。

## 未解決の別P1・実機確認

**Game001/005の共有練習が横向きでclose後も残るP1は未解決。** このPRは共有onboarding CSS/JSを変更しない。Game015/PR11を統合せず、その修正や合格証拠を今回の本番へ読み替えない。最終品質監査のNOT READYを今回の公開準備だけでREADYへ変えない。

通常iPhone Safariでは、screen/orientation判定、縦案内/説明/帰還、Safariバーとsafe-area、横の小さいHUDの実読性、touchの位置・回転中断・fresh gesture、結果/retry・BEST永続保存・音を作者が確認する。今回の方針で横専用を公開する承認と、実iPhoneの技術合格は別。

AdSense設定・再審査申請は行わない。追加改良/HUD再設計も行わない。

## 保存場所

`/workspace/arcade-game012-visibility`、branch `codex/game012-mobile-visibility-fix`。今回の記録をcommitしたSHAは最終回答を参照。未pushのcommitはGitHubバックアップではない。既存3173faf/dfae110の履歴、他worktreeと監査の未commit成果物は保持した。
