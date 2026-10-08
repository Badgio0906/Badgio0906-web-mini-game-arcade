# Game031 Analytics registration

2026-10-07 UTC。ゲーム公開、本番Worker登録、外部送信、実観測は別状態で扱う。

- **コード登録済み**：client envelope／page allowlist、Worker受信・admin／Codex匿名集計、取得CLI、Catalog／profile。未実装032以降と退役010の受信を拒否。020の本番登録と021〜030のpendingを保持。
- **ローカル検証済み**：登録・CLI・gate等85対象テスト／9files、Worker typecheck、実Wrangler workerd＋ローカルD1の42合成events／13RUN。031は4events（start／2interval summaries／quit）、admin・Codex・CLIから匿名集計を確認。認証の相互分離、非GET拒否、032拒否、世界seed／ID等の拒否、既存ingestを保持。[最終登録コードの合成証拠](QA/integration-20261007T233014Z/WORKER_LOCAL_D1.json)。本番実績ではない。
- **本番Worker登録待ち**：この環境に既存Cloudflare認証がないことをrootで確認済み。新しい認証・権限を作らず、同じ認証失敗を繰り返さない。今回の本番deploy／認証済み031集計確認は未実施。
- **外部送信停止**：`PENDING_WORKER_GAME_IDS`に031を追加。Portalのselected-game送信と031自身の外部収集を停止し、同意ありでもGA／Workerへ送信しない。世界のローカル保存は同意／Analytics RUNの有無に依存しない。
- **031の本番実観測は未確認**：合成採掘RUNを本番へ送信して確認しない。

## 低頻度の集計契約

`game_open`／`run_start`／`pause`／`resume`／`run_end`／`return_to_portal`など既存のライフサイクルを使用。世界IDとRUNを分離し、Pause・帰還・個別掘削は新RUNにしない。練習は本番RUN／保存／統計へ混ぜない。

`specific_game_events`の`event: session_summary`は約60秒の区間、Pause、明示退出時に未送信区間だけを要約する。`active_seconds`、`blocks_mined`、`blocks_placed`、`return_to_surface_count`は区間差分。`max_depth`と`material_types_found`はその時点までの世界最大値／発見素材種類数で、合計しない。`quality_tier`、`save_error_code`は固定の粗い識別語。毎frame・移動・voxel編集ごとの外部送信はしない。

031の匿名`sandbox_summary`は区間差分だけを合計し、`run_end`の累積値を再加算しない。最大深度／素材数は最大を採用。品質と保存エラーは**summary報告件数**であり、人数／RUN数ではない。終了欠測・送信失敗・同意拒否を推定補完せず、`coverage: observed-interval-deltas-only`を返す。日次アーカイブは従来の汎用集計のみで、保存期間外のsandbox区間集計を復元できない。

世界seed、world_id、配置全体、save_file、移動座標履歴、自由入力、秘密を送らない。本番登録後も現物データだけで自動改修しない。

## 後続作業

既存の本番登録権限がある環境でローカル検証済みWorkerを公開し、031の認証済み匿名集計を確認後に、031だけの停止を解除する。登録待ち021〜030を根拠なく解除しない。CREDIT／広告／GA4設定／D1 schema／Secretの追加変更は今回行っていない。
