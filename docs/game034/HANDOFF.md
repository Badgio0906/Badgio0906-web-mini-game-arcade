# 再開手順

2026-10-16 JST最終追補：本作は第4工程release `9f655a98df410a7dcc3660321afa6ea195e10115`／Pages38767797394で公式公開済み。最終check・1090tests/102files・公開設定build、公開12作品×4幅48組、一覧4幅122項目、配信177file SHA一致を確認。固有通常RUNのsourceと差分、公開URL、未実施の本人/物理端末/実機聴感は [一括最終報告](../catalog-reorganization/FINAL_REPORT.md)／[公開記録](../catalog-reorganization/PUBLICATION.md)／[引継ぎ正本](../catalog-reorganization/HANDOFF.md)を優先する。以前の公開準備記述は各時点の履歴。

1. 共通catalog/新比較記録定義とVite033–035をrootが統合。Game034 namespace `web-mini-arcade:v1:game034:`、key `best-rules-v1`、score全8面累積/上限20000、rule1。
2. Art担当の3材atlasと背景を実viewし固定build。fallback配色は生成物の代わりとして完成扱いにしない。
3. 通常入力でtitle/説明/練習/選択/3制限/解体/slow/pause/結果/8面完了/RETRY/BEST reload/ミュート/帰還をPC1440・390・320・844横で確認。canvas候補だけでなく44px DOM候補buttonも入力経路。
4. 独立Gameplay/Visual、実画面thumbnail、必要修正→対象unit+root check/test/build。
5. Pages公式workflowと公開物SHA確認。外部Analytics/新board準備中は共通担当が登録確認するまで維持。

世界途中resumeは初版に含めずBEST/muteのみ保存。実行中serverへ依存せず、このコードとunitで再開可能。DEV hookはreadonlyで製品結果強制用APIなし。

2026-10-15追補: 43deb固定で通常4幅全32現場/BEST/mute reload/帰還は完了。証拠`QA/stage4-43deb-four-widths-clean/report.json`。Artへclean実canvasを引渡し済み。次はrootの最終共通統合差分smoke・Visual判定/thumbnail台帳・公式公開/配信照合。
