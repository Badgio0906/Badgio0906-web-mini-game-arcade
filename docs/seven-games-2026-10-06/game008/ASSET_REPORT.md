# Game008 手元の素材

Image Generationは利用していない。オリジナルの意図的Canvasベクターを `src/games/game008/coffeeArt.ts` に制作した。元背景の生成PNG/WebPを削除・上書きせず、現配送は木トレーと整合したカフェ→オフィスの廊下を同じpaletteで描く。

PC/phone × neutral/left/right/spillの8画像は `QA/art-*`。最初の指が浮いていた内部草稿は不採用、掌が前縁へつながる版を撮影。rootがphone neutral/PC spillを実viewし、主要構図の方向は採用。これは最終Visual80点gateの独立合格ではない。

器は本体曲線と陰影、二重リム、内側、二点接続ループ取っ手。各手は袖→生成りカフ→手首→掌→3指と親指の一続き。厚みのある木のトレーを握る。液面は内側clipでcoffeeとgravity/inertiaを器から分離し、縁から高い液体側へspill流を描く。cup2でも同じsupport transform。

runtime素材はCanvasなので配信PNGを新設せず、描画原本がソース。thumbnailはrootが実プレイ採用画面から作成する。旧game008/morning-walk.webpと過去素材は履歴用として保持。
