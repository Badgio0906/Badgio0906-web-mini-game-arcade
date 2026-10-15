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
