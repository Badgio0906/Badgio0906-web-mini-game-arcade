# 初回所見と修正履歴

- initial unit: 7/8 PASS。テストは単純lookaheadが3scenarioすべてでgreedyを上回ることを仮定した。実測scenario1は2430対1880。高得点の遠距離コピー機を運ぶ価値がある意図的な反転。生成を変えてテストを迎合させず、二つでは先読みが勝ち、残る一つで重い遠距離の価値が勝ることを検証する形へ修正。POLICY_COMPARISON.jsonはモデル計算であり本人の記録ではない。
- 初回画面: 320×568の三操作 y565.8〜615.8で画面外、phone音button42.95px、portal32px。対象CSSを狭い短画面へ縮め、44px操作を確保。再測定320はy480.1〜530.1、portal/mute44px。最初のlayout inspectorは固定名を使用しており再実行で初回PC/narrow/landscape画像を置換してしまった。画像はlayout-retestへ改名し、初回画像の証拠と呼ばない。初回寸法は実ツール出力からここへ転記。phone初回画像は別scriptで保持。
- 非隔離native-firstは他ゲームHTMLによるfull reloadを避けるため途中で停止。部分画像は残し、完走PASSとして扱わない。後続native-isolatedは/tmpのソース・HTML・public snapshotを使う。
- 全体tscの初回失敗は007のunion/null telemetry、phase narrowing、旧event名を修正。中間全体checkは別担当の編集中006エラーだけ残り、007エラー0。共有最終check/buildはMain担当。
