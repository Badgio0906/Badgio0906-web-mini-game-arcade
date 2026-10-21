# Game038 独立コードレビューと限定保存修正

2026-10-21 UTC。対象はPR17 `45f7f1a7779e07cf70e12cb42ea9687d88b05662` と、それを通常mergeした `/workspace/arcade-game036-release` の統合候補。model/main/save、既存13 unit、仕様、HANDOFFを実装者と別に読み取った。その後rootから **save.ts と新規 game038-save.test.ts の修正所有**を委任された。以下の初期findingは独立レビューだが、保存修正の実装者・対象テスト実行者もこのreviewerである。**修正後の最終独立検証はrootが別途担当する。**

ネット/API/paid API・Git書込み・push/merge/deploy・ブラウザは実行していない。Jev APIは **NOT_CALLED**。Game036や他作品、main.ts/model.ts、保存キー/形式は本reviewerが変更していない。以前のPR14/15/13の費用了承を今回へ流用していない。

## 初回finding R038-SAVE-01：最後のひと声待ちで再読込すると結果が失われる

model.finish()は `ended={reason,month}` と `pending={kind:'end',id:'end',...}` を同時に作る。mainはその状態をpersistし、最後のひと声を待つ。回数/最高順位/historyへの確定は、その決断後のfinishCareerまで行わない。

旧validCareerは `ended!==null` を一律拒否した。この正規の終端画面で再読込するとsnapshot=null / reported=trueとなり、キャリアを終えたのにhistoryへ未登録のまま消える。新テストは自然モデルを最後のひと声待ちまで進め、そのJSONをvalidateする条件でsnapshot=nullを観測した。

初期独立判断：PRODUCT_BUG / CODEX_ACTION_REQUIRED=true / NEXT_EVIDENCE=AUTOMATED_TEST。保存時点で最後の決断を終えていないため、単に「終了済みsnapshotを捨てる」という以前のテストだけでは足りない。

## 初回finding R038-SAVE-02：壊れた履歴行が受理され履歴表示が失敗する

旧validSummaryはreason/agency/job/最終登録者/同接/monetized/peer内部等を検証していなかった。reason='unknown'やundefinedでもhistoryへ残り、main.historyの `esc(END_LABEL[s.reason])` がundefined.replaceを呼んで失敗する経路がある。保存fixtureで不正reason等9行と正常1行を渡すと、旧validatorは全10行を受理した。これは破損データの回復経路の問題であり、正常プレイから必ず破損が生成されるという再現ではない。

初期独立判断：PRODUCT_BUG / CODEX_ACTION_REQUIRED=true / NEXT_EVIDENCE=AUTOMATED_TEST。summaryを使う表示処理が必要とする値を検証し、不正行だけを除外して他のmetadata/正常historyを維持する必要がある。

## 初回finding R038-SAVE-03：不正pendingと表示toneを継続状態として受理する

旧validCareerはpending.kindの大枠とstring長だけを確認し、unknown event ID、debutの選択肢数不足、存在しないquestion ID、retireKindとretire決断の不一致を受理した。log.toneも検証せず、mainのclass属性に挿入される値を任意文字列として受理した。

新しい不正データテストで旧validatorの受理を確認した。known event/question/retireのID・選択肢数、toneの固定enumを検証する。同じrules1の正規pendingを再構築・抽選し直すことはせず、そのまま復帰させる。

初期独立判断：PRODUCT_BUG / CODEX_ACTION_REQUIRED=true / NEXT_EVIDENCE=AUTOMATED_TEST。外部からの攻撃経路や実browser実行を確認したとは主張せず、保存境界の不正受理として扱う。

## 実装した限定修正

変更ファイルは `src/games/game038/save.ts` と `tests/unit/game038-save.test.ts` のみ。

- 最後のひと声待ちの正規終端だけを復帰可能にした。既知のended.reason、ended.month===career.month、pending.kind=end/id=end、選択肢1、farewell=null、retireKind=nullが必要。model.finishの実値と照合した。pendingを消した確定後のended状態やpractice-endは復帰しない。
- mainの既存bootは復帰snapshotをpause画面へ出し、resumeがpendingを見てopenDecisionを呼ぶ。このため終端復帰のためのmain変更は不要。選択後のruns/BEST/history確定経路も既存のfinishCareerを利用する。
- summaryのreason/agency/job、表示に必要な数値/boolean、peer3人と内部値、noteの月、日時を検証。不正historyだけをfilterし、最高順位・回数・正常履歴は保持する。
- pendingは既知EVENTSのIDと選択肢数、QUESTIONSの月/IDと1選択肢、retireの種別と3選択肢を検証。表示toneは固定enumとした。
- tonesの疎配列がJSON化でnullになるのは正規保存なので許容し、そのまま保持する。mainは元からnullish値をneutral表示する。
- 保存キー `web-mini-arcade:v1:game038:state`、schema/rules_version、RNG、乱数抽選、得点/順位、進行・入力・Telemetryは変更していない。

## RED→GREENと実施範囲

修正前に `vitest run tests/unit/game038-save.test.ts` を実行。終端復帰・履歴filter・不正pendingの3問題がRED。4本目には疎tonesのundefinedとJSON nullを直接比較する期待値の不備も出たため、両辺を正規のJSON状態として比較するよう訂正した。終端テスト側にも同じ比較漏れが1箇所あり、修正途中で16PASS/1FAILとなったが、これは保存が拒否された失敗ではなくundefined/nullのテスト基盤差である。正常nullを拒否する製品変更は行っていない。

**証拠保存の制約：初回REDのstdout原本はファイルへ保存していない（raw未保存）。上のレビュー表・記述がその実行時の観測記録であり、完全なraw logが残っているとは主張しない。** ツール返却は出力量制限で省略もあるため、それを完全なstdout原本として新規logへ再構成しない。root側の `/workspace/audits/game038-save-root-probe.log` は編集途中の別実行であり、初回製品REDの原本と混同しない。証拠作成のためのsource巻戻しや再実行は行っていない。

最終実行：

| 検証 | 結果 |
|---|---|
| `node_modules/.bin/vitest run tests/unit/game038-save.test.ts tests/unit/game038-model.test.ts` | **17/17 PASS**（既存モデル13＋新規保存4） |
| `node_modules/.bin/tsc --noEmit` | **PASS** |
| 25seed、各月/各決断でJSON→validate→復元stateから独立継続 | **PASS**。原stateと同じ選択/autoFocus/stepを進め、全state/RNG結果をJSON正規化して照合。終端pendingも含む |
| 新規history fixture | 正常1行を保持、不正9行を除外 |
| 新規pending/log fixture | unknown/inconsistent ID・選択肢数・tone・終端月不一致を拒否 |

上記は修正者によるローカル検証。全unit/build、compiled browser、実端末、最終独立再レビューはroot側の証拠として別に残す。

## モデル・入力・結果の読み取りとUNKNOWN

rankは6万人の仮定の分布を使い、実統計とは表示上区別される。monthはpending/ended中に進まず、144ヶ月で終端する。通常と練習はpractice旗で分かれ、練習は固定6ヶ月、保存・history・本番Telemetryを除外する。自由入力は描画時にescapeされ、文字列を実行する処理は見当たらない。今回の保存箇所以外に、確定した重大な通常モデル/入力不具合は確認していない。

mainはplay中のblur/hiddenや大きいframe間隔でpauseする一方、決断中のautoTimer、結果/セットアップへ持ち越す長いEnter/Space、450ms guardが切れた後の旧gesture、速度停止と再デビュー時の状態、clip/同意/privacy/実音はread-onlyのソース調査だけでは受入合格にしない。実browserの通常入力、保存復帰、自然終端→最後のひと声→結果1回、reload後history、wrong history fixtureでの画面表示をroot側で確認する。

保存の範囲・時点として、入力欄でまだ送信していないひとこと自体のdraftは保存されない。新規履歴検証は自然生成の完了summaryを想定し、過去の正規データを落とさないことをrootが再確認する。人間の楽しさ・表現・Safari/物理端末、公開成功の判定をこのレビューで代行していない。

## 保存修正固定時のSHA256

| file | SHA256 |
|---|---|
| src/games/game038/model.ts | `1ac2b238876480ba514bd56a725f5fe3a91178963a1a07967d6e1aa2dc15f96c` |
| src/games/game038/main.ts（本reviewerは未編集） | `73838911f69d85c8b47bfc9009e076bac793e757718cd7e8bb5d041a266a5dde` |
| src/games/game038/save.ts | `f426dfa76a5f07b432223f093d46153cd8782bf6559759d18aa245cd9f5de8ab` |
| tests/unit/game038-save.test.ts | `54439129717ab1ba5a526428c5f9e2b611699e85dda85d015311dcd3df9aed9b` |
| tests/unit/game038-model.test.ts | `a11d136554114971dc9f4a56468fad665e24f93607bb719ed6158ff612f5a32b` |
