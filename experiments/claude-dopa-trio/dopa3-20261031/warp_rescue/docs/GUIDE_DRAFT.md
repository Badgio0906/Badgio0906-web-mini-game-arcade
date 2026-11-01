# 遊び方ガイド草稿 — ワープ救助隊、全員まとめて！

（実装事実だけで書いた草稿。面白さや人気の主張は入れていません。統合後のビルドで再確認してください）

## 目的
入口で拾って、開いた出口へ一斉送還。

## 操作
- **select**: 6 DOM buttons: round 入口 (mint) and square 出口 (coral), pointerdown; each selector has its own 80ms cooldown
- **keyboard**: Q/W/E inlet, A/S/D outlet (no repeat)
- **pause**: button / Esc / P; blur and hidden auto-pause

## 得点とランク
- Rescue: 100×min(3, 1+floor(streak/10)); reroute or inlet miss resets streak. Wave of 5 all rescued: +300, all same dock: +500 instead. Clear (≥42) +1000; all 60 +1000. Reading plan: 21,200.
- S: 60 rescued; A: ≥54; B: ≥42 (clear); C: <42

## 練習
Waves 1–2 (10 capsules), separate score, no BEST。練習の得点はBESTに保存されません。

## 終了と保存
- 一時停止中はゲーム内の時計が止まります。タブを離れる・ウィンドウのフォーカスが外れると自動で一時停止します。
- BESTはこのブラウザ（同じ配信元）にだけ保存されます。保存できない環境では、画面を閉じるまでの一時記録になります。
