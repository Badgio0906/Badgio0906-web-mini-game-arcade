# ASSIGNMENT — 雨を避けて帰ろう

- task_id: game038-rain-umbrella-20261018
- owner: codex-cloud
- game_id: game038（新作予約、正式一覧/公開は今回対象外）
- branch: feature/game038-rain-umbrella
- upstream: main9e96d557779c5de099fe54c51731ceb131e591a1
- local_base: cab8bef0e6d72146079dd597a6d1eeb4329005e6（Game037/003採用準備。別branch`integrate/game037-game003-20261018`）
- user_scope: 仕様→画面ラフ→キャラクター/asset設計→背景参照ImageGen→最小プレイアブル→調整→QA、記録/HANDOFF。正式完成/公開は認定しない。
- allowed_paths: game038.html; src/games/game038/**; tests/game038/**; tests/unit/game038*.test.ts; docs/game038/**; assets/game038/**; public/assets/game038/**; this assignment/HANDOFF; Codex-managed CURRENT_STATUS.
- protected_paths: 他ゲーム製品・既存背景bytes・公式Catalog/共通Viteの038追加・Analytics/Cloudflare/D1/広告/CREDIT/Secret/CI/runner/billing settings。
- reference: 既存017 rain-city original PNGと配信WebPをread-onlyで使う。specの正本は[IMPLEMENTATION_SPEC](../../game038/IMPLEMENTATION_SPEC.md)。
- acceptance: 3ライン、累計3秒失敗、傘保護、属性得点一回性、spawn、家、title/実練習/結果/retry/休憩、専用保存、PC/touchに対応。固定source/独立model/実画像/通常入力の技術QA、人間未実施を明記。
- remote_constraints: PUBLIC確認だけで無料判定しない。Webhook403/外部連動条件UNKNOWNでpush/PR作成を保留。API/CLI経由のActions起動/再実行/取消/main merge/deployをしない。workflow/予算/契約の無断変更もしない。
