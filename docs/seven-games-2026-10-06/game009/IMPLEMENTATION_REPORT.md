# Game009 改訂02 — 実装報告

26種類（非印鑑24）の専用SVGを制作して、色・丸四角印だけの探索を廃止。名前／色／キャップの同一predicateで全一致個体を正解にする。9→16→24品、同一机3問、紙の物理遮蔽と折り目めくり、軽い整頓コストを実装。旧bestは保持し、新bestRules2と明示した新版／旧版表示へ分離。広告・CREDIT・外部送信は導入していない。

本番75秒、誤答−2秒、整頓−2.5秒、発見100＋検索速度最大30＋散乱最大15。これらは人間試遊前の調整仮説。整頓は全紙を除き回転を整え、散乱bonusだけ失う。紙・対象の順序と実SVG painted pathsが入力を受け、透明な巨大矩形は使用しない。細いクリップの内部空洞はクリック対象ではない。人間の親指の押しやすさは未確認。

## 検証

- Vitest8/8 PASS。[unit log](QA/unit-first.log)。種類／同条件全正解／机の再利用と増加／遮蔽／軽い罰／一回加点／本番時間／実練習／防御コピー。
- [native4](QA/native-painted-retest/report.json) desktop1440×900、phone390×844、320×568、横844×390 PASS。各画面で実3練習→本番14問／24品→誤答でもRUN継続→pause停止→resize保持→整頓→Enter/repeatで15個→75秒自然終了→新BEST保存／旧777保持／mute再読込。キーボード・クリック・touchscreen入力、readonly IDs/shape anchorsは答えを選ぶテストオラクルであり人間の探索速度の証拠ではない。source SHA before/after一致、全ブラウザを閉じた。
- 紙の端を64artwork unitsへ広げ、320pxでも44CSSpxを確保。ペンのキャップ輪郭と練習pause▶の限定修正は[limited-final-complete](QA/limited-final-complete/report.json)へ別記録。モデル／配点は変更なし。
- check初回は009固有エラーなし。他担当006/008の途中変更エラーを含む[原本](QA/typecheck-first.log)。統合のcheck/buildはMain担当。

## 原本と修正分類

初回のfont URL404は製品の素材URL不具合。共有fontの実URLへ009 CSSだけ修正。元の画面と[中断理由](QA/native-first/INTERRUPTED.md)を保持。2回目は共有Viteに他HTMLのHMRが混入する危険をMainが確認し、[中断理由](QA/native-font-retest/INTERRUPTED.md)と画面を保持、以後/tmp固定copy＋独立portで実行。

最初のisolated collectorはクリップの空洞をクリックする誤ったテスト座標を使った。[4失敗原本](QA/native-isolated/report.json)を保持。透明な入力矩形でその空洞を救済せず、collector座標を描かれたstrokeへ移し、成功ごとのassertを追加した。修正後native4がPASS。実SVG形状に関するこの失敗を、製品がクリックを取りこぼす問題へ転用しない。

[26素材台帳](ASSET_INDEX.json)、[Visual Brief](VISUAL_BRIEF.md)、[人間試遊未実施](HUMAN_PLAYTEST.md)。独立Visual/Feel/QA、Jev、配信統合と公開の最終結果はMain側の統合報告を優先する。実装者だけで独立合格と扱っていない。

限定collector原本も保持：Resume押下のphase guard待機不足は[原本](QA/limited-final/INTERRUPTED.md)、galleryをfile://で開けないbrowser環境制限は[原本](QA/limited-final-retest.log)。後者はHTTP提供へ切り替え、製品の入力や素材を変更していない。

## 最後のタッチscroll修正

4画面の75秒RUN確認後、机を物の上からscrollするとpointerdown即回答が誤答へ化けるという入力の構造的問題をコードで確認した。009 Boardだけpointerupの短いtapへ移し、8px超の移動・pointercancel・別roundへの持越しを捨てる。touchのpreventDefaultを除いて縦scrollを許可。Keyboard/補助技術は既存の一回発火を保つ。モデル・配点・記録形式は不変。

[追加native4](QA/touch-scroll-final/report.json) PASS。通常14問で24品の画面を取得し、描かれた物の上からCDP touchStart/move/endによる実swipeで320／横の机scroll0→65px、発見／誤答は増えない。その後の紙端tap／物tap／Enterで各16正解まで確認した。入力修正前75秒結果・保存の証拠と、修正後scroll/tapの証拠を別範囲として記録。新しい通常24品画像はtouch-scroll-final/*-24-normal.png。

最終unitは26種類が本当にお題になるcoverageまで強化した[009＋010 16PASS](../game010/QA/unit-final.log)。最終型チェックは[共通ログ](../game010/QA/typecheck-final.log)。両者のModelは変更していない。親指の押しやすさ・実機scrollは依然未実施。WORK_LOGは直接instrumentされた最後のQA時刻だけ記録し、実装開始や使用量を推測していない。

素材の手描き原本は配信SVGそのもの。26ファイルを再現する[authoring script](ASSET_AUTHORING.py)も保存。実装者が26contactとphone/desktop通常画像を実viewしたが、独立Visual点はここで付けていない。
