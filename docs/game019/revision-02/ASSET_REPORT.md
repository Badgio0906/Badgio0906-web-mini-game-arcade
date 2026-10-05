# Game019 改訂02 — Original frog / world asset report

Visual方針は[VISUAL_BRIEF](VISUAL_BRIEF.md)、今回のゲーム設計は[仕様](IMPLEMENTATION_SPEC.md)。既存の緑・大きな白目・クリーム腹・暗い太pixel輪郭を持つ32×28オリジナル横顔を継承した。ユーザー参考画像は方向性のみ。Jump Kingのキャラクター／背景／マップや参考画像の貼付・トレース・縮小pixel化は使用していない。Image Generation呼出は0。ライセンスはOriginal project artwork。

## 素材と再生成

[author_frog.py](../../../tools/author_frog.py)は整数座標のpixel polygon／rectangleから独立poseを生成する。旧9poseはbyte単位で保持。新10poseを加えて19poseを出力し、必要な13状態を満たした。旧原本・atlas・preview・台帳・旧author scriptは `assets/game019/legacy-v1/` に保持する。

| 用途 | key |
|---|---|
| Idle | `idle` |
| Charge 1 / 2 / Max | `charge1`, `charge2`, `charge-max` |
| Jump Left / Up / Right | `jump-left`, `jump-up`, `jump-right` |
| Fall / Land / Slip | `fall`, `land`, `slip` |
| Wind Left / Right | `wind-left`, `wind-right` |
| Clear | `clear` |
| 旧描画とのcompile互換 | `charge`, `small`, `medium`, `large`, `wind`, `fail` |

3段階のchargeは、画像scale/squishではなく輪郭・目・脚を整数pixelで別描きした。各alpha bboxの上端は6／10／14px、足は26pxで地面に残るため、しゃがみが見分けられる。旧Idleとの輪郭・大きな目・腹の色を統一。最大時は脚の明色と小さな周囲pixelで力みを補助する。Jump Upは下へ伸ばした脚と上向きの目、左右は伸びた脚、Slipは広がった足、Clearは上げた腕と口で区別する。

`python tools/author_frog.py` で原本PNG・608×28 atlas・1024×1120 preview・TypeScript pixel rows・asset indexを再生成。台帳に各19PNGのfile SHA-256とatlas decoded-RGBA SHA-256を記録。生成を再実行し23fileのbyte一致を確認した。previewを実画像としてview_imageで確認し、13用途と3段階の圧縮を判別できた。これは実ゲームの独立Visual合格を意味しない。

## World renderer

`ChargeBoard.ts` の draw(snapshot, {dt,peek,practice,title}) / resetCamera APIを保持し、360×480論理解像度・24px/mのモデル座標に合わせた。描画cameraとfrogの座標は整数pixelへ丸め、gameplayのfrogは1倍、titleは2倍。旧rendererが行っていたfractional charge squishを撤去。本番の予測点／POWER数値は描かず、practiceだけcharge gaugeを表示する。

12種のsection motifをworld固定で描く。低い場所の暗い濡れ石／水滴、割れた煉瓦、根、苔、木、設備、上ほど明るい光、海、雲／旗、鳥、氷晶、星。背景は低contrastと壁寄りにして、実足場と混同しにくくする。実bucketはropeと桶底、crumbleは亀裂、catchは支え、shortcutは穏やかな金色の縁で見分ける。Blockは物理top `b.y`から下へ `b.height`描き、見た目と天井判定の方向を一致させた。

海100mの波／出口光、model seaProgressに合わせた鳥の羽と足を描く。空の固定wind beltを風線と旗で示し、弱／中／強は旗色・長さ、上／下は縦の風線でも示す。実windの飛行中lockingはmodel/mainの責任で、rendererは時刻乱数による天候変更を行わない。

上寄りsmooth cameraは足元より約14.8m上を見せる。groundedのpeekでは約14.6m下が見え、右壁の小さなshaft schematicは実catch/base棚の横範囲とplayer位置を表示する。底の小表示は下の受け棚の高度と差分を示すだけで、着地を保証する予測／checkpointではない。

## 確認範囲と残る判定

- `python tools/author_frog.py`: PASS。
- 同一再生成のbyte一致23file: PASS。
- 旧9PNGのbyte保持: PASS。
- `npm run check`: PASS（統合中のソースに対するTypeScript compile）。
- runtime/HTML/main/input/model/map/CSS、他ゲーム素材、共通font、global thumbnail ledgerはこの担当では変更していない。
- 実ゲームPC／phone画像による独立Visual判定、pixel密度、風の読み取り、catch案内・titleでの重なりは最終統合後に別workerが行う。Browser QAはこの素材工程では未実施。人間の体感・実機の視認性は未確認。

## 最終実playサムネイル／独立view

Game019だけのportal thumbnailを、最終compiled desktopの通常キー操作で20mに実着地した画面から更新した。原画面は `docs/game019/revision-02/QA/production-root-retest/desktop-20m.png`、crop `[526,422,886,642]` を589×360へNEAREST比例resizeし、640×360の単色paddingへ置いた。新しい蛙・足場・文字の合成はしない。

独立Visual担当が原画面と `public/assets/portal/game019.webp` を実viewし、白目／cream腹の蛙、苔床、上の大小足場が現行の縦ジャンプ内容を表すと判定した。両fileのSHAを `assets/game019/revision-02-thumbnail-candidate.json` に照合。台帳のcrop／resize／paddingから再構成したdecoded RGBが採用WebPと完全一致。独立判定は採用可、総Visual点83を変更しない。確認記録は `QA/visual-independent/THUMBNAIL_REVIEW.json`。
