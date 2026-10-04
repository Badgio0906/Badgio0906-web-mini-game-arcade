# Game010 Foreground Brief — LISTEN / SIDE WORK

2026-10-04 / [IMPLEMENTATION_SPEC](../IMPLEMENTATION_SPEC.md)66〜74・104〜110。既存の会議室/上司/同僚と新前景を一つの視点へ揃える。Art Directorはruntimeを編集しない。

## 実際に見た基準

保存済み[desktop gameplay](../../ten-game/screenshots/game010/desktop-gameplay.png)と[mobile question](../../ten-game/screenshots/game010/mobile-cue-question.png)、`public/assets/game010/boss-question.webp`・`colleague-one.webp`を実viewした。人物は自然な成人比率、細い深灰ink、髪/服/手の多段の柔らかい影、mutedgray/teal/mauve、warmbeigeの肌。旧前景はほぼ単色の台形卓・矩形PC・棒状の手で、そのcraft差が目立つ。新しい別画風を導入しない。

## Design Goal / Art Mode / Composition

**HYBRID**。生成の腕/手/袖/机/道具をコード会議室へ重ね、実LISTEN/WORK状態・小さいmotionと連動する。プレイヤーPOVの低い卓を下端に置き、中央上司の顔・本質問/feintの手姿勢・DOM cueを常に残す。前景が新しいfullscreen会議室を覆う構造ではない。

LISTEN：落ち着いた手、pen、開いたnotebook。WORK：同じ手/袖がkeyboardへ、低いlaptopにtyping。状態の差をcolorだけでなく道具・手の位置で一瞬で見せる。両状態で卓の木目・sleeve/skin/light/perspective/anchorを同じにする。指は自然な5本で、袖と手首が途切れない。Laptop screenは浅い角度/低い高さで、上司を遮る縦長screenを作らない。

## 生成素材の確定契約

| 項目 | 契約 |
| --- | --- |
| Production | `public/assets/game010/foreground-listen.webp` / `foreground-work.webp` |
| canvas | 各1200×300 RGBA、共通anchor center600/bottom300、上30px透明安全域 |
| 初期renderer想定 | existing virtual600×400にx0/y250/w600/h150、下端を揃える。実合成で顔/cueを覆う場合はscale/透明域を検証して調整 |
| Sources | `assets/game010/foreground/` にPOV concept/sheet、原本、2状態bbox/crop/scale/共通anchor/bytes/provenance |
| Budget | 2枚合計≤120KB目標、最大180KBの必要理由は記録 |
| Generated | player arms/hands/tealgray sleeves、pen/notebookまたはtyping hands/keyboard/laptop、暖かい木卓`#8a6b59`付近のmaterial |
| Code | 実状態、typing/画面進捗、transition、cue/文字/score、会議室/同僚の配置。生成screenに重要textを焼かない |

実image_genへ見た旧人物/画面をreferenceとして渡す。先に同一POV2状態concept/sheetを出し、実viewして共通framing/全finger/透過/余白を確認し、採用2spriteへcropする。汎用名『Image Generation Skill』を、存在しないinstalled skillを読んだという記録にしない。使用した実ツール/prompt/outputと採否だけログに残す。

## Animation / UI / Avoid

切替は短いcrossfade/2px程度のtyping差など、実model stateが主。遷移中もLISTENかWORKを同じDOM labelで示す。静的2素材を豊富な手animationとして宣伝しない。reduced-motionはstate swapだけで成立させる。前景内へ字幕/choice/buttonを生成せず、existing code cueが紙/PCに紛れない背景を保つ。

photoreal/3D hands、flat primitiveの仮素材、左右で違う肌/袖、6本指、切れたpen、keyboardへ不自然にめり込む指、新room・別人物・大きなscreen、important baked textを避ける。

## 実画面Gate

Rootのexclusive browser release後に旧保存画像と新1440×900/390×844のLISTEN/WORK/cueを比較する。手の質、指の形、人物とのline/shading/視点、状態の即読取、顔/cueを覆わないことを独立確認。80/F12/H12以上を目安に、他人物と同等のcraftを必須とする。素材の採用は完成画面PASSではない。
