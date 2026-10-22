Game001・005では短い横画面で練習を閉じても、共有CSSのdisplay:gridが閉じたdialogへ適用され、画面が残っていた。Game005では開始タップも遮断される。横向きgridの対象をopen属性のあるdialogに限定して修正する。

製品差分は `src/arcade/onboarding.css` の1セレクターのみ。開いた練習の2列表示・JSの入力解除/フォーカス復帰・保存を維持し、ゲームルール・広告/解析・Worker/D1は変更しない。

変更ファイル：共有CSS、ブラウザ回帰collector2本、CURRENT_STATUS、修正報告とRED/GREENのJSON・画像・検証ログ。

検証：修正前16条件の8失敗を保存（追加で001の残留、005のタップ遮断を実測）。修正後DEV16/16、compiled16/16、横画面成功後4/4、共有作品と追加幅14/14。check成功、unit106files/1013tests成功、build成功、offline helper25成功。最初のunit fixture不足と、独自onboarding作品を対象にしたcollector誤設定も記録。

PR11のGame015専用機能は取り込まない。保存済みlocal PR11候補の共有CSSと一致し、remote候補のsuspension APIともコード上整合する。実PR11統合/実iPhone Safariは未実施。

詳細：`docs/adsense/SHARED_PRACTICE_DIALOG_FIX_20261022.md`。

これはDraftレビュー用。main統合・本番公開・AdSense再申請は行わない。本番P1は公開後の確認まで未解決として扱う。
