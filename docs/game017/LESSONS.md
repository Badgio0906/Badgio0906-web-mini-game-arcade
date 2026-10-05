# Game017 — LESSONS

- GOALは表示された領域として判定する。一点の厳密X比較はnative touchの小さい丸め誤差で練習を到達不能にした。
- Canvasのintrinsic height変更は描画を一度消す。layout変更後は2 RAFを待って入力座標と実画像を取得し、途中の青い画面を恒久的な製品問題へ変換しない。
- raw CDPで1 moveだけの高速dragを送ると、次のnative button clickがChromiumから出ない。Game017を読み込まない最小ページでも再現。中間点を含むgestureと、2点でも貫通を検出する純粋sweepテストを別に保持する。
- 雨の落下時計はdash経過、残像は経路の弧長で決める。RUN全体時間の剰余やX座標検索は停止時間／後退線に対応しない。
- 製品とテスト基盤の分類は実イベント・source・最小再現で行う。Jevは参考。ビルドgateの失敗と、公開時のユーザー被害riskも別に扱う。
- 技術的なnative6round成功、実画像81点と、楽しさ／酔い／親指操作の人間評価を混ぜない。
