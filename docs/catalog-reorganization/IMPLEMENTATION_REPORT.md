# 一覧再編と4工程開発 — 2026-10-15 JST

開始main: `4b32be51d8673906347cf69a3175d79ff5ed1c3c`、branch `work`、未commit変更なし、worktreeは本checkoutのみ。active31/historical32、033–035未使用。公開指示はユーザー添付「第1～第4工程 一括実装・品質管理・本番公開指示書」。全文は同dir REQUEST.txt。

## 第1工程
作者本人の試遊後の明示指示で001/016/018/019/020/022/023/025/032だけ完成版。004/007/021をretired、026/028/029/030をhidden、010退役維持、008維持。旧HTMLはassets/catalog-reorganization/original-htmlへ保管し、ゲームソース/画像/保存は保持。active24/hidden4/retired4。カード番号を全activeのreleaseOrder順から独立導出し、フィルター/お気に入りで変えない。内部ID/route/releaseOrder/記録定義/保存/Analytics設定は不変。

レビュー担当は実装から分離して委任可能。OpenAI ImageGen toolあり、Art Directorが実利用確認。旧稼働20board、新032と021–032 Analyticsは登録待ち（最新GETで確認後追記）。

検証・独立レビュー・公開証拠はQAとPUBLICATIONを参照。本人の変更後試遊・物理端末・聴感は未実施。
