# Game031 — 掘って、置くだけ。 / DIG & PLACE

ユーザー発案の新規sandbox。改訂統合指示を正本として、026〜030予約、010退役を保護。基準main dd31ed5818893c1e45c0af304a55f61aab7acc2dから専用worktreeで実装。作者未試遊の技術QA済み試作公開は承認済み。候補表の実装には数えない。

核は歩く→見る→長押しで1voxel掘る→同じ素材の所持数+1→面の外側に1個置く。目的・スコア・時間制限・敵・死亡・クラフト・耐久・入場制限なし。見えない身体の衝突だけで、人物・手・腕・道具は描画しない。既存ゲーム本体・保存・広告・GA4・CREDIT・認証・D1schemaは変更しない。

## 段階と世界

Phase A: X32 Y32 Z32で操作・穴・衝突・IndexedDB確認を先行。Phase B: X128 Y64 Z128、Y上、16³Chunk、自然地表Y48前後＋上16m建築空間。Phase C: 継続編集・保存・phone・統合・公開。練習は独立X12 Y8 Z12で本番保存/所持/統計/RUNを変更しない。

seed + generatorVersion1の整数座標hashで元地形を決定。苔土/土/石/白石/深部岩/青結晶/琥珀鉱/暗色結晶はID1〜8固定、AIR0/境界9。小/中/大空洞、入口、帰還台は独自設計。外周・底・小さな帰還台と頭上は保護。高低差は小さく、無限世界や液体は導入しない。

Three.js0.186.1は描画だけ。露出面をChunkのBufferGeometryへ集約、共有材質、自作低解像度表面模様・面明暗。正規voxelは即編集、Chunkと隣接面のrevisionを更新。一度に1Chunkを近距離優先再構築しworld/chunk/revision照合、古いGeometryをdispose。WebGL2利用不可は説明とPortal、contextlostは世界保持で停止。

## 操作・保存・計測

隠れた幅0.6/高さ1.8/目1.6m身体、重力とsubstep、歩速4m/s、1voxel段差ジャンプ、落下ダメージなし。照準DDA5m、対象変化や中断で掘削進行をリセット。配置は最新面・射程・AIR・所持・身体・保護領域を再検査。一回成功時だけ個数変更。最初0個、99スタック制限なし。

PC: WASD/Space、明示PointerLockでmouse+左DIG/右PLACE。代替はdrag視点+F長押し/G配置。1〜8/wheel素材、Esc休憩。phone: 固定pointer役割のstick/look/DIG/PLACE/jump、二段素材、320px/縦横。cancel/lostcapture/非表示/回転/メニューで解除。TouchGuardは既存の対象領域限定処理。

IndexedDB game100garage-game031/worlds/currentの単一transactionで、schema/gen/block版1、seed/dims/localworldid、player、inventory、stats、最終Chunk差分、revision/時刻を整合保存。操作履歴の無限追記なし。5秒定期＋Pause/終了、明示終了は古い保存の完了後に最新snapshotを再保存。失敗時最後の正常保存とメモリ世界を保持。未対応版は自動再生成せず原本export+明示置換確認。backup16MiB、入力検証先行、import失敗で旧世界を消さない。端末終了直前の保存・他端末同期は保証しない。

本人統計: mined/placed/固定開始高基準maxDepth/activeSeconds/天然素材種類。空洞の「発見数」は未確認推定しない。TelemetryはRUNと世界を分離、60秒/中断で区間差分summary、最終run_endに重複数値なし。seed/worldid/全配置/backup/座標履歴送信なし。新031は本番Worker登録待ち、Portalとgame双方外部送信停止。ローカル保存は同意不要。

## 受入と対象外

単体/型/build、通常入力の穴・階段・橋・100採掘/50配置、保存stress1000/5000/10000は合成fixtureと明記。Desktop/headlessphone縦横320、実画面Visualと入力技術QAを独立。公開では10採掘/5配置、保存再読込、Portalと期待commit配信。本人の面白さ・実機発熱/音/酔いは別の未実施項目。

敵/戦闘/HP/空腹/動物/村/農業/砂崩落/水/マルチ/ログイン/ランキング/サーバー世界保存/CREDIT/動画広告SDK/日次義務は対象外。将来の入場方式はFUTURE_ENTRY.mdの案のみ。
