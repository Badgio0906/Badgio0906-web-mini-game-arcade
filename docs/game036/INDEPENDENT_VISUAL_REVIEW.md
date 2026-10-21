# Game036 もちっと連鎖 — 独立Visualレビュー

2026-10-21 UTC、担当 `/root/game015_ui_review`。**最終候補のVisual gateは84/100、可読性F12/15・完成感H13/15でPASS。** 根拠は実画像と、compiled版の通常入力による2連鎖motion観察。実iPhone・音・人間の面白さ／爽快感・公開許可とは別の判定である。

## 1. 対象と独立性

worktree `/workspace/arcade-game036-release`、HEAD `9560283ce9b6a39f30263cbdbbdd625c90dd2441` 上の未commit統合候補。AGENTS、PROJECT_CONTEXT、CURRENT_STATUS、GAME_DEVELOPMENT_RULES、`IMPLEMENTATION_SPEC.md`、`game.manifest.json`、Git読取りによる `docs/ten-game/reviews/REVIEW_PROTOCOL.md` を参照した。

初回は静止画像だけをレビューし、Gを未評価、総合gate未確定とした。その後、親がportrait中央配置とfooter高さの限定修正を実施。最終製品固定・rootブラウザ終了後に独立motion枠を明示的に受領し、compiled `http://127.0.0.1:4981/game036.html` で通常touchを実行した。別担当の変更を上書きせず、レビュアーの書込みはこの文書と `QA/independent-motion/` のみ。製品・Git・API・有料サービス・公開は操作していない。

最終読取り時のSHA256：

|ファイル|SHA256|
|---|---|
|`src/games/game036/style.css`|`79cae17bbe114729cb6a73198fa3ea511c4c44ce67be9c0de451596db9133c62`|
|`src/games/game036/main.ts`|`e786ef8bc242b07cdf8e379cb474d4934249348c2058525e6ceccfcc7cc31b32`|
|`src/games/game036/model.ts`|`39b24b3904923df70504258daea1aa1f387a7080a170e3735d671dc6bc4c1ddc`|
|`src/games/game036/game.manifest.json`|`3576abb32eeeef2fa639c6cfb64c0f0c4b67792c64170f825c06b4f6c6e854c8`|

6列×12段、4味の2個組、4個以上で消去→重力連鎖、落下地点の「N連鎖」予告、32個ごとのこんぺいとう、すぐretryという固有体験を前提に評価した。240秒は設計仮説であり、画像からRUN時間や人間の継続意欲を作らない。

## 2. 実viewした根拠

初回 `QA/codex-integration-dev/` のdesktop／phone／small／landscape play、phone練習preview・title、landscape resultに加え、phoneのpop→2連鎖banner→練習clearを実view。旧smallは320×640であり、320×568とは区別する。

最終候補では以下を改めてview_imageで実際に閲覧した。

- [390×844 play](QA/codex-production-config/390x844-play.png)、[320×568 play](QA/codex-production-config/320x568-play.png)。
- [844×390 play](QA/codex-production-config/844x390-play.png)、[667×375 play](QA/codex-production-config/667x375-play.png)、[1440×900 play](QA/codex-production-config/1440x900-play.png)。
- [通常練習の消去フレーム](QA/codex-compiled-flow/actual-practice-frame.png)、[40点の自然結果](QA/codex-compiled-flow/actual-result.png)。
- 正式サムネイル `public/assets/portal/game036.webp`。もちの顔と積み上げを主題にしたcropで、台帳 `assets/portal/thumbnails/asset-index.json` は原画像を `codex-integration-dev/desktop-play.png` と記録する。旧配置の画面由来だがcrop内でUIの誤表示を追加していない。別の豪華なゲーム画面を創作した画像ではない。
- 独立motionの390のframe00／03／05／08／12と、844のpreview／frame02／04／06。各ファイルは `QA/independent-motion/` に保存。

## 3. 初回所見と限定修正の確認

|初回の所見|最終根拠と判定|
|---|---|
|portraitの`.well`が左端へ寄り、390／320で右側に大きい余白。|最終390／320の盤面は左右中央に配置。HUDと5buttonの中央軸との違和感を解消。アスペクト比を引き伸ばして横を満たしていない。|
|phone・landscapeで解析footerの下端が画像外に入る。|親の `QA/layout-before.json` ではbody overflow16／28／33px、scroll後に設定button実tapは可能だった。初回を「到達不能」と誤認しない。最終は重複brand footerをmobileだけ非表示にし、同意／privacyバーを保持。最終画像で全体が見え、親の7画面全PASSと自分の2画面のbody scrollHeight一致を確認。|
|静止フレームだけでG Motion/effectsを採点できない。|明示的なブラウザ枠でcompiledの通常練習を独立実行し、落下固定→pop→崩落→2連鎖banner→練習完了の時系列を採取・実view。Gを追補。|

320×568ではもち1個とNEXTが小さく、細かい列操作は実機で判断が必要。ただし左右・回転・すとんは独立した大きいbuttonとして残る。盤面を無理に広げ、footerや主要操作を画面外へ押し出す見え方にはしていない。

## 4. もち・盤面・情報の見え方

丸みのある四角いもちに目・口・頬・ハイライトがあり、ピンク・緑・黄・青の4味を識別できる。cream／pink／淡blue背景、やわらかい盤面枠、SCOREとすとんのaccentが同じ菓子の世界にまとまる。写真や高密度背景がないことを欠点とはしない。

薄い列・dotで空きと積み上げを分け、上の×が限界位置を示す。着地点の点線輪／同色ghostと「2連鎖」badgeは、「光る場所を探して置く」という設計を画面へつなぐ。title→練習の「記録なし」→2連鎖clear→本番／再練習／titleが同じ色・言葉で整理される。結果は点数・BESTとの差／最大連鎖・次のヒント・強いretryの順で読める。0点の初回結果だけで爽快なプレイを十分に体験したとは認定しない。

PCは盤面＋右情報、横は小さめ盤面＋右の情報とpad、縦は上のscore/NEXT/gauge→盤面→padという配置。横は列間に余白が残るが操作域が盤面を覆わず、pointer入力の対象を分けられる。最終1440は従来の構成を維持。

味の区別は主に色であり、色覚への適合は未確認。こんぺいとう本体・全消し・後半高LVの密度は今回の画像と短い練習に出ておらず未評価。

## 5. 独立actual motion

[実行script](QA/independent-motion/run.mjs)／[結果](QA/independent-motion/results.json)／[close記録](QA/independent-motion/closed.json)。

新規contextを390×844と844×390で別々に作り、全requestをroute。**base originのGET/HEADだけcontinue、その他はabort**。本番データ・時刻・モデル・得点を書き換えず、titleを550ms待つ→表示時は同意拒否の通常tap→practice tap→250ms待つ→DROP tapという通常入力を行った。各18フレームを約200ms間隔で採取した。これは動画のFPS／知覚的滑らかさ測定ではなく、実行中の描画と状態遷移の時系列観察である。

- 390：DROP後140msで最初のpop、755msで2連鎖bannerと次の消去、1170msで残るもちの落下と粒子、1372msには「2連鎖できました」のresult。18枚中17種類の画像。
- 844：186～625msで最初の消去と次のもちの位置変化、1065msで2連鎖banner、1490msに練習result。18枚中17種類。
- どちらもJS例外0、遮断対象の通信試行0。最後に全contextとbrowserをfinallyでcloseし、親へ枠を返した。

動きの根拠は、pop中にもちが薄くなり粒子が散る、上のもちが次の位置へ落ちる、2連鎖bannerが大きくなる、残る粒子と完了menuへ移るという実RUNの変化。予告badgeと実際の連鎖結果が一致する。音・触覚・人間の「もちっとした気持ちよさ」は未評価。実GPUで連続して何FPSだったか、強い連鎖の全演出が快適かは測っていない。

## 6. 44px・footer・clipの技術証拠との境界

親の `QA/codex-production-config/RESULTS.json` は7画面でboard／pad／設定buttonのrect・settings実操作を記録し、すべてPASS。設定buttonは各画面44px高で全体がviewport内。これはShadow DOM内部を通常documentのquerySelectorで探せたことではなく、実操作成功と寸法が根拠。

自分の最終motion2画面でもbody scrollHeight=viewport（844／390）を読取り、390の5buttonは約70.4×50px、844の方向回転4個は63.75×44px・すとん270×44pxだった。最終320の親記録は約56.4×50px。boardの各セルを44pxとする要件ではなく、盤面の広いスライド／tap／flick領域と独立buttonを区別する。

静止画像のclip確認、親の7画面技術QA、自身の2画面motionを別々の証拠として扱い、「全機種で切れない」「親指で快適」と一般化しない。

## 7. 最終rubric

`GAME_DEVELOPMENT_RULES` と `REVIEW_PROTOCOL` の項目を用いる。初回75/90・G未評価という状態を、最終配置と独立motionの追加根拠により更新した。

|項目|上限|得点|実画像／実RUNの根拠と限界|
|---|---:|---:|---|
|A Visual identity|15|13|4味の顔もち、菓子の淡色、ぽん／すとんの表現が一貫。類似落ち物との独自性を題材だけで過大評価しない。|
|B Character/object appeal|15|13|頬・目口・光沢・柔らかい角、積まれたもちを判別。星本体は未評価。|
|C Background quality|10|8|静かな背景と列・dotが盤面を分離し、情報を邪魔しない。|
|D UI integration|10|9|title／予告／練習／clear／結果の色と操作が一貫。解析footerも最終画像で保持。|
|E Composition|10|8|portrait中央寄せで改善。PC/横のboardと操作を分離。小さい画面の余白とNEXT寸法には改善余地。|
|F Gameplay readability|15|12|連鎖badge・banner、score、主要5buttonを識別。smallのNEXT・補助文・色覚・実機の判読は留保。|
|G Motion/effects|10|8|compiled通常入力で消去・重力・2連鎖banner・粒子・完了への変化を2画面で実観察。音／実GPU FPS／高連鎖は未評価。|
|H Production value|15|13|一貫した各state、成立する通常練習、focusを示すretry、viewport内の操作とfooter。人間受入は別。|
|**合計**|**100**|**84**|**80以上、F12・H13で今回のVisual gate PASS。**|

これは実画像・短い実motionに基づく専門レビューで、作者の面白さ、爽快感、実機の快適性、公開・pushの承認を代行しない。

## 8. 残る未評価

実iPhone／Androidの親指・バー・safe-area・音・長時間プレイ、color vision、screen readerとkeyboard-only完全経路、こんぺいとう／全消し、高LVの密度、実GPUの滑らかさは人間または後続の限定検証が必要。未確認を合格と創作せず、今回のVisual PASSをAdSense審査通過予測へ転用しない。

費用UNKNOWNのpush／公開は今回許可されていない。他PRの過去waiverを本件へ流用せず、親の安全な公開判断とユーザー承認を別に待つ。独立実行は終了し、全browser/contextを閉じた。
