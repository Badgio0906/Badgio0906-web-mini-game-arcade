# Game006 独立 Game Feel / Visual Review

Reviewer: Game003実装担当（Game006 runtimeを編集していない）。実装担当者の自己QAとは別工程。基準commit `5b2dff83fe9196de82eaa7d8b0f15b35d7ff4a34`。根拠はREQUEST §4/10、`docs/ten-game/reviews/REVIEW_PROTOCOL.md`。

## 実行と範囲

固定snapshot port5266、通常Spaceまたはnative touchを使った独立実行。readonly DEV inspectionからゲージ値を観測して入力時刻を選ぶoracleであり、人間の試遊ではない。モデル、得点、位置、時計を変更しない。Chromium headless/Phaser Canvas経路。実機FPS・音質・片手操作・自然な初回失敗は未評価。

Canonical PC1920×1080 / phone390×844で説明、角度変化、3導入、挑戦、ブレーキ安全枠、選択停止、pause停止、実失敗→Resultを実行した。[原本report](QA/tower-independent/report.json)と[collector](tower-independent.mjs)。各profileは5台の実駐車まで成功、page/console/HTTP error 0。最終collectorが存在しない`#result-screen`のinnerTextを読もうとして両profileのassertionがFAILした。これはテスト基盤の誤りで、実際のResult画像とゲーム状態は得られている。原本を残し、製品を変えずselectorを`#overlay`へ直した。

一方、実画像で以下の製品上の2件を発見した。独立担当は修正を実装せず、Game006担当者へ具体的に伝えた。

1. PC/phone実Resultで外側とResultのBEST V2=1774だが、画面内HUDのBEST V2=0が残る。`QA/tower-independent/desktop-result.png` / `phone-result.png`。担当者はBEST保存後にsnapshotを再描画するよう修正。
2. 通常終了のspecific eventはv2だが、run_start/retry/quit/quit run_end/score/run_durationが版番号を持たない。担当者は各run-specific primitive recordへrulesVersion2を付加。

修正前main SHA256 `6597f7c254db2bf1104ce4a23a3343802d59fd29f5a9fa92d9360e8847c51779` → 修正後 `772c870234d26fcb9601c7983f65c6a3ed2bf0109f1a22e559920529fa3e700c`。Scene/model/input/physics変更なし。原本はsource前後不変・browserClosed=true。修正後独立再検証は完了。PC11台/禁断、phone2台/ブレーキ、Result HUDとretry/quit記録はPASS。source前後不変・全browser閉鎖を確認。

## Game Feel — 実際の観測と推論

最初の10秒では1台目の角度→強さ→走行→PERFECTが成立（PC game time9.66s）。最初の1秒の角度は−37.95°から−36.15°へ変化した。説明は「角度→強さ→任意ブレーキ」で3入力の役割が分かれる。PC3台までgame time29.03s。これはoracleの実行時間であり、初心者成功率ではない。

4台目で先に2枠を選ぶ。広い安全枠と障害車に接近した狭い挑戦枠を同時に見られ、倍率も文字で明示される。選択前はtime/gauge/poseが250ms完全に停止する。決定後は薄い指定外枠が残り、対象外の説明がある。安全路は選択肢として毎回残る。

PC挑戦成功は＋549（基礎490＋NO BRAKE49＋ニアミス10）、続く安全ブレーキは＋400、NO BRAKE0。phoneでも同じ点数となり、実際に異なるリスク選択が報われた。ブレーキ時の軌道/停車は後述traceで独立再確認する。強さ2%を選んだ実失敗は車が手前に残り「強さが足りず、枠に届きませんでした」と出た。衝突でなく不足を説明できる。

pauseはsnapshot全体が250ms停止し、復帰後に新しい操作を受け付けた。失敗→Resultは約300msで、retryボタンとタイトルが明示される。連打/保持/visibility/storage拒否の広い境界QAは担当者の最終native/18unitの証拠を参照し、独立実行したかのようには記載しない。未制動の旧モデル5入力系列bit単位一致は`unit-compat-final.log` / archived baselineに記録される。

技術的な再挑戦動機は「角度/強さ/余裕/ノーブレーキ」の自己修正と安全/挑戦の判断にある、という仮説。人間が面白いと言った、広告を見たいと言った、とは扱わない。

## Visual — 閲覧した実画像

独立で取得したPC/phoneのangle、choice、challenge、brake、earned-result画像を実際に開いた。追加の担当者取得`QA/visual-limited-final/landscape-success.png` / `narrow-result.png`と、現行phone練習2成功/挑戦成功も開いて確認した。基準`../QA/before/006-phone-play.png`も確認済み。画像所有者を混同しない。

- 暖かい駐車券、ミントの広い枠、コーラルの挑戦枠、車3種類が一貫したparking officeの見た目を作る。
- Canonical PCは約800×800の実プレイ盤を保ち、車体の方向/車全体の余裕が判読できる。phoneでは盤面が幅368pxで、左右の枠名は文字と形状の両方から読める。
- 点線予測、向きの鼻マーカー、全車体矩形が視覚と物理の基準を揃える。挑戦を選ぶと非対象が薄くなり、選択自体は色だけに頼らない。
- success popupは枠ラベルから分離され、PERFECT/余裕/加点が読める。上の重要HUDは盤面内、ゲージと確定入力はすぐ下にまとまる。
- 320のResultはretry/titleが入り、landscapeは盤面とレシートを左右に並べる。新しい大画像を生成しなくても、既存素材が機能している。

## 修正後の実結果と最終判定

**Game Feel技術ゲートPASS / Visual PASS 88点（F14/H13）**。担当者が直した2件を別担当として再実行した。新mainのhashは上記`772c8702…`、Scene/modelは据置き。PCの[限定再検証](QA/tower-independent-result-retest/report.json)はPASS。phoneは同runの2台ブレーキ成功後、collectorがparkedの演出待ち中に角度ゲージを要求してFAILした。実状態alive=true/parked=2/phase=parkedを原本に残したTEST_INFRA_BUG。製品は変更せず次angleを待つcollectorに修正し、[phone最終](QA/tower-independent-phone-final/report.json)はPASS。いずれもsource前後不変、browserClosed=true。生ログとcollectorを残す。

- PCは10台に実到達し、モード選択中のtime/pose全体を200ms比較して停止を確認。通常の「入る」で禁断を選び、11台目は挑戦枠へGREAT成功。**+472 = 150×2×1.4（420） + NO BRAKE42 + ニアミス10**。禁断と挑戦の係数は1回ずつで、過剰乗算にならない。次の枠指定も禁断のまま、極狭50×82の見た目・身体余裕2.6pxが実画像に反映される。[実選択](QA/tower-independent-result-retest/desktop-forbidden-choice.png)／[実成功](QA/tower-independent-result-retest/desktop-forbidden-success.png)。序盤の説明に展開を全公開していない。
- ブレーキの実traceはPC16frame/237.7ms、phone16frame/244ms。移動は約213→240px、各frameの距離差が約3.68→0.02pxへ減少して有限距離で停止した。瞬間停止や再加速ではない。曲がる枠の制動成功は初回5台目で実行し、車体が枠の向きに着地した。円弧式を保持するモデルとunit証拠も別に確認した。
- 新しいearned Result画像でPC画面内BEST4297/Result4297、phone画面内BEST470/Result470を一致確認。両画像を実際に開いた。修正前のBEST0画像も保持している。
- 両profileで実Result→Retry→pause→タイトル（quit）を実行。run_start/retry/quit/quit run_end/score/run_durationの全対象recordのrulesVersion=2を確認。イベントをfixtureとして注入していない。
- この独立実行は禁断の「やめておく」native path、3失敗からのCREDIT補充、real phone、音質、実機FPSを評価していない。CREDIT OFFの本構成では広告導線への誘因は対象外。担当者境界QAのvisibility/storage拒否などは明示fixtureで、独立native結果と区別する。

|Visual項目|点|実画像・実動作での理由|
|---|---:|---|
|A identity|14/15|parking officeの券面、道路、枠、暖色が一致|
|B objects|13/15|赤/青/緑の車に向きと車体の厚みがあり、小型phoneでも対象が判別可能|
|C background|8/10|道路と縁石は物理境界に一致、装飾は控えめ|
|D UI|9/10|重要HUDは盤内、文字の枠指定と加点、独立発見したBEST更新漏れは修正済み|
|E composition|9/10|PCは大きな盤面を維持、phone/320の実Resultと横配置の操作が収まる|
|F readability|14/15|広狭2枠、障害車、指定外、点線、grade/余裕/原因が実形状と合う|
|G motion|8/10|実native走行と16frameの減速、短い成功演出が判断を邪魔しない|
|H production|13/15|再利用車素材が機能、練習/結果/ミュート/ポーズまで統一。実機評価は留保|
|合計|88/100|≥80、F≥12、H≥12|

人間A–Nは全て**未実施**のまま。この88点は独立した技術/画像レビューで、ユーザーが面白いと認定した点数ではない。
