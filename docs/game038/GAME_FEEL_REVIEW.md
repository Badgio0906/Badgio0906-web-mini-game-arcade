# Game038 技術的Game Feelレビュー（提供証拠の独立確認）

2026-10-18 UTC。独立reviewer subagentが[生RESULTS](QA/browser-fixed/RESULTS.json)、[実行collector](../../tests/game038/browser.mjs)、実PNGを確認した。本担当自身のlive browser操作・人間Feel評価ではない。対象`963956abf095492e17dd58bfee148388c3e29f56`は[独立モデルQA](INDEPENDENT_QA.md)の7d0287bから、製品差分がstreetの幅指定CSSだけ。モデル・入力・保存・描画sourceは同一で、RUN前後hashと現ファイルも全一致。

**初期playableの技術的な操作・進行成立はPASS。** Linux headless Chromiumの通常keyboard/tap/swipeで、readonly DEV観測から案内傘を選ぶ自動操作。時計加速や盤面書換えはcollectorにない。77/77checks、pageerror/POST/外部requestは0。

| 実画面 | 本番の確認結果 | 練習 |
|---|---|---|
| PC 1280×800 | 実90秒・180m完走、1910点、濡れ0.0102秒、27乗換え | 9秒・3乗換え・濡れ0・得点0 |
| touch 390×844 | 実90秒・180m完走、1910点、濡れ0秒、27乗換え | 同上 |
| touch 320×568 | 約6.64秒まで進行しpause。90秒勝利は未実施 | 同上 |
| touch 844×390 | 約6.70秒まで進行しpause。90秒勝利は未実施 | 同上 |

全4幅で濡れ3秒失敗→retry初期化、pause時計停止→Escape復帰、練習BEST除外→別操作で本番開始、learned/mute再読込を確認。PCはrepeat無視、touch3幅はlane tap/通常swipeを確認。PC/390の完走BESTは保存1910点と結果が一致。保存拒否のmemory表示は390幅の別fixtureだけで確認し、他幅や完走保存拒否まで広げない。

実viewした[PC進行](QA/browser-fixed/desktop-play.png)では足元の保護円、上中下ラベル、270点と現在の親子+90表示が対応する。[390完走](QA/browser-fixed/phone-home.png)は0m/1910点/到着の結果とretryが読める。[320練習成功](QA/browser-fixed/narrow-practice-clear.png)は本番開始を独立ボタンで示し、[844進行](QA/browser-fixed/landscape-play.png)では左HUD・右道路/3ボタンを同時に判読できる。主要lane buttonは全幅44px以上でviewport内、横overflowなし。人物や保護円の重なりを初見で理解できるかは人間確認が必要。

公式帰還は4幅ともhref一致だけで、実クリック後の到着は未実施。320/844の本番完走、blur/hiddenの実タブ操作、複数pointer、物理端末/Safari、音の聴感、連続FPS、初見の迷い・3秒許容量・90秒の長さ・再挑戦したくなるかは未評価。自動案内傘追従の成功を人間の面白さ・実機合格・完成版・公開の承認へ読み替えない。
