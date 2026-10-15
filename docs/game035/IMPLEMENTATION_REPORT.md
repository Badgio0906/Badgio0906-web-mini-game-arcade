# Game035 — 実装・技術検証

2026-10-15。「1ミリカーリング ～MINI CURLING～」をCanvasで新規実装。3エンド各最大3投、dragで向き/強さを決めて離す投球、等質量の円形衝突と全色共通摩擦、開始配置の青い相手石、赤い自分の石。中心への寄せ、相手石の排除、ガード、残り投球、好配置の連続による独自採点を実盤面から計算する。空の氷面へ最大パワー直進するだけでは中心に止まらない。

練習は相手石なしの1投を繰り返し、中心内へ寄せる実操作が成功条件。本番は3エンド完了totalのみBEST。途中退出と練習を分離。保存は全位置/速度/エンド/投球/得点内訳/連続好配置/run ID/報告flag/BESTを含み、飛行中でもpause/reloadで明示再開する。保存拒否ではメモリ継続。個人BEST/runsの完了加算は一度。保存キーはgame035専用で既存ゲームに変更なし。

Art Directorによる実OpenAI ImageGen氷面/赤青花崗岩stoneを実view後に採用し、WebPを実canvasに読込む。正確なハウス/ガイド線/滑走跡/影はCanvasで動的描画。素材制作の詳細はasset-indexとART_DIRECTIONを参照。架空のゲーム画面ではなく、実画面をQAへ保存。

## 実行済み

- `npx vitest run`の担当9files/93tests成功。035は11tests、100試合×9投、有限な静止、同一摩擦、理論停止距離、衝突連鎖、3投制限、正確な採点、3エンド完了/二重採点防止、inflight同一復元、破損/保存拒否を確認。024/027の既存と追加82件も成功。
- `npx vite build --config tests/game035/vite.config.mjs`で035専用production build成功。通常の非module navigation scriptとpublic CSS参照のVite警告が出るが、そのpublicファイルはdistへコピーされて通常ブラウザで動作。固定sourceとbuild hashはQA/SOURCE_FIXED.json、BUILD_HASHES.json。
- `node tests/game035/browser.mjs`：最終生成stone統合版の1365×900、390×844、320×740、844×390すべてPASS。production診断hookなし。全4viewportで通常drag練習成功、BEST非混入、氷面viewport内、主要button44px以上、横overflowなし、飛行中pause/reloadで位置速度一致、明示再開、title退出の保存解除を確認。
- PC通常drag9投で3エンド完了4853点、個人BEST4853点、runs1。結果reloadでruns重複なし、リトライ成功。全pageerror0。ブラウザ/contextは終了済。
- 最終実証は`QA/browser-2026-10-15T14-18-29-447Z/RESULTS.json`と実png。初回Canvas石版`browser-2026-10-15T14-16-32-448Z`とPRE_STONE source hashも保全した。最終見た目だけを後段判定の対象にする。

全体`npm run check`も実行。担当035/024/027の型エラーは解消。最後の実行では統合中の`src/records/currentRules.ts:29`の別範囲TS2367で停止。最終check/build/全体testsとCatalog/records/Analytics/Vite登録はrootの統合検証で確定する。固有buildと全体buildを混同しない。

035で新たなJev対象findingは0件。単純な型エラー修正やPASS数をAPIへ送信しない。独立Gameplay/Visualレビュー、本番公開/配信版照合、本人の面白さ、物理スマホ、聴感は未実施。ブラウザはtouch-capable viewportでもdrag入力自体はmouse PointerEventであり、実タッチの技術検証と呼ばない。これらを最終成功へ読み替えない。

2026-10-15 14:25 UTC 追補：独立担当towerがBFCache復帰で閉じたAudioContextが再生成されないfindingを観測。pagehideのpersisted時はpause/persistだけを行い、非persisted時だけdestroyする限定修正とonce解除を実施。旧固定prodではfixtureがclose発生でFAILし、その原本をAUDIO_PERSISTED_BEFORE.jsonへ保全。新固定prodでsynthetic PageTransitionEventの1回目/2回目persisted close0、pageshow後gestureのoscillator生成継続、非persisted close1を確認してPASS（AUDIO_PERSISTED_FIXED.json）。model11件も再PASS。実際のBFCache navigationと音の聴感を確認したとは報告しない。SOURCE_FIXED/BUILD_HASHESは限定修正後へ更新し、PRE_AUDIO_FIXも保全。通常4viewport/9投の証拠は音修正前の生成stone版、最後の音fixtureは修正後の版で、同一版の証拠と混同しない。Jev finding/独立注釈はtowerが担当。

## 標準イベントの限定追補

既存abandonの!training/snapshot/!reported guardへ標準quitを1回追加。既存score/best_update/run_endは変更せず、終了済み/練習/欠落snapshotへquitを増やさない。

根拠は`docs/catalog-reorganization/QA/standard-events-024-027-035/`。3mainの変更前後hashと差分を保存。既存対象8file/92testと、実mainの終了関数を抽出・transpileして隔離VMで実行する12testが成功、TypeScript check成功。VMは描画・通常入力・本番通信の試験ではない。desk_rainがJev回答未読で独立readし、追加event文だけを除くと3mainがbefore hashと完全一致すること、練習除外とrun_end重複なしを確認。Jevは各game1件、実3HTTP200/12回答、独立注釈3件成功。既存大型gameplay QAはevent追補前のsourceで継続し、この限定検証を全sourceの同一版QA合格と扱わない。外部POSTは試行せず、remote/同意/登録gateは不変。


## 一括改修の最終統合・公開状態（2026-10-16 JST追補）

今回のcanonical runtimeは `57dce24977e4d3c7dfd42e99315c67fa07bb0243`。12作品×4画面のcompiled48組とPortal27作品のroot/subpath150項目を確認した。固有の通常RUNと後追い限定差分は [source chain](../catalog-reorganization/QA/FINAL_SOURCE_CHAIN.json) に分離し、過去の失敗原本を保持する。最新の公式workflow・公開commit・配信SHA・実公開操作は [公開記録](../catalog-reorganization/PUBLICATION.md)、ゲーム別結果と本人/実機/聴感の未実施範囲は [最終報告](../catalog-reorganization/FINAL_REPORT.md) を正本とする。以前の「準備中」は各記録時点の履歴。

最終集約候補aa9716cでcheck・1090tests/102files・公開設定build成功。最終第4工程release `9f655a98df410a7dcc3660321afa6ea195e10115` の公式Pages [38767797394](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/38767797394) はbuild/deploy成功。工程別公開日と固有RUNのsourceは上記正本へ分離してある。
