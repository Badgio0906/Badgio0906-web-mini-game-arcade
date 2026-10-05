# 改訂03 QA

対象015は`candidate-source.sha256`で固定して`tests/game015/probe-risk.mjs`を実行し、終了時に全hash一致を確認した。共通開始UIと全体fontは統合作業中の候補であり、このフォルダは最終production公開の検証ではない。

- `native-final/report.json`: 通常キー／マウス／native CDP touch入力、readonly game/practice診断、44pxとviewport geometry。PC／390／320／横画面の4PASS。
- `native-final/*-deep-fall.png`: 実際のホールド落下。王様、途中の石床、クッションとSOFT CATCH、中央を含むトゲ、距離HUD。desktop画像はthumbnail原本へコピー。
- `native-final/*-hold-practice.png`: 実入力で2枚の普通床を通過し9mクッション着地。
- `native-final/*-impact-practice.png`: 10m石床の衝撃実演。
- `native-final/*-scroll-result.png`: 待機で追走天井死亡、明示された理由。
- `native/`と`candidate-native.log`: 初回候補の失敗証拠。touch harnessの接点リリース不備と、横画面の説明行増加によるviewport超過。報告の原因・修正と照合する。
- `unit-final.log`: 27モデル＋9練習テスト。深いホールド落下、危険維持、距離差、64seed安全経路、5000m継続、6段練習を含む。

Viewports／自動操作は実機の親指操作、音、FPS、人間の面白さの評価とは区別する。独立レビューと公開については統合報告を参照する。
