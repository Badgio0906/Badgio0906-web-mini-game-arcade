# Game032 revision01 再開資料

作業branch: `codex/game032-bait-lure-aquarium`。base: e3d7338c8fa0f073e0e3ad7ba419375eed3ad0cd。

現行仕様は[IMPLEMENTATION_SPEC](IMPLEMENTATION_SPEC.md)、モデルは[MODEL](MODEL.md)、美術は[ART_DIRECTION](ART_DIRECTION.md)、操作はゲーム内「説明を見る」。任意練習は時間無制限・BEST/production除外。

再現: `npm ci` → `npm run check` → `npm test` → `npm run build` → `npm run preview -- --port 4433`。固定候補の通常操作は `GAME032_QA_URL=http://127.0.0.1:4433 GAME032_QA_OUT=docs/game032/revision01/QA/<unique-output> node tests/game032/revision01/candidate03-browser.mjs`。出力先は新規・一意にする。PC/390/320/横844の通常入力を行い、仮想時計/RNG/model注入なし。5分期限の明示合成fixtureはcandidate02-browser.mjsへ分離し、実プレイヤー実績とは扱わない。

背景・旧魚素材・Save.ts・BEST key/5field/records board r1は維持。操作と誘引条件は今回指示で変更。水槽は今回釣行の釣果鑑賞用で永続飼育ではない。少年6poseと写真調空水槽の新ImageGen実呼出2回、具体的モデル版はツール非公開。原本/派生SHAとpromptはassets/game032/revision01。

外部Analytics/032オンライン記録は引き続き準備中・無効。認証/許可先不足を回避せず、Worker/Secret/D1/広告/GA4/CREDITは触らない。methodは端末内event/釣果のみで、既存Analytics sanitizerが落とすため方式別本番集計は未対応。旧20boardの基盤を変更しない。

Jevは実findingのみschema2 Shadow。ログ/有効返答/独立判断はQA/JEV_SHADOW.jsonlとJEV_SUMMARY.json。単純PASSや面白さ/公開許可を代行していない。過去失敗は削除しない。新しいfindingは当時の観測を送る。

次に必要な人間評価: [HUMAN_PLAYTEST](HUMAN_PLAYTEST.md)。実機iPhone/Android・聴感・本人の楽しさは未確認。公開詳細は[IMPLEMENTATION_REPORT](IMPLEMENTATION_REPORT.md)とQA/PUBLICATION.json。次033や無関係ゲームへ着手しない。
