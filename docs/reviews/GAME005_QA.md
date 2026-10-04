# Game005 SORT SHIFT — QA

技術 QA PASS。**Unit 53 件、Game005 ブラウザ 10 ケース、静的 production 1 ケース成功**。Unit は Sort 6 件と既存 47 件（Main Agent の全体実行）。ブラウザは対象別の実行を合わせた 10 個の異なるケースを確認し、7 テスト × 3 project の重複 11 件は意図して skip。修正後の mobile pending 2 ケースを追加で再確認。TypeScript / `npm run build` 成功。技術ブロッカーなし。Game005 の人間 A〜J と公開判断は未実施。

## モデル検証

最初は shape の荷物 1 個、判断期限 4.8 秒。4 属性を独立して保持し、現在のルールだけで左右を判定する。dispatch 中の 40 回の連打は受け付けず、新しい荷物へ入力を持ち越さない。

3 RNG seed で公開入力を使って各 128 個を仕分け、4 次元 × 正常 / 反転の 8 mapping、各属性の両値を確認。独立した属性表から求めた回答とモデルの診断が一致。8 正解ごとのルール変更は約 0.95 秒、荷物なし・入力拒否。期限は徐々に短くなり 1.3 秒を下回らない。保持する荷物は常に 1 個で、履歴を増やす配列や入力 queue はない。

wrong / timeout はそれぞれ即時・一度だけ終了。実際の入力、期待方向、ルールと属性を結果に保存する。診断・結果のコピーは本体を変更できず、無効な dt / 入力を拒否し、大きいフレームは 50ms に制限。reset / start で前の RUN を消す。

## 実際のブラウザ

通常の ← → / A・D / native button / 左右半分のタップを使い、診断は荷物・ルールの読み取りだけに使用。状態書換え・強制終了は使わない。自動の回答方針は人間の視認・判断能力の評価ではない。

- PC / 縦 / 横で、dispatch の連打と押し続けたキーの repeat を拒否。次の荷物は意図した新しい入力でだけ仕分ける。
- 判断中の pause は time / remaining を保存し、荷物の CSS animation も停止。mute 保存、blur、途中 title の非消費と quit / run_end / duration / game_id を確認。
- 通常キーで **40 正解**まで進み、正常 shape / brightness / size / symbol と反転 shape を通過。その後の反転 brightness の左右ラベルも確認。8 正解で新しいルールを予告し、荷物なし・左右入力拒否を確認。変更中の pause は phaseRemaining と time を保持する。
- 40 正解後の自然な wrong で CREDIT 1→0、NEW BEST / BEST 40、期待方向の明確な表示、sorted_count / rule_change_count 各一度、reload 後の Best / CREDIT を確認。
- **wrong → timeout → wrong** の 3 RUN で CREDIT 3→2→1→0 を各一度、即時消費。timeout は時間切れと表示。retry、credit_zero、reward_offer_shown、run_start / end / duration / score / sorted_count / rule_change_count の回数、Stub +3 の多重クリック防止、reload 保存と Game004 との分離を確認。
- cached pagehide は途中の期限を pause し、resume 後の自然な wrong だけで一度終了。保存済み CREDIT 0 のタイトル offer は一度で、補充クリックで重複しない。
- 同時 2 本指の primary だけを受理し、副ポインタは別の荷物へ入力を持ち越さない。native button の Enter / mouse click は一度受理。押した Space を別の Arrow 操作で荷物が変わった後に離しても、新しい荷物に古い入力を適用しない。
- 1366×900、1280×720、1024×768、390×844、320×568、844×390、568×320 の 7 サイズで 40 正解 / NEW BEST / CREDIT 0 の結果カード、正解方向、Stub、操作が画面内。pause も通常・小型縦横で確認。補充待機中のカード / Stub / CTA / TITLE が小型縦横で画面内に収まり、操作は 44px 以上。

`artifacts/qa-game005-forty-sorted-320-568.png`、`artifacts/qa-game005-forty-sorted-568-320.png`、`artifacts/qa-game005-mobile-portrait-reward-pending.png` を目視確認。通常入力 / pause / mute の 3 project と production で console error / pageerror なし。

Game Feel の別レビューでは通常操作 65 正解、8 mapping、1.3 秒期限、縦横 33 正解まで確認。詳細は `GAME005_FEEL.md`。QA の 40 正解と混同して数えない。

## 静的ビルドと軽量性

Game001〜005 の HTML を静的生成。Game005 JS 17.99 kB / gzip 6.92 kB、共通純粋サービス JS 4.14 kB / gzip 1.67 kB、CSS 25.51 kB / gzip 5.65 kB。Phaser を使う既存ゲーム向けの約 1,208 kB chunk の注意表示は残る。

source import graph は main / SortRun / SortBoard / contracts と core 5 サービスだけで、外部 import なし。production の実際の script 応答本文を検査し、**22,128 bytes**（Game005 17,993 + RewardService 4,135）だけを取得。engine signature なし、Phaser chunk を要求しなかった。reload の HTTP 304 は検査済み 200 の同じ URL と照合。証拠は `artifacts/qa-game005-production-network.json`。

production は開発診断 hook と Canvas なし。荷物の見える shape を読んで通常キーで仕分け、wrong → CREDIT 2 / Best 1、retry、pause / resume、title、mute / Best / CREDIT の reload 保存を確認。

## 指摘と修正確認

UI Engineer の追加 smoke で 320×568 の補充待機カード下端が 598.48px、document 高さ 606px となり画面外へ出た。Main Agent の fix window で補充 CTA / TITLE を横並びにする修正後、QA は待機中の card / Stub / 両ボタンの画面内配置と 44px の操作サイズを縦横で再確認した。補充処理と入力 queue は変更されていない。

40 正解ケースの初回 reload だけ失敗した。QA の init fixture が reload ごとに CREDIT を 1 に書き戻していたため。storage が未設定の場合だけ初期値を入れる fixture へ直し、同じ通常操作・7 サイズ・reload を再実行して成功した。実装の保存不具合ではない。

## 人間に残す確認

最初の説明の分かりやすさ、ルールを切り替える面白さ、認知負荷、音、実機の操作感、想定 1〜3 分のプレイ時間、再挑戦意欲は人間 A〜J で確認する。サーバー・本番広告・全 OS / browser の実キャッシュ動作・実機 FPS は未検証。技術 PASS を公開承認や面白さの確定として扱わない。
