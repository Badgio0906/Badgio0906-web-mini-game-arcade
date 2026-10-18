# Game038 HANDOFF — local ready for playtest

## 状態

branch`feature/game038-rain-umbrella`、製品最終`963956abf095492e17dd58bfee148388c3e29f56`（logic7d0287b、最後は横幅CSSのみ）。初期playable、未push/新規PR未作成/main未反映/未公開。Game037/003採用準備cab8befを基点とし、その別branch`integrate/game037-game003-20261018`のQA/docs0628dcbも385406eで内容を継承し、採用引継ぎb6a34adの文書/費用監査も保存。final docs commitは`git log`を正本とし自己SHAを埋め込まない。

正本：[仕様](IMPLEMENTATION_SPEC.md)、[実装報告](IMPLEMENTATION_REPORT.md)、[生成prompt](IMAGEGEN_PROMPTS.md)、[素材index](../../assets/game038/ASSET_INDEX.json)、[独立QA](INDEPENDENT_QA.md)、[Visual](VISUAL_REVIEW.md)、[Feel読解](GAME_FEEL_REVIEW.md)、[人間試遊](HUMAN_PLAYTEST.md)。既存017背景は元bytesのまま。ImageGen実2回/透過14assetは原本/処理pipeline/metadata込みでcommitし、会話や一時生成フォルダを再開前提にしない。

## 実行と実証範囲

Node24.19.x/npm11.9.x。新環境は`npm ci`。

```sh
npm run check
npx vitest run tests/unit/game038.test.ts
npx vite build --config tests/game038/vite.config.mjs
npx vite --config tests/game038/vite.config.mjs --host 127.0.0.1 --port 4938 --strictPort
```

ブラウザで `http://127.0.0.1:4938/game038.html`。localhost限定の試遊。公式一覧は038候補を配信していない。最初は「遊び方へ」または「練習する」。上下/W/Sまたは3ボタン/路面tap/上下swipe。別laneの傘へ1回以上乗り換えて9秒練習を完了し、別buttonで90秒本番へ。濡れは累計3秒、傘では減らない。主人公の閉じた傘は保護しない。停止は端末Ctrl+C。既存save/BESTを消さない。

unit15、全体1125/106files、型/通常build/限定build成功。固定sourceの通常入力77checks/4幅成功、PC/touch390の実90秒帰宅/BEST保存、320/844は約6.6秒まで。compiled20checks/4幅成功・DEVhook無し。詳細はreportとQA原JSON/PNGへ。browser時はsourceを固定し、build/製品編集を並走しない。再検証は新出力先を明示し、過去の失敗を上書きしない。

再現用collectorは`RAIN038_REPORT=<新dir> node tests/game038/browser.mjs`、compiledは限定build後`RAIN038_COMPILED_REPORT=<新dir> node tests/game038/compiled.mjs`。OS/Chromium/時間条件を記録する。これらはreadonly観測でAIが操作する技術QA、人間試遊ではない。`__RAIN038__`はDEV readonlyのみ。

## 費用と権限

PUBLICを実確認したがWebhook403/外部連動と保存/契約条件UNKNOWNでpush保留。PRは[原稿](PR_DRAFT.md)のみ。再開後も公開状態/branch/workflows/runner/連鎖/保存/API/外部build-deployを再確認し、追加費用なしを確認できなければpush前にユーザー判断を待つ。PR作成の依頼はあるが条件不明で実行しない。Actions手動起動/再実行/既存job取消、main merge/公開/deploy、workflow無効化/削除、予算/契約/runner変更をしない。今回Jev/OpenRouter API0、ImageGen以外の生成API呼出しなし。ImageGenモデル版/tokens/費用やCodex使用量は取得不可null。

Game037採用は[採用記録](../game037/ADOPTION.md)、003完成指定は[記録](../game003/COMPLETION_ADOPTION.md)。038はまだ正式Catalog/共通Viteに載せず、次担当はID038を二重割当しない。036のPR8と037のPR9を勝手にmergeしない。mainpushは既存Pagesworkflowで公開まで連動するため、統合準備と公開判断を分ける。

## 次の3手と未実施

1. 保存したbundleから候補を読み、人間がPC/スマホで初見練習・90秒の面白さ/難度・背景と人物・音を試す。
2. 見出しの改行、重なる小人物、単一pose、rare判別、人数/得点/3秒を実感に基づいて調整。自己判断で完成にしない。
3. 費用条件/外部連動を確認できた後に、許可されたbranch push/PRを再判断。main統合・Pages公開は今回実施していない。

GitHub CI/公開環境/物理端末/Safari/実音/連続FPS/人間評価、320/844の90秒完走、公式帰還先の実到着は未実施。初回fixture失敗と放置練習RED、初回画面は保持済み。

## 保存場所と復元

作業コピー`/workspace/arcade-rain`、採用準備`/workspace/arcade-adoption`。両branchと必要な未main commitを含む `/workspace/100gare-next-stage.bundle` と `/workspace/100gare-next-stage-CHECKSUM.json` を手元へ保存する。GitHubへはバックアップしていない。

```sh
git clone https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade.git arcade-trial
cd arcade-trial
git fetch /path/to/100gare-next-stage.bundle refs/heads/feature/game038-rain-umbrella:refs/heads/local-game038
# 本体mainは変更せず、試遊用branchへ
git switch local-game038
npm ci
npx vite --config tests/game038/vite.config.mjs --host 127.0.0.1 --port 4938 --strictPort
```

bundleの前提baseはmain9e96d55を含むclone。CHECKSUMでSHA256と先端を照合する。bundleだけを新規cloneする完全履歴版ではない。採用準備branchを取り込む場合は同bundleの`refs/heads/integrate/game037-game003-20261018`を別localbranchへfetchする。
