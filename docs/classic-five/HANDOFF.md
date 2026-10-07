# 次タスクへの引継ぎ

この5作品バッチは021〜025で終了。026以降を今回の許可で開始しない。現行状態はCURRENT_STATUSと各作品のQA/PUBLICATION.json／SHEET_UPDATE.json、全体報告IMPLEMENTATION_REPORT.mdを読む。個別の仕様／Visual／Gameplay／HUMAN_PLAYTESTはdocs/game021〜025。失敗ログ・before・旧freezeは履歴として保全し、最新freezeと混同しない。

再現はNode.js24で`npm ci`→`npm run check`→`npm test`→`npm run build`。Workerはanalytics-workerで`npm ci`→`npm run check`→`npm test`（ローカルD1 fixtureのみ）。Jev helperは`python3 -m unittest discover -s tests/jev -p 'test_*.py' -v`でオフライン検証。実APIは新finding時のみ既存Shadow規則に従う。

通常操作collectorはtests/game021〜025に保存。root previewの同じbuildを使い、game022はGAME022_BASE_URL／GAME022_REPORT_DIR、023はGAME023_BASE_URL／GAME023_REPORT_DIR、024はGAME024_BASE／GAME024_REPORT、025 browser-pan-final.mjsはGAME025_BASE／GAME025_QA_DIRで新しい出力先を指定。021は個別QAのcollectorの説明を参照。`.mjs`冒頭で現行URL・出力先・fixture・context routeを確認し、過去のbeforeや既存runフォルダを再使用しない。公開確認は期待SHAのPages workflow SUCCESS後に行う。公開操作は同意拒否＋QA環境＋remote request遮断を維持する。

残作業は本番Worker認証が既に使える承認済み環境での021〜025登録deployと、匿名集計API登録の確認。新しい認証・秘密・権限を作る許可には読み替えない。既存設定／D1 schema／migration／Cronは変えない。コード登録とローカル検証は済み。**deploy成功とID受付・集計互換を確認してから**各新作のremoteCollectionEnabled:falseとsrc/analytics/remoteRegistration.tsのpending IDを解除する別改修を行う。game020は既存本番登録済みで今回再deployしなかった。未観測は0件／欠測として扱い、productionへ架空RUNを送らない。

作者本人と実機iPhone／Androidでの試遊、ドラッグ／panの触感、音量・ゲームの面白さは未実施。ユーザーはこの状態での試作公開を承認済み。独立技術レビュー、Visual83点、Jevのroutingを人間評価の代わりにしない。今後の本人所感は新しい実観測として既存ログと区別する。

候補表は今回5つのAセルだけ公開確認後に済へ更新・読戻し済み。No21／A22のGame020や他候補、format／validation／No.／題名を編集しない。Sheet更新証拠は各QA/SHEET_UPDATE.json、Drive／Sheets pluginを使用した。既存Game018未commit作業は元worktreeに残し、今回の公開へ再混入させていない。
