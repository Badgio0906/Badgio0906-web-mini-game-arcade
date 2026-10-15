# Game027 revision02 — ターン表示

2026-10-15。盤面の上に独立した大きなターン帯を追加。自分、CPU、プレイヤー1/2、球が移動中、白球配置、一時停止、勝敗をmatch/phaseから導出する。名前と文章で識別し、黄/青/落ち着いた灰青の色も補助に使う。帯は盤面や操作に重ねず、狭いportrait/landscapeの高さ予算を調整。自分の操作開始時に短い音、CPUは思考表示の後に350msの「CPUがショットします…」を出す。

CPUの予兆は既存generation/timerキャンセルへ統合し、休憩、離脱、リスタートで遅延ショットが発火しない。既存CPU精度・chooseShot関数・物理・勝敗・保存format・BESTは変更していない。rules_version 1を維持、presentation_version turn-banner-2。予兆中pause/reloadでは通常の保存snapshotからCPU思考へ戻り、新たな予兆を出してから打つ。

実行済み：既存rules13、save/input11、physics14、match1、planner1の40件PASS。新turnView4件はCPU/2人戦、移動中の撃者、白球配置、思考/予兆、pause/help/confirm/result/practiceを確認。024と合わせた追加境界群42件PASS。checkの実行時点では003編集中の型エラーにより全体が停止し、027範囲の型エラーなし。最終check/build/全体testsはrootが担当。

新たな独立Jev findingは0件。成功数のためのAPI送信は行わない。独立worker Gameplay/Visual、固定build browser通常操作（CPU/同端末2人戦/ファウル/配置/再開）、本人/実機/音、本番公開は未実施。固定sourceで再開して実画面の帯・操作・viewportを確認する。既存原報告はdocs/game027配下に保持。

## 標準イベントの限定追補

既存abandon(current)へ標準quitを1回追加。trackのtraining除外とcurrent=nullによる冪等性を維持。対局/ファウル/勝敗/CPU/保存やCSSは変更しない。

根拠は`docs/catalog-reorganization/QA/standard-events-024-027-035/`。3mainの変更前後hashと差分を保存。既存対象8file/92testと、実mainの終了関数を抽出・transpileして隔離VMで実行する12testが成功、TypeScript check成功。VMは描画・通常入力・本番通信の試験ではない。desk_rainがJev回答未読で独立readし、追加event文だけを除くと3mainがbefore hashと完全一致すること、練習除外とrun_end重複なしを確認。Jevは各game1件、実3HTTP200/12回答、独立注釈3件成功。既存大型gameplay QAはevent追補前のsourceで継続し、この限定検証を全sourceの同一版QA合格と扱わない。外部POSTは試行せず、remote/同意/登録gateは不変。


## 一括改修の最終統合・公開状態（2026-10-16 JST追補）

今回のcanonical runtimeは `57dce24977e4d3c7dfd42e99315c67fa07bb0243`。12作品×4画面のcompiled48組とPortal27作品のroot/subpath150項目を確認した。固有の通常RUNと後追い限定差分は [source chain](../../catalog-reorganization/QA/FINAL_SOURCE_CHAIN.json) に分離し、過去の失敗原本を保持する。最新の公式workflow・公開commit・配信SHA・実公開操作は [公開記録](../../catalog-reorganization/PUBLICATION.md)、ゲーム別結果と本人/実機/聴感の未実施範囲は [最終報告](../../catalog-reorganization/FINAL_REPORT.md) を正本とする。以前の「準備中」は各記録時点の履歴。

最終集約候補aa9716cでcheck・1090tests/102files・公開設定build成功。最終第4工程release `9f655a98df410a7dcc3660321afa6ea195e10115` の公式Pages [38767797394](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/38767797394) はbuild/deploy成功。工程別公開日と固有RUNのsourceは上記正本へ分離してある。
