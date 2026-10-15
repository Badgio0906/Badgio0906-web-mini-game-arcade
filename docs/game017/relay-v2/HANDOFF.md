# 再開地点

[仕様](IMPLEMENTATION_SPEC.md) と [報告](IMPLEMENTATION_REPORT.md) を起点に、固定buildの通常操作と独立Visual／Feel、44px／320・390・844・desktopのレイアウト、pause／再開／保存拒否／reload、ポータルBESTと新比較版を確認する。旧本番のレビュー結果を今回の改修へ流用しない。公開判定と本番URL確認はMain担当。

tests/unit/game017-relay.test.ts（8件）: 予告と風向き、100seedの屋根間距離、dash制限、異常dt、休憩回復と放置0点、100濡れ終局一度、通常待機／移動／dash方策で3seed全11屋根完走、練習分離、defensive copy。旧 tests/unit/game017.test.ts（23件）も合格。
