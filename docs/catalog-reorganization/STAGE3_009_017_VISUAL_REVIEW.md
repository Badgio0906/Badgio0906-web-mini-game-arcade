# 第3工程009／017 — 独立Visualレビュー

Art Director worker、009/017の実装には不参加。017の静的背景制作者であり、素材の自己採用と本書の統合画面の独立判定は分離する。

基準は a32344b8185e8ffb4eb80e92f2a687ecca294f6c。4幅の実統合画像をview_imageで開き、通常操作QAとreadonly前後を照合。collectorの実行者や連続動画視聴者であるとは主張しない。

| 対象 | A | B | C | D | E | F | G | H | 合計 | 判定 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| game009 | 13 | 12 | 8 | 9 | 9 | 13 | 7 | 12 | 83 | 技術Visual合格 |
| game017 | 13 | 11 | 9 | 9 | 8 | 13 | 8 | 12 | 83 | 技術Visual合格 |

A15 B15 C10 D10 E10 F15 G10 H15、合計80/F12/H12以上。Gは実連番の技術的な状態伝達だけ。

## game009

木机・紙色・手描き事務用品SVGの固有性を維持。依頼、謎タイトル、手掛かり、前提操作、物品候補の階層が4幅で判読可能。箱の番号確認→蓋を開ける→角印鑑の発見という実画面を確認し、単に対象名だけが変わる構成ではない。320pxのヒント文は折り返すが切れず、結果の点数・旧ルール・retry・共有準備中も見える。

phoneのfound-motion-a/bで、発見枠のパルスが薄まり、時刻87.9→87.8へ進む実連番を確認。通常練習2問と本番4発見後の自然timeout/resultはQA記録と一致。G7は状態変化と発見フィードバックの技術点で、楽しさや連続運動の審美は未評価。

実view: [009-desktop-discoveries.png](QA/stage3-009-017-a323-native-01/009-desktop-discoveries.png) / [009-phone-discoveries.png](QA/stage3-009-017-a323-native-01/009-phone-discoveries.png) / [009-narrow-discoveries.png](QA/stage3-009-017-a323-native-01/009-narrow-discoveries.png) / [009-landscape-discoveries.png](QA/stage3-009-017-a323-native-01/009-landscape-discoveries.png) / [009-phone-found-motion-a.png](QA/stage3-009-017-a323-native-01/009-phone-found-motion-a.png) / [009-phone-found-motion-b.png](QA/stage3-009-017-a323-native-01/009-phone-found-motion-b.png) / [009-desktop-result.png](QA/stage3-009-017-a323-native-01/009-desktop-result.png) / [009-narrow-result.png](QA/stage3-009-017-a323-native-01/009-narrow-result.png)。

## game017

青い雨の街と琥珀色の窓に、黄色のレインコート人物・緑の安全枠・薄い屋根を重ねる。人物と屋根は意図的に単純な形で、背景との画風の差はあるが、操作対象としての輪郭は4幅で明確。雨量予告と濡れmeter、回復中表示、次の屋根方向と距離が本体を覆わない。短い横画面では街上部が切れ水面中心になるが、移動と安全地帯は見える。

phoneのwalk-motion-a/bで人物の位置・足の姿勢・水たまりと雨線の変化、距離0→4m、次屋根77→72mを実見。全4幅で通常11屋根到達の結果をQAと照合し、結果に892m/11地点と新旧BEST区分を確認。G8は実連番と状態伝達の技術点。雨の聴感、実機指操作、チル感・本人の面白さは未評価。

実view: [017-desktop-playing.png](QA/stage3-009-017-a323-native-01/017-desktop-playing.png) / [017-phone-playing.png](QA/stage3-009-017-a323-native-01/017-phone-playing.png) / [017-narrow-playing.png](QA/stage3-009-017-a323-native-01/017-narrow-playing.png) / [017-landscape-playing.png](QA/stage3-009-017-a323-native-01/017-landscape-playing.png) / [017-phone-walk-motion-a.png](QA/stage3-009-017-a323-native-01/017-phone-walk-motion-a.png) / [017-phone-walk-motion-b.png](QA/stage3-009-017-a323-native-01/017-phone-walk-motion-b.png) / [017-phone-result.png](QA/stage3-009-017-a323-native-01/017-phone-result.png) / [017-landscape-result.png](QA/stage3-009-017-a323-native-01/017-landscape-result.png)。

[QA原本](QA/stage3-009-017-a323-native-01/REPORT.json): 4幅8case644checks、source前後一致、pageerror/POST0。採取は別runner worker。

009/017とも実本番画面からcrop/containのみ。原本、旧出力、crop、hashをassets/portal/thumbnails/reorganization-2026-10-15へ保存。最適化後も実view。

人間Feel、実機、聴感、連続FPSは未実施。全工程・全作品・人間合格へ判断を拡張しない。
