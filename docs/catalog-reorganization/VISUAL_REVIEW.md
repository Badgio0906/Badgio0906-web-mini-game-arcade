# 今回対象12作品 — Visualレビュー入口

Art Director workerによる実統合画面・通常入力QA証拠のレビュー。各ゲームのコード実装には不参加。003/017/033/034/035の静的素材制作者でもあるため、素材の自己採用と統合画面の判定を各報告で分離した。本人の面白さ・実機・聴感・連続FPSは未実施、human judgmentはnull。完成版認定はユーザー本人の明示指定を維持する。

| 対象 | 合計 /100 | F /15 | H /15 | 技術Visual |
|---|---:|---:|---:|---|
| game002 | 85 | 13 | 12 | 合格 |
| game003 | 86 | 13 | 12 | 合格 |
| game005 | 85 | 13 | 12 | 合格 |
| game006 | 82 | 13 | 12 | 合格 |
| game009 | 83 | 13 | 12 | 合格 |
| game015 | 89 | 14 | 13 | 合格 |
| game017 | 83 | 13 | 12 | 合格 |
| game024 | 80 | 13 | 12 | 合格 |
| game027 | 80 | 13 | 12 | 合格 |
| game033 | 86 | 13 | 12 | 合格 |
| game034 | 83 | 12 | 12 | 合格 |
| game035 | 87 | 13 | 13 | 合格 |

技術VisualはA〜Hの実確認項目に基づき合計80/F12/H12以上。Gは実連番・readonly前後から確認した動きと状態伝達の技術点で、連続動画による滑らかさや人間の快感の評価を含めない。元の未評価、初期失敗、限定修正、修正後再確認は各報告へ残した。Viewportの高さは各collectorの記録どおりで、320系を全て同一実機として扱わない。

- [第2工程5作品・015最終追補](STAGE2_VISUAL_TECHNICAL_REVIEW.md)
- [第3工程005／006・006最終prefix追補](STAGE3_005_006_VISUAL_REVIEW.md)
- [第3工程009／017](STAGE3_009_017_VISUAL_REVIEW.md)
- [第4工程033〜035](STAGE4_VISUAL_TECHNICAL_REVIEW.md)

003の背景境界／重心ヒント重複／横canvas縮小、027の横盤面消失／HUD重複、005の横score重複／共有footer狭幅、006の旧V2疑似ラベルは、実画像で発見し、限定修正後の実画像で解消を確認した。034の初回consent付きcaptureは採取準備の問題として不採用原本を保持し、通常拒否操作後のclean captureへ置換した。独立judgmentとJev routingの原本は各ゲームQAに保持する。

12作品のサムネイルは実プレイ画像のcrop/contain640×360WebP。実原本・crop・hash・旧履歴を保存し、最適化後も実viewした。[12対象／対象外23作品の保護監査](../../assets/portal/thumbnails/reorganization-2026-10-15/VALIDATION.json)はPASS。[生成8回の静的素材台帳](../../assets/reorganization-2026-10-15/asset-index.json)は素材制作の証拠として分離する。

本書はVisualと技術動作の実確認範囲を整理する。本人試遊はHUMAN_PLAYTEST、正式公開結果は各工程の公開報告を参照する。
