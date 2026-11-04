# 公開記録 — 2026-11-04 JST

**11作品の改修を本番公開し、公開URLで縦横22画面の起動を確認した。**

- 公開先：https://game100garage.com/
- PR：https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/26
- ゲームソースcommit：`6690706b89cc91101753eeee8eab72e5fb7cd06d`
- 公開main：`7078eb75d3f6f5635392a33a1399817e9f1aa75e`
- PR CI：https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/41817869956 — 成功。型/全体単体テスト/Jev offline/build。
- Pages：https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/41818121454 — build/deployとも成功、2026-11-04 20:04 JST完了。
- 本番確認完了：2026-11-04T20:06:00.551836+09:00

`MOBILE_BASE=https://game100garage.com MOBILE_OUT=docs/mobile-eleven-20261104/QA/production node tests/mobile-eleven-20261104.mjs` で11作品×390/844幅の22画面が成功。HTTP200、必要ファイルの404なし、pageerrorなし、横方向のはみ出しなし、production診断hookなし。012縦画面は案内のみでruntime未起動、横画面は旧engine起動まで確認。

[本番ブラウザ結果](QA/production/REPORT.json)と同フォルダの実画面、[公開source hash](QA/production-source-hashes.json)を保存。013/014の静的moduleと012shellの本番SHA-256は採用ソースと一致した。これは人間の実機音ズレ/面白さ評価を代行しない。

旧Godot runtimeの全hashは保持したmanifestと一致。新得点は端末内の独立BESTで、旧公開board・旧保存を保持。CREDIT全体無効、広告/解析設定、Worker/D1は維持。

この事後記録・本番スクリーンショットは `feat/mobile-eleven-20261104` の記録commitへ保存する。公開mainのゲームソースからの変更は文書/検証証拠だけで、再deployは要求しない。承認はユーザーの今回の明示指示に基づく。Actionsの通常branch→PR→CI→merge→既存Pagesを使用し、新規runner/API契約や課金設定変更なし。
