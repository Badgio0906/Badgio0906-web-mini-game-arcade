# 4作品のドット絵化撤回 — 2026-11-01

## 対象と復元

作者の「ドット絵を指示した4つのゲームを元へ戻す」に従い、ドット絵化だけを撤回する。
基準main: `7209da2f92a61c1137466192f0a5ecd9238005e8`。独立branch `fix/revert-pixel-art-four-20261101`。

| ID | 作品 | 復元元 |
|---|---|---|
| 046 | ピンボール、出力1000％。 | `assets/game046/publication-20261101/baseline-distribution/`の8 WebP。rendererは`d49f3845`と完全一致 |
| 050 | 帰り道も、必殺技。 | `assets/game050/publication-20261101/original-distribution/`の8 WebP。DPR対応の滑らかなCanvas表示へ復帰 |
| 060 | 雷、予約しました。 | `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/src/art.ts`の元コード描画と正方形portrait比率 |
| 061 | ずらして、全段ぶち抜け。 | `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/src/art.ts`の元コード描画と正方形portrait比率 |

低解像度240固定・pixelated・補間禁止を解除し、元のDPR対応を復帰。060/061は生成画像の別案ではなく、受領した元試作版のproceduralアートへ戻す。元コードのBLOCKED_ART注記は当時の履歴として維持し、新しいImageGen制作済みとは扱わない。ドット絵原本・プロンプト・旧QA・未参照の配信画像は証拠保全し、今回使用しない。

4作品だけのpixel-artタグを外し、Jev用カタログmirrorを同期。4枚の一覧サムネイルは復元版の実プレイ画面へ更新し、`assets/portal/thumbnails/asset-index.json`へ記録。

## 維持確認

- 046のコンボ花火、フリッパーSE半音量、GAPSを維持。renderer復元元に既に花火層が含まれている。
- 050の易化済みモデル、全4作品の入力・ルール・保存・BEST・音・ページ帰還を維持。
- model/audio/storage/GAPS・他ゲームソース・広告/同意/解析・Worker/D1・CREDITは差分なし。
- カタログ50作品（完成9/試遊41）、031/048公開保留、削除4作品を維持。
- 保全した素材のbyte/hash一致は [復元証拠](QA/restoration-integrity.json)。

## 検証

環境: Linux、Node 24.19.0、ローカルChromium、DPR2。実iPhone・人間の聴感/面白さは未実施。

- `npm run check`: PASS。
- `npx vitest run tests/unit/game046* tests/unit/game050* tests/unit/game060* tests/unit/game061* tests/unit/prototype-publication.test.ts tests/unit/catalog*`: 9 files / 60 tests PASS。
- 4個別Vite build（qa）: PASS。
- `npm run build`: PASS（公開50作品を維持する本番構成）。既存Game018 CSS構文/Phaser chunk警告は継続、今回変更なし。
- qa個別build: 4作品×1280×720 /390×844 /320×568 /844×390 =16ケースPASS。
- 実本番構成distをローカルHTTP配信: 同16ケースPASS。
- 両群で起動・通常キー/クリック/タップ代表入力・pause/resume・Canvas可視範囲・横overflowなし・帰還リンクを確認。pixelatedなし、smoothing=true、描画解像度はDPRに追従し固定240ではない。pageerror/asset HTTPエラー/外部通信0。
- フルRUN再攻略は未実施。モデルを変更していないため、今回の結果を新しい全編攻略の証拠にしない。
- 独立レビュー担当が元ファイルとのbyte一致/差分を確認。PC・320幅の計8実画像で重大な欠け/重なりなし。046の320幅は既存ヘッダー名省略あり。動作中の視認性や実機合格の認定ではない。
- unitが生成した共通 `qa/strategy-comparison.json` は今回QA内へ退避し、既存原本を復元。製品差分や既存QA上書きへ含めない。

[qaブラウザ](QA/browser/report.json) / [本番構成ブラウザ](QA/production/report.json) / [build log](QA/build.log)

## 試遊用ZIP

`/workspace/100gare-restored-art-four-20261101.zip`（1,587,312 bytes）。ソースcommit `4e577055`。新規フォルダーへ展開し `START_PREVIEW.cmd`、`http://127.0.0.1:8480/` を開く。4作品の起動・一覧帰還とmanifest全file SHA一致を確認。[配布検証](QA/delivery.json)。既存ZIPを上書きしない。

## GitHub・本番

この復元はローカル候補。main/本番は変更していない。前回の「通常公開1回」の費用不明点了承はPR20で完了済みのため流用しない。
今回確認でもリポジトリPUBLIC・既存標準ubuntu-latest。一方Webhook一覧とaccount billingは403でUNKNOWN。以前の作者指定「費用条件不明ならpush前停止」に従い、今回分の了承前はpush/PR/Actions/Pagesを実施しない。新規課金/API/サービス/設定変更・AdSense再申請なし。

## 次の3手

1. 作者が復元版の画面または個別プレビューを確認。
2. 今回分の費用UNKNOWN了承後、通常branch push→PR/既存CI→main通常merge→Pages通常公開1回。
3. 公開版4作品の素材/描画/導線と50作品維持を確認。旧版ZIPは上書きせず別版名で配布。
