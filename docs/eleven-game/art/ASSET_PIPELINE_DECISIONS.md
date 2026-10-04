# Eleven-game Art / Asset Pipeline Decisions

2026-10-04 / 基準commit `ffa433c3bd3e475235f3cc235bf9bf29292e7aaf`。今回[spec](../IMPLEMENTATION_SPEC.md)全文0〜119を読了。旧評価は旧候補の証拠で、新11-game候補の品質点として流用しない。

## 所有と順序

Art Director：このart directoryのbrief/採否/視覚方針。Asset Producer：実image_gen、原本/個別crop/optimized image/ログ。UI：portal/007/008、Gameplay：011、Root：共通練習/CREDIT flag/routing/GitHub Pagesと統合。画像原本と保存beforeはread-onlyでinspect可。新browser/build/runtime/deployをArt Directorが起動/変更しない。

011と010の契約を先にproducerへ渡して生成開始可能にした。011は新規なので旧画面なし、010/007/008は旧saved desktop/mobileと010人物素材を実viewした。[011](GAME011_VISUAL_BRIEF.md)、[010foreground](GAME010_FOREGROUND_BRIEF.md)、[Portal](PORTAL_VISUAL_BRIEF.md)、[007/008readability](READABILITY_GAME007_008.md)が具体契約。

『Image Generation Skill』は仕様の汎用呼称。該当installed skillがないことを理由に作業を止めず、使用可能な第一者image_genツールを使う。存在しないskillを読んだ/実行したとは言わず、実tool・prompt・output・source参考・採用結果をProducerが記録する。この文書の生成計画を完了したimagegen callに数えない。

## Bounded Production

| Set | 予定採用 | 公開path | optimized目標 | 確認条件 |
| --- | --- | --- | --- | --- |
| 011icons | 20×256square RGBA | `public/assets/game011/icons/{unko,ukon}-01..10.webp` | ≤240KB、最大320KB根拠記録 | cleanpop、20distinct、同サイズ/鮮明度、全body/alpha、カテゴリ曖昧さなし |
| 010foreground | 2×1200×300 RGBA | `public/assets/game010/foreground-{listen,work}.webp` | ≤120KB、最大180KB根拠記録 | 共通desk/POV/anchor、自然5指、既存人物とink/shading同等、face/cue領域を残す |
| Portal thumbs | 11×640×360 WebP | `public/assets/portal/game001.webp`〜`game011.webp` | each≤45KB、total≤495KB | 最終actual screenshot crop/padding、sourcehash/候補ID、架空宣伝画なし |

最適化の値は目標で、実bytesを計測して採用ログへ追記する。atlas/gridのnominalセルで自動cropせず、actual bbox/全指/全rootをviewして明示crop。個別fileのalphaを確認する。採用原本は`assets/game011/icons/`・`assets/game010/foreground/`へ、未採用原本をpublicへ置かない。Rootのpublic書込みfreezeがある場合はsource/stagingで待機し、許可window後に採用fileだけ反映する。

## Review / Evidence

Concept/Brief→実imagegen→原本とoptimized素材のactualview→採否→実装→Rootexclusive actual Desktop/phone→独立Feel/Visual→QA。最低1440×900/390×844、必要な8viewportを別QAで確認。独立Visualは80以上、F/H各12以上、最大3art iteration。技術CSS/hit/文字の修正checkpointは別に記録し、art点をinflateしない。

Portal thumbはactual runtime完成後の証拠。先に生成posterを作ってthumbがあると言わない。001〜010の既存saved画像は仮のsource候補で、007/008/010改修とprototype-credit/offを誤表示しない新candidateを最終captureへ使う。thumbnail11はgameを一覧へ揃えるだけの資産で、game11×VisualPASSの代用ではない。

Universal practiceは各worldの短い実操作。重要説明/操作は≥44px、本文を小さくしない、score/BEST/credit/run telemetryを本番と区別する。秘密の特殊展開は説明しない。今回HumanK〜Nはspec117の『説明理解/練習理解/長さ/本番でやること』であり、旧ten-gameのK〜N『先の興味/特殊選択/追加の面白さ/ネタ』と同じ項目名で結果を混同しない。双方未実施は未実施と記録する。

## 現状

仕様/briefとproducerへの確定契約を作成済み。010/007/008旧保存画面・010oldactorsを実view。011の実image_gen原本2枚もArt Directorがviewし、source artを承認した：`exec-b51efc32-cc8c-4ec2-a52c-b6d697f35f27.png`（10clean brown coils）と`exec-d3e9a2b0-d54d-4fc7-bf1a-f4b8e163f34d.png`（10golden segmented rhizomes）。coilは高さ/巻き/丸さ/scallop/表情、rootは枝/knob/断面/葉で変化する。rootの内側の描込みは多いが、太い暖ink輪郭とsoft shadingで同じgameへ合い、カテゴリは明瞭。実原本は2行×5列だが、最適化は明示bboxで全bodyを保つ。

010の実image_gen原本`exec-e7477b6f-5a7a-4621-802f-ee53cbd43860.png`もArt Directorがviewしsource artを承認。2wide stripsは同じ木卓・低いPC・notebook・tealgray袖のPOVで、LISTEN右手のpenとWORK両手のtypingが異なる。自然な成人指と細ink/多段soft shadingは旧人物に合い、fullroom/face/textの混入はない。2row専用bbox・共通scale/anchorで最適化する。

最適化後の素材採用も承認済み。011は20枚256×256 RGBA、10+10、content最大208px/中心128、総224,332B。原本全20体とoptimized `unko-01`/`unko-06`/`ukon-01`/`ukon-05`を実viewし、全body/透明余白/判別性を確認した。行ごとの透明gapに基づく明示cropを使い、等分セルで切れていない。Producerのmanifestは`assets/game011/icons/asset-index.json`。

010はoptimized LISTEN/WORKの両方を実viewし、各1200×300 RGBA、共通anchor(600,300)、上60px完全透明、合計68,680Bを確認した。atlas境界の独立した微小alpha specksだけをconnected-componentの技術抽出で除去し、全手/pen/PCを保持した。Producerのmanifestは`assets/game010/foreground/asset-index.json`。公開反映はRootの許可windowに従いProducerが行う。素材採用は実gameの独立VisualPASSを意味しない。

Portal runtime pathはRoot/UI確定の`public/assets/portal/game001.webp`〜`game011.webp`へ統一した。source保存folderは`assets/portal/thumbnails/`。001の旧実プレイ`artifacts/feel-safe-15sec.png`はsource候補であり、最終表示内容と候補の対応をProducerが記録する。portal実11thumb、新candidateの独立点、人間評価、deployはここでは未完了。今後の実証だけを追記する。
