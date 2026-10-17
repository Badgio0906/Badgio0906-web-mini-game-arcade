# エージェント別タスクの引継ぎ

このフォルダにはCodex統合担当が確定したタスクごとに `<task-id>/ASSIGNMENT.md` と、担当者が更新する `<task-id>/HANDOFF.md` を置きます。現時点で特定のゲームがClaude Codeに割り当てられているわけではありません。

- 手順：[併用・離脱時の継続運用](../AGENT_COLLABORATION.md)
- [割当テンプレート](../templates/AGENT_TASK_ASSIGNMENT.md)
- [引継ぎテンプレート](../templates/AGENT_TASK_HANDOFF.md)

Claude Codeの使用中止時は未統合branch/PRとHANDOFFをCodexが照合し、確認済みの最後のpushから作業を再開します。ローカルにしかない未commit作業は復元を保証できません。
