# Jev Shadow — 今回の実記録

本文観測の補助分類だけ。画像を見せて合格にしたものではない。既存4問PRIMARY_CAUSE / CODEX_ACTION_REQUIRED / HUMAN_ONLY_JUDGMENT_REQUIRED / RELEASE_RISK_IF_UNRESOLVEDを使い、requested typesafe/jev-1.13、POST openrouter.ai/api/alpha/decisions。API鍵をログ／コードへ保存せず、代替model、同checkpoint再送、自動修正や公開判定は使っていない。

|作品・checkpoint|観測|Jevと独立Codexの違い|
|---|---|---|
|018 A|初期関節の長さ変化と足首不連続|原因PRODUCT_BUGは一致。Jev human-only.74、Codexは客観的骨長／不連続原因の判断に限りfalse。美観は別。|
|003 B|横画面のテスト期待600、実点／保存300、最後offset6.065|Jev PRODUCT_BUG.84／risk.79。Codexは実PERFECT範囲6pxを外れたため固定期待値のTEST_INFRA_BUG／risk false。|
|008 C|実viewで器／手を判別、横で縦圧縮、慎重／急ぐ比較|原因VISUAL_OR_FEEL、human-only一致。Jev action.36、Codexは独立横サイズレビューが必要と判断してtrue。そのレビューで比例圧縮を実際に発見し作者へ修正依頼した。|
|009 B|紙上の44/49押下後、次の折り目locatorが消えてtimeout|Jev PRODUCT_BUG.57／risk.75。Codexは正規折り目を先に押したcollector順序のTEST_INFRA_BUG／risk false。|

003／009はJevの判断に合わせて製品を変更せず、source・DOM座標と通常入力を調べてcollectorだけを修正した。全判断と原本を保持。008の横圧縮は独立VisualでF/Hがgateを下回り、CSS比例表示とHUD位置を限定修正して再view合格。Jevの低actionを理由にレビューを省かない。

006／007／010には今回APIを実行していない。意味のある観測を持つ4地点に限り使用し、回数消化のためのA〜E全送信はしていない。各ゲーム5／全体35の上限以下。

実call4、HTTP200 4、直接報告cost合計USD0.00017266、wall latency合計1.365s。false-pass（独立risk true／Jev<.5）は0件。入力／出力usageとresolved modelは[集計](QA/JEV_SUMMARY.json)／各raw JSONLに記録、欠損はnull。Codex token／creditや節約率は取得不能でnull。これは品質や人間の面白さを保証する費用ではない。
