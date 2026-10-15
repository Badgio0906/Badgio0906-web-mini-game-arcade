# FIREWORK MAKER 実装報告

2026-10-15 JST。実装担当の作業記録。100秒本番・時間無制限練習・press/release高度・開花／連鎖／コンボ／八重咲き・結果／retry／BEST・音／mute／pause・通常keyboard/touch入力を実装。[仕様](IMPLEMENTATION_SPEC.md)／[美術](ART_DIRECTION.md)。

モデルはDOMから分離。発射時に目標を凍結し、実際の開花位置と時刻から採点する。100秒時点で溜めを取り消し、新発射を止め、飛行中の花だけは得点確定まで見届ける。練習は別インスタンス状態として開始し、本番記録へ送らず、BESTを更新しない。結果の自己BESTは `web-mini-arcade:v1:game033:best`。Catalog／Vite／records／Analytics登録はroot統合担当。

背景はArt Directorによる実ImageGen素材を採用。粒子・残光・煙・反射はCanvasで動的描画、画像内の架空の花火を得点にしない。有限900粒子・最大6飛行で負荷を制限。mute状態はStorageService、音声は既存AudioServiceで発射・開花・特別花に接続した。

## 実行済み

`npx vitest run tests/unit/game033.test.ts`: **5/5 PASS**。目標高度と満タン不正解、4花連続の実連鎖／特別開花、100秒終了と飛行中確定・一回だけ結果、練習130秒無制限とcancel／pause相当、2500反復での粒子／rocket上限とコピー防御。

初回の4連続テストでは直後のpressが拒否された。Jev実1HTTP200へその観測を送り、答えを伏せてソースを確認。次の溜めを始めるpressから待機制限を外し、最低launch間隔をreleaseへ移動し、自然な連続holdを許可した。制限そのものと負荷上限は維持。再検証5/5 PASS。[Shadow](QA/JEV_SHADOW.jsonl)。

初期TypeScript確認で033固有エラーを解消し、当時の共通records型エラーをrootへ連絡した。その後のroot統合で共通登録と固定43deb production buildが用意され、下記の通常入力QAを完了した。全体check/test/buildの正式記録と公開判断はroot統合報告を正本とする。

## 固定production通常入力QA（2026-10-15 UTC）

43deb6cd50348dada54acb7469fefd12b54ac93c、`/workspace/arcade-stage4` のproduction preview4174で実施。[初回原本](QA/43deb-native-01/report.json)。モデル／時間／位置／得点の注入なし。見える目標表示に合わせたnative SpaceまたはCDP touch長押し・releaseだけで実プレイした。

1440×900と390×844では説明・無制限練習・練習BEST不変・通常開花・motion連番・pause時計停止／再開後Spaceまたはtouch・mute切替とreload・quit／portal帰還が通過。390×844は実100秒を完走し、自然結果65560点、86/86開花、85ぴったり、最大コンボ86、最大連鎖7を[実結果画像](QA/43deb-native-01/phone-result.png)で確認。BEST123→65560、結果1440/320/844回転、retry得点0、再reloadの保存一致も通過。音はAPIとmute状態の検証であり、実聴はしていない。

初回RUN全体は3case目320×568の説明modal最後の「タイトル」buttonが初期viewport下へ18.77px出るというgeometry assertionでFAIL。CSSはdialogにmax-heightとoverflow:autoを指定しており、collectorが長い説明の全actionの同時表示を要求した。原本はFAILのまま保存し、Jev Cへ観測を1回送った。製品sourceを変えず、modal内の通常scrollで各actionが到達・非clipになるかを320/844限定で追加確認した。初回RUNの全source hash一致は[別記録](QA/43deb-native-01/source-verification.json)、pageerror／POST／write試行はいずれも0。

## 限定追補と最終技術結果

[追補原本](QA/43deb-native-02/report.json) は320×568／844×390の2case、16check群PASS。説明modalの各actionを通常scrollIntoView後、viewportとdialog内側の両方でclipを測った。320の最後actionはscrollTop14→85、y457.77＋44<内枠bottom520、844はscrollTop0→16、y314.34＋44<内枠bottom358。説明・実練習・通常花火とmotion連番・pauseと再入力・mute保存・quit／帰還まで通過。source hash不変、pageerror／POST／write試行0。製品CSSの変更は不要だった。desk担当のJev未読独立判断と実測を対応してJev C annotate済み。

[最終技術集約](QA/FINAL_NATIVE_QA.json) は初回の成功desktop/phoneと追補のnarrow/landscapeを合算した4case37check群を採用し、失敗した初回全体report自体をPASSへ書き換えない。2run間の全source hashも一致。独立Visualへ4幅の実play／motion連番／結果画像を渡した。

## 残確認

独立Visual／Feel点とサムネイル、本人の試遊、物理スマホ／音の実聴、正式公開。通常100秒の成功は実施済みとして保持し、製品sourceが変わらない限り同じ長RUNを繰り返さない。

## 独立コードレビュー後の限定修正

独立desk_rain担当から、native dialogをpauseボタンで開いてresumeすると元のpauseへfocusが戻り、次のSpaceが花火ではなくpauseを再度押す可能性を指摘された。Jevへ新findingを1回実HTTP200で送り、start／resumeのmenu.close・launch有効化後にlaunchへ明示focusを戻した。desk担当の独立判断JSONを元観測と対応してannotate済み。本人／browser再現とは区別し、通常pause→resume→Space長押し／releaseをcollectorへ追加した。[独立判断](QA/033-resume-space-focus-judgment.json)。
