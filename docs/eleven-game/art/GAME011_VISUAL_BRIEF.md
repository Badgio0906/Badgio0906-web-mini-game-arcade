# Game011 Visual Brief — UNKO or UKON

2026-10-04 / 実装前の確定方向。根拠：[IMPLEMENTATION_SPEC](../IMPLEMENTATION_SPEC.md)75〜100・104〜112。基準commit `ffa433c3bd3e475235f3cc235bf9bf29292e7aaf`。新規ゲームなので以前のゲーム画面はない。素材生成・採用・実画面PASSは別の記録にする。

## Design Goal / Mood

POP / CLEAN / ABSURD。題材はくだらなくても、輪郭・整列・反応は丁寧。明るいクリーム紙、深い青茶のink、控えめなcoralと黄色。便器や臭いの演出を加えず、きれいな二択舞台として作る。既存暗い軌道、漫画街路、建築、記憶機械、仕分け工場、駐車地図、かご、coffee前景、机、会議室とは異なる、中央アイコンと大きい言葉のクイズ台。

## Art Mode / Composition

**HYBRID**。20個の独立生成アイコン＋コードの問題、同じ見た目の回答、時間/段階/feedback。画像を貼った一枚画面にはしない。PCは中央の大きい対象と下の左右回答を主役にし、装飾側欄で縮めない。mobileは上から現在段階/進行、対象または文章、読む/回答状態、2回答。390pxでは対象160〜220CSSpxを目安、左右回答は各十分な幅・最低44px高。短横画面は対象左/回答右など、対象と両ラベルを同時に残す。

画像Phaseの1問目5秒、2〜10は1秒。TEXTは読む状態の文章が主役で、時間制限なしを明示。回答表示後だけ0.8秒。FINALは選んだ言葉と0.5秒の連続判断を大きく示す。全段階で左右ラベルは毎問独立randomであり、左が特定カテゴリという印象を作らない。Tutorialは対象と回答だけを体験させ、FINALの秘密を先に説明しない。

## Character / Object / Background

UNKO10個：リアルさのない丸いcoil/pile/softblob。大きい輪郭や巻きの数、広がり、丸さ、控えめな表情で区別する。汚れ、濡れ、蠅、臭線、排泄中の身体は描かない。

UKON10個：黄色〜orangeの節付き根茎。枝数、曲がり、knob、見える断面、小さな葉の有無で変化。植物の根として明白。poopに見える単純coiled yellow blobを避ける。同じink/soft shadingで、両カテゴリのサイズ・鮮明さ・余白を同等にする。背景はコードの静かな紙/spotlight、アイコンの認識を邪魔するconfettiを常時出さない。

## UI / Animation / Failure

『ウンコ』『ウコン』は**同じcolor/shape/size/font**。hover/focus/pressも同じ仕様。カテゴリの黄色/茶を回答ボタンに対応させない。PCの左右/Space等の操作説明と押せる状態はコード。準備完了の押下を回答へ流用しないguardはGameplayが実装する。Artは準備ボタンと回答の出現を見分けられる構成にする。

正解は短い押込み/チェック/score増加。誤答は選んだ側、正しい言葉、段階を表示して理由を伝える。派手な揺れで次の0.5秒問題を読めなくしない。reduced-motionでも意味が残る。結果はSCORE、画像x/10、テキストx/10、FINAL MODE/STREAK、BEST、retry/portalを読める順に。笑いはResultの短い一文に置き、失敗を不明瞭にしない。

## Image Generation Contract

| 項目 | 確定契約 |
| --- | --- |
| Production | `public/assets/game011/icons/unko-01.webp`〜`unko-10.webp` / `ukon-01.webp`〜`ukon-10.webp`、20枚 |
| 各canvas | 256×256 RGBA WebP、中央anchor(128,128)、全bodyを含み各約190〜215px content、10%程度安全余白 |
| Sources | `assets/game011/icons/` に生成原本、prompt、sourcebbox/scale/anchor/category/index/bytes/採否manifest |
| Budget | optimized合計≤240KB目標。最大320KBを使う場合は実bytesと必要理由を記録 |
| Generated | アイコン本体のみ。2カテゴリのcoherent atlas等を実image_genで生成し、実原本をviewして明示bboxで個別crop |
| Code | 文字、問題pool、タイマー、ボタン、random、score、正解、重要な形/入力境界 |
| Reject | セル混在、欠け、halo、低解像、同一にしか見えない10個、黄poop/茶rootの曖昧さ、不要なtext、リアル汚物 |

生成指示の要点：same pop clean editorial game-icon style; dark warm-ink contours, restrained two-level soft shading; isolated complete silhouettes; no UI/text; non-real nongraphic poop versus unmistakable segmented turmeric rhizomes. Prompt実行と出力IDはAsset Producerのログに実行後だけ記載する。

## Avoid List / Gate

emoji代用品、colored primitivesだけ、photorealism、3D、臭い/汚物texture、回答ボタンの色手掛かり、画像の曖昧さを難度にすること、fake rankingを避ける。実1440×900以上/390×844で20アイコン、2answer/文章/FINAL、feedback/結果、通常animationを独立確認。80以上、F/H各12/15以上を基準にし、同等のアイコン判読が必須。素材承認は独立Visual点ではない。人間の0.5秒反応・笑い・再挑戦は未評価。
