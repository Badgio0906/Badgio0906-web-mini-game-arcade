# 表示014の雨ゲーム — 改良候補への訂正報告

2026-10-19。ユーザーの意図は既存雨ゲームの改良だった。新作Game038という解釈を撤回し、表示014/内部Game017のrevision03候補へ移管した。番号の一致をCatalog実モジュールで確認し、別作品である内部Game014（指ハート、表示011）には触れていない。

## 実装

038候補のmodel/render/style/assetsをGame017/revision03へ移設。候補HTMLは`game017-revision03.html`、DEV readonly診断もgame017/display014/rules3を返す。既存正式HTML/Catalog/gameVersions/recordDefinition/Worker等は不変。038の製品HTML/source/public assetは現行treeから撤去し、旧QA/raw/履歴はdocs/game038に撤回表示を付けて保持した。新IDの予約・本数加算はしない。

モデル・styleと14個の配信WebPは移設前と同じbytes。renderの参照path、画面の識別、固有保存namespaceを訂正し、旧雨宿りBESTの読取表示を加えた。ImageGenを新たに呼んでいない。背景は既存017の雨の街そのものを保持する。

新BESTは`game017:umbrella-r3:best`、旧`game017:best`と`bestRelayV2`は更新しない。038の誤った試遊BESTも保全するが、新候補へ移さない。旧Portalは引き続きrules2のBESTを読む。新候補の点数を旧オンラインboardへ混ぜず、通信を有効化しない。

## 検証

移設後に型検査PASS、全体1,127 tests/107 files PASS（うち候補モデル15＋番号/保存境界2）。旧公開route・Catalog・記録定義・Godot014・既存017背景等42ファイルは移設前2a6e36aとbytes一致。model/style＋14配信画像の16ファイルも旧038候補とbytes一致（[不変検査](QA/INVARIANTS.json)）。

初回移設1e55d97のnative検査は49 checksでFAIL。追加した長い識別見出しが320×568で2行になり、ラインボタンbottom574で下端を6px越えた。初回desktop/390は実90秒完走1910点だったが、全体成功とはしない。[初回raw](QA/browser-fixed/RESULTS.json)を保持した。

3b8adf8でHTMLの見出しだけ「014 · RAINSHIFT 改良候補」へ短縮。model/styleは触れず、固定sourceでnative全4幅を再実行し**89 checks PASS**。320のボタンbottomは562で画面内へ戻った。[再検証raw](QA/browser-label-fix/RESULTS.json)、[実行ログ](QA/browser-label-fix/RUN.log)。

| 幅 | 本番の観測 | 濡れ累計 | 得点 |
|---|---|---|---|
| 1280×800 キーボード | 実90秒帰宅・傘27回乗換 | 0.0089秒 | 1910 |
| 390×844 タップ | 実90秒帰宅・傘27回乗換 | 0秒 | 1910 |
| 320×568 タップ | 6.708秒で休憩まで | 0秒 | 270 |
| 844×390 タップ | 6.7273秒で休憩まで | 0秒 | 270 |

小さい2幅を90秒完走とは呼ばない。4幅で練習9秒/別傘への乗換、3秒失敗/再挑戦、休憩、44px以上のボタン、横overflowなし、保存拒否時の説明を確認。旧best313/relay4242/誤038best777をfixtureとして事前保存し、候補BEST1910の保存後も旧3値が変わらないことを確認した。実ユーザーの保存データを取得/変更した検査ではない。

修正後HTMLで限定Vite build PASS。[compiled検査](QA/compiled/RESULTS.json)は4幅24 checks PASS、表示014識別・DEV診断なし・失敗/再挑戦・横overflowなし・HTTPerrorなし。native/compiledともpageerror/POST/外部requestなし。通常キー/タップで操作し、DEV診断は読み取りだけ。時計加速や内部state書換えはしていない。

移設前のGame038名義77/20成功・独立Visual81は履歴として保持し、新結果へ流用していない。[独立移設レビュー](INDEPENDENT_MIGRATION_REVIEW.md)で番号/旧保存/保護ファイル/新QA証拠を確認しPASS。[独立Visual移設差分レビュー](VISUAL_MIGRATION_REVIEW.md)で4幅の識別/BEST/収容を確認し限定PASS。新たな総合Visual点は付けず、人間の面白さ判定と区別する。

本人/物理端末/Safari/実音/連続FPS/公開環境・正式採用は未実施。main反映・deploy・PR作成・Actions手動起動/再実行/取消は行わない。
