# 検証基盤の修正記録

製品仕様変更によるREDは `red.json`。修正前HEAD62ac472は回転で自動停止しない。

- green-initial: 3 assertionは成功したが、新規collectorのRED分岐でpass記録を付け忘れexit1。記録フラグを修正。
- browser-full: 設定欄のbuttonを曖昧に選択し、shadow DOM内4要素に一致した。実際の既存文言「許可しない」とsettings IDを指定。製品の解析処理は変更なし。
- compiled-final初回: Game008は共有onboardingを使わない固有練習のため、共有練習の回帰対象を現行activeのGame005へ変更（中間候補Game004は退役済みで公開終了ページだった）。
- 入力collectorの回転後は旧仕様の「そのままプレイ中」から、明示再開を挟む現行仕様へ更新。帰還リンクも案内用とheader用の2本になったため、通常帰還のselectorをheaderへ限定。

初回を含む原始ログは `/workspace/audits/game015-portrait-20261020/` に保持する。これらのcollector修正のために製品コードは変更していない。
