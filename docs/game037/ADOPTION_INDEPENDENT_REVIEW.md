# Game037採用・Game003完成指定の独立ソースレビュー

2026-10-18 UTC。担当はCodex独立reviewer subagent（`agent_tool: codex-subagent`）。製品実装には参加せず、読取監査と本レビュー2ファイルのみを担当。固定候補は`cab8bef0e6d72146079dd597a6d1eeb4329005e6`、採用元はPR #9先端`6123b39ba724e0603c91429a29e1569e8961c4a1`、基準mainは`9e96d557779c5de099fe54c51731ceb131e591a1`。詳細hashと限界は[JSON](ADOPTION_INDEPENDENT_REVIEW.json)。

**ソース範囲・登録・ローカルBEST・サムネイルの技術判定はPASS。** ブラウザ操作と公開は本担当の判定対象外。既存レビューのVisual81/F12/H13や575ブラウザchecksは過去の別実行証拠であり、本担当の再実行数には数えない。

- PR元差分は92ファイルで、037専用allowed pathsとCodex作成ASSIGNMENT内。既存独立検証ソース4057766からPR先端まではレビュー/HANDOFF追加と一時unit削除のみ。`tests/unit/game037-codex-verify.test.ts`は不存在。恒久unitから重いbrowser subprocessを起動せず、workflow/package/Vitest設定は基準mainと同一。
- 採用候補で037のHTML・モデル・入力・描画・保存・素材はPR先端と同一。003のHTML・製品source・素材も基準mainと同一。003完成指定は今回の作者指示を根拠にしたcatalog overrideと[完成指定記録](../game003/COMPLETION_ADOPTION.md)だけで、過去QAからの推定認定ではない。
- 037はactive/trial、表示028、内部037、releaseOrder37、standard。036を取り込まずNEXT_GAME_NUMBER38。active28/complete10/hidden4/retired4/historical36。Viteは037のみ追加し、003だけを新たにcompleteへ変更。既存retired/hidden/完成作品とrouteの期待値を保ち、ID穴を認めるテスト変更も確認した。
- 037のportal BESTは既存`best:rules1` JSONの読取のみ。`publicEnabled:false`によりpublic `recordBoards`へ入らず、TOP10やオンライン共有を有効化しない。既存Worker/remote registration/Analytics実装・広告/CREDIT設定・Secret・CI設定は変更しない。portalの037 click/impressionだけを除外して未登録作品の計測を追加しない。
- 読取上限に1件指摘あり：初期adapterはゲーム本体の32文字上限に揃っておらず、ゲームが破損扱いする長いJSONをportalが受理し得た。候補cab8befでは037専用32文字上限と回帰条件を追加し解消。0〜6000の整数、異常JSON・配列・null・範囲外・小数・文字列を確認するテストがある。RED/GREEN原本は[QA](QA/local-adoption/)に保持。Jev API/有料APIは今回呼んでいない。
- 新thumbnailを実際にviewした。既存desktop第6面完成PNGから1280×720全体を640×360へ縮小した実画面で、食材と盤面を識別可能。source/output SHAを再計算して台帳と一致。既存35件のthumbnail entryは変更なし。
- Portal font index/OFLと実WOFF2 cmapを確認。新タイトル/紹介/記録labelで未収録はU+8A70「詰」だけ。CSSにHiragino/Yu Gothic/sans-serif fallbackがある。統合browserの実画面でfallback判読を確認する対象としてcoordinatorへ通知。字体追加や既存字削除は行っていない。

coordinatorが保存した全1110単体PASS、32文字制限追加後の対象7件PASS、check/build成功ログを閲覧した。これらは本担当の実行とは記載しない。本担当はbrowser枠を使用せず、coordinatorの037通常575checksとportal4幅統合検証を別証拠として接続する。人間のFeel、物理スマホ、Safari、聴感、実FPS、main反映、公開は未実施。push/PR/Actions/API/課金設定操作は行っていない。
