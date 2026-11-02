# Game060 GAPS SE — 正式公開・配信確認

2026-11-02 JST。対象: [雷、予約しました。](https://game100garage.com/games/thunder_booking/index.html)。

## GitHubとPages

- [PR #22](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/22)を通常merge。
- 製品commit: `76ad79ff`、最終レビュー記録込みHEAD: `7228555dcd94ba44ea4a18ac44be2cf9f76bd048`。
- [PR CI 41386348586](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/41386348586): success。型・1294単体・offline Jev25・全体buildを含む既存workflowが成功。
- 公開main: `e0dfed9bdeb58dba90f9babe45c78242a7077809`。
- [既存Pages 41386645437](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/41386645437): build/deployともsuccess。新workflow/Runner/サービス/課金設定を追加していない。

## 実サイト検証

`node tests/game060/audio-production.mjs`で本番HTTPSを取得・操作し、成功した。[機械可読記録](QA/publication.json)。

- 公開JS `assets/game060-BYgLfMhs.js`とCSSを、ローカルで検証済みのproduction buildとSHA-256で比較し一致。
- 13WAVすべてHTTP200・export manifestのSHA-256と一致。配信manifestも制作台帳と一致。
- `/games/trial-build.json`の試遊22件を維持。公開カタログと他作品を変更する差分はない。
- 公開ゲームを1280×720と390×844で開始し、全13音を実WebAudioでデコード。
- PCはmouse click、スマホ相当contextは実touchscreen tapで、開始gesture消費→予約→6機一撃を実行。GAPSのreserve/thunderSix再生を確認し、pause時は残留0音。
- pageerror・HTTPエラー・外部リクエスト0。productionのゲーム診断hookや検証用音声instance参照を含めない。WebAudioを観測する計測コードはテスト側だけに注入。
- 実画面: [PC](QA/published-1280.jpg)、[スマホ幅](QA/published-390.jpg)。

人間の聴感、実スマホの物理スピーカー、実iPhone Safariの受入は未確認。公開成功をそれらの合格へ読み替えない。

## 記録の保存先

製品と制作・事前検証証拠はPR22によりmainへ反映済み。この事後公開記録と公開検証script・JSON・画像は `docs/game060-gaps-publication-20261102` branchへ保存する。このbranchの製品コードは公開mainと同じで、事後記録の保存でPagesの再公開は起動しない。
