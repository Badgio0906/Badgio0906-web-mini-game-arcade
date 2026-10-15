# 公開記録

第1工程の実装source f28ce3d。ローカル固定buildと独立レビューを実施。公式 `.github/workflows/pages.yml` へ通常main pushを行い、workflowと公開配信を確認する。成功後にrun URLとSHAを追記。

## 第1工程 — 公式公開成功

main commit `6e371613edfff6123f997259630acbbd98f0c4da`、branch `work`から通常push（force無し）。[公式Pages 38749424619](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/38749424619) build/deployともsuccess。公開URL https://game100garage.com/ 。固定distとHTML/JS/CSS110fileのSHA256一致。4viewport通常公開操作・hidden4旧URL/retired4案内/一覧帰還・complete9/filter/表示番号/hiddenお気に入り保存を検証しpageerror0・POST0。詳細 QA/live-stage1/REPORT.json と PUBLICATION_SHA.json。広告はテスト内だけ空応答、記録APIはテスト内だけ503 fixtureで、実ランキングGETの正常応答と20boardは別途確認。実機/本人試遊は未実施。

## 第2工程 — 公開候補の固定

`d0252d9dc0b0fdc9ff5bf75bab0895fb2a53b341` を固定してcheck、1031 tests/92 files、buildが成功。実本番相当のcompiled smokeは5作品×desktop/phoneを確認。大きな通常RUNと、後追いevent-only/027横画面CSS/実画面thumbnailの差分は [source chain](QA/STAGE2_SOURCE_CHAIN.json) と [独立browser照合](STAGE2_BROWSER_QA.md) に分離。015の追加操縦・Visual追補後に通常main pushし、公式workflowと実配信を確認する。

015追加操縦と5作品独立技術Visualを確認。最終固定distで5作品×4画面20case・1210checks、pageerror0/POST0/source不変。[最終compiled報告](QA/stage2-release-build/REPORT.json)。このsourceを変えず、証拠commitから公式公開へ進む。

## 第2工程 — 公式公開成功

公開commit `25deef9f88aeabdda83d8bcbb5f0494587260176`。[公式Pages 38760415500](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/38760415500) build/deploy success。[公開5作品×4画面](QA/live-stage2-browser/REPORT.json)は20case/1210checks、source不変・pageerror0・POST0。

[配信155file SHA一致](QA/live-stage2-reproduced-public-config/PUBLICATION_SHA.json)（HTML/JS/CSS・003素材・全thumbnail・fonts2）。初回defaultローカルbuildの61不一致は QA/live-stage2 に保持。公式buildの公開VITE設定がローカルdefaultと異なり依存hashが連鎖変更していた。ActionsVariables読取とartifact保存先へのアクセスは使用できなかったため、公開runtimeの既知設定3つだけをメモリ上で照合し同じ固定sourceを再build、全一致を確認。設定値/認証情報は報告へ出力せず、source/Worker/配信へ追加変更なし。[独立再計算](QA/PUBLICATION_BUILD_ENV_EVIDENCE.json)。人間の試遊/物理端末/実音は未評価。

## 第3工程 — 公開候補の固定

固定a323 sourceでcheck・1045tests/95files・build、005/006独立4幅475項目＋限定22項目、009/017独立4幅8case644項目を確認。006CSS疑似要素の比較版prefix1語だけV3へ追補し、新title写真で再確認。第3工程4作品のゲーム性を追加変更せず、[source chain](QA/STAGE3_SOURCE_CHAIN.json) に差分を限定。[005/006 Visual](STAGE3_005_006_VISUAL_REVIEW.md) と [009/017 Visual](STAGE3_009_017_VISUAL_REVIEW.md) は4作品とも技術基準通過、人間評価は未実施。実画面4thumbnailを採用。公式build設定を再現して最終build後、mainの通常pushへ進む。
