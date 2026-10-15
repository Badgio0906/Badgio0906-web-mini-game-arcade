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
