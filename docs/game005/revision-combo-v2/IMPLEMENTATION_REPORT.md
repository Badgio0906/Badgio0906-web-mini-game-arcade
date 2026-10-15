# game005 改修実装報告

2026-10-15 UTC。sorting_parking worker担当。今回仕様は[IMPLEMENTATION_SPEC](IMPLEMENTATION_SPEC.md)。旧資料は[旧仕様](../../GAME002_TO_005_SPEC.md)／[旧改修](../../ten-game/IMPLEMENTATION_SPEC.md)。

実装済みの変更と保存境界は仕様を参照。共通records/gameVersions/外部登録・カタログはroot担当で、固有ソースに旧boardの書換処理を追加していない。作業中の対象source SHA256は[manifest](QA/SOURCE_MANIFEST.json)。この記録時点は未commit、未公開。

実行した検証：

- `npm run check`：2026-10-15 14:12 UTCの全体TypeScript成功。前の003/009/017作業途中エラーとは区別。
- `npx vitest run tests/unit/game005.test.ts tests/unit/game005-fever.test.ts tests/unit/game006.test.ts tests/unit/game006-revision.test.ts tests/unit/game006-unbraked-compat.test.ts tests/unit/game006-correction.test.ts`：6file、31tests PASS。
- 006衝突テストを明示collision/contact期待へ強化した後、`npx vitest run tests/unit/game006-correction.test.ts`：4tests PASS。

005は3ミス、速度加点、コンボ、8個→6秒フィーバーの開始/終了/再充填、3seed各128個のルール判定、期限固定、境界ミスの二重切替防止を確認。006は6°誤角度が途中曲率反転で駐車成功する一方、同条件無切返しは枠外となる数値証拠、正確な無切返しの方が高得点、一RUN制限、切返し後のブレーキ停止点、縁石contact、旧無制動ルート互換を確認。

対象ブラウザQA・実画像Visual・通常操作Feel・build・本番公開はこの時点では未実施。独立レビューや本人合格と扱わない。Rootから固定候補とブラウザ枠を受けて通常入力4画面QAへ進む。技術モデルで答えを選ぶテストは人間認知や面白さの証拠ではない。

Jev：本担当の新モデル対象単体は初回PASSで、新規findingなし。共有check中の他ゲーム編集中エラーの責任は各担当に分離。別途担当したstage1のfavorite保存findingはrootがShadowを記録し独立レビューへ残した。

## 後続の独立ブラウザ証拠

別担当desk_rainが固定`c057d2f06d931911011a6f202c131140634794b7`で通常入力の独立ブラウザQAを実行した。[4幅の報告](../../catalog-reorganization/QA/stage3-independent-005-006-03/REPORT.json)は005の1440/390/320/844でフィーバー・3ミス結果・保存等を確認。006desktopの待機timeoutを含むため、このファイル全体のpass=falseを変更せず保持している。005のDOMに表示されたルールを読み通常ボタン/キーで回答する技術証拠であり、実装担当の人間認知・面白さ合格ではない。公開確認とVisual最終判定はrootの工程報告を参照。
