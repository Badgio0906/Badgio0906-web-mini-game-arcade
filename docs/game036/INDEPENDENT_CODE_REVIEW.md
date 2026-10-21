# Game036 独立コードレビュー

2026-10-21 UTC。実装者と別のreviewerが `src/games/game036/{model,save,main}.ts`、`tests/unit/game036-model.test.ts`、仕様/manifest/報告を読み取った。対象はPR16 HEAD9560283を基にした `/workspace/arcade-game036-release` の統合準備候補。共有登録/公開はrootの所有。製品・Git・ブラウザ・API・公開操作は行っていない。有料Jev APIを含むAPIは禁止のため呼ばず、以下は独立判断である。以前のPR14/15/13の費用了承を今回へ流用していない。

**最新判定：保存2件とkeyboard入力1件は後述の限定修正・独立再probeで修正を確認した。今回のコードレビューに未解決の重大修正要求はない。通常モデルの連鎖/previewにも重大な不整合は確認されない。** 初回の修正前証拠とhashを以下に保全する。人間の面白さ・実機操作・音・公開の合格とは別のコードレビューである。

## R036-SAVE-01：不正snapshot復旧時に妥当なBESTまで消える

`save.ts:22` はvalidateSaveがnullを返すとblankSaveへ戻す。snapshotだけが不正でも、同game/rulesの妥当なbest/bestChain/runsを破棄する。main起動のtitle→abandon→store.writeでそのblankを永続化するため、既存記録の消失となる。仕様は「不整合なsnapshotは破棄」であり、snapshot破損に巻き込んで確認済みBESTを0へ下げる必要はない。

独立pure probe：best4321 / bestChain5と通常createMochiから作ったsnapshotのpiece:nullを保存JSONとしてbackendへ渡す。MochiStore.readの結果はbest0 / bestChain0。通常生成のsnapshotが自然に破損することを再現したわけではないが、破損後の復旧経路の記録喪失は確認した。

独立判断：PRODUCT_BUG、CODEX_ACTION_REQUIRED=true、NEXT_EVIDENCE=AUTOMATED_TEST。validateSaveの厳密拒否は維持し、MochiStoreの復旧で同game/rulesかつ各metadataが妥当な場合だけbest/bestChain/runsを回収し、snapshot/runId破棄・reported=trueへ戻す限定案を推奨。違うgame/rulesや不正数値から値を移入しない。正常な初回不存在・JSON破損・保存拒否は区別する。

## R036-SAVE-02：落下組の相方bounds/盤面衝突を検査しない

`save.ts:17` はpieceのpivot x/y/rot/colorだけを検証する。実際の `pieceCells()` の2セルが盤面内か、既存boardと重なっていないかを検査しないため、不整合snapshotが継続可能として受理される。

独立pure probe：通常stateのpieceを `{x:5,y:12,rot:1,a:0,b:1}` にしたsnapshotはvalidateSaveで受理される。hardDropすると相方がindex78へ書かれ、board.lengthが78→79となる。別probeでpivot位置のboardに既存色を置いた重複pieceも受理される。自然生成の正常pieceでこの状態へ到達すると主張していない。問題は保存データの境界検証である。

独立判断：PRODUCT_BUG、CODEX_ACTION_REQUIRED=true、NEXT_EVIDENCE=AUTOMATED_TEST。drop snapshotはpieceCells両方の範囲・既存board EMPTYを確認する。単にclamp/上書きして継続せず、不整合snapshotを拒否しSAVE-01のmetadata回収へ進める。正常な壁際・回転・床・star・mid-chain roundtripを失わないことも確認する。

## R036-INPUT-01：フォーカスしたpadのEnter/Spaceがhard dropになる

`main.ts` のbindPadは「keyboard activation（detail0 click）で各button固有actionを1回」と意図する。一方document keydownは `.pad` 内buttonを除外せず、Enter/SpaceをpreventDefaultしてhardDropする。左・右・回転buttonをTabでフォーカスした状態でも、そのbuttonの移動/回転として操作できない。通常のcanvas focusでSpaceがhard dropになることとは別の問題。

独立pure probe：実keydown listenerをソースから取り出してTypeScriptをmemory内で変換し、active=true、target.closest(button/.pad)が一致する条件でEnter/Spaceを送った。hardDrop=2、move=0、rotate=0、preventDefault=2となった。実ブラウザ/実機の操作を実行したとは主張しないが、実handlerの分岐は確定している。

独立判断：PRODUCT_BUG、CODEX_ACTION_REQUIRED=true、NEXT_EVIDENCE=AUTOMATED_TEST。pad buttonにフォーカスしたEnter/Spaceはnative button activationへ委ね、既存detail0 clickでそのactionを1回実行する限定案が妥当。canvas focusの通常hard dropとArrowキー等のゲーム操作は維持する。左右/両回転/dropをTab focusしてEnter/Spaceで各1回、pointerの二重発火なし、pause/result画面の入力隔離を検証する。

## 通常モデル・保存・結果で確認したこと

- 6×13の有限board、orthogonal group4以上、hidden rowの通常消去除外、列gravity、triangular chain得点、上限、star対象選択、seed/queueの進行を実装と仕様で照合した。spawn不能だけでoverを発行し、その後stepは止まる。
- 独立probeで30seedの到達可能な通常盤面を進め、計1575配置についてpredictの着地点/resolveAll結果と、hardDrop後のtimed resolutionの最終board/chainを照合し全て一致した。練習も同じモデルを使い、2連鎖到達で完了、失敗なら固定盤面へ戻る。
- 初回probeのdeepStrictEqualは別VM realmのArray prototypeが違うため失敗した。見た目も値も同じ配列に対するテスト基盤上の失敗であり、JSON正規化で比較し直して上記1575件を完了した。これをモデル失敗として数えない。
- pause/help/result/titleへ移るsetPhaseはsoft、drag、hold-repeatとframeの基準時刻を消す。blur/hidden時はpauseし、通常のstepはactive時だけ。0.5秒超のframe停止もpauseする。長時間の不在をまとめて進行させない。
- 保存はsnapshot/seed/timerを複製し、eventsを保存しない。正常な再読込はpause画面から再開する。保存拒否はmemory fallbackを使う。既存12 unitは基本ルールとmid-chain roundtripを含むが、上記不正piece/metadata回収/pad keyboardをカバーしていない。
- 練習はscore0、snapshotなし、Telemetry ignoreEventで記録対象外。通常overはsnapshotを消し、runs/BESTを更新、resultを一度表示する。モデルover後のstep停止とeventsの消費により通常のoverを毎frame重複確定する経路は見当たらない。quitは未完了runをcompleted=falseで終え、BESTを新規確定しない。
- 036のremoteCollectionEnabledはfalse、記録共有は既存session API経由。rootの方針は個人BESTのみ/publicEnabled:falseで、Worker/D1/global比較は未接続。共有登録の完成状態は本固有レビューでは未判定。

## UNKNOWN / 別に判定する事項

実browserのtouch、native button keyboard activation、長押し解除、pointerが結果画面へまたがる操作、450ms結果guard、全4幅のclip/可読性、pause中時計、save拒否・reload・BEST、console/networkは本レビューが実行していない。450msの時間guardは存在するが、全gesture寿命を証明するものではないため、通常/長い押下を跨ぐ入力のbrowser確認を残す。

星のgaugeは閾値へ達すると0に戻し、同じ連鎖中に再充填されてもqueue先頭の同じstar枠へ書く実装。仕様の「32個ごと」が厳密な剰余繰越/複数報酬を意味するか、単一chargeとしてリセットする意図かは資料だけで確定しない。通常進行不能のfindingには数えず、表示/仕様との意味を統合担当が揃える余地として残す。

独立Feel/Visual、人間の「ぼんやり遊べる」「爽快」「もう1回」、物理端末/Safari、聴感/FPS、通常production buildへ036が含まれること、Portal/thumbnail/個人BEST導線は別担当の証拠が必要。元報告のWindows全体4FAILは環境要因という実装者説明であり、本レビュー自身がLinux再検証した合格ではない。過去QAを新統合候補の合格へ読み替えない。

## 初回レビューhash

| file | SHA256 |
|---|---|
| src/games/game036/model.ts | `39b24b3904923df70504258daea1aa1f387a7080a170e3735d671dc6bc4c1ddc` |
| src/games/game036/save.ts | `3db36c36dd25e774c75dcc0dfffd2aaf47f59dbd7de885b99364c384b73f50ba` |
| src/games/game036/main.ts | `5fe35577a0da46e68b42104b7403baaceffdd67343571482e5f3b2ea5a670cba` |
| tests/unit/game036-model.test.ts | `62901c0d4343eaa50778bd8969ac95392d095971725d140f578a1d04aad22a7f` |
| docs/game036/IMPLEMENTATION_SPEC.md | `c8f36a874ab758e4a04bff07dd8828ed518e407d208c0a9ba2ab1c2e09bdf67c` |

## 追補：3件の限定修正と独立再probe

2026-10-21 UTC。rootがsave.ts/main.tsを修正し固定した候補を再読した。製品・テスト・Git変更やbrowser/APIを行わず、前回と同じTSソースをmemory内で変換したpure probeを再実行した。

| finding | 限定変更 | 独立再確認 |
|---|---|---|
| R036-SAVE-01 | validMetadata / recoverRecordsを追加。validateSaveは不正snapshotをnullで拒否し、MochiStore.readが同game/rulesの妥当metadataだけを回収する。 | 前回と同じ不正piece:nullでbest4321 / bestChain5 / runs7を維持、snapshot=null / runId=null / reported=true。game035、rules0、best−1の3条件はblankへ戻る。 |
| R036-SAVE-02 | dropのpieceCells両方が盤面内かつboard EMPTYであることを検査。 | 前回のx5/y12/rot1は拒否され、occupied pivotも拒否。30seedの正常移動/回転snapshotは全て受理。 |
| R036-INPUT-01 | pad button上のEnter/Spaceをboard shortcut処理からreturnし、native button clickへ委ねる。 | 実keydownと実bindPadをmock DOMで実行。5pad×2キーの10件でkeydownはaction/ preventDefaultをせず、detail0 clickは左/右/左回転/右回転/dropの対応actionを各1回。canvas対象のEnter/Spaceは従来どおりhardDrop各1回。 |

上記のkeyboard証拠はnative clickを模したdetail0 callbackのpure検証であり、実ブラウザがそのclickを生成する過程や実機操作の検証ではない。通常browser RUNはrootの担当で進行中。rootから追加2unitのRED→修正後14/14 GREENとcheck成功の報告を受けたが、本reviewerが独自にそのtest suiteを実行した合格とは記載しない。

model.tsは初回hashのままであり、1575配置のpreview/timed結果照合の対象から変わっていないため同じ長いsimulationを繰り返していない。星は単一chargeが32へ到達するとresetする既存ルールを維持し、その意図を仕様へ明記する方針をrootから受け取った。ルール変更を要求したものではなく、前述の仕様意味の曖昧さと区別する。

**独立再判定：3 findingは修正済み。** 未解決の重大コード修正要求はない。通常compiled browser、gestureを跨ぐ結果/再開、実保存互換、初回同意/privacy、Portal導線、独立Visual/Feel、人間実機・聴感、外部費用と公開状態は別の検証・判断として残す。

| 修正後file | SHA256 |
|---|---|
| src/games/game036/model.ts | `39b24b3904923df70504258daea1aa1f387a7080a170e3735d671dc6bc4c1ddc` |
| src/games/game036/save.ts | `12bf96addc8cc91584d59282bbb6a8d75450dc6dc12f41b73329ddd82c382f70` |
| src/games/game036/main.ts | `e786ef8bc242b07cdf8e379cb474d4934249348c2058525e6ceccfcc7cc31b32` |
| tests/unit/game036-model.test.ts | `fff1519cbfaab00242153b72c218a2f9d8bfff64af8e92ded4f8a4c656e0f59d` |
