# GitHub保存・公開前の引継ぎ

- repo：`Badgio0906/Badgio0906-web-mini-game-arcade`（実APIでPUBLIC確認）
- worktree：`/workspace/arcade-catalog-cleanup`
- branch：`codex/adsense-catalog-quality-cleanup`
- base main：`47c6cfe1ea93f71325fc47ff7031980ef9be9f74`
- 保護するPR #11：`codex/game015-mobile-landscape-ux`、HEAD `dbdf915a696b326f1247dd41c9f6cbf8765e9c56`、Draft OPEN。変更・統合禁止。
- 予定する保存：上記作業branchへの通常push、新Draft PR、base main。mainへのpush/merge、Pages deploy、自動merge、AdSense操作は禁止。

## push前の費用・連動処理の確認

現在のmainと候補にあるworkflowは2本のみ。

|処理|今回の起動範囲|runner／外部処理|
|---|---|---|
|`pr-validation.yml`|新Draft PRのpull_requestでvalidateが実行される|固定`ubuntu-latest`。checkout/setup-node/npm ci/check/test/Offline Jev/build。GA4・Telemetry endpointは空。records endpointはbuildに埋め込むだけで実送信なし|
|`pages.yml`|pushはmain限定。今回の作業branch/PRでは起動しない|固定`ubuntu-latest`。今回deployしない|

matrix、runner変数、larger/GPU/self-hosted、reusable workflow、workflow_run/連鎖、Packages公開、LFS転送、有料API、Railway等へのdeployを呼ぶ処理は候補workflow・呼出scriptに見つからない。新たな有料サービスは追加していない。ワークフローと課金設定は変更していない。

PR workflowにはartifact uploadなし、setup-nodeの既存npm cacheあり。現在のcache使用量はAPIで97,333,639 bytes／2件。PUBLIC＋標準GitHub hosted runnerという実行時間の無料条件は確認できるが、それだけで外部連動も無料だとは断言しない。

**Webhook一覧はHTTP403（Resource not accessible by integration）で取得できず、外部ビルド/デプロイ等の連動・追加費用は不明。** Actions permissions APIも403。リポジトリ公開状態の変更、設定変更、予算変更、workflow無効化/削除、既存jobのcancelで回避していない。

ユーザーの以前の「必要な費用条件が不明ならpush前で停止」という条件が継続しており、他タスクの一回限定了承を今回へ転用しない。ローカル実装・監査・commitを先に完了したうえで、この不明点への今回の判断を待つ。GitHub保存とCIはこの段階では未実施。ローカルcommitはGitHubバックアップではない。

## 再開

1. このworktreeのstatus/branch/HEAD、live main、PR #11 HEADを再確認する。独自commit/未commitを保護する。
2. Webhook等の情報が確認できるか、またはユーザーが今回の不明点を明示了承した場合のみ、対象repo/branch・PR検証だけが起動する旨を短く報告する。
3. `git push -u origin codex/adsense-catalog-quality-cleanup`（通常push）。新Draft PRをmain baseで作る。既存PR #11へpushしない。
4. 自動PR検証の結果を一度確認し、成功まで無条件rerunしない。生成したPR URLをタスクへ添付する。
5. mainとPR #11・本番が変更されていないことを確認し、作者の公開承認を待つ。

主要報告は[品質監査](../PUBLIC_GAME_QUALITY_AUDIT_20261020.md)、[実装と031再公開手順](../CATALOG_QUALITY_CLEANUP_IMPLEMENTATION_20261020.md)。生ログは`/workspace/audits/catalog-quality-20261020/`。node_modulesとdistは環境依存の再生成物でcommitしない。
