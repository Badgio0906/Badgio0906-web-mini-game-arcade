> **2026-10-19 訂正：新作038という扱いは撤回済み。** 対象は一覧表示014／内部game017の改良。[現行の改良候補](../game017/revision03/HANDOFF.md)を参照。以下は移設前の履歴で、旧pathや未push状態を現状と混同しない。

# アセット設計と生成前一覧

## Image A（最優先reference）

`assets/game017/reorganization/originals/rain-city.png`、1774×887、SHA256 `197b12031b005c40caacc23197285d95b98904a613e155894f10305afcbbc14d`。配信版`public/assets/game017/reorganization/rain-city.webp`、1536×768、SHA256 `4bf5d59ea095fd2c20f936cd4012dbe5d7b70a31224b1b282e2f260c0aedd089`。初期背景の元ImageGen provenanceは同017のrain-city-provenance.json。今回は新背景を生成/修正しない。新作から既存配信版を参照し限定buildではbytesそのままcopy。

実view：群青・濡れた青灰路面、琥珀の窓/低いbounce light、柔らかな雨霞、描き込まれた街並み。正面寄りの建物、路面の浅い奥行き。新キャラは浅い3/4歩行姿勢と整理された筆触、弱い暖反射を揃える。頭身を潰すchibiや白いsticker輪郭は避ける。上/中/下に足元anchorを置き、人物の大きさを奥ほど少し小さくする。

| 素材 | 優先 | 状態/方針 |
|---|---|---|
| 主役 | 最優先 | 黄土の普段着、閉じた傘を片手、手ぶらでなくても保護なしと分かる |
| おねぇさん | 最優先 | 上品、明るい傘、+150、過剰なglamourなし |
| こわもて | 最優先 | 太い輪郭、暗赤の傘、−120、誇張しすぎない |
| 会社員男/女 | 優先 | 異なる服/傘、+20/+30 |
| 学生/老人 | 優先 | +50/+10、輪郭と姿勢で区別 |
| 親子/レア | 次 | +90/+250、親子は一組として判定 |
| 家 | 次 | 暖かい玄関、最終ゴール、透過object |
| 傘小物/雨icon | 次 | 開閉/属性のcompact asset、必要ならUIにも利用 |

最初は静止spriteを歩行の上下揺れ/足元影と併用。9人組の固定3×3atlasと、家/小物の2×2atlasをImageGenで別生成。原本PNGと実prompt/参照/採否/各SHAをassets/game038へ。透過spriteの技術的切出し/縮小/最適化だけをローカルpipelineで行い、背景や人物を手描きで捏造しない。生成未実施時に使用済みと書かない。モデル版非公開ならUNKNOWN。
