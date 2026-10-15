# 第4工程033〜035 — 統合Visual／技術動作レビュー

Art Director worker。033〜035のゲーム実装には不参加。3作品の主静的素材は自担当制作のため、素材そのものの自己採用を第三者承認とは呼ばず、実統合画面・操作情報・配置の判定と分離する。

固定基準: 43deb6cd50348dada54acb7469fefd12b54ac93c。実際のdesktop/phone/narrow/landscape画像と動作連番をview_imageで開き、別workerが固定ソースで取得した通常入力・readonly状態前後と照合。collectorを本レビュアーが実行した／連続動画を視聴したという主張はしない。

| 対象 | A | B | C | D | E | F | G | H | 合計 | 判定 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| game033 | 14 | 12 | 10 | 9 | 8 | 13 | 8 | 12 | 86 | 技術Visual合格 |
| game034 | 13 | 12 | 9 | 9 | 8 | 12 | 8 | 12 | 83 | 技術Visual合格 |
| game035 | 13 | 13 | 9 | 9 | 9 | 13 | 8 | 13 | 87 | 技術Visual合格 |

A15/B15/C10/D10/E10/F15/G10/H15。合計80以上、F/H各12以上。Gは実連番と状態前後の技術的な状態伝達に限定。

## game033

写真調の夜景、広い紺の空、水面と琥珀色の街灯に、細い明朝体のタイトルと柔らかい発射buttonがまとまる。四幅とも目標輪・開花文字・時間・score・chargeの識別が可能。花火の初期開花は小さく控えめで、煙と残光は淡いが、夜景を覆わず動的粒子として認識できる。320の長い結果見出しは折り返し、短い横画面はスクロールを伴う構成。

desktop/phone/narrowのmotion-a/bで粒子輪の拡大と減光、上昇rocket、対応する水面の小さい反射が変わることを実見。通常100秒の実結果65560点、86発/85ぴったり/最大86combo/7chainを実画面とQAに照合。0.18秒待機と採取overheadを含む実連番であり、連続滑らかさや花火音の快感は未評価。

初回320説明末尾がviewport外でcollector停止した記録は保持。通常scrollで説明actionへ到達する追補QAを使用し、失敗原本を成功へ書き換えていない。

実view: [desktop-play.png](../game033/QA/43deb-native-01/desktop-play.png) / [desktop-play-motion-a.png](../game033/QA/43deb-native-01/desktop-play-motion-a.png) / [desktop-play-motion-b.png](../game033/QA/43deb-native-01/desktop-play-motion-b.png) / [phone-play.png](../game033/QA/43deb-native-01/phone-play.png) / [phone-play-motion-a.png](../game033/QA/43deb-native-01/phone-play-motion-a.png) / [phone-play-motion-b.png](../game033/QA/43deb-native-01/phone-play-motion-b.png) / [narrow-play.png](../game033/QA/43deb-native-02/narrow-play.png) / [narrow-play-motion-a.png](../game033/QA/43deb-native-02/narrow-play-motion-a.png) / [narrow-play-motion-b.png](../game033/QA/43deb-native-02/narrow-play-motion-b.png) / [landscape-play.png](../game033/QA/43deb-native-02/landscape-play.png) / [phone-result-narrow.png](../game033/QA/43deb-native-01/phone-result-narrow.png) / [phone-result-landscape.png](../game033/QA/43deb-native-01/phone-result-landscape.png)。

QA根拠: [report.json](../game033/QA/43deb-native-01/report.json) / [source-verification.json](../game033/QA/43deb-native-01/source-verification.json) / [report.json](../game033/QA/43deb-native-02/report.json)。

## game034

暖かい木工工房とsage壁、木・terracotta・tealの小さな建材が一致した玩具世界。背景小物を端に置き、操作対象の家を中央下へ配置。支柱の選択×印、黄色い解体範囲、守る小屋、選択数と本文buttonが4幅で見える。建材と木の机のコントラストは控えめ、建物自体も小さいためFは12点に留めるが、代替の44px以上の部品buttonと名前で操作可能。

desktop-playing→desktop-motion-bで実材の下方向の移動を実見し、同じ姿勢画像の使い回しでないことを確認。四幅の選択→実崩壊→8現場完了の画面をQAと照合。黄色範囲内質量・低く崩した質量・小屋無事・除去数が結果内訳として見える。G8は実pose/結果の技術的伝達だけで、崩壊の気持ちよさは未評価。

初回consentを処理していない画像は不採用。通常の拒否操作後のclean画像だけを最終Visualとthumbに使用し、旧原本・独立finding・撤回台帳を保持。素材作者のため素材単体の第三者承認ではない。

実view: [desktop-playing.png](../game034/QA/stage4-43deb-four-widths-clean/desktop-playing.png) / [desktop-motion-b.png](../game034/QA/stage4-43deb-four-widths-clean/desktop-motion-b.png) / [phone-selection.png](../game034/QA/stage4-43deb-four-widths-clean/phone-selection.png) / [phone-playing.png](../game034/QA/stage4-43deb-four-widths-clean/phone-playing.png) / [narrow-playing.png](../game034/QA/stage4-43deb-four-widths-clean/narrow-playing.png) / [landscape-playing.png](../game034/QA/stage4-43deb-four-widths-clean/landscape-playing.png) / [phone-complete.png](../game034/QA/stage4-43deb-four-widths-clean/phone-complete.png) / [landscape-complete.png](../game034/QA/stage4-43deb-four-widths-clean/landscape-complete.png)。

QA根拠: [report.json](../game034/QA/stage4-43deb-four-widths-clean/report.json)。

## game035

淡い氷の質感、青いboard、赤青の花崗岩stone、低彩度targetが静かなスポーツ画面として統一。真上の投影で距離と予測方向を読みやすくした。四幅でmain/title/resultを実見。短い横画面のarenaは小さいが、targetとstoneは残り、数値や44px操作を場外へ分けている。小画面の長い結果dialogは内部scrollが必要になるが、QAの通常操作で帰還まで到達。

towerの新desktop-motion-a/bを実見。通常投球後の赤id10は(240,523.56)→(240,395.266875)、128.293px移動。通常pauseで保存状態をreadし、resume後の実physics0.441667秒を測定。速度-323.6→-257.35と赤stoneの軌跡・待機文言が実画面に対応。G8は減速を伴う実移動と状態伝達の技術点。衝突の快感、実機drag、連続FPS、聴感は未評価。

初回実装者の静止QAを投球motionへ代用せず、別tower workerの43deb通常投球画像とreadonly前後を追加で使用。

実view: [desktop-aim.png](../game035/QA/browser-2026-10-15T14-18-29-447Z/desktop-aim.png) / [phone-aim.png](../game035/QA/browser-2026-10-15T14-18-29-447Z/phone-aim.png) / [small-aim.png](../game035/QA/browser-2026-10-15T14-18-29-447Z/small-aim.png) / [landscape-aim.png](../game035/QA/browser-2026-10-15T14-18-29-447Z/landscape-aim.png) / [desktop-motion-a.png](../game035/QA/independent-tower/stage4-smoke/desktop-motion-a.png) / [desktop-motion-b.png](../game035/QA/independent-tower/stage4-smoke/desktop-motion-b.png) / [phone-result.png](../game035/QA/independent-tower/stage4-smoke/phone-result.png) / [narrow-result.png](../game035/QA/independent-tower/stage4-smoke/narrow-result.png) / [landscape-result.png](../game035/QA/independent-tower/stage4-smoke/landscape-result.png)。

QA根拠: [MOTION_G.json](../game035/QA/independent-tower/stage4-smoke/MOTION_G.json) / [report.json](../game035/QA/independent-tower/stage4-smoke/report.json)。

## 12作品サムネイルと採用境界

今回対象002/003/005/006/009/015/017/024/027/033/034/035は、全て実際の通常入力play画像からcrop/containだけで640×360WebPを作成。原本PNG、旧thumb、旧台帳、crop、source/output SHA、再採用履歴を保持。最適化した12画像もview_imageで実際に開いた。[監査](../../assets/portal/thumbnails/reorganization-2026-10-15/VALIDATION.json)では対象12の原本・寸法・hash一致、対象外23entryとpublic hash不変を確認。034のconsent付き画像は[不採用記録](../../assets/portal/thumbnails/reorganization-2026-10-15/game034-withdrawn-consent-capture.json)へ残し、clean画像だけを現行thumbに採用した。

[生成台帳](../../assets/reorganization-2026-10-15/asset-index.json)と[Visual Brief](../../assets/reorganization-2026-10-15/VISUAL_BRIEF.md)は静的素材の制作・自己採用の証拠であり、それ自体を独立統合Visual合格に読み替えない。ImageGen8回、原本8枚はrepo内のassets/gameNNN/reorganization/originalsへ保存。具体的なbackendモデル版はtool非公開のため推測していない。

3作品とも実確認範囲の技術Visual基準を満たす。人間の面白さ・実機・連続FPS・聴感は全て未実施。

本書は公開CI・配信hash確認の代行ではない。素材品質、統合画面、通常入力の技術動作、本人Feel、正式公開は別々の結果として扱う。
