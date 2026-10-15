# 第3工程 005／006 独立コード／要求レビュー

2026-10-15 UTC。desk_rain担当（005/006の実装には不参加）。今回の005/006実装担当のJev回答や自己評価を読まず、ユーザー指示の31～36章、対象ソース、差分、単体を照合した。009/017は自己実装のため本書の独立評価に含めない。

**コードレビューでは005/006の重大な欠落は検出しなかった。** 本書は固定候補のブラウザ入力・実画像・Visual・Feel・人間試遊の合格ではない。

| 対象 | 独立に確認した内容 | 実操作で確認する事項 |
|---|---|---|
| 005 | 左右判定と表示が同じruleから導出される。8正解ごとに従来のrule変更0.95秒。正解でcombo、誤答／timeoutはcomboとfeverGaugeをリセットして3ミスで終了。速さ0～50＋基本100にcombo倍率、有限6秒のfever×2、dispatch短縮と判断時間短縮。fever中に正解しても延長せず、終了後再び8個を必要とする。現在parcelの期限はfeverが途中終了しても切替なし。誤答後0.8秒で復帰、終局一度。新版 `best-rules-v2`、旧bestは読取表示のみ。 | 8連続→fever→通常復帰→再目標、rule変更時の入力防止と表示、回復可能な2ミス／3回目終局、狭画面のstatus増加分。 |
| 006 | `correct()`はdriving・実移動後・非制動・RUN未使用に限定。現在poseを起点に曲率符号を反転（直進は小曲率）、位置とheadingの不連続なし。以後の予測線・移動・衝突sweep・有限brake・最終矩形包含・精度採点が同じpiecewise pathを使う。台数更新では軌道起点だけをリセットしcorrectionUsedは保持、startでのみ再使用可。切り返し自体の加点はなく、精度・指定枠・ノーブレーキ・実near missのみを採点。Cキーと区別された専用ボタン。新キー `best-rules-v3`、旧v1/v2は読取表示のみ。 | 通常0度無切返し駐車と、少し誤った角度の途中Cによる救済、C→brake、2台目の使用済み表示、練習4段階の実到達、スマホ44px／誤認／pause復帰fresh gesture。 |

独立実行: `npx vitest run tests/unit/game005.test.ts tests/unit/game005-fever.test.ts tests/unit/sort-localization.test.ts tests/unit/game006.test.ts tests/unit/game006-revision.test.ts tests/unit/game006-correction.test.ts tests/unit/game006-unbraked-compat.test.ts` 7ファイル34件PASS。

006は同じ入力で旧無制動の軌道・結果の互換、切り返しによる誤角度救済／切返し後の有限brake／2台目再使用不可／縁石衝突を含む。005はcomboと速さの点差、有限feverと再充填、境界誤答後のrule二重切替防止、fever終了時のparcel期限不変を含む。

本人の「逆転が気持ちよい」「繰り返したくなる」評価と、物理スマホ・実機聴感は未実施。通常ブラウザによる結果は固定版QAの証拠へ追記する。

## 固定c057での独立通常ブラウザ検証

`/workspace/arcade-stage3` HEAD `c057d2f06d931911011a6f202c131140634794b7`、DEV4173で実行。005/006 sourceの実SHAを前後比較し一致、固定treeの対象source／HTML差分0。全browser/contextをcloseし、次の検証担当へ枠を返却済み。

005は1440×900、390×844、320×720、844×390の全4画面で、native click/tapの8連続正解→fever→pause/resume→回復可能な誤答2回→3回目終局→BEST reloadを確認。006は同4画面でSpaceの角度／power確定→新しいCで一度切返し→pause/resume→実際の駐車成功→次の自然失敗→BEST reloadを確認。専用タッチボタンによる006切返しは初回採取で使用済み表示まで確認、成功駐車4画面は通常keyboard Cによる技術証拠であり、物理スマホの親指操作を評価したものではない。

[統合証拠](QA/STAGE3_005_006_COMBINED.json) は8case最終PASS、記録した成功assertion475、pageerror0／書込み要求0。主記録 [03 REPORT](QA/stage3-independent-005-006-03/REPORT.json) はdesktop006の狭すぎる角度poll窓timeoutを1件保持。限定再検証 [desktop006 REPORT](QA/stage3-independent-006-desktop-retest/REPORT.json) 53check合格で実駐車からreloadまで完了。初回の駆動中screenshot遅延を起こした01、collector転記を修正する前に中断した02も保存し、成功扱いに合算しない。

実画像をdesktop／005390fever／006320pauseで確認し、005条件と左右ボタン、fever/lives、006の切返し状態／操作は判読可能。一方、006の静的上部『BEST V2』とstage/result『V3』の不一致を観測した。Root working HTMLのみV3へ限定修正済み、固定候補の実行中変更はなし。Jev Dを記録し、独立判断はcontent/spec・追加調査true・重大release risk false。修正後の公開画像は別途再確認が必要。Visual数値gateと本人Feelは本報告では採点していない。


## a323での限定追補

005CSSの重なり／共有幅と006静的BEST V3は[最終候補再検証](STAGE3_005_006_FINAL_RETEST.md)へ記録。通常入力22check、source前後SHA一致、native Cによる追加desktop駐車も成功。005CSSと4作best_updateの限定修正には当レビュアーが後から参加しているため、当該修正の独立Visual判定はArt Director、events独立レビューはMainへ渡した。
