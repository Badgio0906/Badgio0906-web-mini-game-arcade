# Game027 revision02 — ターン表示

2026-10-15。盤面の上に独立した大きなターン帯を追加。自分、CPU、プレイヤー1/2、球が移動中、白球配置、一時停止、勝敗をmatch/phaseから導出する。名前と文章で識別し、黄/青/落ち着いた灰青の色も補助に使う。帯は盤面や操作に重ねず、狭いportrait/landscapeの高さ予算を調整。自分の操作開始時に短い音、CPUは思考表示の後に350msの「CPUがショットします…」を出す。

CPUの予兆は既存generation/timerキャンセルへ統合し、休憩、離脱、リスタートで遅延ショットが発火しない。既存CPU精度・chooseShot関数・物理・勝敗・保存format・BESTは変更していない。rules_version 1を維持、presentation_version turn-banner-2。予兆中pause/reloadでは通常の保存snapshotからCPU思考へ戻り、新たな予兆を出してから打つ。

実行済み：既存rules13、save/input11、physics14、match1、planner1の40件PASS。新turnView4件はCPU/2人戦、移動中の撃者、白球配置、思考/予兆、pause/help/confirm/result/practiceを確認。024と合わせた追加境界群42件PASS。checkの実行時点では003編集中の型エラーにより全体が停止し、027範囲の型エラーなし。最終check/build/全体testsはrootが担当。

新たな独立Jev findingは0件。成功数のためのAPI送信は行わない。独立worker Gameplay/Visual、固定build browser通常操作（CPU/同端末2人戦/ファウル/配置/再開）、本人/実機/音、本番公開は未実施。固定sourceで再開して実画面の帯・操作・viewportを確認する。既存原報告はdocs/game027配下に保持。
