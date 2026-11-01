# 遊び方ガイド草稿 — ずらして、全段ぶち抜け。

（実装事実だけで書いた草稿。面白さや人気の主張は入れていません。統合後のビルドで再確認してください）

## 目的
ずらして揃えて、4段まとめて撃ち抜く。

## 操作
- **shift**: pointer drag on a row; on release round(dx/cell) clamped to −2..2; one owner pointer; pointercancel discards
- **cannon**: column buttons 列1–5 or tap below the board (pointerdown)
- **fire**: FIRE button (pointerdown; click only for keyboard activation)
- **keyboard**: 1–4 row, ←→ shift 1 step, Q/E cannon, Space fire (no repeat)
- **pause**: button / Esc / P; blur and hidden auto-pause

## 得点とランク
- Shot breaking n rows: 100n². Room cleared by its first shot with 4 rows: +400, other room clear +100. All rooms: 1000 + shells×50 + floor(remaining s)×50. Score = max(0, destroy + bonuses − 20×moveSteps) computed from totals. Optimal plan: 14,920.
- S: all 6 rooms with one shot each and moves ≤ min total (19) + 6; A: clear + ≥4 one-shot rooms; B: other clear; C: fail

## 練習
Room 1 only with 3 shells, separate score, no BEST。練習の得点はBESTに保存されません。

## 終了と保存
- 一時停止中はゲーム内の時計が止まります。タブを離れる・ウィンドウのフォーカスが外れると自動で一時停止します。
- BESTはこのブラウザ（同じ配信元）にだけ保存されます。保存できない環境では、画面を閉じるまでの一時記録になります。
