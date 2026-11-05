# Game037 — Step 3 独立技術・画面レビュー（2026-10-18）

> レビュー担当：ChatGPT（Claude Codeとは別の実行主体）。GitHub連携経由でリモートソース・SVG・実際のQA PNGを閲覧し、PR専用GitHub Actions runnerで独立検証を追加して実行。**Codex Cloudセッション／人間／別の独立workerが行ったとは主張しない。**

## 判定
- **技術的な試遊候補としてPASS**。正式採用、独立の人間Feel、物理端末、音、実FPS、公式公開は未確認。Game037は暫定ID、PR #9はDraft/未マージを維持。
- Claude提出元のソースcommit：`fd3eca9ce3f05653f3bfed0d3fa95d0b184ddd15`。Claudeの独立QA主張ではない自己実装QAは574/574 PASSと報告。
- 監査時のClaude最終先端：`a050da6655a99cb2a308c9d1f122c811623e36a1`。base `9e96d557779c5de099fe54c51731ceb131e591a1` との差分**90ファイル、全てallowed path内**。Claudeソース検証commit後の追加はdocs/QA証跡のみ。
- Game037だけの保存キー2個、無料試作、外部POSTゼロ、他ゲーム・共有ファイル・Analytics/広告/CREDIT/Worker/D1無変更（コード監査と実ブラウザリクエスト検証の範囲）。
- **独立再実行の最終根拠**：[GitHub Actions #39096571478](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39096571478)、source commit `4057766503f9051a9b5a0ba6c2a99d9ee648e48c`。Node24、fresh checkout、`npm ci`／`npm run check`／`npm test`（**105 files・1110 tests PASS、うち独立追加2件を含む**）／`npm run build` → SUCCESS。元のGame037単体18件に加え、独立モデル境界試験もPASS。Chrome/Chromiumで実際のVite HTTP画面を開き、**575/575ブラウザchecks・4幅＋保存拒否ケースPASS**。ノーページエラー/外部通信0。元574項目に「Esc復帰直後のキー入力」を1件追加した。
- 一時的な独立CI試験 `tests/unit/game037-codex-verify.test.ts` は終了後 `4ad5858aa3ae9f5fb43c0866b2e9a68e8bde2b8d` で削除（元の恒久CIへ重い追加browser実行を残さない）。恒久ブラウザQAの回帰条件は `tests/game037/browser.mjs` に保持。

## 独立検証時の失敗と原因・修正
1. 初回 [CI #39095772818](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39095772818)：デスクトップの第2面でEscによる休憩解除直後、回転が収束せずブラウザQA FAIL（54チェック通過）。ゲームコードを読むとダイアログの閉鎖判定が同期である一方、再開状態の更新を非同期`close`イベントに依存しており、次のキー入力を取り逃がす**タイミング競合の可能性**があると分析した。単一ログから根因を完全確定したわけではない。
2. [CI #39095930096](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39095930096)：574/574 E2EはPASS、全1110テストもPASS。しかし独立テストの同期`spawnSync`でVitest worker RPCがタイムアウト、CI全体FAIL。この追加テスト基盤の問題を同期実行から非同期childへ修正した。
3. [CI #39096159351](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39096159351)：非同期テスト構成でCI全体SUCCESS、574/574ブラウザQA再現。
4. 製品側の保守的修正：`4c86a7ff2b30a500159bb3b85e599d9257d11947`。Escの`cancel`時に`dialogClose`を先に消して`resumeFn`を同期で適用し、後から来る`close`と二重実行しない。新たに「復帰直後のキーボード選択」をbrowser QAへ追加。**ルール/スコア/画像や他ゲームへは変更なし**。
5. [CI #39096406073](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39096406073)：新回帰QAを誤ってタッチ画面にも適用し、直後のtap専用プレビュー判定と干渉→QA側FAIL。この試験設計上の問題をPC専用のEscキー回帰条件へ修正（`4057766503f9051a9b5a0ba6c2a99d9ee648e48c`）。
6. [CI #39096571478](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39096571478)：**最終sourceで全1100+テスト・575/575ブラウザ検証PASS／CI SUCCESS**。失敗記録は削除・上書きせず維持。

## 独立Visual評価（スクリーンショット確認）
`docs/game037/QA/browser-final/`のdesktop/phone/narrow/landscapeのtitle、stage-clear、result、help、pause、rejected等の実PNGを実際に開いて確認。生成した架空モックではない。評価は専門的な画面レビューであり人間の試遊ではない。

| 指標 | 独立評価 | 主な根拠 |
|---|---:|---|
| Identity | 14/15 | 藍色のれん、赤漆の箱、生成り和紙、木目が一貫している |
| Objects | 12/15 | 食材7種は輪郭・具体的な具材で区別。縮小のブロッコリー・海老フライには改善余地 |
| Background | 7/10 | 控えめな和紙柄。ただしdesktopの下方余白は大きい |
| UI integration | 9/10 | 墨色の縁・朱色ボタン・札が統一 |
| Composition | 8/10 | 4幅に収まり、おかずトレイと盤面の位置が安定。320幅結果表は窮屈 |
| F Readability | **12/15** | 対象・残り・得点は判読可能。320幅の結果表とhelpはスクロール／改行が必要 |
| Motion | 6/10 | 完成時スタンプ・光・配置バウンド。音／実FPSは未評価 |
| H Production value | **13/15** | 13点のオリジナルSVG、UI・画面間の統一感。単色仮置き／絵文字主軸ではない |
| **合計** | **81/100** | 技術的Visual gateの80/F12/H12を満たす（画面画像ベース） |

## Feel・次の工程
- UI実装、スナップと不正置き、ドラッグ/タップ/キーボード、練習隔離、時計、BEST、6面完走は自動操作QAから技術的に再現した。
- solverの答えを用いた自動操作は**人間の面白さや初見難易度の証拠ではない**。本人による見た目・操作感・6面の所要時間・音・実機iOS/Android・Safari・FPSはNOT_RUN。
- 感想を取る際の優先改善候補：320px結果表の段組みと文字サイズ、デスクトップ下部余白、物理スマホ指の被り、音量/効果音。すべて別改修候補で今回の技術PASSと混同しない。
- 今回の目的（Claudeに1本完走まで制作させ、ChatGPT側が独立に回収・QA）は達成。Codex単独制作との同条件・同課題比較をしていないため、**モデル優劣・費用優位を結論付けない**。
- 計測不能なClaude tokens/API費用/総壁時計/本レビューの総費用は`null`。CIジョブと成功/失敗、ソースSHAのみ実測。正式統合／公開は明示指示と人間試遊の後に別判断。
