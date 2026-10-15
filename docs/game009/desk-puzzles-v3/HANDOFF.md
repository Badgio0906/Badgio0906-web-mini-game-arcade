# 再開地点

[仕様](IMPLEMENTATION_SPEC.md) と [報告](IMPLEMENTATION_REPORT.md) を起点に、固定buildの通常操作と独立Visual／Feel、44px／320・390・844・desktopのレイアウト、pause／再開／保存拒否／reload、ポータルBESTと新比較版を確認する。旧本番のレビュー結果を今回の改修へ流用しない。公開判定と本番URL確認はMain担当。

tests/unit/game009.test.ts（7件）: 全12開始offset×12問題の解存在・隠れた正解の選択防止・依存順／重複入力・ヒント非バイパス・誤答罰・無制限練習と0点・timeout一度・defensive copy・44pxモデル境界。
