# MINI CURLING — ART DIRECTION

落ち着いたスポーツゲーム。白青の氷、細い擦過傷と淡い照明反射、赤/青の取っ手、控えめな灰色の石を使う。視点は真上から固定。正確なハウス/ガイド/石の当たり判定はCanvasで描く。

Art DirectorがOpenAI ImageGenで制作した`public/assets/game035/reorganization/ice-arena.webp`を実際に読込む。統合前に画像をviewで確認：淡い氷面、外周の濃青、ターゲット/石を含まない正投影。prompt/原本/hash/adoptionの正本は`assets/reorganization-2026-10-15/asset-index.json`。素材制作と実画面Visualレビューを分ける。

石の陰影、影、速度方向の氷上の薄い跡、ターゲット色帯と予測線は動的Canvas。石の円形見た目は物理radius18に対応。石は`stone-red.webp`/`stone-blue.webp`を実view確認後に直径2rで読込む。透過余白が小さい円形の花崗岩、赤/青の取っ手、白反射を持つ。読込失敗時だけCanvas陰影へ退避する。

4viewport固定buildの実画面をQAへ保存。独立Visual点数/本人の見た目の好み/物理端末と音は別途評価する。
