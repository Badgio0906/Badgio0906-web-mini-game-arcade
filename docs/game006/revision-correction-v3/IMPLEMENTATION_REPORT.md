# game006 改修実装報告

2026-10-15 UTC。sorting_parking worker担当。今回仕様は[IMPLEMENTATION_SPEC](IMPLEMENTATION_SPEC.md)。旧資料は[旧改修](../../ten-game/IMPLEMENTATION_SPEC.md)／[LESSONS](../../GAME006_LESSONS.md)。

実装済みの変更と保存境界は仕様を参照。共通records/gameVersions/外部登録・カタログはroot担当で、固有ソースに旧boardの書換処理を追加していない。作業中の対象source SHA256は[manifest](QA/SOURCE_MANIFEST.json)。この記録時点は未commit、未公開。

実行した検証：

- `npm run check`：2026-10-15 14:12 UTCの全体TypeScript成功。前の003/009/017作業途中エラーとは区別。
- `npx vitest run tests/unit/game005.test.ts tests/unit/game005-fever.test.ts tests/unit/game006.test.ts tests/unit/game006-revision.test.ts tests/unit/game006-unbraked-compat.test.ts tests/unit/game006-correction.test.ts`：6file、31tests PASS。
- 006衝突テストを明示collision/contact期待へ強化した後、`npx vitest run tests/unit/game006-correction.test.ts`：4tests PASS。

005は3ミス、速度加点、コンボ、8個→6秒フィーバーの開始/終了/再充填、3seed各128個のルール判定、期限固定、境界ミスの二重切替防止を確認。006は6°誤角度が途中曲率反転で駐車成功する一方、同条件無切返しは枠外となる数値証拠、正確な無切返しの方が高得点、一RUN制限、切返し後のブレーキ停止点、縁石contact、旧無制動ルート互換を確認。

対象ブラウザQA・実画像Visual・通常操作Feel・build・本番公開はこの時点では未実施。独立レビューや本人合格と扱わない。Rootから固定候補とブラウザ枠を受けて通常入力4画面QAへ進む。技術モデルで答えを選ぶテストは人間認知や面白さの証拠ではない。

Jev：本担当の新モデル対象単体は初回PASSで、新規findingなし。共有check中の他ゲーム編集中エラーの責任は各担当に分離。別途担当したstage1のfavorite保存findingはrootがShadowを記録し独立レビューへ残した。

## 後続の独立ブラウザ証拠

別担当desk_rainが固定`c057d2f06d931911011a6f202c131140634794b7`で通常入力の独立ブラウザQAを実行した。[初回最終4幅原本](../../catalog-reorganization/QA/stage3-independent-005-006-03/REPORT.json)の006phone390/320/844は切り返し・ブレーキ・駐車・結果・保存を確認。desktop1440の待機timeoutは元pass=falseのまま保持した。同じsourceの[desktop限定再検証](../../catalog-reorganization/QA/stage3-independent-006-desktop-retest/REPORT.json)は53checks PASS、pageerror/POST0。読み取りゲージで通常キー/ボタンの時機を選ぶ技術証拠で、人間の駐車判断・面白さの合格とは区別する。公開確認とVisual最終判定はroot工程報告を参照。


## 一括改修の最終統合・公開状態（2026-10-16 JST追補）

今回のcanonical runtimeは `57dce24977e4d3c7dfd42e99315c67fa07bb0243`。12作品×4画面のcompiled48組とPortal27作品のroot/subpath150項目を確認した。固有の通常RUNと後追い限定差分は [source chain](../../catalog-reorganization/QA/FINAL_SOURCE_CHAIN.json) に分離し、過去の失敗原本を保持する。最新の公式workflow・公開commit・配信SHA・実公開操作は [公開記録](../../catalog-reorganization/PUBLICATION.md)、ゲーム別結果と本人/実機/聴感の未実施範囲は [最終報告](../../catalog-reorganization/FINAL_REPORT.md) を正本とする。以前の「準備中」は各記録時点の履歴。
