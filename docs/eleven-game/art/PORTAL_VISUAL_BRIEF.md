# Portal Visual Brief — WEBミニゲーセン

2026-10-04 / [IMPLEMENTATION_SPEC](../IMPLEMENTATION_SPEC.md)23〜43・101〜107。11本を次々試したくなる試作版。ランキングや広告のfake表示は作らない。

## Design Goal / Mood / Art Mode

**CODE＋実プレイ画像のHYBRID**。明るいcream、深navy/暖かいink、coralの遊び心、丸い日本語font。ゲームセンターの看板と紙のゲーム紹介票が合わさる軽さ。SaaS dashboard、全体neon、templateカードの色替えだけ、emojiを主要artにすることを避ける。各ゲームの異なる絵が一覧の主役で、portal decorationは小さくする。

大見出し『WEBミニゲーセン』、副題『WEB MINI GAME ARCADE』。短いcopyは『すぐ遊べて、なぜかもう一回。ちょっと変なミニゲーム置き場。』。試作版で好きなだけ遊べることと、基本操作の短い練習があることは簡潔に伝える。技術用語/広告stub/creditsEnabledをportal来訪者の説明へ出さない。

## Composition / Typography / Card

PCは有効幅で3〜4列、1440幅なら実thumb約280〜330px程度を保つ。画面の大半を大きなhero空白で使わない。mobileは題名が潰れない1列を390で基本、十分な幅がある場合だけ2列。各cardは16:9実thumb、邦題、英題、短いtagline、明確なPLAY。日本語titleは省略せず2〜3行許容、英題は主題より小さいが読める。card全体をlinkにする場合、重複click targetや過剰Tab stopを作らない。主要tap/focus≥44px、focus outlineを残す。

共通fontは既存rounded JPに合わせてよい。邦題17〜21CSSpx程度、tagline14〜16、UI16程度を出発点に実screenで調整。ink/creamのcontrastを保つ。catalogはUI Agent/Rootの一箇所のdataを使用し、将来gameを追加して同じ構造のcardが増える。Art側で人気順、評価点、fake playCountを埋めない。

## Thumbnail Contract

11枚すべて実game visual由来。最終候補の保存actual gameplay screenshotをsourceに、比率を保つcrop/paddingで640×360 optimized WebPにする。目標各≤45KB、合計≤495KB、足りるqualityを実確認。Root/UI確定runtime pathは`public/assets/portal/game001.webp`〜`game011.webp`。source/crop/dimensions/hash/bytes/対象game候補を`assets/portal/thumbnails/`とArt logに記録する。

旧thumbは手掛かりだが、改修007/008/010は新HUD/前景、011は実二択画面が反映された新actualを優先。未取得画面を生成で代替しない。011は実プレイのpoop/rootと二択UIが伝わるcropが望ましいが、1問中に両対象が出ない実装なら実タイトル/練習等の正直な状態を採用し、2種同時の架空gameplay合成をしない。文字が小さいHUDを拡大して読みやすく描き直すこともしない。catalogの文字で邦題を伝える。

## Animation / Navigation

hoverでわずかに持ち上がる/枠が強まる程度、常時揺れ/点滅なし。reduced-motion対応。headerやsafe pause/resultで『← ゲームセンターへ』へ戻れる。現在の実力やrankingがあるような誤解を作らない。no-credit試作版は単に何度でも遊べる体験にする。

## Actual Review Gate

新portalに旧beforeはない。11cards/11actualthumbを1440×900と390×844でviewし、邦題/英題/tagline、thumbの大きさ、PC3〜4/mobile1〜2、keyboard/tap/戻りを確認。各game画像が異なる体験に見えるかを独立評価。80/F12/H12以上、実gameより豪華なposterを使っていないこと、fake rankingがないことを必須。直接refresh/subpath/ロードはQAとRootが検証し、Artの素材確認で代用しない。
