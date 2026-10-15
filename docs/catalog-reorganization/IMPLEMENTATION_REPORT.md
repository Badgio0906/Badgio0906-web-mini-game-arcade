# 一覧再編と4工程開発 — 2026-10-15 JST

開始main: `4b32be51d8673906347cf69a3175d79ff5ed1c3c`、branch `work`、未commit変更なし、worktreeは本checkoutのみ。active31/historical32、033–035未使用。公開指示はユーザー添付「第1～第4工程 一括実装・品質管理・本番公開指示書」。全文は同dir REQUEST.txt。

## 第1工程
作者本人の試遊後の明示指示で001/016/018/019/020/022/023/025/032だけ完成版。004/007/021をretired、026/028/029/030をhidden、010退役維持、008維持。旧HTMLはassets/catalog-reorganization/original-htmlへ保管し、ゲームソース/画像/保存は保持。active24/hidden4/retired4。カード番号を全activeのreleaseOrder順から独立導出し、フィルター/お気に入りで変えない。内部ID/route/releaseOrder/記録定義/保存/Analytics設定は不変。

レビュー担当は実装から分離して委任可能。OpenAI ImageGen toolあり、Art Directorが実利用確認。旧稼働20board、新032と021–032 Analyticsは登録待ち（最新GETで確認後追記）。

検証・独立レビュー・公開証拠はQAとPUBLICATIONを参照。本人の変更後試遊・物理端末・聴感は未実施。

## 実行結果（第1工程）
固定source f28ce3d（実装）。check成功、全87file/1011test成功（bc193ad）、favorite修正後の対象35tests成功、production config build成功。4viewport＋repository subpath通常操作150check成功・pageerror0・POST0。hidden4は旧URLでゲームUI、retired4は終了案内/一覧帰還を確認。画像はQA/local-mapping-fixed。公開前の失敗QAもlocal-final（同意panel未処理）、local-consent-fixed（object key順比較）として保持し、テスト手順を修正。初回全体の7failureは旧固定件数/旧完成状態/旧退役集合/portalとWorker登録の混同で、旧boardを削除せず期待を更新。

記録サービスGET: /v1/health HTTP200 status ok、/v1/records/public/bests HTTP200・20board（Node inherited proxy経由）。Python urllibによるHTTP403はこの環境の経路差で本番障害とは判定しない。Analytics021–032 pendingを維持。第1工程ではWorker/D1へ書込みなし。

新ゲーム用matter-js採用は次工程のみ。第1工程のpackage/ゲーム本体は不変。

## 第2工程候補
002バイク1000m別加速/区間積分スコア、003十形状の実compound物理/左右回転/接触重心芸術点、015十二経路/巡回鳥/移動床、024毎回3–7再抽選の実障害物盤面/安全生成/保存、027正本phaseから独立turn表示/CPU予兆。各固有報告を参照。003の初回本番に架空demoを描く独立findingをtitleModeで限定修正し、Jev Shadowと独立再確認を保存。保存は002 bestScoreV2/bestDistanceV2、003 rules3:best/bonus、015bestR04、024state-shifting-v2。新boardは旧boardを保存して別登録、未登録中は準備中。旧queueもboard別検証で保持し、新ルールへ付け替えない。

Matter.js（新003、今後034の実物理）を採用。10種compoundを同じ描画clipと接触形状に使用し、120simulation単体で確認。Phaser新規参照を増やさずCanvas描画。ImageGen背景/専用facadeを実統合、原本・prompt・hashはassetsの台帳。

## 第2～第4工程の最終実装

上の候補記録は当時の状態。第2工程は25deef9、3工程はe2d59dbで公式公開と配信照合まで完了。現在の最終runtimeは57dce24（active27/historical35）。005combo/fever、006実切返し、009固有12問題、017雨宿りリレー、新033100秒花火、新0348現場Matter解体、新0353endカーリングを実装。全12対象の固有通常QA・独立コード/技術Visual・実画面thumbnailを確認。完成認定は本人指定9作品だけを維持する。

旧8board/BEST/save/eligible候補は保持し、現行比較版を分離。既存記録Workerを非破壊更新し旧default20/current query32/new11boardsを確認、Game032recordsと021～035Analyticsの既存pending方針を維持。完成9作＋008のsrc/HTML差分は開始mainから空。新3作への外部Analyticsは明示OFF。詳細と各工程の実配信・失敗原本・人間未評価は [最終報告](FINAL_REPORT.md)、[公開記録](PUBLICATION.md)、[Visual](VISUAL_REVIEW.md)、[source chain](QA/FINAL_SOURCE_CHAIN.json) を正本とする。
