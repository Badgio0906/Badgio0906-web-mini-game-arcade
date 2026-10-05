# Game019 改訂02 — 独立 Visual Review

**Visual PASS：83/100、F（可読性）12/15、H（完成感）12/15。** 実装者とは別の reviewer が、固定ソースから通常キー／native touch操作で撮影された実画面を `view_image` で確認した。素材の存在、CSS差分、モデル到達性だけで採点していない。ゲームの操作QA、公開、人間の面白さの判定とは独立した結果。

## 証拠と対象版

撮影担当は独立Feel／QA worker、Visual判定はこの別worker。Visual担当はBrowserを起動せず、撮影担当のBrowser slotを共有しない。確認画像一覧とfile hashは [実view記録](QA/visual-independent/VIEWED_IMAGES.json)。素材原本 `assets/game019/frog-preview.png` も確認したが、原本の確認を実画面の点数へ読み替えていない。初期 `integration-first` は採点対象から除外。

- 初回固定撮影：[final-independent](QA/final-independent/SOURCE_SUMMARY.json)、2026-10-05 22:22:02.749～22:27:39.261 UTC。Desktop1440×900、phone390×844、narrow320×568、landscape844×390。before／after一致、Browser終了を記録。
- 最終限定再撮影：[controlled-fall-rerun](QA/final-independent/controlled-fall-rerun/SOURCE_SUMMARY.json)、22:29:35.390～22:34:09.828 UTC。Desktop／landscape。before／after一致、Browser終了を記録。
- 両固定版の19fileの差は `src/games/game019/style.css` 1fileだけ。旧 `930486e2f53a051ccc098a1df72f6fd477899d595d12b19153b79b775c525c28` → 最終 `796adf4ca96028efac56d070a342501d95419a987bb3dc99a4438e00c52f2afc`。追加は短いlandscape media queryに限定したtitle／menu配置で、phone／narrowの適用CSS、物理、map、frog、fontは同一。これをコード差分で照合し、旧phone／narrowとdesktopの有効な到達画像を保持、landscapeは新版画像で判定した。
- Visual記録作成時、再撮影の19file hashと現在fileが一致。新019固有fontとfont-indexも撮影source一覧に含まれる。

初回landscapeではタイトル右panelの「練習する」が画面外となった。[初回画像](QA/final-independent/landscape-title.png)を不採用にし、新版 [landscape title](QA/final-independent/controlled-fall-rerun/landscape-title.png) で3開始buttonがすべてviewport内に見えることを実viewで確認した。この修正前の画像を最終合格扱いにしない。

初回Desktopは200mの実到達画像を取得した後にcollectorの多区間落下assertがFAIL、再撮影Desktopも経路再現のassertがFAILとなった。phone／narrowの初回と新版landscapeはcollector PASS。これらの操作結果は [QA report](QA/final-independent/report.json) と [再撮影report](QA/final-independent/controlled-fall-rerun/report.json) に保持される。**Visualの点をDesktop操作QAの合格へ読み替えない。** 全体の操作合格／再検証はQA担当の責任で別記する。

## 実際に見た内容

Desktopのtitle、説明、練習7、本番charge1／2／max、25.2m受け棚、34.8m苔、100m海／鳥、104m Chapter2、177.7m氷／星、200m結果。Phoneのtitle、3charge、78.1m安全側、海／鳥と200m結果。320pxのtitle、練習3／7、海／鳥、151m風と200m結果。最終landscapeのtitle、練習3／7、64.2mバケツ、78.1m分岐、海／鳥、Chapter2、177.7mと200m結果。

- 緑の体、大きい白目、cream腹、太い暗pixel輪郭が参考方向と一致し、小さな横顔からも蛙と読める。Desktop／phoneの実charge画像は頭と体高が3段階で変わり、maxには力みの小pixelがある。数字のPOWERや本番の正解予測点は出ていない。
- 根、割れた壁、苔、木、バケツ、明るい出口は当たり判定の床と異なる低contrast。実床は明るい上面・暗い底で一貫し、木梁は厚みと暗い腹で別物と読める。大きなcatchには下向き支えがある。狭い足場とcatchの幅の差、上側の次の着地点が画面に現れる。
- 右壁の小地形図、下側の `SHELF / DOWN` 表示、下を見るbuttonがリスク確認の手がかり。地形図は実棚の概要で、着地保証線やcheckpointの表示ではない。
- 暗緑の井戸→明るい青い海／空→紫の星空という進行が分かる。100mでは海の波と鳥が蛙の上に描かれ、statusが「海だ！ ……あっ、鳥!?」、104mで「井の外の蛙、宇宙を目指す」へ変わる。200mは高度／総落下／転落／jump／timeを示す結果へ接続する。
- 風線、旗の向き／長さ／色と、現在・次の風を示す小文字が併用される。左右は環境でも読む手がかりがある。上／下と強度は環境の細い記号だけでは判別しにくく、文字の矢印と「弱／中／強」が主要な補助となる。
- 方向2button＋中央JUMP＋下を見るの配置はPCとportraitで下部、landscapeで右側。練習の達成／次／skipと主操作は別枠で、透明overlayに隠れない。撮影された状態で日本語の欠字、主要文字の重なり、canvasのviewport外拡大を認めなかった。44CSSpxとhit-testの機械判定は操作QA reportを参照し、静止画だけでは操作成功を断定しない。

## A–H 採点

| 項目 | 配点 | 点 | 実画像からの根拠と上限 |
|---|---:|---:|---|
| A. Identity | 15 | 14 | 大きい目の緑蛙、縦井戸、海鳥、風、星へ一続きに変わり題材が明瞭。titleの「溜めて、離して、祈る」と操作も一致。 |
| B. Character / objects | 15 | 14 | 可愛い横顔とwhite eye／腹／後脚。実画像で3chargeの輪郭差があり、bucket／木／苔／ひび／星を区別。320の小spriteは細部評価の上限。 |
| C. Background | 10 | 8 | 壁の光量と素材、井戸出口、海、雲、鳥、氷と星で場所を覚える手がかり。背景の大部分は単色と控えめな反復、海は薄い帯。 |
| D. UI integration | 10 | 9 | cream／深緑／limeがartと一致。高さ／BEST、主操作、任意7練習、結果が同じ見た目。小さいstatus／次風、数値の丸め差を残す。 |
| E. Composition | 10 | 8 | 上側の着地候補と操作を分離。新版横titleは3開始経路が同時に見える。phone titleの余白、320/resultの小art、横結果panelのscrollが上限。 |
| F. Gameplay readability | 15 | 12 | Frog／実床／梁／装飾の明暗を分離。3charge、床幅、catch支え、風HUDが読める。320／横の小frogとm目盛り、上下風の環境記号は文字に依存。 |
| G. Motion / effects | 10 | 6 | chargeの3形、着地pose、鳥を伴うseaとその後の104m、風線／星の複数状態を実captureで確認。Visual担当は連続動画やlive animationを視聴しておらず、補間・速度・音との同期を加点しない。 |
| H. Production value | 15 | 12 | 同じpixel蛙と世界がtitle／練習／本番／海／空／宇宙に統合。新fontと最終横3択は実view済み。簡素な景色、小さいart、結果scroll、未実施の連続motionが上限。 |
| **合計** | **100** | **83** | **80以上、F／H各12のVisual gateを満たす。** |

## 残る上限と人間確認

320練習では蛙が約12～14px、landscapeでも約15～18pxとなる。色・目・腹のシルエットは残るが、初見の人が短／中／最大poseをその大きさで瞬時に認識できるかは未評価。canvas内のm目盛り、地形図の横位置、旗の上下記号はさらに小さいため、HEIGHT・statusを併用する。

320titleの下の補足、320Resultの下の帰還link、新版landscapeResultのretry以下はscrollを使う。初回から必要な3開始buttonを隠した問題は解消したが、すべての結果導線が一枚に収まる設計ではない。Desktopの `THIS RUN 37.0m / BEST36.9m` 等に0.1m差を確認。表示丸めと既存dm保存の差と考えられるが、原因は実装担当で確認する。

この点数は人間の楽しさ、親指での多指入力の快適さ、チャージの体感、実機の画素密度／音／FPS、海や鳥のユーモアの成功、長時間の転落ストレスを測っていない。それらは人間試遊で確認する。Jump Kingの美術・マップと同じかを画像の類似性だけで断定せず、原本／設計の出典はAsset ReportとResearchを参照する。

## 実playサムネイルの独立追加確認

最終compiled版の通常PC操作で20mの苔足場へ実着地した [原画面](QA/production-root-retest/desktop-20m.png) と [採用WebP](../../../public/assets/portal/game019.webp) を別途 `view_image` で確認。緑の蛙の白目／腹／脚、現在の苔床、上の細い石と大きい受け棚、20／25m目盛りが一枚に入り、縦へ登るゲームの内容と一致する。pixel輪郭の滲みや横伸びは認めない。タイトル文字はportal card側で表示する構図。

[候補台帳](../../../assets/game019/revision-02-thumbnail-candidate.json) の原画面／採用画像SHA-256を実fileへ照合し、指定crop→NEAREST比例resize→単色paddingを再構成したdecoded RGBがWebPと完全一致。原画面へ蛙・足場・文字等を合成した素材ではない。サムネイル **採用可**、Visual全体の83点を追加素材だけで上げない。他18ゲームの台帳の不変監査はroot QAを参照。

作成後の操作QAは [QA_REPORT](QA_REPORT.md) のローカル技術PASSを参照。先に残したcollector FAILの歴史記録と、その後のcase別集約／保存統計の限定再検証は別の結果として保持する。
