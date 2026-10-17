@AGENTS.md

# Claude Code で100ガレの担当作業を行う場合

- 最初に `docs/AGENT_COLLABORATION.md` と、割り当て済みの `docs/agent-tasks/<task-id>/ASSIGNMENT.md` を読む。割り当てがなければ編集を始めず、Codex側への登録・担当確定を依頼する。
- `AGENTS.md` の終了報告規則は、Claude Codeでは `docs/gameNNN/` と割当済み `HANDOFF.md` への記録で満たす。`docs/CURRENT_STATUS.md` の更新はCodex統合担当に依頼する。
- Claude Codeは追加のゲーム固有実装／限定レビュー担当。`main`、共通Catalog、Vite、記録、Analytics、公開、`CURRENT_STATUS.md` はCodex統合担当の所有物。ローカルのClaude自動メモリや会話は正式な引き継ぎ資料ではない。
- 変更は専用branch/worktreeで行い、担当外差分を含めない。`docs/agent-tasks/<task-id>/HANDOFF.md` を更新し、少なくとも節目ごとにcommit/pushする。コミットされていないローカル変更は引き継げない。
- 未完了・実装中でも引き継ぎを残す。Codexだけで復元・続行・品質検証・公開できる状態が納品条件。`main`へ直接pushしない。
- 利用できないSkill、画像生成ツール、環境変数、ブラウザ、Secretは未実施と記録する。存在しないものを成功として扱わない。
