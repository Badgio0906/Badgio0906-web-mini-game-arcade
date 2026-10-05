# Game019 実装報告

[仕様](IMPLEMENTATION_SPEC.md)に従い、オリジナルの精密上昇ゲームを追加した。360×640、10px/mの上向き世界、固定120Hz stepping、方向を跳ぶ前に確定する小／中／大ジャンプ。苔・崩れ・狭い寄り道・天井／壁・海100m・予告風・宇宙200mを固有モデルに分離した。

32×28の蛙9状態は[author_frog.py](../../tools/author_frog.py)でオリジナルのpixelを制作。画像参照は緑、白目、cream腹、太い輪郭の方向だけを利用し、画像自体は貼らない。PNG原本と[台帳](../../assets/game019/asset-index.json)を保存。ゲームの背景とspriteはCanvasで描く。ImageGen追加呼出0。

初回3択、6操作ボタン、90ms予備動作、予測点、現在／次の風、pause、mute、BEST、retryと帰還。練習は別modelで4段、実際のjump＋landingが成功条件。練習の右大ジャンプと配置の一致は独立レビュー指摘で修正。BESTだけを0.1m単位で保存し、位置saveなし。100mのshore床はそのrunの足場。落下は復帰イベントで、死亡として記録しない。

モデル13・独立練習4テストPASS、統合284unit PASS、TypeScript／build成功。4windseedの公開jump入力による海／宇宙到達、予測side-effectなし、転落回復、崩れ足場、停止と復帰を検証。ブラウザの実入力・失敗・修正・最終配信の正本は[統合報告](../integration-2026-10-05/IMPLEMENTATION_REPORT.md)。

独立[Feel](GAME_FEEL_REVIEW.md)／[Visual](VISUAL_REVIEW.md)と[QA](QA/)を保持。初回横画面tap遮断とgrid過大を発見し、画面境界を強化。4profilesの通常tap練習と全画面境界、独立した横画面200m到達の再検証もPASS。失敗の原本を保持。PC・390・320の通常キー／touch到達を人間評価へ読み替えない。[人間試遊](HUMAN_PLAYTEST.md)未実施。320練習の小さなfrog/targetは判読性の上限。料金・Codex tokensは取得不可でnull。
