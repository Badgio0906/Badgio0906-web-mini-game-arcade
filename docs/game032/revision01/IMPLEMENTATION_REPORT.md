# Game032 revision01 — 少年・2釣法・水槽

2026-10-10 JST。公式試作公開・実URL確認済み。base e3d7338c8fa0f073e0e3ad7ba419375eed3ad0cd。

背景の生成画像を維持し、麦わら帽子の独自2D少年へ置換。人物は歩かず、クリック/タップ/矢印で川面を選ぶ。準備して離す入力と投げ先を分離し、チャージ長で選択点が変わらない。左右の向きは変えても足位置は固定。

餌＋浮きは不当たりで自動撤収せず待ち直す。全有効地点にアタリの機会を用意し、場所は魚種/サイズ/早い反応の確率差にする。ルアーはクリック/タップを1回ずつ入れて引き、誘引する。合わせ/巻く/緩める、旧得点式、5分標準/無制限練習は保持。

実ImageGen2回で少年6poseと写真調空水槽を制作。具体的な顔/赤服/魚印/網/籠は参照からコピーしない。モデルの具体的版はツール非公開で、GPT Image2.5使用と断定しない。原本/実prompt/ツール結果/派生SHA/anchorsはassets/game032/revision01。新7WebP199188bytes。権利リスクゼロは保証せず、既存背景/魚をそのまま使い、新人物と水槽は独自生成表現。写真調は生成画像で実撮影素材とは称さない。

水槽には実際の釣果が泳ぐ。最新最大12spriteを表示し、総数/種別数は保持。Pause/非表示で泳ぎを止め、細い手機でも最低28CSSpxを目安に魚を見せる。水槽は釣行中の鑑賞用で、永続飼育/同期は今回追加しない。サムネイルは最終固定候補で実際に2匹釣ったDOM画面をresize/paddingしたもの。架空の釣果や生成合成画面ではない。

## 検証・失敗の扱い

- check、root988/85、build成功。最終production相当build成功。offlineJev25成功。
- independent-browser-04：実clock/通常PC・CDPtouch4画面154/154、餌/ルアー8匹、4端点+中央、正しい着水、少年/背景固定、動く水槽/Pause、44px操作center-hit/祖先clip、Portal。pageerror/POST0、固定source/art/font/hash不変。
- candidate02の明示仮想時計fixtureで300active秒/BEST/結果/再挑戦/再読込成功。モデルは以後不変。練習BEST除外も確認。
- 初回途中導入時計fixture失敗、狭い川帯への変更で表面化した端点丸めのunit/browser失敗を保全。成功だけで上書きしない。前者は時計登録前に導入し試験を直し、後者は正確な端点lerpと.001CSSpx以内の入力丸め許容/interval clampで修正。1pxの岸は依然拒否。
- 実Visualで旧labelの照準遮り、ルアーへの浮き文言、手機の小魚表示、原画像上で近点が草に重なることを確認し限定修正。原背景bytesを変えず、川帯Y=.45〜.58と横画面cropを較正。詳細は独立QA/Visual/Art報告。

## 保存・範囲

Save.ts、旧BEST key/5field/r1/旧scoreは不変。元背景、旧魚6、SaveのSHA一致。共通fontは旧1342glyph全て維持して新4字のみ追加。gameVersions/export対象profile/Portalthumbは032のみ。Worker/D1/広告/GA4/CREDIT/他ゲームのソースと設定は変更なし。21旧tree/018の未commit182fileと別STEP2/旧032treeは保全。

外部Analytics/032共有/TOP10は準備中・無効。新たな権限やbackend設定は作っていない。methodは端末内釣果と内部eventにあり、既存sanitizerが除外するため方式別本番集計は未対応。架空RUN/本番POSTなし。

Jevはfinding時だけ実schema2 Shadowで9request/36有効回答（全api_attempted=true/HTTP200/resolved model確認）を使い、回答に依存しない別agentのコード/実画面/通常操作を維持。API成否/4回答/独立判断/採否はQA/JEV_SHADOW.jsonl/JEV_SUMMARY.json/JEV_AUDIT.json。面白さ/画像評価/公開許可をJevへ任せていない。独立原因一致8/9、次証拠一致5/9、false-pass/risk-miss0。ただし全9件で独立追加作業が必要で、低routing値の省略候補0件。少数・問題選択済み標本からレビュー削減や一般的有効性を断定しない。

実機iPhone/Android、音の聴感、作者本人の面白さは未確認。試作公開の承認範囲で進める。[HUMAN_PLAYTEST](HUMAN_PLAYTEST.md)／[再現](HANDOFF.md)。active31/historical32、010退役、次033未着手。

## 公式公開確認

runtime **829f0148595863a42d34a4bcff928025e0aeb941** をmainへpush。公式Pages **38039708161** のbuild/deploy successを確認し、検証したCI相当production buildと公開193fileのSHAが一致（032art22+新thumbを含む）。公開URL：https://game100garage.com/game032.html 。

公開通常4画面 **154/154**、餌/ルアー計8匹は実clockのキーボード/マウス/CDPtouchによる実釣果。別Portal/取消補足 **43/43**：31card・032PLAY実遷移・新640×360thumb decode/配信SHA・AdSense残存・032BEST準備中・3touch cancel/PC Escapeからのfresh resume。pageerror/POST0、source/画像/font/runnerhash不変。ネットワーク方針で遮断した既存backend GETのERR_FAILEDをJavaScript製品例外と混同しない。

出力はQA/public-browser-01、配信一致はQA/public-version-01/VERSION.json、公開概要はQA/PUBLICATION.json。失敗の削除や人間評価の捏造なし。公開・本番登録・実ユーザー受信は別状態で、032Analytics/共有は引き続きOFF/登録待ち。
