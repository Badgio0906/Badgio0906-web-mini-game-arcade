# 第2バッチ 引継ぎ

正本：[REQUEST](REQUEST.md)→優先[ADDITIONAL_INSTRUCTIONS](ADDITIONAL_INSTRUCTIONS.md)、現状[報告](IMPLEMENTATION_REPORT.md)。026を公式Pages成功→期待artifact配信SHA照合→通常PC/phone完走→Portal→Sheet A33だけ済/読戻し、続いて027/A47、028/A11、029/A42、030/A49を同順で公開する。今は026公開前、他4本は未統合。

固定QAと再現collectorは各docs/gameNNN/QA・tests/gameNNN。026 integrated freezeはSOURCE_FREEZE_INTEGRATED.json、GAME026_FREEZEで明示指定し当初freezeを上書きしない。各collectorは新しい出力dirを必須とし、実ブラウザを同時起動しない。027通常終局と029phone休憩は未完了、public HTTP200だけで済にしない。

公開前の型check/root全test/build・ローカルD1、既存tree保全・差分範囲を確認。git add -A禁止（将来ゲームreview証拠が未追跡で同居）。Game018や棒試作・旧枝変更は取り込まない。公式pages.ymlのみ、Secret/CF権限等の新規作成なし。Worker deploy blocker継続、新作Analytics外部送信停止。

作者本人／物理スマホ試遊は未実施。公開承認とは別に記載。権利は独自表現と限定検索根拠、ゼロ保証ではない。Jev利用のHTTP/モデル/有効返答・独立判断・手順逸脱を最後に監査する。
