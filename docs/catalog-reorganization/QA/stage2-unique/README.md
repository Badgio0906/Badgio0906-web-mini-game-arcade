# 第2工程 通常入力QA記録

sorting_parking担当。DEVの読み取り診断/端末保存を読んで通常クリック・タップ・キー・ポインター操作を選ぶ技術QA。ゲームのscore/time/position/outcome、保存世界の注入なし。実機・本人の認知/面白さは未評価。

## 固定候補と証拠

- 旧候補`5bd5f03039d1cf3bd6124342f4084cd801dcd78d`。`desktop-initial`と`desktop-retest`に収集基盤の失敗を保持。`practice-budget-retest`で015全6練習と通常lifecycleを再確認。
- `final-four-widths/REPORT.json`：旧候補5作×4幅、4349checks。003/015/024/027各4幅と0021440はPASS。002390/320はcollectorが練習success後に消えたbuttonへtap待ちする不備、002844は補助how-button41×44px。原本はpass=falseのまま。pageerror/外部write0、source SHA前後一致。
- **新候補`a52677d22911f423769cb2b206704b08f2a87b68`**。`a526-002-003-four-widths/REPORT.json`は002/003全4幅、8case/1420checks PASS。002mobileの本番レーン移動は通常stage tap。003は実形状練習2棟着地、移動/回転、通常落下、自然失敗、pause/result/retry/BEST/mute/reload/帰還まで。003physicsの実motion連番と実canvas thumbnail候補を保持。
- `a526-027-844/REPORT.json`は140checks PASS。実台326.875×179.781px（内部327×180・58sampled色）を確認し、通常練習成功、通常shot途中pause/save/reload→1回判定、白球配置、CPU実shotとbannerを確認。旧44pxcontrol-onlyの検査が盤面collapseを検出できなかった限界を保持し、実台寸法とpixel検査を追加した。

両新候補reportはpageerror/外部write0・source SHA前後一致。各実行の`COLLECTOR.mjs`は当時の収集コードの原本で、後の修正を上書きしない。gameの実装変更はroot担当で、QA担当による修正はcollectorだけ。

## Findings

`JEV_SHADOW.jsonl`に1問題ずつschema2の実APIと独立注釈。出力親directory不在、固定wall-clock移動待ち、練習時間budget/強制SwiftShader、success terminal判定漏れ、補助how-button41pxを分離。最初の015held-input境界という解釈は仮説で、後の実simulation elapsed11.6秒/45wall秒から収集構成/時間budgetへ訂正した。Jevに合わせて診断を決めず、元失敗を保持している。

## 再実行

固定commitの専用worktreeを作り、依存準備後にそのrootでViteを起動する。既存の稼働serverや`dist`が残ることを前提にしない。collectorは`tests/catalog-reorganization/stage2-browser.mjs`。

```sh
STAGE2_BASE=http://127.0.0.1:4172/ STAGE2_ROOT=/path/to/fixed-worktree STAGE2_SOURCE=a52677d22911f423769cb2b206704b08f2a87b68 STAGE2_GAMES=002,003 STAGE2_OUT=/new/unique/output node tests/catalog-reorganization/stage2-browser.mjs
```

`STAGE2_MODE`は`basic`、`bike`、`snake`、`pool-terminal`、`production`。初期値basic。既存output leafは上書き拒否。`STAGE2_WIDTHS`で対象幅を限定できる。productionには別途build済み静的serverを指定し、DEV hook不在と主要UI読込・pause・帰還を確認する。

最高速bike、snake実盤面2変化、pool通常19shot完局/retry、4ab027844 production、compiled5作×desktop/phone主要UIを追加で完了した。最終source継承と各結果は[統合QA](../../STAGE2_BROWSER_QA.md)と[hash照合](../../STAGE2_BROWSER_SOURCE_AUDIT.json)を参照する。015の鳥/移動床通常操縦はrunner_fall担当の別collector/記録を参照する。
