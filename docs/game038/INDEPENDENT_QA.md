> **2026-10-19 訂正：新作038という扱いは撤回済み。** 対象は一覧表示014／内部game017の改良。[現行の改良候補](../game017/revision03/HANDOFF.md)を参照。以下は移設前の履歴で、旧pathや未push状態を現状と混同しない。

# Game038 独立Gameplay・ソースQA

2026-10-18 UTC、担当Codex独立reviewer subagent。製品は読取専用で監査し、本QAのMD/JSONだけを記録した。最終対象は`7d0287bdfaf5d037362619620ed8c136870e6980`。初期対象はruntime`c8c47d6`。個別SHA-256・測定値・未実施範囲は[JSON](INDEPENDENT_QA.json)。

**モデルとソースの技術QAはPASS。** 本担当のブラウザ実操作、独立Visual採点、人間Feel判定ではない。coordinatorがbrowser枠を保持し、固定ソースでの画面/実入力を別に実施する。

## 指摘と修正の再確認

初期9秒練習は中ラインで放置しても勝利できた。独立pure probeは`won / wet1.2416667 / entries3 / score0`を確認。乗換え操作を一度も示さずlearned状態へ進めるため、実練習の成功条件として不十分と判断しcoordinatorへ報告した。

7d0287bは別ラインの傘で保護された乗換えを1回以上要求する。放置は`lost / reason=lesson / transfers0`、通常の案内傘乗換えは`won / transfers3 / wet0 / score0`となった。UIは放置未達の理由と再練習を表示し、成功時だけlearnedを保存する。新回帰条件は[RED原本](QA/IDLE_PRACTICE_RED.txt)を保持。修正後、独立に`npx vitest run tests/unit/game038.test.ts --reporter=dot`を実行し**15/15 PASS**を確認した。Jev/有料APIは今回の指示に従い呼んでいない。

## 独立確認した挙動

- 濡れは累計3秒で失敗し、傘では減らない。無保護の3秒goalとの同時到達はwet失敗を優先。前景の大きな時間差を捨てず、run期限までの時間を最大1/120秒のmidpoint刻みで積分する。
- 90秒の独自案内傘追従probeは`won / wet0 / 1910点 / 31人 / 27回ライン変更`。0〜90秒を1ms間隔で調べた案内傘coverageの空白は0、同時人数の最大は12。1回のmodel simulation約9.7msは当環境Nodeの測定であり、ブラウザFPSや人間所要時間ではない。
- 傘への出入りを50回繰り返しても150点/1人から再加点しない。負点種別・同ライン保護・半径境界・最近傘/同距離ID優先、最終runへの追加進行拒否はモデルとunitで照合した。pause中は状態不変でmoveも拒否する。
- 実main.tsをTypeScriptでtranspileし、Node VMの仮DOMで登録された実handlerを呼ぶ補助検査を実施。新規Arrow移動、repeat無視、pause中5秒の除外、resume後repeat無視、pause前pointerのrelease無視、pointercancel後release無視を確認した。前景0.5秒＋休憩5秒＋前景0.1秒でelapsed約0.6秒。これは実ブラウザ/物理タッチの証拠ではない。
- startはclock基準・gestureを初期化し、pauseはgestureを破棄、resumeは基準時計を更新する。入力前に未精算時間を旧ラインへ計上し、画面に使った操作を次runの移動へ再利用しない。実ブラウザのfocus/scroll/複数pointer/帰還はcoordinatorの検証対象。
- 保存先は038専用`best-r1 / learned / mute`だけ。BESTは完走した非練習runの改善時だけ保存し、負点BESTにも対応。拒否時はmemory fallbackと非永続表示。練習はBESTと本番scoreへ影響しない。
- sourceにfetch/beacon/外部通信SDKはなく、画像はローカル038素材と既存017背景だけ。公式一覧への外部URLは明示リンク操作の帰還先。Game017本体/背景、production catalog/Vite、Analytics/CREDIT/広告/CI等の共有設定は採用準備基準0628dcbから無変更。038は限定Vite previewのまま。

初回Nodeのstrip-only実行はTypeScript parameter property非対応で起動できず、`--experimental-transform-types`で補助probeを実行し直した。仮DOM補助検査も準備完了前のbutton参照を修正してから実行した。これらは検証harnessの問題で、製品の失敗には数えない。最初のunit実行はcoordinator追加中の放置練習RED条件と重なり14PASS/1FAILとなったが、同じ指摘の修正後15PASSを確認している。

本人の面白さ/難易度、物理スマホ、Safari、実音、連続FPS、正式完成、main統合・公開は未評価。browserの長い通常RUN中は本担当による製品変更を行っていない。push/PR/Actions/merge/deploy/設定操作は実施していない。
