# 第1工程 独立コードレビュー

Reviewer: sorting_parking worker（第1工程の実装担当と分離）。2026-10-15 UTC。固定対象 `/workspace/arcade-stage1` commit `07f70a2a580a15a1ecf72e578cf65376e42a9f0e`。ユーザー指示第3〜8節・第67節とGit差分、catalog、portal、favorites、retired HTML、対象単体を読んだ。レビュー対象コードの修正とブラウザ実操作は実施していない。

## Finding

1. **既存hiddenのお気に入りが次回保存時に消える**。`src/portal/main.ts` の `knownIds` がactive `gameCatalog`だけを使う。`readFavorites` → `parseFavorites`はその集合にないIDを除くため、たとえば既存保存 `["game026","game001"]` はメモリではgame001だけになる。その後activeカードのお気に入りを変更すると`saveFavorites`がhidden IDを落とした配列を書き込む。hiddenを表示から除く要件は満たすが、既存保存を保持する要件には不適合。既知ID検証をhistorical catalogで行い、表示・順序はactive catalogで行う境界を維持すればよい。現状のtestsはactive-only fixtureでinactiveの除去を期待しており、この保存保持シナリオを検証していない。Rootへ先行報告済み。Jev Shadow記録・限定修正・再検証はroot担当。

## 確認できた範囲

- completeは指定9作品だけ。developmentStatusと通常タグが分離され、状態絞込みにも接続される。
- historical32 / active24 / hidden4 / retired4。008はactive。
- hidden026/028/029/030はactive catalogから除外、フィルターでもactive判定が必須。元HTML・ゲームソース・records/gameVersions差分なし、従来routeは維持。
- retired004/007/021は旧routeのまま軽量noindex,nofollow案内・一覧リンク。script/canvasを持たずゲームを起動しない。旧HTMLはdocsへ保全、元ゲームソース・assetsは維持。既存010退役は維持。
- displayNumbersForはactiveをreleaseOrder順に並べて001〜024を導出。指定対応表と一致し、favorite/タグの順序・抽出と独立。
- id/releaseOrder/route、recordDefinitions/gameVersions/records、完成9作品の本体に差分なし。元BESTとランキングboardに書込み変更なし。

上記finding解消前に独立レビュー合格とはしない。通常ブラウザ入力、配信URL、実機、人間の遊び評価はこのコードレビューの範囲外。

## 限定修正のコード再確認

Root作業treeの`src/portal/main.ts`でhistoricalGameCatalogのimportと`knownIds = new Set(historicalGameCatalog.map(...))`へ変更されたことを2026-10-15 14:10 UTC以降に独立確認した。render/applyDiscovery/orderingFavoritesの対象はactive gameCatalogのままで、hiddenを再掲載せず既存favorite IDを保持する境界となった。コード上のfindingは解消。固定07f70a2の原判定は保持する。Root担当の実ブラウザ保存シナリオと最終固定source確認は別証拠を参照。

## 独立Visualレビュー（実画像）

2026-10-15、root担当の固定candidate `QA/local-mapping-fixed/1440-root.png`、`390-root.png`、`320-root.png`、`844-root.png`を`view_image`で実際に開いた。Portalの今回変更範囲に対する評価で、各ゲームのグラフィック・面白さの再評価ではない。

**静的UI scopeは86/100相当、F13/15・H13/15。** A〜Hのうち今回の静止一覧に適用できる90点を77点として100点換算（77/90）。Gのmotionは静止画像で確認できず採点しない。動いている演出を見たと偽って通常の8/10等を足さない。

| 観点 | 点数 | 実画像の根拠 |
|---|---:|---|
| A identity |13/15|cream背景、濃紺の文字と枠、黄色のplay motifで既存100ガレのidentityを保持。|
| B object appeal |13/15|実ゲームサムネイルを一覧の主役として保持、番号は小さな黄色badgeに統合。完成/試遊とfavoriteも同じ枠・角処理で整う。|
| C background |8/10|静かなcream gradientで文字とサムネイルを邪魔しない。新たな美術制作ではない。|
| D UI integration |9/10|完成版9/試遊版15、OR/AND、選択条件と24/24が分離し読める。favorite付き024が先頭でも表示番号024を保持。|
| E composition |8/10|1440は4列。390/320では1列、ロゴと説明が自然に改行。フィルター展開中はカードが下へ来るが通常scrollが前提。844の短画面ではfilter途中までの画像で、下部カードはこの画像から判断していない。|
| F readability |13/15|今回の番号001/002/003/024、状態、件数、filter選択のコントラストと字形が明瞭。観測範囲で文字重なりや横の切れはない。44px以上はrootのgeometry QAと分ける。|
| G motion |未採点/対象外|静止画像のみ。motionやfavorite操作の実測はrootのbrowser150checksを参照し、このレビューの実操作結果には数えない。|
| H production value |13/15|既存のPLAY優先card構造とサムネイル、太線と影の処理が一貫。今回範囲に仮素材・文字欠落・不自然な番号重複は見えない。|

独立実画像で追加のblocking findingなし。rootが報告した150check PASS/pageerror0/POST0は本担当の再実行ではない。実機mobile・人間の探しやすさ・ゲーム内play・全24card下部をこの4画像だけで確認したとはしない。
