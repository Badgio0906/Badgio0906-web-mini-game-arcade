# 原本と限定修正

- `native.log` / `native/`：共有checkoutViteで開始した未完試行。並列HMRの危険に気づきsnapshotへ移行。正式合格へ集計しない。
- `native-final.log` / `native-final/`：snapshotの5218が他serverと競合し起動は5219へfallbackしたがcollectorが5218を使用。phone再読込でconnection refused。検証先不一致の基盤失敗。原本保持、正式合格へ集計しない。
- `native-isolated.log` / `native-isolated/`：5238 strictPort／専用Vitecache、同一game008ソース。4画面通常キー／CDPtouch、1杯とphone追加2杯、保存・旧BEST・mute・pause freezeを記録。
- 初回layoutの一覧リンクはphone42px／narrow37pxだった。3択と主操作は44px以上。製品のタッチ領域不足として `.arcade-portal-back{min-width:44px}` のみ限定修正、配達モデル・絵・入力は変更なし。修正後の全4layoutを別記録へ保存する。
- snapshot-only対象型check初回はvite-env.d.tsをincludeしていないためImportMeta.env/hot型不足。実装の型不具合でなく対象テスト設定不足。snapshot tsconfig008へvite/client型を加え、元src/configは変更せず再検証。原本 `type-targeted-first.log`、修正後 `type-targeted.log`。
- 独立elevator reviewerがshort landscapeのcanvas縦圧縮をVisual blockerとした。1200×900素材が約826×244へstretchし器・腕が横広になる。max-height500限定object-fit:containで比率を維持するCSS修正。配達physics/input不変。修正後全4layoutで44px・viewport・HTTPconsoleを確認、さらに独立実viewを要求した。
