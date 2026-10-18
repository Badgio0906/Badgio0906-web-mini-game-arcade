# 検証補助処理の記録

番号照合の最初の補助コマンドは存在しない`src/portal/catalog.ts`を指定して失敗した。実体`src/data/gameCatalog.ts`に訂正して実exportを読み、IDENTITY.jsonを得た。後者の終了時にViteの非同期dependency scanが閉じたserverへアクセスする診断ログが出たが、番号の読み込みは完了した。アプリ実行や型/単体/buildの成功とは混同しない。

最初のgit addは既にrenameで削除済みの旧test pathを明示しpathspecエラーとなった。git index/workingtreeを確認してstageをやり直した。製品コードの失敗を隠すためのtest再実行はしていない。

`git diff --check`のEOF空行指摘はnpmのrawログ2本のみ。raw証拠は整形せず保持し、ログ以外の変更には同checkの指摘なし。compiledの識別assertは既存のheader2個を踏まえ`.game-heading`に限定してから初回実行する。

## 初回移設browser FAILと限定修正

1e55d97でdesktop/390の実90秒は完走1910点、旧save保持は通過したが、320×568のcontrols viewport検査で3ボタンのbottom=574、画面下端568から6pxはみ出しFAIL（49checks）。rawは`browser-fixed/RESULTS.json`とPNG/logを保存する。追加した長い英語見出しの折り返しが原因候補。見出しを「014 · RAINSHIFT 改良候補」へ短縮し、model/styleは変更せず、次の固定commitで再検証する。初回失敗をPASSへ上書きしない。
