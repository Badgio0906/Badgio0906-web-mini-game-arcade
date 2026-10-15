# Game003 実形状物理 v3

2026-10-15 JST。今回指示書13–18章を適用し、旧横長ブロックのタイミングゲームを置換。

- Core loop: 形と重心を見て位置・向きを決定→落下→動的接触が落ち着く→次の建物。設計想定1–3分、未実測。
- 10種類: 横長商店、細身時計ビル、王冠、片側張出し、L字、階段、給水塔、偏重工場、非対称研究所、頭でっかち本社。非重複矩形の和集合を描画maskとMatter compoundへ同じ定義から渡す。
- 異なる面積・密度が質量/重心/inertiaへ反映。重工場のボイラーだけ密度2倍、色と実形状で区別。飾りを当たり判定と誤認させない。
- 左右キー/左右44pxボタン/drag/タップ位置で移動、R/↑/↻で90度回転、Space/Enter/DROPで放す。着地待ちの追加入力を次の建物へ予約しない。
- Matter.js 0.20.0。Phaser専用runtimeをCanvasへ置換し二重物理engineを避ける。1/120秒固定step、最大frame50ms、摩擦・低反発・sleep。着地後もdynamic、同じworldで継続し固定化しない。SATの実形状contactが判定を所有し、重心表示の包絡は衝突に使わない。
- 実接触・全体低速を0.55秒保持してaccepted棟数を加算。積んだ建物が足場以下へ落ちると崩壊、今回の建物が外れる/9秒安定しないと落下失敗。最大実高さを保持。
- 主記録はaccepted棟数。別表示のPERFECTは中央/ほぼ水平で連続、芸術点は前棟との実接触、8px以上のaggregate COM回復、前棟が傾き回復または22px超偏った非矩形、静止着地が必要。同じ2棟の重複加点なし。単純交互だけでは加点なし。
- 新キーrules3:best、rules3:bestBonus。旧best/bestBonus/rules2:best/rules2:bestBonusを削除/上書きせず旧記録として表示。共有board/version定義はroot統合担当。
- 練習は独立worldで、移動と回転を使い2棟を実着地。BEST/credit/runイベントと独立。

旧C国自動振れ倍率は手動空間構築へ全面改修するため廃止。旧保存は保持し、その旧比較ルールのrecordを新得点へ混入しない。

依存採用比較（インストール済みminified配布物、最終Vite chunkではない）: Matter.js 83,476 bytes/gzip25,860、旧Game003のPhaser1196122/gzip314910。Canvas＋Matterは専用SAT/接触/摩擦/sleepを備え、自前でcompound solverを組むより既知の安定性を利用できる。Phaser表示依存をこのゲームから外し、MatterをGame034とも共有する。実測根拠 `QA/ENGINE_SIZE.json`。
