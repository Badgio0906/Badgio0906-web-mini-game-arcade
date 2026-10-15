# 4工程一括実装の引継ぎ

正本は [最終報告](FINAL_REPORT.md)、[公開履歴](PUBLICATION.md)、[最終source chain](QA/FINAL_SOURCE_CHAIN.json)、[Visual集約](VISUAL_REVIEW.md)。本書の候補記録より、PUBLICATIONの各工程の正式公開結果を優先する。

- 最終ゲームruntimeは `57dce24977e4d3c7dfd42e99315c67fa07bb0243`。後続の公開候補には検証・報告・実終了関数12testを追補。全12対象のゲームsourceとHTML、public assets、build設定の差分をsource chainで区別する。
- active27 / complete9 / hidden4 / retired4 / historical35。番号はactiveをreleaseOrderで導出し001～027。内部ID/URL/保存/記録IDは不変。Game008と完成9本のsrc/HTMLは開始mainから空差分。
- 改修8作は新比較版のBEST/board/eligible保存先、027はrules1維持。旧BEST/旧save/旧8board/旧送信候補を削除・付替えしない。各ゲームの固有報告が保存キーの正本。
- 既存記録Workerは `7089fcf1-38cc-4a7d-8414-d32f41c86c48`。default GETは旧20board、`boards` queryは既知の32boardからcaller subset。旧画面互換のため無指定応答を全32へ変えない。現在のclient records pendingはGame032だけ。新11boardは本番GETで登録確認済み。
- Analytics pendingは021～035を維持、新033～035は明示OFF。記録共有の登録済みとAnalytics送信許可は別。広告/CREDIT/GA4同意方針をついでに変更しない。API token、D1復旧bookmark、短期署名URLを文書/Git/チャットへ出さない。

## 再検証

`npm ci`、`npm run check`、`npm test`、`npm run build`。最終固定aa9716cでcheck・1090tests/102files・公開設定build成功。Workerは `analytics-worker` の既存手順を使う。今回のlocal D1/独立review/本番GETはQAの証拠にあり、本番への架空score/event POSTは実施していない。

公式Pagesは `.github/workflows/pages.yml`。defaultローカルbuildは公式の公開VITE設定と異なることがある。必要なら、公開runtimeから既知の公開設定だけをメモリで読んで再現する（設定値を出力しない）：

```bash
PUBLIC_BUILD_ROOT="$PWD" PUBLIC_BUILD_LOG=/tmp/arcade-unique-build.log node tests/catalog-reorganization/build-public-config.mjs
```

ログは新規pathが必要。配信照合は `verify-publication.mjs` に `PUBLICATION_DIST`、新規 `PUBLICATION_OUT`、対象commit/workflowを指定。HTML/JS/CSS・新作素材・portal thumbnail・fontsまでSHA比較する。

通常ブラウザcollectorは固有の `tests/game033` / `game034` / `game035`、`tests/game015/routes-r04-native.mjs`、catalog-reorganization配下にある。実行時のBASE/source root/commitと新規出力先を必ず指定し、sourceを固定する。共有compiled smokeは `stage2-browser.mjs` のproduction mode、対象ID/幅はenvで指定できる。native modalではopen dialogの帰還リンクを優先し、画面遷移後の入力guardを越えて通常click/tapを行う。失敗原本を成功へ書換えない。

最終Portalは `CATALOG_STAGE=final` の `browser.mjs` で27件を確認。root4幅＋subpathの150項目を確認済み。公開版は `CATALOG_LIVE=1`。QAは全非GETを遮断しattempt0を確認する。headless/touch viewport/readonly診断は、本人や物理端末の試遊と区別する。

## 残す人間評価

今回改修9作と新3作の本人試遊、物理スマホ、音の実機聴感、連続FPSは未評価。完成版認定は追加しない。具体的に試す点は最終報告F。得点/BEST/物理/通常入力の技術合格を、面白さの断定へ変換しない。

## 最終正式公開

4工程とも公式公開済み。第4工程release `9f655a98df410a7dcc3660321afa6ea195e10115`、Pages38767797394 build/deploy成功。配信177file SHA一致、公開12作品×4幅48case/2714checks成功（error/POST0・source不変）。[配信](QA/live-final/PUBLICATION_SHA.json)／[公開操作](QA/live-final-browser/REPORT.json)／[実API14GET](QA/WORKER_FINAL_PUBLIC_GET.json)。記録・報告だけの後続commitでもruntime57dce249とbuild入力が同一であることを確認する。公開後の報告追補に新しいゲーム改修は含めない。

[公開一覧4幅122checks](QA/live-final-catalog/REPORT.json)も成功。27作品・完成9・hidden/retired旧URLとお気に入り/番号/帰還を実公開で確認、pageerror/POST0。全工程の公開後確認完了。
