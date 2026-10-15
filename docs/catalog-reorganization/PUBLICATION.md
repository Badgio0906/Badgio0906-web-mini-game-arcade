# 公開記録

第1工程の実装source f28ce3d。ローカル固定buildと独立レビューを実施。公式 `.github/workflows/pages.yml` へ通常main pushを行い、workflowと公開配信を確認する。成功後にrun URLとSHAを追記。

## 第1工程 — 公式公開成功

main commit `6e371613edfff6123f997259630acbbd98f0c4da`、branch `work`から通常push（force無し）。[公式Pages 38749424619](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/38749424619) build/deployともsuccess。公開URL https://game100garage.com/ 。固定distとHTML/JS/CSS110fileのSHA256一致。4viewport通常公開操作・hidden4旧URL/retired4案内/一覧帰還・complete9/filter/表示番号/hiddenお気に入り保存を検証しpageerror0・POST0。詳細 QA/live-stage1/REPORT.json と PUBLICATION_SHA.json。広告はテスト内だけ空応答、記録APIはテスト内だけ503 fixtureで、実ランキングGETの正常応答と20boardは別途確認。実機/本人試遊は未実施。
