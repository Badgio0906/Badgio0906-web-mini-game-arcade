# Game021 ならべて4つ — 実装仕様

候補No.28。日本語名「ならべて4つ」、英題「FOUR IN A ROW」。`game021`、rules_version `1`、presentation_version `prototype-1`。今回の正本は [ユーザー指示書](../classic-five/REQUEST.md) の0〜6・11〜19節（親統合worktreeに保存）。このauthor worktreeでは `/workspace/arcade-classic-five/docs/classic-five/REQUEST.md` を読んだ。[読込SHAと日時](QA/INSTRUCTION_READS.jsonl)。

7列6行、交互に1枚、列の最下段の空きへ落ちる。縦・横・両斜めの4個以上が勝ち、42マス非勝利で引き分け。満杯列・不正列・終了後の着手は盤と手番を変えない。色と中央記号を別々にし、緑は●、琥珀は◆。独自の平面盤とアイボリー／青緑／緑／琥珀の幾何学UIを使う。爆弾、盤回転、制限時間、特殊モード、総合得点はない。

Core loopは列を選ぶ→1枚置く→相手の応答→次の手を読む。Skillは空間把握・即時の脅威・先読み。CPUまたは同じ端末の2人対戦。CPUはやさしい／ふつう／つよい、初期ふつう。先手・後手を選べる。短い対局の反復を想定するが、所要時間・難度感は未実測。失敗はCPUの勝利、再挑戦は同じ設定のもう一局または設定変更。

CPUは盤だけを読むWeb Worker。全難度で即勝利と相手の即勝利阻止を先に確認し、やさしいは注入可能なseed乱数選択、ふつうは最大depth3／3000 nodes／100ms、つよいはdepth6／18000 nodes／350ms。完了した深さの最善手へ戻り、合法な中央候補を初期fallbackに持つ。Worker起動不可／error／1800ms以内に応答なしは軽い即勝利・阻止処理へ戻る。世代番号と手数revisionを照合し、pause・undo・title・newでWorkerをterminateして世代を無効化する。

CPU戦の待ったは自分＋CPUの2手。CPU計算中は自分の1手を戻す。後手の最初のCPU単独初手は戻せない。2人戦は1手。ヒントはつよい探索の候補列を示すだけで、自動着手しない。補助履歴は勝敗に罰を与えず記録を分ける。結果後は着手／待ったを受け付けず、もう一局を明示する。

Tap/clickで列全体を選ぶ。左右キーで合法列を巡り、Enter／Spaceで着手。repeat・短い連打・CPU手番中の人入力を抑止する。着地予定マスと最後の着手、勝った全連続駒を静かに表示する。入力はclick一本に集約し、独自drag／pointerdown状態を持たない。共通TouchGuardはTelemetryServiceが導入し、列・ゲーム操作に属性を付ける。説明・リンク・通常scroll・zoomは維持する。

開始は「すぐ遊ぶ／説明を見る／練習する」、未完のsaveには「続きから／新しく始める」。練習は別盤、下段3個のまるを実際に4列目へ置いて4つにつなげる。記録・通常save・本番RUNは変えず、practiceイベントはproduction以外だけ。途中の本番を残したまま練習へ入れる。実際の本番開始で置換を確認し、cancelは練習を維持する。

Pause、Esc、visibility hidden、window blurで入力とCPUを止める。復帰は明示の「続ける」。保存済みCPU手番はreload直後に動かさず、「続きから」後にだけ再探索する。pagehideは保存だけでrun_endを送らない。明示のPortal帰還はquit、明示置換はreset。

独自JSONキー `web-mini-arcade:v1:game021:state` にgame_id／rules_version／設定／seed／列履歴／元run_id／ヒント／待った／outcome／reported／設定別勝敗を一体保存する。色数・gravity・終局後着手の整合は履歴の合法replayで検証し、不正saveを拒否する。読み書き拒否はmemoryへfallback。既存保存キーを触らない。muteは固有prefixの既存StorageServiceとAudioServiceで保存する。

勝敗はmode・難度・先後・補助有無ごと。2人戦は表示した色を基準として説明する。reportedと勝敗加算を同じJSON書込みで確定し、結果の再表示／reloadで再加算しない。Telemetryは既存サービスのgame_open、run_start、run_end、retry、return_to_portal、pause/resume、意味のあるmove/cpu_move/hint/undo/restoreだけ。盤面snapshotや自由文を送らない。既存observerのrun_idを保存し、restoreRunで継続、run_startを再発行しない。Worker登録待ちはremoteCollectionEnabled:false。

RootがCatalog／Vite登録／Analytics allowlist・version／profile／実画面thumbnail／公開／候補表更新を所有する。authorは共通登録・Worker・既存作品・広告・CREDITを編集しない。
