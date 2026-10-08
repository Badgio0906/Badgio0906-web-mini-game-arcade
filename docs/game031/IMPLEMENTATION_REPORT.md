# Game031「掘って、置くだけ。」技術QA済み試作

**試作公開済み:** https://game100garage.com/game031.html 。runtime `aead0cf218558cbe4ead9a8a4d15251c56070430`、公式Pages **37709128212** build/deploy成功。期待版の公開13file SHA一致後、PC／phone相当の通常操作と保存再読込を確認。[公開証拠](QA/PUBLICATION.json)。本人未試遊の技術QA済み試作。

## 実装と境界

X128×Y64×Z128、Y上、Chunk16³、自然地表Y48前後、上部建築空間。先に32³試験世界で操作・保存を成立させてから拡張した。見えない幅0.6／高さ1.8mの身体衝突と目線カメラのみで、人物・顔・手・腕・道具・アバターを制作していない。目的・制限時間・敵・死亡・クラフト・耐久・強制報酬・入場制限なし。

WASD／Space＋明示Pointer Lock、代替ドラッグ＋F掘る／G置く。スマホは固定役割の多指move/look/DIG/PLACE/jumpと二段8素材。DDA射程5、素材別長押し、原子的取得／配置、身体内・保護領域・世界外・0個を拒否、置いたブロック固定。地上帰還は世界・所持・RUNを維持。説明と独立練習は任意。

Three.js0.186.1は031描画だけ。独自の低解像度表面、配色、hash地層／空洞／結晶。Chunk露出面・共有材質・revision/world照合・近距離1Chunk/frame・破棄Geometry解放、粒子上限48。WebGL2不可は説明、contextlossは世界保持で休憩／復旧。軽量／標準は描画のみ、世界寸法や元地形を変えない。

Block1..8固定、AIR0/境界9、block/gen/save-schema版1。IndexedDBの一transactionで変更Chunk最終差分・所持・位置・統計を整合保存。5秒定期＋休憩／明示終了、最終状態の二度目flushで保存中追加編集を失わせない。未対応版・破損は無断破棄せず原本書出し、確認付き置換。16MiB上限と内容検証後backup読込、失敗で旧保存を維持。端末内保存で他端末同期／終了直前必ず保存は保証しない。旧ゲームのroute/save/BEST互換は維持。

## 検証

- 最終root: check、816tests/71files、build、Jev offline25 PASS。Worker typecheck／実ローカルD1の42合成events/13RUN PASS。QA/FINAL_*とintegration-20261007T233014Z。
- PhaseA32³の穴・落下・段差ジャンプ・自作階段／橋／支持採掘・保存。最終128の通常103採掘/50配置→帰還→ジャンプ→明示保存→再読込で統計/所持を維持。QA/full-world-normal-20261008T001400Z。
- 天然空洞へ通常4採掘で到達。身体2セルが元生成AIR0、中心距離2.630を確認。QA/natural-cave-20261008T002550Z。前方頭上の石を無視して下へ掘り続けた旧試験失敗は保全し、生成や物理を改変して合格にしていない。
- 最終128phone通常10採掘/5配置、2197voxelhashと所持/統計/revisionの再読込一致、練習1/1と本番保存隔離。move/look/DIG3指、役割横断、cancel/lostcapture。QA/independent-full-mobile-20261008T0017Z。
- 390px縦／844px横／320px縦、案内非空でHUD/照準/進行/ボタン/素材と重なり0。QA/independent-final-layout-20261008T0036Z。初回Jump重なり、修正後の照準重なりを別の実画像findingとして残し再確認した。
- PointerLock実利用→採掘→Esc休憩、品質light/standard/auto fresh-frame後dirty0かつ世界/所持/343voxelhash維持、contextloss/recovery、WebGL2不可fixture保存hash維持。QA/independent-final-platform-20261008T0034Z。旧quality待機のstale0を合格へ読み替えない。
- native-IDB1000/5000/10000変更fixture、元地形への差分除去、capture後編集、txabort/Quota注入/拒否/blocked/破損/不正backup/位置安全復帰。10kは48Chunk、JSONbackup67,068bytes、save2.3ms/load1.7ms/復元38.8msの単発。この環境のfixtureであり、実プレイヤー10k採掘・物理容量不足・実機性能ではない。
- 独立AI実画像Visual82/100、F13/H12 PASS。Feelは通常操作の技術成立を評価。人間の面白さ・実機の触感/発熱/音/酔いは未実施。本人未試遊公開のユーザー承認と品質結果を区別する。

Chromium headless1280×900＋ANGLE SwiftShader softwareGPU、編集後120frameサンプル中央値30.6ms/p9554.7ms/max63.5ms、最終27calls/10,948triangles/dirty0。phoneの復帰後29サンプル平均18.4ms/p9533.3msは全操作平均ではない。初期dirty全部を編集時刻に含めた旧2082ms指標は採掘対象遅延ではなかった。対象/面隣接だけへ限定後、実採掘1.7→21.6msで初期queue5→2→0の間も増えないことを確認。全スマホFPS保証はしない。

## 権利・統合・Analytics

素材/配色/地形/UI/短音は独自コード、他社ゲーム素材やアルゴリズム無断流用なし。Three MIT全文を配信して設定からリンク、既存OFL日本語subsetとsystemfallbackを保持。名称は限定Web検索／既存Catalog重複確認で明確な同名ゲームなし。法的ゼロ保証ではない。thumbは実103/50画面の640×360crop/resize/padding、原本・hash・cropをasset-indexへ記録。ユーザー参考画像を実画面や素材へ転用していない。

Portal/catalog/version/Vite physicalroute、client/Worker/admin/CodexCLI/profileの031登録を接続。active30/historical31、010退役、次032未着手。候補表は編集していない。既存Cloudflare認証がないため本番Worker登録・031外部送信・実観測は未実施。コード/ローカル合成検証済みでPortal/game031双方OFF、021〜030pendingも保持。本人保存は同意なしで利用できる。seed/world_id/全配置/backup/位置履歴を送らず、低頻度区間差分summaryで二重合算しない。

Jevは実finding16件（最終ログで確認）、各4問と独立判断。QA/JEV_SHADOW.jsonlと最終HTTP有効性／summaryを参照。単純PASS/buildを回数合わせで送らない。原因/routingの一致は少数記録上の比較で、人間の真値・費用節約・公開許可を証明しない。

基準main dd31ed5818893c1e45c0af304a55f61aab7acc2dから専用tree。15既存worktree・Game018 revision03未commitをBASELINEとcheck-protectionで保全。広告/GA4/CREDIT/認証/D1schema/既存ゲーム本体に変更なし。最初のMD読込の正確な時刻は未記録null、参照commit/path/適用と後続独立読込は記録した。過去の読込や実行を捏造しない。

## 残る制約

本番Worker認証環境で登録・確認後に031停止解除が必要。本人／物理iPhone・Androidの主観試遊未実施。簡素な空／形状・空の案内帯は試作の軽微な磨き込み余地。終了直前の保存・他端末同期はなし。将来入場案はFUTURE_ENTRY.mdの文書だけで、広告SDK/日次token/CREDIT消費は未導入。

## 配信用buildの通常操作

compiled-preview-desktop-after-20261008T0036Zとcompiled-preview-phone-20261008T0040Zの両REPORTはPASS。PC／phone各12採掘5配置、移動約0.87／1.17m、ジャンプ約1.24／1.21m、production診断APIなし、正式backupをメモリで読み地形/所持hash保存再読込一致。Portal30cards/031thumb640×360/Ads script1/解析設定UIを確認。pageerror0・Analytics request0。制限環境による既存Ads外部URLのERR_TUNNEL_CONNECTION_FAILEDは各1件で、ゲーム由来エラーなし。広告を削除・変更して回避していない。

初回compiledPCはゲーム部分PASS後、旧URL形式だけを数えてlegacy3本を落とすPortal試験でFAIL。原本を保持してdata-game-id全cardとlazyimage通常scroll/waitへ試験を修正、再実行でPASS。Portal impressionの旧catalog_version29は現在gameCatalog.length由来へ限定更新、schema/認証/gate/広告は不変。

## 公開確認結果

runtime aead0cfをmainへfast-forward push→公式Build and deploy arcade37709128212全成功。公式CI74hashnamedasset一覧と、同じ公開設定の期待commitクリーンbuildを照合し、index/game031/thumb/関連JS/CSSの13配信file SHA256が一致。現在artifact55,411,965bytesは直接ZIP取得をしていない（32MiBの既知転送制約等）。正確な検証方法と旧helper説明文の限定はQA/ARTIFACT_REFERENCE_METHOD.json。最初の直接Nodefetch DNS EAI_AGAINも保全し、既存設定proxy経由で一致を確認、サイト設定や権限を変えていない。

公開PCは**11採掘/5配置・6所持・4変更Chunk**、phone相当は**12採掘/5配置・7所持・4変更Chunk**。どちらも正規backupを一時メモリで読んだ地形/所持hashと再読込が一致。PC移動約0.93m／jump1.17m、phone move/look/DIG複数指＋cancel/jump約1.17m、縦390/横844/縦320、Portal戻り30cards・031thumb640×360・既存Ads script1・同意UIを確認。DEV診断APIなし、pageerror0／Analytics request0。既存Ads外部通信の環境制約エラー各1件は保存し、広告コード変更で隠していない。作者本人・物理端末の試遊ではない。

公開後PROTECTION_PUBLISHEDは15旧tree/未commit全て一致。資料・公開写真・proxy対応QA runnerのみ後続commitに保存し、runtime sourceの追加変更は行わない。後続公式CI/期待ファイルの再一致は最終チャットで報告する。


差分検査はコード／設定が対象範囲のみと確認済み。保存したraw test stdoutにgit diff --checkのEOF空行警告5件があり、元の実行記録として保持した。ソースの空白問題やテスト失敗ではない。
