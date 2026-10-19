# Phase 1 ローカルブラウザ確認

`npm ci`（依存がなければ）、`npm run build`を実行し、リポジトリ直下から以下を実行する。

```bash
python3 tests/adsense-content-phase1/serve.py
```

別ターミナルで同じリポジトリ直下から実行する。ソースは検証中に編集しない。

```bash
CHROMIUM_PATH=/usr/bin/chromium PHASE1_QA_SUBPATH=phase1/ node tests/adsense-content-phase1/verify.mjs
CHROMIUM_PATH=/usr/bin/chromium node tests/adsense-content-phase1/native-short.mjs
```

`CHROMIUM_PATH`を省略するとPlaywright管理のChromiumを使用する。出力はgitignore対象の`artifacts/adsense-content-phase1/`。`PHASE1_QA_OUTPUT`で保存先を変更できる。サーバーはローカル用であり、公開処理ではない。終了時にCtrl+Cで停止する。

- verify: 1440/390/320pxの入口・起動・帰還、about/privacy導線、タグ・お気に入り。`PHASE1_QA_SUBPATH=phase1/`指定時は追加3ケース。
- native-short: 3作品のPC起動、012/013の844×390横画面、014の390×844縦画面。通常入力後に実エンジンが出す既存`start`メッセージを受動的に観測する。ゲーム状態や記録を注入しない。013のSTARTボタン位置は1280×720の既存レイアウトからcontain変換する。
- 外部リクエストを遮断し、本番Analytics・広告・記録への送信を避ける。遮断に伴う広告リソースのconsoleエラーは製品のJavaScript例外と区別する。広告クリックはしない。
- Godot初期化・`start`の観測は、全UI可視・ゲーム完走・面白さ・実機品質を保証しない。特に012のスマホ本体表示欠け、013の縦画面時の横向き案内は既存制約として報告書に残す。
- GitHubの公開窓口はログイン画面への遷移まで別途確認した。新IssueテンプレートのGitHub上の選択は既定ブランチ反映後に人間が確認する。Issueは投稿しない。
