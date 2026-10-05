# Game015 改訂02 — 独立Game Feel Review

2026-10-05 日本時間。**PASS（通常入力での遊びの成立・表示・結果の確認範囲）。未解決のFeel blockerなし。** 中央固定でDROPするだけの遊びは危険になり、次の安全な着地点へ左右移動し、停止すると天井に追いつかれるループを実行した。人間の「面白い」「気持ちいい」や実機の指／音／FPSを合格扱いしない。

## 方法と固定source

Reviewerは実装者と別。[改訂仕様](IMPLEMENTATION_SPEC.md)、[開発規則](../../GAME_DEVELOPMENT_RULES.md)、[review protocol](../../ten-game/reviews/REVIEW_PROTOCOL.md)を参照。Rootの[15ファイルsource freeze](QA/SOURCE_FREEZE.json)は `44cadb4b87b2a0e94e58269bbc1c4b2632336d16cb22b4e923b94ff49371a50a`。

独立実行は2026-10-05 **22:07:48〜22:09:43 日本時間**、PC1920×1080 keyboard/clickとphone390×844 native touch、各新規contextで初回説明→4段階練習から進行。[script](feel-native.mjs)、[report](review-artifacts/feel/report.json)、[log](review-artifacts/feel-run.log)、[全src/public＋game015.htmlのfreeze](review-artifacts/feel/SOURCE_FREEZE.json)を保存。Reviewerの全tree hashは前後 `3bc45654281b29ea292e7fe13166102140d646900c12549f1e4bc9dc58f15dcd` 一致、変更ファイル0。Rootのhashと異なるのは範囲と集計方式が異なるため。Runtime/publicを編集せず、モデル・player・phase・clock・score・保存値の注入0。ブラウザとcontextは全て閉じた。

Readonly snapshotを次の入力の計画に用いた安全路trialはoracle操作であり、人間の認知・反射・平均プレイ時間の測定ではない。小さい／横長viewportはRootの[native-final4profile](QA/native-final/report.json)と画像を別証拠として参照し、独立Reviewer自身のphone実機試験と混同しない。

## 実入力の結果

|trial|PC|phone|確認できた因果|
|---|---|---|---|
|初回練習|DROP→右着地→左着地→ghostスクロール死亡|同じ4段階をtouchで完了|中央トゲを避ける方向入力、DROP、停止時の追走を別々に学べる|
|本番で無入力|2.842秒、0m、scroll終了|2.841秒、0m、scroll終了|同じ足場に留まり続けると天井に追いつかれる|
|中央維持でDROP|0.955秒、4.1m、spike終了|0.997秒、4.1m、spike終了|中央固定の安全攻略は今回の2courseで成立しない|
|安全路を通常入力で選び続ける|85.24m／24.27秒、速度23.34px/s|85.27m／26.94秒、速度23.93px/s|左右中央が変わる着地点を操作して到達できる|
|85mtrial後、pause→resume→無入力|89.0m／31.61秒、scroll終了|88.6m／34.02秒、scroll終了|いったん深く降りても停止すれば追いつかれる|
|右を押し続けDROP、ブレーキなし|6.46m／2.078秒、needle終了|8.30m／1.444秒、spike終了|急いで一方向へ落ちるだけでも危険になる|

PC／phoneともpageerror・console error0、pause中300msのsnapshotは完全一致。Retryを押してplayingへ戻るまで壁時計112ms／129msで、この環境では説明や練習を繰り返さず再挑戦できた。入力保持を解除してから次trialへ進め、score等を設定していない。

## 最初の10秒、判断、圧力

タイトルは「上を目指すな。うまく落ちろ。」、下降追走・中央トゲ・左右移動を説明する。初回は本番scoreを進めず、中央トゲ右回避、左回避、待ちすぎによるghost死亡を通常入力で確認した。Reviewerは[PC右着地](review-artifacts/feel/desktop-practice-1.png)、[PC左着地](review-artifacts/feel/desktop-practice-2.png)、[ghost追走](review-artifacts/feel/desktop-practice-scroll.png)を実viewした。

本番の最初のDROPには約2.84秒しかない。これは「止まって考えれば安全」を壊す目的に沿うが、初見の人間にとって十分かは未評価。安全trialは最初からreadonly値を読んで方向を選んでおり、無入力2.84秒を人間の平均初回失敗時間に読み替えない。

PC安全trialの着地点例は128→184→118→76→125.5→76→142→176→133…。Phoneは128→180→125.1→76→104.3→72.9→138.9→184…。PCはsoft-route／zigzag／center-left-right、phoneはstairs／zigzag等が実際に連結された。毎段左右を交互に強制する単一courseではなく、中央に戻る段や近い段も含む。中央トゲによる死亡を実入力で確認し、中央にも危険が出ることを画像で見た。

安全trialではDROP前に現在の足場で位置／速度を整え、空中で次の足場へ舵を切り、反対入力でブレーキをかけた。20回のtakeoffが各profileで記録され、到達可能な行路が今回のcourseで成立した。85m付近まで速度は18から23台へ漸増し、急な段差速度ではなかった。次の足場が複数段見えるので、視覚的に先を準備する余地がある。[PC15m落下](review-artifacts/feel/desktop-falling.png)、[PC85m](review-artifacts/feel/desktop-safe-85m.png)、[phone15m](review-artifacts/feel/phone-falling.png)、[phone85m](review-artifacts/feel/phone-safe-85m.png)を実viewした。

全seedの幾何学的保証はRoot／QAのモデル検証が所有する。今回の2courseで届いたことから全courseの人間に対する公平さを保証しない。100m以後のmoving platform、深いbiome、最大速度36、長時間耐久は独立trial範囲外。

## 失敗、pause、再挑戦の意味

[PC中央トゲ結果](review-artifacts/feel/desktop-center-result.png)と[phone中央トゲ結果](review-artifacts/feel/phone-center-result.png)は飛ぶ王冠／潰れた王様、SPIKES、針接触の説明、安全なすき間へ着地する助言、DEPTH／BESTと「もう一回」を示す。放置結果はTOO SLOWとスクロールに置いていかれた説明へ変わる。別原因を一つの曖昧なGame Overにまとめていない。上端へ押し出される死亡はfeet-based境界の意図に沿い、王様が天井帯へ入った瞬間を誤って新しいcollision bugとは判定しない。

Pauseは落下中に実行した。[実pause画像](review-artifacts/feel/desktop-pause.png)に停止理由と、再開後もう一度押す操作説明があり、readonly player／camera／clock／hazardを含むsnapshotが300ms変わらなかった。Resume後、追加移動をせず結果まで進めた。今回のtrialではdecision dialogや広告による割込みはなく、CREDITは既存OFF境界を維持している。広告を見たいという人間の意欲は測定していない。

深度BESTが分かり、短いretryで別パターンの着地点へ試行を戻せるため、左右移動・DROP時期を学び直す再挑戦理由は設計上ある。これはReviewerの仮説であり、人間の再挑戦意欲や面白さを測った結果ではない。

## 残る人間評価

未解決blockerはこの確認範囲では0。残るのは約2.84秒の初回猶予、慣性／逆方向ブレーキの自然さ、読みながら降りる緊張感、実機親指による移動＋DROP、音／FPS、深部のmoving床／最大速度と長期変化、人間の再挑戦意欲。とくに「王様が面白い」「ルート選択が楽しい」は今回の自動native入力で合格としない。実画像と技術的ループは受入可能な状態になった。
