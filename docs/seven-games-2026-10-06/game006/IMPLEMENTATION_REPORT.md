# Game006 rules v2 実装・QA

## 実装

HTMLとGame006固有6file、対象unitだけを変更。円弧、42×70矩形、最初3台の旧配置、10台後の禁断×2を維持した。以降は同じ障害車を共有する2つの到達可能な枠を角度前に指定。安全86×118、挑戦56×90、禁断時は両方50×82。挑戦は×1.4で、指定外の薄い枠は対象外と表示する。

新入力による1回のブレーキは240msの等減速。現在の曲率に沿った有限距離で止まる。未使用時は旧速度・円弧・衝突・終点を維持した。角度／強さの決定は押しっぱなしや同時入力から制動へ持越さない。ポーズ・非表示時はheld入力を解放する。

ニアミスは回転矩形間の点と線分の最小距離6px以内。成功時だけ1障害物1回、1駐車最大20点。接触／枠外に追加点はない。精度・連続点×禁断2×挑戦1.4を1回計算し、ノーブレーキ成功に10%加算する。停止位置に精度grade、余裕px、補助点を短く表示する。失敗は衝突／角度／手前／行き過ぎ／指定外から実際の形状・走行距離で分類する。

旧`best`は読み取り表示だけで残し、新`best-rules-v2`へ分離保存する。HUDとResultはV2を明記。Game006専用の説明と3段階の実練習（角度→強さ、過大Powerから制動、枠指定）を作り、すぐ遊ぶ／説明／練習から自由に選べる。練習は同じParkingRunをstartPracticeでresetして専用配置へ切り替え、mainの練習状態で本番BEST・CREDIT・RUNイベントから隔離する。既存WebP3種を再利用し、素材生成・共有コードの変更はない。

端末内400件に`slot_choice`／`brake`／`near_miss`／`park`／`failure`を操作／駐車単位で記録し、rulesVersion、指定、制動、精度、余裕、補助点、原因を付ける。外部送信・新しいJev SDK・本番広告を追加していない。

## 検証と原本

基準commit `5b2dff83fe9196de82eaa7d8b0f15b35d7ff4a34`。独立実装レビューは別担当へ委任し、その判定を実装者の自評と分ける。

- `npx vitest run tests/unit/game006*.test.ts`: **18件PASS**。[実ログ](unit-compat-final.log)。旧モデルを当該commitからそのまま保存し、5つの実入力系列と不均一dtで未制動のpose／time／phase／outcomeがbit単位で一致。初回の等価式の厳密比較は1e-14の差で失敗し、演算順の違うテスト期待値だけ許容比較へ直した原本[unit-second.log](unit-second.log)を保持。
- 全体TypeScriptは他担当の作業途中のエラーも含む初回ログを保持。後の[check-current.log](check-current.log)は成功。最新[check-final.log](check-final.log)は全体としてFAIL（Game010の作業途中2診断のみ、Game006診断0）。最終統合check／buildはMainが改めて記録する。
- 固定したsnapshotの通常キー／タップで、3実練習と5台（3導入、挑戦、制動による安全駐車）、選択中凍結、入力保持／重複、pause、resize、result、BEST／mute再読込を確認。実行後hashと照合する。[collector](probe.mjs)。DEV readonly geometry/gaugeは入力時刻選択の観測だけに使い、モデル・時計・得点を変えていない。
- 最初の隔離サーバーは共有Vitecacheの504とソフトウェアWebGLの低速により失敗した。[native-first](QA/native-first/report.json)。cacheDirを隔離し、headlessは`--disable-webgl`でPhaser AUTOのCanvas経路を使った。製品のAUTOは変更せず、実機FPSを合格と扱わない。
- 次の[PC／320／横](QA/native-second/report.json)は全ケースPASS。phone練習2ではcollectorの25ms固定leadで制動が遅れ、258.54px停止／240px枠で失敗した。実際のnative tap遅延からleadを更新するcollectorだけを修正し、原本を保持。

最新[phone再検証](QA/native-phone-retest/report.json)は全PASS、4画面のゲーム操作証拠が揃った。その後、実画像から成功popupと枠ラベルの重なり、非接続CREDITのResult表示、LOT表示の更新漏れを修正。モデル・入力・配置・得点は変更せず、[新phone全ケース](QA/visual-phone-final/report.json)と[新PC／320／横の実成功・Result](QA/visual-limited-final/report.json)を撮り直し、全PASS/source hash不変を確認した。

[最終境界](QA/boundaries-final/report.json)はPC／phone／320／横＋保存拒否の5ケースPASS。通常ヘッダーSpaceでゲームを動かさないこと、非表示だけでblurが来ない明示fixtureでheld入力を消すこと、凍結・新入力復帰、旧BEST12345の保持、新V2の分離、retry/title/portal href、CREDIT非表示を検証。document.hidden／保存拒否は明示fixtureであり、人間の実機操作とは別に記録した。人間の試遊・実機音・FPSは[未実施](HUMAN_PLAYTEST.md)。公開／main／配信の状態はMainの統合報告を参照し、このworkerはcommitも公開も行わない。

独立担当の実PC Resultから、外部BEST／Result BESTは更新済みなのにstage内BESTが古いままという表示不具合を確認し、BEST保存後に最新snapshotを再描画するよう修正した。また途中中断したRUNと単独score／duration記録にrulesVersionがなかったため、run_start／retry／quit／quit-run_end／score／run_durationへ2を付けた。mainのみ変更、物理・入力・採点・Scene・モデルは不変。新main hash `772c870234d26fcb9601c7983f65c6a3ed2bf0109f1a22e559920529fa3e700c` で独立担当が限定再検証を完了した。

その2点の限定修正後の [全体TypeScript](check-independent-fixes.log) はPASS。新しい物理変更がないため18モデルテストの反復は省略し、変更したResult表示／生命周期記録の通常入力再検証を独立担当へ委ねた。最終統合buildはMain担当。

独立seven_towerの最終通常入力確認はPC／phoneともPASS、browser終了／hash一致。PCは実11台と禁断×2／挑戦×1.4を検証し、GREAT472点=150×2×1.4+42+10、終端BEST4297のHUD／Result一致。phoneはBEST470のHUD／Result／保存一致、制動16frame／244msで移動量3.67→0.02px、run_start／retry／quit／quit-run_end／score／run_durationの全V2記録を確認。Visual **88/100（F14/H13）**、Game Feel技術PASS。人間試遊ではない。[独立報告](INDEPENDENT_REVIEW.md)に詳細を残す。
