# Game003 芸術建築・改訂2 実装報告

既存の中央PERFECTに、実際に張り出した2階を反対へ戻し、釣り合いを回復する芸術ペアを追加した。幅を切らず、全接触面より上の合成重心を検査する現行基盤を活用した。同寸法の隠れたランダム質量を廃止し、見た目の幅×高さに比例する同一密度へ統一した。

## ルールと維持した境界

- 完全な建物幅と位置を保持。支持区間は実矩形の重なり。全支持面の上部重心・余裕を逆走査し、無接触／中層破綻を拒否。既存4px支持graceは維持。
- 直近2階の相対横ずれが20〜46%、逆方向、全支持成立、先の弱い支持面余裕または基礎偏りが3px以上改善したときだけ受賞。建物IDは受賞後再使用しない。待機・小さな往復・入力左右順へ加点しない。
- P=100×モード。1組は310〜360×モード、連続加点最大30×モード。PERFECT回数・得点と分離し、合計BONUSを明示する。
- C国は従来の揺れ角速度2倍、将来のPERFECT追加点3倍。芸術へは同じ倍率を一度だけ適用。15m超の一度限り選択、凍結、fresh-input guardを維持した。
- 最初のDROP、Space/Enter/Click/Tap、PERFECT6px、落下・settle、基礎、クレーン／5種類の既存建物素材、PCの大きなプレイ領域を維持。
- 旧保存 `best` / `bestBonus` を削除・上書きしない。新階数／BONUSは `rules2:best` / `rules2:bestBonus`。タイトル・Resultに旧ルール保持を明示。URL/ID不変。

## 調整値と理由

| 項目 | 初期案／現行 | 最終 | 観測と理由 |
|---|---|---|---|
| 横ずれ | 22〜42%案 | 20〜46% | 実際の幅と初期可動範囲を照合。左右の十分な張り出しは広い範囲で成立し、小さな往復は無得点。左右4モデル経路と4画面nativeで成立を確認。 |
| 芸術組 | P2.2〜2.8倍案 | P3.1〜3.6倍、連続最大+0.3P | 既存PERFECTコンボでは初期2回=100+200=300点。観測した新鮮な芸術組317／319点は少し上。長い中央コンボの価値を維持。 |
| 2・3個目の可動幅 | ±38px | ±64px | 中央300から右芸術狙いが334.4〜338の約4pxだけだった。最初のDROPは±38のまま、次の2個を広げて数pxだけの成功窓を解消。角速度・PERFECT6pxは維持。 |
| 320レイアウト | top padding8px | 4px | DROPの下端がviewportより2px見切れた実画像／bounds検査に基づく。 |
| phoneタイトル | 23px | 20px | 語尾「ぃ！」だけの折返しを実画像で確認。titleのみ限定修正、4画面の3開始選択再検査PASS。 |

## 表示と練習

危険な支持面の線／上部重心三角印と、別の基礎合成重心バーを表示。「安定／注意／危険」、実投影、芸術確定popupと2階を結ぶ金線を加えた。確定階は水平の実判定矩形と一致させた。

共有の1回DROP練習をruntimeから外し、別TowerRunの中央→張り出し→反対へ戻す3実着地へ変更。説明・練習は任意。練習に本番RUN/BEST/CREDITを混ぜない。既存素材を再使用し、画像生成は実行していない。

## 検証

- [18単体PASS](QA/model-final.log)：現行9、C選択4、芸術5。全支持面、全体重心が基礎内でも中層破綻、無接触、左右4安定経路、同側負荷の下層崩壊、小振動／待機／同一ID再利用拒否、中央コンボ、C芸術倍率1回／上限。
- [003だけのTypeScript PASS](QA/003-typecheck-final.log)、[独立003 entry build PASS](QA/003-build.log)。共有Phaserのlarge chunk warningあり。全7作品の統合buildはMain担当。
- [desktop / phone / 320 full native PASS](QA/native-revised/report.json)、[landscape native retest PASS](QA/native-landscape-retest/report.json)。各3実練習、芸術組、pause凍結、危険な実DROP→Result、retry、44px／viewport／祖先clip／hit、旧BEST900／BONUS8000保持、新記録、mute再読込、console／HTTP error0。
- [title限定4画面PASS](QA/title-final/report.json)。[final source差分](QA/FINAL_SOURCE.json)：full gameplay以後はtitle字体、C国の2表示文言、manifestのみ。モデル／描画／入力／練習に差分なし。
- 再現collectorはQA内の `native-probe.mjs` / `title-probe.mjs` / `mode-probe.mjs`。通常キー／nativeタップをreadonly診断で選ぶ技術検証。モデルstateの書換え／fixtureは使用していない。

## 最初の失敗と分類

[最初のnative原本](QA/native-first/report.json)を保存。PC／横画面は旧±38の範囲から外れた目標を指定するcollector問題と、実際の芸術窓が約4pxしかない設計問題を分けた。320 DROP見切れは製品レイアウト不具合。phone練習の非PERFECTは余分なfocus／locator処理を挟む入力collector遅延で、native tap座標を先に取得するよう修正した。以後はsource snapshotで他HTMLのVite reloadと共有optimize cacheを分離した。

改訂collectorの横画面が600点を固定期待した失敗はテスト側。最後の中央配置は294.721px、前階300.786px、差6.065pxでPERFECT6px外。実precisionScore300／保存300は一致して正しい。保存を実公開snapshotのBONUSと比較し、製品の許容範囲／得点は変更していない。Jevはこの観測をPRODUCT_BUGと判定し、独立CodexはTEST_INFRA_BUGと判定。判断差を[Jev原本](QA/JEV_SHADOW.jsonl)へ保持した（API実行はMain担当）。

15mの初回C実入力試験は22階15.3mから選択し、既得14800点の維持・速度2／追加点3・二度目offerなしを確認。一方、意図した芸術組の最初の実横ずれ27.845px/140px=.1989が20%未満で、正しく芸術0。collectorが1組を期待した[失敗原本](QA/mode-native/report.json)を保持。幅の広い目標へ変更した[最終C実入力試験](QA/mode-native-retest/report.json)はPASS。23階15.67mから新しい選択でC国へ。既得15600点を保持し、2回の実着地で芸術1組1026点、速度2／追加点3・二度目offerなしを確認した。source hash前後一致、browser/context終了。

## 評価と公開

実装者による画像実view：[before](BEFORE.md)、desktop実芸術、全3練習、phone title最終、実15m選択を確認。独立Visual/Feelは別担当の報告を採用する。点数を実装者から独立レビュー済みと報告しない。

Jevは観測分類のみ。ゲーム内物理・採点・正解・公開判断へ接続していない。400件の既存Telemetryへ `overhang` / `art_pair` / `support_failure` とrulesVersion2を追加し、毎フレーム保存／外部送信はない。

人間の面白さ・音・実機FPS・親指操作は[未実施](HUMAN_PLAYTEST.md)。候補ブランチの実装／技術検証段階で、main／公開確認はMainの統合報告に従う。


## 独立担当者による最終確認

Game006実装担当がGame003 runtimeを編集せずに独立実行し、canonical PC1920×1080 / phone390×844の実練習、張り出し／釣り合い、失敗、Retry、保存を確認した。source前後不変・全browser閉鎖。Game Feel技術ゲートPASS、Visual **83/100（F12/H13）**。[独立原本](../independent/game003/INDEPENDENT_REVIEW.md)／[native report](../independent/game003/native/report.json)。短いlandscapeの盤面と小さな支持点マーカーの読みやすさは軽微な限界として残る。人間の楽しさ・実機音質・FPSの未評価を合格へ置き換えない。
