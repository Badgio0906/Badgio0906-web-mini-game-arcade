# PR12公開後の残課題・引継ぎ（2026-10-20）

第1段階は [公開記録](PR12_PUBLICATION_20261020.md) の通り完了。main `619adc35a4339dc5d6f1ddc4e357d5f7eccde991`、Pages39434884258成功、掲載26／完成9・試遊17。下記候補は**未統合・未公開**で作者レビューを待つ。AdSense再申請は行わない。

|課題|状態・実装|独立branch／PR|人間確認|
|---|---|---|---|
|Q01 内部012 お前の仕事は俺の仕事|960×540と16:9のcanvas全体contain。HTML・生成・厳密監査の限定修正、WASM/PCK不変。|`codex/game012-mobile-visibility-fix`、Draft提出対象|縦の文字が小さい。実iPhoneで判読・入力、必要なら方式Cを作者判断。|
|Q02 内部015＝表示012 落下キング|既存縦専用PR #11をread-only確認。**変更・mergeなし**。|[PR #11](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/11)、HEAD `dbdf915a696b326f1247dd41c9f6cbf8765e9c56`、Draft OPEN|iPhone長押しは本番と練習を別確認、回転pause／明示再開、幅揺れ・Safari UI。|
|Q03 002/003/035|無料運用・位置/回転/重心・3エンド結果の表示文だけ修正。|`codex/adsense-content-accuracy-fixes`、Draft提出対象|作者の文面・小画面の読取り。|
|Q04 内部033 火花連鎖|titleのみmodeless、title時設定footerを画面内に保持。help/pause/resultは従来modal。|`codex/game033-initial-consent-ux`、Draft提出対象|iPhone fresh consent／撤回／privacy、画面・focus／VoiceOver。|
|Q05 内部013 タスク天国|**製品変更なし**。既存案内・nativeを保持、人間用確認票。|新PR不要|実iPhone横の音・4pad同期／押しやすさ、通常3stage結果→retry。|

## Q02・Q05の境界

`integration-20261020/Q02_Q05_REVIEW.md` に読取り根拠、既存QA source hash、実機チェック票を保存。PR11の最新treeとmainの変更パス交差は `docs/CURRENT_STATUS.md` だけ。`git merge-tree` も同文書のみ競合。**今回解消しない**。将来統合時は本番26本の記録とPR11候補記録を両方残す。製品差分非交差は統合実行テスト成功の代替ではなく、統合後check/test/buildは未実施。

本番の強化capture/touch0 fallbackと練習のwindow終端経路は完全同一ではない。練習も実機長押し確認が必要。Canvas幅揺れの実機原因はUNKNOWN、縦専用化で根治済みとはしない。タスク天国は表示番号013＝内部016と取り違えない。

## 追加修正の品質・費用・保存

3候補それぞれcheck／976単体／build成功。Q01は3Godot×4サイズ、Q03は3ゲーム×2サイズ、Q04は19状態＋keyboardを隔離compiled環境で検証し、Q04通常100秒自然結果・retryを確認。各候補の `docs/game012/`、`docs/game033/`、本階層の [Q03報告](CONTENT_ACCURACY_FIXES_20261020.md) に生結果・画像・残課題。実iPhone・WebKit・面白さ合格は未実施。

既存PUBLIC repository、branch push自体に該当workflowなし、Draft PRは `Pull request validation (no deploy)` の標準ubuntu-latest1 jobを自動実行する。matrix／再利用workflow／workflow_run連鎖なし。npm scriptsはローカルcheck/test/build、Offline Jevはネットワークなし。新API課金・新サービス／プラン・workflow変更なし。既存npm cacheを利用するため、保存容量契約とWebhook403による外部連動は別のUNKNOWNとして扱う。ユーザーの費用条件に従い、必要な承認／確認を得るまではlocal commitまでとする。CI成功まで無条件再実行しない。

ローカル保存場所は `/workspace/arcade-game012-visibility`、`/workspace/arcade-content-accuracy`、`/workspace/arcade-game033-consent`。既存 `/workspace/arcade-catalog-cleanup`・`/workspace/arcade-game015-mobile` はcleanのまま保全。commitのみの場合はGitHubバックアップではない。最終Git状態とPR URLは後続の保存記録に追記する。

## 再審査前に作者が判断すること

1. **技術的に未完了**：新3候補のレビュー・統合／公開は別承認。PR11の文書競合解消と統合QAも将来工程。012 pinned元export監査は元source/export不在で未実施。縦の可読性は未解消で作者判断が必要。
2. **実機試遊**：012の小さいHUDとタップ、015の縦専用／長押し解除・回転停止、013の音と4領域、033初回設定と撤回。機種・iOS・Safari・候補SHA・向き・バー状態を記録。合成イベント・viewport試験は人間確認の代わりではない。
3. **Google管理画面**：ads.txt認識・審査状態／通知内容は作者が確認。Search ConsoleのURL検査は任意の技術証拠でAdSense合格保証ではない。再審査の時期・実行は作者判断。
4. **後回し可能**：新ゲーム追加、装飾・共通基盤拡大、記事文字数／ページ数の水増し、深いGodot responsive再設計。実機で重大な不足があれば限定タスクとして再評価。

Google Publisher Policiesの操作可能性・コンテンツ／UXの公式方針と、今回実測した表示欠け・初回設定阻害・説明矛盾を区別する。GoogleがQ01〜Q05を不承認の真因と認定した事実はない。個別改善は確認済み障害またはユーザー理解の問題に基づき、合格率は算出しない。参照： https://support.google.com/publisherpolicies/answer/11112688?hl=ja 、https://support.google.com/adsense/answer/9724?hl=ja 。
