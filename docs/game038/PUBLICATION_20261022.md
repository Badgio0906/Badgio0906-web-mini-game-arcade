# Game036 / Game038 同時公開 — 2026-10-22 JST

ユーザーが「game038とともにpages公開を行ってください。明示的に公開を指示します」と承認。前回提示したWebhook/billingの403による費用UNKNOWNを含む今回の公開承認として再開した。PUBLIC・標準ubuntu-latest・既存Pagesを使用し、新規有料サービス、API呼出、プラン/予算/runner/workflow設定変更は行わない。

## 対象とGit安全性

- 起点main `ac5304fa81361f592942c472c7fa04f668d3b4bc`。開始時ls-remote/fetch/origin/mainが一致。
- PR16「もちっと連鎖」受領 `9560283ce9b6a39f30263cbdbbdd625c90dd2441`、保全済みローカル統合版 `6f43491c5becc9db5489ed50ec22e867d2d0b64f`。
- PR17「6万分の1」受領 `45f7f1a7779e07cf70e12cb42ea9687d88b05662`。038を正式ID、releaseOrder38とする。037は既存PR9候補のまま不採用。
- `/workspace/arcade-game036-release` の `release/game036-game038-pages-20261022` に通常mergeで両履歴を集約。元branch/commit/他worktreeを保持。reset/clean/forceなし。
- 既存PR17を両作品の公開統合PRとして更新し、通常mergeを1回行う。PR16の原作者commitも履歴に含み、同じmain更新で両作品を公開する。PR11/13/9/8は対象外。
- [PR17・CI・公開結果](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/17)。この報告を含むcommitは公開前の候補で、実際のmerge SHAとPages結果は同PRの公開結果記録を照合する。

## 実装の最終方針

掲載28本（完成9/試遊19）。Game036は表示027、Game038は表示028。旧026本の表示番号/route/公開状態、削除4・保留031・retired4を保持。カタログ・meta/fallback・Vite導出・実画面サムネイル・version・Jevオフラインmetadataを追加。Vite設定自体は変更しない。

036の保存/入力修正・個人BESTは[前工程の固定検証](../game036/PUBLICATION_PREPARATION_20261021.md)。036のモデル/得点/操作、原作者038のモデル/確率/難度は変更しない。038は非競争作品として全体ランキングや空BEST枠を新設せず、最高順位と活動履歴は既存ゲーム画面・同じ保存キーに保持。両作品とも外部解析pending、Worker/D1への登録やdeployを行わない。

038の公開前修正：正規の終了直前（最後のひと声待ち）のsnapshotを再読込で回復可能にし、不正な履歴reason/描画フィールドや不整合なpendingを受理しない。REDを保存し、正規25seedの全月/全決断のJSON復元→継続が一致することを検証。修正者とレビュー担当を[コードレビュー](INDEPENDENT_CODE_REVIEW.md)で区別。

独立ブラウザ点検で844×390のタイトルdialogがy26.97–363.03、解析barがy326–390、帰還リンク下20pxが隠れることを確認。横向き用dialogだけをheader52px/解析bar64pxの間へ制約し、最大高を258px、中央を189pxとした。内容はdialog内scrollで到達可能、解析設定や広告同意の意味は変更しない。初回画像と結果は`QA/independent-review/`に保持。

## 検証と証拠

型検査PASS、全単体 **1,013件/106files PASS**、offline Jev25 PASS、既存Pagesと同じrecord endpointによるbuild PASS。compiled036 **12/12**、038 **4/4**（4幅すべて自然終端前の再読込→結果1回）、portal **73項目**、公開smoke **8ケース**（ゲーム4＋lazy画像待ち修正後portal4）を確認。共有navigationの非module警告と既存500kB超chunk警告は残存、警告基準を緩和しない。

最終集計は `QA/publication-20261022/`、compiled通常入力は `QA/compiled-20261022/`、独立Visual/Feelは [INDEPENDENT_VISUAL_REVIEW](INDEPENDENT_VISUAL_REVIEW.md) を参照。最終 **82/100・F12/H13 PASS**、4幅の設定実tapと12帰還を確認。036は前工程の84/100・F12/H13でソースを保持。root実行の初回4件失敗は公開数/予約ID/非競争038を反映していない旧期待値によるもの（製品バグをテストの緩和で隠さず、旧identity/保存の検証を維持して更新）。保存REDはレビュー観測記録を保持（初回stdout raw未保存の制限を明記）し、原作者証拠も保持。公開smoke collectorの初回portal4件は、画面外のlazy画像をscroll/decode待ちせず判定したため失敗。collectorだけを実際のscroll→decode待ちへ修正し、該当4件を再検証。製品側でlazy loadを解除する変更は行わない。

外部通信をblock/mockした隔離contextで通常入力のみを使う。モデル/得点/時間を注入しない。本番Telemetry・広告クリック・記録POSTなし。Jevはoffline契約テストのみ、課金APIはNOT_CALLED。

## 人間による確認・制限

実iPhone Safari / Android / Windows実GPU、聴感、ゲームの面白さ・長さ・038の表現の好みは未評価。公開や自動テスト成功を作者の完成宣言へ読み替えず、両作品を試遊版に保つ。[038試遊票](HUMAN_PLAYTEST.md)、[036試遊票](../game036/HUMAN_PLAYTEST.md)。AdSenseの再申請・設定操作は行わない。

## 公開検証

既存Pagesのbuild/deploy成功後にトップ28本・027/028・両作品の通常起動/帰還・対応JS/CSS/WebPの配信hash・ads/privacy・旧公開/削除/保留/retired経路を確認する。結果をPR17へ記録し、ローカル証拠も保存する。公開前のBEFORE.jsonでは両作品404を確認済み。
