# 記録Worker拡張時の旧画面互換

2026-10-15。既存frontendは未知のboard IDを含むpublic BESTレスポンス全体を拒否する。Workerを32boardへ拡張してから旧ページを再読込しても、すでに開いている旧タブでも、従来の20board応答を受け取れるようにした。`schema_version`、`definition_version`、公開行のfieldsと60秒cache、Origin境界、投稿/取消/旧D1の扱いを変えない。

frontendはGET `/v1/records/public/bests?boards=<自分のrecordBoardsのboardIdをcommajoinしてURL encode>`を送る。board IDだけの公開メタデータで、識別子・保存・credentialをqueryへ含めない。stage2 frontendならその版で既知のboard群、最終版なら32boardを指定する。

Workerは`boards`を唯一のquery parameterとして受け付け、非空・64件以下・既知のpublic boardのみ・重複なしを検証。指定順のsubsetだけを返し、SQLもbindしたboard IDで絞る。無指定では2026-10-15の公開GETから実取得した明示的な旧20 IDだけを返す。現在gameのrulesetから旧一覧を導出しない。これにより新Workerにも、旧frontendの許容範囲外のboardが混ざらない。`initialize`のINSERT ON CONFLICT DO NOTHINGは変更せず、旧board/履歴/記録を保持する。

当初の「旧Workerはqueryを無視する」という前提は実測と異なった。現公開Workerは`boards=game001.score.r1.all`だけでもHTTP400 `invalid_query`。そのためfrontendは**この正確な既知エラーの場合だけ一度**無指定GETへfallbackする。400の別エラー、401、429、503、network errorではfallbackしない。fallbackの20boardも既存のboard-aware validationを通し、新boardがpendingの期間だけ安全に受け付ける。未知boardや欠落必須boardの検証は緩めない。将来、新boardを有効化する前に新Workerへ反映する順序は引き続き必要。

検証済み：

- 直接本番GET（読み取りのみ）で旧20 IDを取得し、query付き400を確認。公開値は証跡から省略。QA/RECORDS_ROLLOUT_PRODUCTION_DEFAULT.json。
- 新unit6件、既存migration3件、records-client9件の18/3files成功。新/旧応答、32指定、subset、無指定20、空/unknown/重複/65件/重複parameter/余計なquery拒否、400限定fallback、その他のエラーで再試行しないことを確認。
- `npm run check`と`npm --prefix analytics-worker run check`成功。
- 実Wrangler/workerd＋隔離local D1で34項目成功。requested32、default旧20、subset2、DBのpublic32保持、元の投稿/参加者/重複/保留/撤回/管理/ロールバック/Analytics回帰を確認。QA/RECORDS_ROLLOUT_LOCAL_D1.json。本番POSTなし。

既存records-client testのURL完全一致1件は、必要な公開board queryを含む期待へ更新。privacy/no credentials/単一並列GET/cacheの検証は維持する。最初の旧期待による失敗と、Jev CLIで非対応game_id `catalog`を指定してAPI送信前に拒否された事実を隠さない。正しい`shared`で同findingを一度だけ送信しHTTP200、4回答有効。未注釈時点ではJevの公開判断とは扱わない。

本実装担当は本番deploy/remote D1操作を行っていない。stage2候補へfrontend変更を含め、最終Worker32boardのdeployと本番GET両世代の照合はrootが担当する。source hashはQA/RECORDS_ROLLOUT_SOURCE.json。
