# 100ガレ：Claude→Codex途中引継ぎパイロット割当

> **試験用の仮ゲーム**。この割当はGame036の正式な公開・次番号予約を意味しない。mainの次ID/他割当を開始時と統合時に再確認する。公開・Catalog登録は今回禁止。

## 識別
- task_id: `pilot-game036-handoff-20261018`
- game_id: `game036`（この専用ブランチだけの試験用仮番号）
- status: `assigned`
- owner: `claude-code`（モデル・使用環境は実行側で記録）
- integrator: `codex-cloud`
- base_branch: `main`
- base_sha: `9e96d557779c5de099fe54c51731ceb131e591a1`
- assigned_at: `2026-10-17T23:19:07.151Z`
- task_branch: `claude/pilot-game036-handoff-20261018`
- upstream_pr: https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/8
- current_product_scope: **試験専用・本番掲載なし**

## 固定された小さなゲーム仕様
- temporary_title: **ぴったりストップ ～TIMING PILOT～**（試験名であり正式な新作案ではない）
- core_loop: マーカーが0〜100を左右に往復する。プレイヤーはクリック・タップ・Spaceでタイミングよく停止し、各ラウンドの目標点へどれだけ近いかを競う。全3ラウンド終了で結果。
- mechanics: マーカー速度35単位/秒。両端で反転。ラウンドごとの目標は70、30、55。各ラウンドは入力確定1回。実時計dtが不正ならモデルを進めない。最大1000点/ラウンド、`max(0, round(1000 - abs(position - target)*30))` で計算。合計0〜3000点。
- input: PCクリック/Space、phoneタップ。リトライ時に入力を持ち越さない。
- practice: 同じモデルで自由に停止練習、正式スコア/BEST/Analyticsを変更しない。
- run: ラウンド3回の結果画面と「もう一度」。ポーズ時に時間停止。
- visual: まずは最小限の試験用表示でよい。未採用の仮UIを公式版の美術完成と称さない。
- score: 0〜3000点。個人記録は**試験中は外部送信しない**。既存BESTを上書きしない。全体ランキングboardは作らない。
- media: 新しい高品質素材は必須ではない。追加した素材は `assets/game036/` 原本、`public/assets/game036/` 配信、来歴/ライセンス付き。使えない外部ImageGen/Skillは未実施と記録。

## Claudeが今回実装する範囲（意図的な中断点）
1. 独立したゲームモデルと5件以上の有意な単体テストを作る。
2. `game036.html`、最小UI/入力の骨組み、個別ビルド設定 `tests/game036/vite.config.*` を作る（不可能なら理由をHANDOFFに記載）。
3. 固定モデルを実行し、最低限の自動テスト結果をHANDOFFへ記録する。
4. **デザイン仕上げ・全幅ブラウザQA・共通登録・正式公開に着手せず中断する。** 仕様の残りをCodexが後から引き継げるようにする。
5. `docs/agent-tasks/pilot-game036-handoff-20261018/HANDOFF.md` を更新し、変更したソース・テスト・HANDOFFをcommitしてリモートbranchへpushして停止する。Claudeの会話やローカルSkillなしでCodexが続行できること。

## 編集許可（厳守）
- `src/games/game036/**`
- `game036.html`
- `tests/game036/**`
- `tests/unit/game036*.test.ts`
- `docs/game036/**`
- `assets/game036/**`
- `public/assets/game036/**`
- `docs/agent-tasks/pilot-game036-handoff-20261018/HANDOFF.md`（この割当文書ASSIGNMENT.mdはCodexのみ）
- 上記以外に必要な修正はHANDOFFの `integration_requests` へ列記し、直接編集しない。

## 編集・操作禁止
`main`へのpush、`src/data/**`、`src/portal/**`、`src/records/**`、`src/analytics/**`、`src/arcade/**`、`src/core/**`、`src/game/**`、`vite.config.ts`、`package*.json`、`.github/**`、`.claude/**`、`docs/CURRENT_STATUS.md`、`assets/portal/**`、`public/assets/portal/**`、`analytics-worker/**`、その他のゲーム、広告・GA4・CREDIT・D1・Worker・Secretを変更しない。

## 個別の検証
- Node 24相当、`npm ci`（既に導入済みなら省略可）
- `npx vitest run tests/unit/game036*.test.ts`
- `npx vite build --config tests/game036/vite.config.*`（作成した場合、実コマンドへ置換）
- 任意の手動PC/touch試験は実施範囲を明示。物理実機と人間の面白さ評価は未実施として残す。
- `git diff --name-only 9e96d557779c5de099fe54c51731ceb131e591a1...HEAD` で許可外変更がないこと。
- 認証値・token/APIキー、秘密、実ユーザーの記録をローカルやGitHubへ保存しない。
- imagegen等のツール有無が引き継ぎの必須条件にならないこと。

## Codexの統合ゲート
- remote branch先端とHANDOFF、実ファイルが対応し、Code/QA/次の3手が読み取れる。
- Codexが新しいworktreeから依存を入れ直し、Claude無しでモデルテストを再現できる。
- Codexが不足分を実装し、後で新作として正式採用するかはユーザーの別判断とする。**このパイロットだけでは正式公開しない。**
