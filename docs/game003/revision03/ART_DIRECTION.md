# 建築工事の手描き設計帳

配信パス:
- `public/assets/game003/buildings-atlas.webp`：5列×2行。各cell256px以上の正面ファサード。順序は long, slender, crown, cantilever, ell / step, rooftop, factory, asymmetric, mushroom。個別形状の上端・下端へ描画するが、物理shapeの和集合でclip。セルの物体周辺余白は避け、窓・壁・屋上設備を中央へ。独自の別ファサードで、それぞれの形状を読める。
- `public/assets/game003/physics-city.webp`：1600×1000推奨。紙の質感、青緑の空、低い都市、遠景のクレーン、地面の工事。プレイ中の重要形状/接触より弱いcontrast。

形状/重心・密度定義は `src/games/game003/buildings.ts`。rendererも同じ矩形和でclipし、図柄の透明輪郭を物理輪郭として扱わない。輪郭を矩形より張り出させない。全ビルの●が実mass center。

ImageGen制作と原本/採用hash記録はroot Art担当。現時点で新画像は未受領であり、生成済とは報告しない。fallbackの手描き窓パターンは検証用。最終Visual/実画像統合確認/実画面thumbnailはまだ未実施。
