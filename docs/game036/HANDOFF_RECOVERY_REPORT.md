# Game036 Claude Code → Codex 復旧試験（Codex側）

対象タスク: `pilot-game036-handoff-20261018`。これは**試験専用の未公開Game036**であり、正式なCatalog登録・ゲーム完成宣言・Pages公開は行わない。Claude Codeの会話・ローカル記憶・秘密・作業環境は参照していない。

## 1. GitHub起点の回収

- 唯一の入力はPR #8のリモートbranch `claude/pilot-game036-handoff-20261018`、`ASSIGNMENT.md`、`HANDOFF.md`、ソース及びGitHub上のCI結果。
- GitHub連携で回収したClaude最終先端 `5fed3606686d7f64b0df91ca5e1efd32d8e41d92` と、Claudeの検証済みソースコミット `498edcc2c3bed1740f22336b0fad06e2cbf6485d` を区別した。
- 基準 `9e96d557779c5de099fe54c51731ceb131e591a1` との差分は初期ASSIGNMENT/HANDOFF及びgame036固有7ファイルの**9ファイルのみ**。共通・他ゲーム・CI設定・Worker/D1の変更なし。
- このChatGPTコンテナから直接 `git ls-remote/fetch` を試みたが、`Could not resolve host: github.com` で失敗。**本物のremote Git checkout/worktreeはコンテナ内で作れていない**。代わりにGitHubアプリでbranch/head/blob SHAを取得し、独立作業ディレクトリに完全一致する主要ソースを復元した。
- `src/games/game036/model.ts`、`main.ts`、`style.css`、`game036.html`、`tests/game036/vite.config.mjs` は取得したremote Git blob SHAと隔離復元したファイルの `git hash-object` が一致した。実際のmainへcheckout/mergeしていない。
- Claude版に記載された実際の未完了点（ブラウザQA、共有ナビ、保存/BEST、Visual/Feel、公式登録）をソースから照合。秘密やClaude専用ツールへの依存は見つからなかった。

## 2. 再現コマンド・証拠

| 項目 | 結果 | 証拠／限界 |
|---|---|---|
| `git fetch origin` / `git rev-parse origin/...` | **このコンテナでは実行不可** | DNS制限。GitHub連携でhead `5fed360...` を回収。Codex Cloudで実際のgit worktreeから再試験が必要。 |
| `npm ci` | **GitHub PR ActionsでPASS** | branch `d0e6b51e508b792ad76be40b5aa0c667cf4edee2` の [CI](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39080605158)。このローカルコンテナではnpm依存の取得は実行していない。 |
| `npx vitest run tests/unit/game036*.test.ts` | **対象の10件はGitHub Actionsの `npm test` 内でPASS** | 直接そのCLIをコンテナで実行したわけではない。GitHub job logの `tests/unit/game036-model.test.ts (10 tests)` を確認。 |
| `npx tsc --noEmit` | **GitHub PR Actionsの `npm run check` 内でPASS** | Node24、リポジトリTypeScript設定。追加でコンテナ上の復元済み純ゲームソースをglobal tsc 5.8で `tsc --noEmit` PASS。 |
| `GAME036_BUILD_DIR=... npx vite build --config tests/game036/vite.config.mjs` | **同等の個別ViteビルドをCI内でPASS** | `tests/unit/game036-build.test.ts` が一時ディレクトリを使用し、同一Vite設定へCLIを直接呼び出して成果物HTML/JS/CSSを確認。Claudeの元報告にある直接CLI成功とは別に再検証。 |
| GitHub PR CI全体 | **PASS** | [CI run 39080605158](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39080605158)、104 test files／1101 unit tests、型チェック、Jevオフライン、通常build成功。 |
| Chromiumの通常入力 | **隔離再構成のブラウザで124/124 PASS** | 1280×720、390×844タッチ、320×568タッチ、844×390タッチ。クリック/Space/タップ、マーカー動作、休憩・復帰、3ラウンド、結果、retry、repeatキー無視、模擬blur、練習0点、例外0/POST0。 |
| 実際のVite HTTP画面のブラウザQA | **未実施** | このコンテナのChromiumは `http://127.0.0.1`・`file://` のnavigationが `ERR_BLOCKED_BY_ADMINISTRATOR` で拒否。Playwrightの `page.set_content`＋忠実に変換したTSロジックを注入して通常入力を実行。公式Vite配信・共有ナビscriptそのものを動かしたQAとは区別する。 |

ブラウザ隔離再構成の変換は、remote blob一致の `model.ts` / `main.ts` をグローバルTypeScript 5.8でコンパイルし、ブラウザ注入のためだけに import/export を単一スクリプト化したもの。モデルとイベント処理には変更していない。更新後のHTML（共通ヘッダーclass追加）でも124/124の挙動を再確認したが、外部CSS/JS自体は注入しなかった。従って**公式Viteビルド画面のエンドツーエンド正常性を完全に確認した証拠ではない**。

## 3. Codex側の変更

- `game036.html`: 既存共通 `arcade-navigation.css/.js` への参照、`arcade-game-header` / `arcade-portal-return`、`data-game-interaction` を追加。共有アセットを編集せず、通常の100ガレ帰還形式へ近づけた。
- `tests/unit/game036-build.test.ts`: 専用ViteビルドをPR unit testから再現。テスト用distを一時ディレクトリにのみ生成し、正式Vite入力や本番Pagesを変更しない。
- `tests/game036/browser.mjs`: 個別Vite distをローカルHTTPで配信してPC/phone/narrow/landscape、通常入力・保存無し・POST無しを検証できる独立ブラウザスクリプト。**コミットはしたが、この環境ではHTTP navigation制限によりスクリプト自体の本番式実行は未実施**。
- `docs/game036/QA/RECOVERY_BROWSER_SUMMARY.json` とこの報告：観測したQA、GitHub runner検証、利用できなかったCLIを明確に分離。
- 元ゲームのモデル・得点・ルールを変更しない。正式記録共有・Analytics・広告・CREDIT・本番機能に接続していない。

## 4. HANDOFFのopen_decisionsの扱い

この試験用モデルで、次は**パイロットに限定した検証上の暫定仕様**として維持する。正式ゲームとしての採用やユーザーの仕様承認を意味しない。

1. 各ラウンド0地点・右向きで再スタート：既存単体10件とブラウザ挙動の整合を確認。製品化時の体験は未承認。
2. 非有限/負/`dt>0.5`は無効、フレーム飛びは自動休憩：単体の境界と隔離ブラウザのpauseを確認。実際のOSスリープからの復帰は未検証。
3. 練習は3目標を循環、正式スコア0・結果に加算しない：単体とブラウザで維持確認。
4. retryでは新しいrunインスタンス、押しっぱなしSpaceのrepeatを無視：隔離Chromiumの再挑戦と合成repeatイベントで確認。実機タッチや物理キーは未確認。

正式Game036として扱う場合は、作者が別途企画・美術・記録・公開方針を判断する必要がある。パイロットは現在のルールを変更せず、**途中停止した別エージェントの成果物を復元・検証・限定継続できるか**を主目的とする。

## 5. 残作業

- 実際に `git fetch origin` と新規worktreeを使い、Node24で `npm ci`／指定の3コマンドを直接再現する（本コンテナのネットワーク制限による代替検証は実施済み）。
- ブラウザが利用できるCodex実行環境で `GAME036_BUILD_DIR=<private-dir> npx vite build --config tests/game036/vite.config.mjs` → `GAME036_BUILD_DIR=<same-dir> GAME036_QA_OUT=<new-dir> node tests/game036/browser.mjs` を実行する。Playwrightブラウザの導入が必要なら通常の安全なセットアップのみ行う。
- `/context`／`/permissions`でのClaude Code実際のdeny/allow試験は、Claude側で未実施。Codexがその事実を代行してPASSとすることはできない。
- 独立Visual/Feel評価、物理スマホ、実際の人間試遊、正式Catalog/Vite/Portal/記録/Analytics統合、公開は未実施。ゲーム保存、BEST、音、正式美術は試験割当において未要求／未完成。
- PR #8は**Draft維持・マージ禁止**。試験Game036の正式採用を決める作業と混同しない。

## 判定

**GitHub上の成果物だけからソースを回収し、限定のモデル・UI機能を継続する能力は確認できた（部分PASS）。** ただし、ユーザー指定の `git fetch` と完全なworktree再現、およびVite配信の実ブラウザ通常操作は環境制限により未検証のまま。全項目PASSではない。費用/tokensは直接観測できず `null`。
