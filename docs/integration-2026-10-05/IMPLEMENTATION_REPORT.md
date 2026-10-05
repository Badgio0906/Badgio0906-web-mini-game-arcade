# 2026-10-05 統合改修・公開報告

依頼の正本は [REQUEST.txt](REQUEST.txt)、[範囲と公開承認](SCOPE.md)。前タスクで018公開と012〜014改名は完了済み。今回は015を距離判断と連続降下へ改訂し、018の少年と回転表示、全19本の任意説明／練習、タグ、端末内記録、019を追加した。AdSenseは独立した [PR #1](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/1) のroot HTML 2行だけ。

## 実装

- [015改訂03](../game015/revision-03/IMPLEMENTATION_REPORT.md)：安全な2.1〜5.8mの足場と10.6〜10.8mの深いクッション経路。下ホールドで途中の普通床を通過し、落下距離を保つ。トゲ・衝撃・上端死亡と段階的スクロールを維持。6段階の独立練習と9m／12mのリスク表示。王冠・白ひげ・紫衣装・赤マントの王様を保持。
- [018改修](../game018/revision01/IMPLEMENTATION_REPORT.md)：茶髪・赤Tシャツ・青い短パンの横向き少年、裸足で靴を飛ばす蹴り、足首拡大、結果ポーズ。回転は実物理の向きと揃え、同じ絶対強度で左右の距離が同じことを説明。5靴・得点・既存保存を保持。
- [019仕様](../game019/IMPLEMENTATION_SPEC.md)：方向3択と小／中／大、約1／5／9mの固定ジャンプ。苔・崩れ・狭い足場・天井、転落から復帰、100m海／鳥、空の現在と次の風、200m宇宙。run内の海岸床は保存checkpointではなく、retryは底から。オリジナル蛙9状態。
- [開始導線](../start-choices/IMPLEMENTATION_REPORT.md)：初回でも「すぐ遊ぶ／説明を見る／練習する」。スキップで完了保存を偽造しない。旧3本は隔離したshell補助練習と元の説明を保持。013の強制helpはgame_manager.gdcだけ差替え、他82resourceとengine保持。
- [データ](../data/JEV_PREPARATION.md)：安定タグとカード4件、19profiles、schema、designnotesと明示的synthetic fixture。端末内400件保存、JSON export、ゲーム／タグ／設計難度別集計。欠測はnull、legacyはshell-only。外部Jev呼出と自動判定は追加しない。

## 検証と修正

TypeScript・build成功。旧Godot source／distの各42file監査、意図しない差分0：[source](QA/legacy-source-audit.json)／[dist](QA/legacy-dist-audit.json)。最終unit **284/284、28files PASS**：[ログ](QA/final-unit.log)。共通開始QAは78distinct cases最終PASS、初回75PASS／3harness失敗と修正後6対象PASSを保存：[summary](../start-choices/QA/COMMON_CHOICES_SUMMARY.json)。013は新規初回START→本番をPC／mobile横画面2PASS。

015実入力4profiles PASS：[native-final](../game015/revision-03/QA/native-final/report.json)。018独立実操作4profilesと固定SPIN表示・kick・flight・result・BESTイベントPASS：[独立QA](../game019/QA/independent-native/report.json)。019 PC／390／320は通常入力で独立練習、転落復帰、100mと200m、BEST／retry PASS。横画面のstatus要素によるtap遮断、続くgridの縦過大を検出し、canvas絶対配置と固定した操作rowで修正。4profilesの全練習・画面境界を実入力で再検証し、独立した横画面の100m／200m再到達もPASS：[最終QA](../game019/QA/independent-final/report.json)。初回失敗と中間のviewport FAILを保持する。

独立Visual／Feel／ソース指摘は [INDEPENDENT_REVIEW](INDEPENDENT_REVIEW.md)、[019 Visual](../game019/VISUAL_REVIEW.md)、[019 Feel](../game019/GAME_FEEL_REVIEW.md)。Visualは01583/F13/H13、01886/F13/H13、01981/F12/H12。小画面での蛙の小ささは評価上限として保持。スキップ／練習／BEST／計測の実装差分、説明方向、SPIN文字見切れ、restartとpage_exit集計を修正した。自動予測を使う入力は読み取り専用で、位置・runclockを強制変更していない。

本番buildのroot／subpath×PC／phone、全19route・各19サムネイル・76タグ・開始3択・端末JSON exportも4profiles PASS：[production](QA/production/report.json)。診断用UIが本番に混入しないこと、019実入力と画面境界を確認。初回の折り畳みdownload harness失敗を保持し、detailsを開く修正後に再実行した。

## 公開

A/B統合は [PR #2](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/2) でmainへマージ。release `c7b0ffdbfbc94cb8bc771b162f8cbb375e05c30b`、[Pages run37329630773](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37329630773) のunit／build／deploy成功。公開HTML・JS・CSS・フォント・015/018/019画像・013pckの27fileがlocal production buildとSHA256一致：[asset audit](QA/public-ab/asset-hashes.json)。Cは [独立PR #1](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/1)、専用task／worktree／commit `0286e7d712f40b75a3e978cff525bc21d976a1ce`でroot headの指定2行だけ。最終runtime release `d6f6f6b9b193562a933e1cc728b739e770c478ed`、[Pages run37330051749](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37330051749) のunit284／build／deploy成功。正式URL **https://game100garage.com/** に全19本を公開（2026-10-06日本時間）。

公開PC／phoneは全19route・19画像・76タグ・開始3択・端末JSON export・019実操作・診断UI不在、所有確認scriptのhead内1回／async／client／crossoriginをPASS：[最終summary](QA/public-final/FINAL_SUMMARY.json)。初回PCのgame004.htmlが一度HTTP503となった原本を残し、phoneとPC全19route再実行、単独HTTP200を確認。HTML／JS／CSS／フォント／新画像／013pckの27fileは最終buildと全SHA256一致：[hashes](QA/public-final/asset-hashes.json)。C以外のruntimeはA/Bと同一。遅れて起動した重複Pages runは既存concurrencyによりcancelされた。

PRをCodex chatへ添付するtoolは応答が得られず終了したため、上記のGitHub URLを引き継ぎの正本とする。AdSenseの外部loader実配信はCloudのnetwork policy許可対象外なので、HTML配置とinert loaderによるlayout確認を区別する。コード設置は所有確認／審査承認の成立を示さない。

## 人間評価と継承

[019人間テスト](../game019/HUMAN_PLAYTEST.md)は未実施。面白さ、初見の理解、実機の親指同時操作、音、FPS、酔いは自動入力と静止画から合格にしない。320px練習の蛙／足場は小さく、初見の判読性を試遊で確認する。CREDIT OFF、Reward開発stub、旧保存namespaceと旧Godotの音／engineは保持。

公開file一致再実行：`python tests/integration-2026-10-05/public-hashes.py <report-directory>`。公開PC／phone：`ARCADE_BASES=https://game100garage.com/ ARCADE_ADS=1 node tests/integration-2026-10-05/production.mjs`（Google loaderはinert stub）。

root/subpath再実行：[production.mjs](../../tests/integration-2026-10-05/production.mjs)。019実操作：[review.mjs](../../tests/game019/review.mjs)。015：[probe-risk.mjs](../../tests/game015/probe-risk.mjs)。タグ／profile再出力：`node tools/export-jev-data.mjs`。Jev実ユーザー統計は生成せず、synthetic provenanceを保持する。
