# Game031 A案テクスチャ導入：素材受領と事前調査

**追補 2026-10-08T12:58:57.253325+09:00: ZIPの8画像を受領。** 原寸1254×1254 RGB、内容によるID1〜8対応と高品質512／256 WebP化を確認。以下の「素材受領待ち」は前ターン時点の観測履歴であり、現在の未受領を意味しない。採用素材と工程は [SOURCE_ASSETS.md](SOURCE_ASSETS.md)／[IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md)へ記録する。

確認記録: 2026-10-08T11:27:04.271921+09:00。基準remote main／HEAD: `2d745110e1a7a24660da16dd6529d8ca2d08a2bf`。
専用ブランチ `codex/game031-textures-a`、作業領域 `/workspace/arcade-game031-textures-a`。
ユーザー依頼全文は [REQUEST.md](REQUEST.md)。この文書は導入計画と確認済みの制約であり、実装・素材採用・QA・公開完了の記録ではない。

## 素材受領状況

指定されたWindowsフォルダを現在のLinuxクラウドから読めない。指定Windows形式パスおよび対応候補 `/mnt/c/Users/romcr/Downloads/掘って、埋める用テクスチャ` は存在せず、`/proc/mounts` にWindows／`/mnt`ドライブもない。タスクの添付領域 `/workspace/attachments` に画像・ZIP等は存在せず、受領したのは指示書テキストだけ。
必要な入力は指定フォルダ内の8画像、または8画像をまとめたZIP。原画像がないため寸法・SHA・タイルの継ぎ目・素材内容の確認は未実施。既存配信素材や前回の概念画像を提供素材として代用しない。Windowsの個人Downloads全体は探索していない。

| BlockID | 日本語名 | 素材キー | 想定ファイル名（実内容で確認する） | 状態 |
|---|---|---|---|---|
| 1 | 苔土 | moss_soil | `seamless_teal_mossy_soil_texture.png` | 未受領 |
| 2 | 土 | earth | `hand_painted_seamless_dirt_texture.png` | 未受領 |
| 3 | 石 | stone | `seamless_slate_stone_texture.png` | 未受領 |
| 4 | 白石 | chalk | `pale_mottled_chalkstone_texture.png` | 未受領 |
| 5 | 深部岩 | deep_stone | `seamless_deep_slate_pixel_texture.png` | 未受領 |
| 6 | 青結晶 | blue_crystal | `seamless_aquamarine_crystal_texture.png` | 未受領 |
| 7 | 琥珀鉱 | amber_ore | `teal_stone_with_amber_crystal_veins.png` | 未受領 |
| 8 | 暗色結晶 | dark_crystal | `dark_amethyst_crystal_rock_texture.png` | 未受領 |

AIR0には割り当てず、BOUNDARY9は識別可能な独自表面を維持する。連番・一覧順だけで画像を割り当てない。

## 現行コードで確認した変更箇所

- `src/games/game031/Render.ts`: Canvas320×32、IDごと32px、UV固定値32/320、NearestFilter拡大縮小、sRGB、共有MeshBasicMaterial。vertex colorは素材色ではなく面ごとの灰色陰影。平面normal属性は現在なし。地上／地下Fogは20m/12m付近から。Chunk露出面方式と編集時リソース破棄を維持する。
- `src/games/game031/main.ts` / `style.css`: palette見本はBLOCKS由来の単色span、画質切替はRender.setQuality。新素材導入後は共有配信用素材による見本と、素材ロード状態の確認手段が必要。
- `src/games/game031/Blocks.ts`: ID0〜9、素材ごとの硬さ・取得／配置可否は固定。保存／生成版1、X128/Y64/Z128を維持する。
- `src/data/gameVersions.ts`: game031のrules_version1、presentation_version prototype-1。見た目更新時だけpresentation版の変更を検討し、ルール版・保存版・生成版は上げない。

## 素材受領後の実装・検証計画（未実施）

1. コピー原本の寸法／形式／色／透過／bytes／SHAを計測、8画像実viewとID対応一覧、各3×3繰り返しを確認。実ファイル名が異なっても内容を優先する。
2. 標準512px／軽量256pxを出発点に高品質縮小・配信WebP化。不要な拡大なし。公開用には採用済み配信用素材とmanifestだけ、原本・QA画像はpublicへ入れない。
3. 共有テクスチャ方式の選定、metadata基準UV、6面方向、paddingとタイル単位mip／LODで素材間色混入を防ぐ。全体RepeatWrappingをタイル繰返しと混同しない。粗いnearestのまま縮小して完了しない。
4. Base Color sRGB／出力sRGB、基本色白。標準のlight反応材質を必要な範囲で比較し、flat法線と控えめな光、地下最低明度を確保。軽量でも提供画像を使用。推定Normal／発光は必要性が確認できた場合だけ。
5. 最新quality／renderer世代を確認して非同期読込を採用、decode／404fallbackを可視化し、古い完了による上書き・Texture蓄積を防ぐ。共有画像のpalette見本、輪郭・ヒビ・previewの視認性を確認。
6. 固定した同一世界・位置・向き・viewport・qualityのbefore/afterを別出力に保存。8素材／6面／同素材壁／異素材隣接／Chunk境界／地上地下／採掘preview／PC390/320/横を確認。通常100採掘50配置と旧保存コピーの継続を検証。
7. 転送量、解像度、mip込みGPU概算、textures/geometries/calls/frame/chunk/edit遅延を条件付き比較。型検査・対象／全体テスト・build、独立Visual／操作QA後、対象差分だけ公開・CI・実素材ロード・旧保存継続を確認。

## 保護範囲と未実施

今回の準備は文書だけ。ゲームコード・public素材・保存schema／生成／world seed／寸法／BlockID／採掘・配置／移動・衝突／所持・統計／広告／CREDIT／同意／Analytics本番設定は変更していない。mainへのcommit/push/deployなし。新GameID・候補表編集なし。
前タスクの15旧worktreeは保全チェックPASS、`arcade-game031`もHEAD2d74511／cleanを確認。素材未受領のまま代替生成／差替え／公開へ進めない。

## Jev・レビュー

本工程はファイル存在の確認とコード事前調査。現行JEV_REVIEW_RULESの「ファイル存在…はスクリプトで処理する」に沿い、Jev API呼出し0。実装・実画面の新しい不具合findingを得た段階でschema v2のShadowを適用する。実画像Visual、独立レビュー、性能／操作／保存テスト、本人／物理端末試遊は今回未実施。
