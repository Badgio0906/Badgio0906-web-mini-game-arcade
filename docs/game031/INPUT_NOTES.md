# Game031 入力境界

基準commit: `dd31ed5818893c1e45c0af304a55f61aab7acc2d`。担当 `/root/game031_input`。所有範囲は `src/games/game031/Input.ts`、`tests/unit/game031-input.test.ts`、この文書のみ。

## 参照と実装

担当開始時に `AGENTS.md`、`docs/GAME_DEVELOPMENT_RULES.md`、`src/games/game031/Types.ts`を読んだ。その後`docs/PROJECT_CONTEXT.md`と`docs/CURRENT_STATUS.md`冒頭を確認した。後者をまとめたtool出力は切り詰められており、全履歴を読了したとは扱わない。最初の読込の厳密な時刻は取得していない。確認できた時計は2026-10-07T23:26:32Z。

`Input`は初期状態がinactive。root画面から`setActive(true)`を呼ぶ。`setActive(false)`は全操作を解除し、取得中のPointer Lockも解放する。コールバック`look(dx,dy)`は既に感度を掛けたradian相当値。rootはyaw/pitchへ直接加算し、pitch制限を担う。`sensitivity`は初期`.0025`、復元する素材は`syncSelected(id)`でホイールと合わせる。

PCはWASD／矢印移動、Spaceの新しいpressでジャンプ、Pointer Lock中の左押しでDIG、右mouse pressで1個PLACE、1〜8／canvas内ホイールで素材選択。Pointer Lockがないcanvas左ドラッグは視点だけを動かす。代替F長押しでDIG、Gの新しいpressでPLACE。`requestLock()`はrootによる明示的な開始／再開操作からのみ呼ぶ。利用できない場合falseとなり、ドラッグの代替操作を使える。旧式ブラウザの非Promise式Lockでは、戻り値と後続pointerlockchangeがずれる可能性があるため、戻り値だけでプレイを禁止しない。

タッチは`#joystick`、canvas、`#dig`、`#place`、`#jump`へ役割を割り当てる。`#palette [data-material]`は素材選択だけ。各指は最初の役割を解放まで保持し、移動／視点／DIGを同時利用できる。PLACEは有効なpointerupで1回のみ。cancel／lostpointercaptureでは置かない。役割ごとのcancelは他の指を解除しない。メニュー切替、非表示、blur、orientationchangeは全状態を解除する。画面停止時に押していたキーのrepeatは再開時に新pressとして扱わない。

Wheel／contextmenuの抑制はactiveなcanvas（および操作ボタン）に限定する。ページ全体のスクロール／文字選択をこのクラスは抑制しない。既存TouchGuardの適用、説明文、pointerup後の画面遷移gesture隔離、44px以上の操作領域はroot画面の責任。

## 実施した検証と限界

`npx vitest run tests/unit/game031-input.test.ts`：2026-10-07T23:27:13Z開始、14テスト成功。純粋なrole状態テスト6件と、native EventTargetを使うDOM adapterテスト8件。移動／視点／DIG同時保持、役割横断、cancel隔離、配置の単発性、ドラッグoff、再開後repeat、Lock解除、ホイール復元、非表示を確認。描画や実機触感の検証ではない。

担当の`npx tsc --noEmit`はInput関連errorなし。23:26:32Z以後の確認では、他担当の実装中`Render.ts:19`でnumeric fillStyleの型errorが残っていた。この結果をrootへ共有し、担当外のファイルは変更していない。最終全体型検査はroot統合QAが実施する。

ブラウザ枠は使用せず、実際のPointer Lock許可、PC mouse／多指CDP、実機iPhone／Androidはこの担当では未確認。

実装途中のコード観察で、左を押したまま右を追加するとmouseの2個目のpointerdownが発生しない標準イベント仕様を考慮し、右配置をmousedownへ整理した。最初の案は`canvasDown`の右pointerdownで直接配置するものだった。整理後にchord／二重配置防止テストを追加し成功した。この順序では実ブラウザ／テストの失敗は観測しておらず、Jev Shadowは呼んでいない。Shadow実施済みとは記録しない。
