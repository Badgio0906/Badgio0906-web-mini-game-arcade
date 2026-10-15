# Game003 v3 実装報告

実装基準main f28ce3d21d53e85b413974f99a6ae1b8abb706e1。実装は未commit、root統合中。

実装範囲と仕様は[IMPLEMENTATION_SPEC](IMPLEMENTATION_SPEC.md)。10種のcompound physics、動的継続、位置/90度回転/落下、芸術counterweight、独立練習、新記録キー、Canvas描画を実装。Art担当のImageGen画像2点を指定pathで参照し、画像ファイルを実view確認済。ゲーム画面での配置評価は後段。

検証:
- `npx vitest run tests/unit/game003.test.ts tests/unit/game003-art.test.ts tests/unit/tower-escalation.test.ts --reporter=verbose`：13/13合格。10種×各quarter angleを含む120回の720step物理simulationでfinite/bounded、静止・penetration境界、回転、空のL字隙間、重心・質量・inertia、実崩壊、採点、resetを確認。実counterweight順序340→340→300でL字contact/COM回復から芸術加点を確認。
- 初回のテスト誤期待2件（compound親part数、上棟が単独落下するfixtureへ下棟大回転を期待）を保全、Jev Shadow実2件AVAILABLE後、回答を見ずに独立コード/幾何検査とfixture修正。最終再検証合格。[JEV_SHADOW](QA/JEV_SHADOW.jsonl)。独立workerによるレビューとは別。
- `npx tsc --noEmit --pretty false`：003関連エラーなし。当時の全体checkは並行017 RelayBoard未使用memberによりexit2。全体final check/buildはrootが統合後に実施する。

未実施: 固定buildでの通常ブラウザQA、PC1440/390/320/844、独立Gameplay/Visual、実ゲーム内ImageGen素材の見え方確認、音声聴感、本人/実機、公開。現時点で合格・公開としない。

旧記録は削除せずrules3へ分離。共通catalog/recordDefinitions/gameVersionsはroot担当。CREDIT/広告/GA4/Worker/D1を変更していない。

横画面の独立Visual finding追補: 844×390の旧固定画像でcanvas150×180 CSS px/建物約36px/重さ約3pxを実view確認。`003-v3-landscape-canvas-scale`としてJev D実記録後、`style.css`だけを限定修正。650px以上・高さ500px以下は左canvas最大420×504px、右score/control/menuの2列にし、短画面で全canvasを縮めず文書スクロールを許可。左右/回転48px・DROP52px、メニュー44pxを維持。TowerSceneの同時root修正には触れていない。数値は新CSS設計寸法であり、新固定build実測/Visualは後段。
