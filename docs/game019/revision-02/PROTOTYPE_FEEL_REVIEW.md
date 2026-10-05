# Game019 改訂02 — 20m試作の独立Feelレビュー

担当：実装者とは別の prototype/feel worker。対象 baseline `fcc4156a53988fc24aa70967534c5669e279fb38`、branch `codex/game019-charge-redesign`。研究文書と旧版実操作分析を読み、**100m井戸・上空mapを作る前の**平地／20m試作をレビューした。他ゲームは変更していない。

集約は [SUMMARY](QA/prototype-independent/SUMMARY.json)。判定は**技術・設計gate PASS**、空中補正は**0を採用**。人間の「楽しい」「もう一回跳びたい」、実機の親指／音／FPSは未実施であり、このPASSに含めない。試作だけで完成ゲーム全体のFeel／Visual／QAを合格にしない。

## 実行方法と固定した対象

[probe.mjs](QA/prototype-independent/probe.mjs)を Chromium で実行。PC 1440×900 は Space 長押し・離しと左右キー、phone 390×844 は native CDP の2接点touchで方向＋JUMPの同時長押し。DEV getterは読み取りだけで使用し、位置・時間・modelへ代入せず、ゲームのupdate/launch関数を browser から直接呼んでいない。画面と通常入力の結果を記録した。

`ChargeRun.ts`、`chargeTypes.ts`、`ChargeInput.ts`、`ChargeBoard.ts`、`prototypeLevel.ts`、`prototypeMain.ts`、`prototype.html`、`frogPixels.ts` の8fileを前後 SHA-256で固定。[SOURCE_SUMMARY](QA/prototype-independent/SOURCE_SUMMARY.json)／補足catchの[extra-report](QA/prototype-independent/extra-report.json)。レビュー中のruntime変更は0。全browser contexts／browserは終了済み。物理高速simulationの[最大のみ探索](QA/prototype-independent/max-only-model.json)は browser 実操作と別の証拠である。

```sh
npm run dev -- --port 5196
node docs/game019/revision-02/QA/prototype-independent/probe.mjs
node docs/game019/revision-02/QA/prototype-independent/extra.mjs
node docs/game019/revision-02/QA/prototype-independent/max-only.mjs
```

URL／出力先は `GAME019_PROTO_URL`／`GAME019_PROTO_OUT` で指定可。既存証拠を保持するため別出力先を推奨。補足scriptのURL／出力先はscript冒頭で固定されている。

## 観察できた成立条件

| 条件 | 通常入力の結果／判断 |
|---|---|
| 連続チャージとrelease | 押している間は接地のまま。最大700msを超えて250ms待っても発射0。離して1回だけ発射。小／中／大の独立選択ではなく同じJUMPの押す長さだった。 |
| 短・中・長の差 | PC実91.67/400/700msで頂点0.71/4.22/9.00m、phone実75/400/700msで0.59/4.22/9.00m。短押しは約33〜38pxだけ出発位置を変え、本命跳躍と役割が分かれる。最大は壁にぶつかり得る。 |
| 方向 | 左右と真上を実行。左を押して溜め、発射前に右へ切替えた時、release時の右がeventと軌道に確定した。 |
| 空中操作なし | 400ms右発射後に左入力を250ms行ってもvx125.59が完全一致。phoneも発射vx129.43のまま。方向選択表示は変わるが飛行は変わらない。 |
| 弱補正との比較 | 比較値24px/s²ではPCの逆入力後vx125.59→119.19、同じ400ms条件の着地x313.97→307.21。phoneもvx減少を確認したが両試行の実チャージ時間は完全一致ではないため、着地点の差を補正だけの効果と断定しない。0のほうが出発前の判断に結果を明瞭に結びつける。 |
| 中チャージが主力 | PCは約442左→3.6m、450右→7.2m、383左→10.2m、450右→13.9m。phoneは450/450/367/450ms。同じ固定地形で4回の中程度を主経路に使った。 |
| 短押しで準備→長で成功 | 13.9m木棚で約83ms右へ位置合わせし、700ms左で20mへ着地。PC/phoneとも成立。 |
| 長チャージは万能ではない | 低い梁で700msは頭をぶつける。最大真上8回は7.2mで止まる。別途 model public APIの自然replayによる700msのみ左右／真上の探索は112試行/38状態、到達0、最高頂点19.2m。探索は丸めた状態と12跳躍上限の有限検査で、数学的全解否定ではない。 |
| 失敗ごとの戻り量差 | 13.9mから中寄りの不足跳躍では10.2mへ戻り、進行損失3.7m。小の準備を省いた最大左では3.6mへ戻り、損失10.3m・頂点からの実落下19.3m。梁の失敗はほぼ同じ棚で止まり、損失0。全て同じ罰になっていない。 |
| 再試行で判断を変える | 最初の250ms左は3.6mへ届かず、同じ地形／出発条件から約450msに変えて成功。同一RUNでのcatch復帰と再登りも補足入力で確認。自動正解を覚えたという技術証拠であり、人間の初見学習率を測った結果ではない。 |
| 本番へ移せる安全棚 | 7.2mの広い棚は物理的着地で止め、落下復帰にも使える。補足では10.2mから短い位置合わせ後に外へ跳び、7.2m catch、同じRUNの中チャージで10.2mへ復帰。位置save／復活／Game Overはない。 |
| 画面／mobile | 主要JUMP/左右はPC146〜292×60px、phone88.5〜177×60pxでviewport内。上の目標足場が見え、井戸壁／木梁／苔棚を区別できる。試作はまだ最終artではない。 |

PC/phoneの20m到達画像：[PC](QA/prototype-independent/desktop-route-root-top-700.png)／[phone](QA/prototype-independent/phone-route-root-top-700.png)。[短い位置合わせ](QA/prototype-independent/phone-route-takeoff-80.png)、[大転落後](QA/prototype-independent/desktop-deep-fall.png)、[最大真上停滞](QA/prototype-independent/desktop-max-up-stalls.png)。

## 旧版から変わった判断

旧版は小0、中1、大31の実RUNで200mへ進めた。今回の20mは中を繰り返しつつ、梁では溜めすぎを避け、最後は小で位置を整えてから大きく跳ぶ。高さ差3.0／3.6／3.7／6.1mと横移動、失敗時に戻る棚を組み合わせ、単に障害物を増やした試作にはなっていない。手作り配置は毎回同じで、違った溜め方の結果が次の試行へ残る。

ただし「小がないと絶対に進めない」とは判定しない。最終棚は最大に限らず精密な長チャージで直接狙う余地も設計上許される。小は出発位置を整えて大跳躍を安定させる選択として働き、中／長の役割を削っていない。

## 基盤失敗と製品上の補足

初回probeはチャージ中に72 forecastを生成するgetterをpollし、要求80msが実166.67msに延びた。通常入力のhold→wall time→releaseに変えて実チャージeventを照合した。[初回原本](QA/prototype-independent/first-harness-failure.json)。次の経路assertは失敗後のxを初期位置と誤認した。失敗しても位置は戻らないため、同じ出発条件で比較する時だけ明示RESTARTへ修正。[第二原本](QA/prototype-independent/second-harness-failure.json)。

全物理項目を通過したPC collectorの最後のerrors=0だけが、`http://127.0.0.1:5196/favicon.ico` の404でFAILだった。補足collectorがURLを特定した。ゲーム本体asset／page errorは0、phoneは全collector PASS。prototype HTMLにfavicon指定がないという軽微な不足であり、物理・Feel gateと分離した。最終再実行scriptはこの既知faviconだけを除外し、他console errorは失敗とする。実ゲームHTMLには既存inline faviconがある。

catch補足の初回は70msでも自分の木棚に着地することと、落下中にも固定vxが進むことを考慮せず、特定棚へ着地するassertを置いて失敗した。位置合わせを実入力で行う経路へ修正した。さらに3m差のfloat値2.999999999999999を厳密>=3としたassertを許容差へ修正。失敗原本もQAディレクトリへ保存した。runtime修正を検証したという意味ではない。

## 全体制作へ進む条件と残す注意

100m井戸／上空制作へ進める。採用は空中補正0、release確定、短い位置合わせ・中の主力・長の進行と危険、固定landmarkと差のある戻り。20mの最後だけを全区間へ繰り返さない。低所は広い着地、高所はcatchに届く余地と速いルートを混ぜ、最終ステージでも最大一択の拒否と全到達を再検証する。

- 最終artではsquish transformだけに頼らず、短／中／最大のpixel poseを読みやすくする。
- 下を見る操作を本番に残し、大転落前に下のcatchが読めるか実画像で確認する。
- moving／slip／crumble／風／100m海鳥／200m宇宙はまだ試作gate対象外。最終mapで独立FeelとQAが必要。
- 練習・pause/cancel・端末保存・telemetry・small320／landscape・配信は最終QAで扱う。今回PC/phoneの試作だけで全画面合格とはしない。
- 人間には短中長の読め方、失敗への納得、再試行したくなるか、mobileの同時長押しを確認する。自動成功と独立workerの設計判断をその代替にしない。
