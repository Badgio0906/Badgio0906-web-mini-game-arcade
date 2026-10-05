# Game019 — 独立 Visual Review

実装者とは別の reviewer が [independent-native](QA/independent-native/) の実画像を `view_image` で確認した。画像の存在や CSS の差分だけで採点せず、普通の操作による実画面とモデルの状態を照合した。Visual の評価と実機／人間の楽しさ、公開、操作 QA は別の判定。

**最終 PASS 81/100、F12/15、H12/15。** 最終 landscape は [independent-final](QA/independent-final/) の風練習、井戸、sky／宇宙を再確認し、画面外へのcanvas拡大とtouch遮断を解消。PC／phone／320の視覚評価は先の固定候補を保持し、landscapeだけのCSS変更と照合した。

## 実際に見た画面

Desktop の title、大ジャンプ練習、39.4m転落の回復、100mの海／鳥、sky開始、150m前後の風、200mの結果。Phone の sky と200m結果。320pxの title、風練習、main開始、宇宙結果。Short landscape の title と失敗時の小ジャンプ練習。最終候補の landscape 修正画像は再確認待ち。

全profileの [操作 report](QA/independent-native/report.json) が source hash を保持する。最初の landscape は status box が touch を遮る製品不具合を発見した。画像に操作が見えていることを、操作できる証拠へ読み替えない。修正後の再実行では document988px の canvas が蛙をviewport外に出す不具合を発見し、[viewport判定](QA/independent-retest/VIEWPORT_REVIEW.json)を FAIL とした。この候補を不採用にし、2回目の修正後の実画像とstrict viewport実操作で閉じた。

## A–H rubric

| 項目 | 配点 | 点 | 実画像での根拠と上限 |
|---|---:|---:|---|
| A Identity | 15 | 13 | 緑の蛙、苔の縦井戸、細い足場と HEIGHT、海から空／宇宙への場面変化で題材が明瞭。背景の大半は単色。 |
| B Character / objects | 15 | 13 | 側面の大きい白目、緑の背、creamの腹、暗い輪郭と後脚を小さいnative spriteへ整理。主要PC／phoneで蛙として読める。320練習では非常に小さい。 |
| C Background | 10 | 8 | 湿った丸い石、苔、根、bucket、木板、海の波、雲、星へ一貫して変わる。simpleな反復と狭い海の描写が上限。 |
| D UI integration | 10 | 9 | cream／greenの落ち着いた配色、方向と大きさを2組の3buttonに整理。現在／run最高／BEST、現在と次の風、retryを明確に表示。phoneの「ジャンプ」折返しは改善余地。 |
| E Composition | 10 | 8 | PCは大きい縦井戸とtitle card、phoneは操作を下へ置く。結果では記録を優先。canvas左右の広い余白、320 title／練習／結果の小さいartが上限。 |
| F Readability | 15 | 12 | 平らな床、色と亀裂の違い、明るい予測点、蛙、高さ、方向が分離。風の左右／強弱／上下と次区間を文字と矢印で補足。小さい練習target／spriteと横画面titleのmenu scrollを残す。 |
| G Motion / effects | 10 | 6 | 実入力で低い調整・高い跳躍・滑り・転落・海の鳥・風・宇宙の状態差がある。90msの構えなどを全状態の連続映像や実機で評価していない。 |
| H Production value | 15 | 12 | 同じ蛙とpixel表現がtitle／練習／well／sea／sky／spaceで一貫。4lesson、結果、保存とretryを統合。簡素な背景と小さい練習、初回landscape不具合を隠さない。 |
| **合計** | **100** | **81** | **80以上、F／H各12を満たす。操作QAのlandscape再検証も完了。人間の面白さは未評価。** |

## 評価上限と人間確認

320px練習の蛙は約10px、mainでも約14pxに縮小される。緑／白目／脚の輪郭、操作の説明とbuttonは残るが、初見の人が足場やposeを迷わず見分けられるかは確認が必要。タイトルと結果の art はさらに小さく、文章／buttonを優先する。Short landscape の説明／練習導線はスクロール可能な menu 内にあり、3択すべてが同時に見える設計ではない。

100mでは海の水面と「海だ！ ……あっ、鳥!?」、短いbird carry、風の章への表示を実 view。200mでは紫の星空と最高記録／転落回数／井戸からのretryが読める。海の到達感、鳥のユーモア、風の気持ちよさ、長い再挑戦の面白さを静止画の点から推定しない。
