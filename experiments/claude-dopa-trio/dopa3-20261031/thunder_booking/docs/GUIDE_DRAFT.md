# 遊び方ガイド草稿 — 雷、予約しました。

（実装事実だけで書いた草稿。面白さや人気の主張は入れていません。統合後のビルドで再確認してください）

## 目的
0.9秒後の場所へ、雷を予約。

## 操作
- **reserve**: pointerdown on the battlefield (clamped, no snap); 1 tap = 1 slot
- **keyboard**: arrows move cursor 300px/s, Space (non-repeat) reserves; Space also starts the clock from the READY screen
- **pause**: button / Esc / P; blur, visibilitychange hidden and pointercancel auto-pause; explicit 再開

## 得点とランク
- Per strike n kills: 100n+50n(n-1) (6 → 2100). Boss kill 2000; clear bonus shield×300 + floor(remaining s)×100. Each once. Formation <3 kills → shield −1 once. Validation max observed by plan: 20400.
- S: clear + ≥3 six-kills + 0 formation fails; A: clear + ≥1 six-kill; B: other clear; C: fail

## 練習
Formation 1 three times (16.5s), separate score, no shield loss, no BEST。練習の得点はBESTに保存されません。

## 終了と保存
- 一時停止中はゲーム内の時計が止まります。タブを離れる・ウィンドウのフォーカスが外れると自動で一時停止します。
- BESTはこのブラウザ（同じ配信元）にだけ保存されます。保存できない環境では、画面を閉じるまでの一時記録になります。
