# 新作22作品・GAPS統合版の本番公開完了

- PR: [#20](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/20)、通常merge済み。
- main / Pages SHA: `7209da2f92a61c1137466192f0a5ecd9238005e8`。
- PR head: `dda5f98ea342933776c0c10803baab161b738f89`。CIとmergeのtree一致を確認。
- PR検証: [41311100401](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/41311100401) 全step成功。
- Pages: [41311374285](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/41311374285)、build/deploy成功（通常公開1回）。deployment7473687989はsuccess、mainと同じSHA。
- 公開サイト: https://game100garage.com/

## 本番検証

[ブラウザ結果](QA/production-live-1793539899898/report.json) PASS。Linux Chromium/スマホ相当390×844で新22全作品の起動・必要ボタン・一覧帰還、portal4viewport（1280×720/390×844/320×568/844×390）を確認。50カード、ANDのステルス絞込、favorite保存/再読込/優先表示が成立。旧28全canonical URLは200、新旧のabout/privacy/ads.txtへアクセス可能。Game031/048、削除4、037は404を維持。

[LIVE_ASSET_INTEGRITY](QA/LIVE_ASSET_INTEGRITY.json)は本番canonical HTTPSの139ファイルを検証済みproduction buildとbyte照合し全一致。22作品のHTML/JS/CSS、GAPS9bank/64WAVを含む。改修コードとSEを同じ公開版で配信している。これらは取得検証で広告表示の人工発生ではない。

本番ブラウザでは第三者通信とPOSTを遮断し、解析を拒否した。広告クリック・実記録投稿・AdSense管理画面操作なし。pageerror/自サイトasset404は0。保留/削除404は意図した別のHTTP検査で確認。

## 保護と留保

旧28/完成9、Game012横専用、Game015縦専用、共有練習[open]、Game036/038のsourceと既存保存を保持。新22は全て試遊版で、合計50/完成9/試遊41。048は通常入力の本番完走未確認のため非公開、コード/素材/39unit/失敗証拠を保持。037/039を勝手に採用していない。

AdSense/Publisher/CMP・GA4/Telemetry設定・Worker/D1・CREDIT・Actions設定は変更なし。追加有料API/Runner/サービス契約、課金/Webhook変更、手動CI再実行、force pushなし。今回の費用不明点は作者が明示了承した。AdSense再審査は実施していない。

1288unit・型・25offlineJev・buildと、ローカル通常完走/Visual/性能の詳細は[実装報告](IMPLEMENTATION_REPORT.md)。本番確認は起動と導線の技術検証であり、全本番コース完走や実iPhone・聴感・人間の面白さの認定へ拡張しない。060小字P2、048の入力許容/作者試遊、各作実機/音/Feelは今後の品質課題。062は元Canvas描画、050〜059は配布JS復元であり元TS/mapsは未回収。

## 結果記録の保存

公開後文書と再現用live scriptは結果専用branch `docs/publication-20261101-results` に保存する。mainへの文書追記で2回目のPagesを起動せず、公開main/PagesのSHA一致を維持する。結果文書のmain反映は将来の承認済み変更とまとめて判断する。本作業として再merge/deployしない。
