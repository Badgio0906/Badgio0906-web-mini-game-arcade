# Game022 引継ぎ

タイトル・ID・route：ひと息ソリティア ～KLONDIKE～／game022／https://game100garage.com/game022.html。独自52枚モデル、1/3枚、random/JST daily、tap/drag、任意練習／説明。保存prefix既存共通の当ゲーム専用、既存001〜020互換維持。

再現：npm ci → npm run check → npm test → npm run build → npm run preview -- --host 127.0.0.1。実操作collector：node docs/game022/QA/compiled/reviewer-probe.mjs（4173）。公開試験ではGAME022_BASE_URLとGAME022_REPORT_DIRを指定。全消去fixtureはDEV専用で本番へ混ぜない。

最終root457テスト、Worker check／ローカルD114イベント4RUN、compiled4画面、Visual83/F13/H13。修正前後・失敗・4件実JevのHTTP200＋4回答と独立判断をQAに保持。Workerコマンドの初回typecheck script不存在は実行ログを保持し、正式checkで検証済み。本人の楽しさ・実機・長時間は未確認。

このcommit後に期待SHAのPages CI成功→公開通常実操作・Portal21とthumbnail→候補表A26だけ済／読戻しの順。公開証明はQA/PUBLICATION.json、候補表はQA/SHEET_UPDATE.jsonが作られてから確定する。新作Worker本番は認証blocker、外部収集停止。解除時は実deployの新ID受付確認後、当ゲームremoteCollectionEnabledと中央pending setを一緒に見直す。Secret/権限の新設は行っていない。
