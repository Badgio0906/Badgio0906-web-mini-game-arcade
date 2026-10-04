# Game010 会議、聞いてます？ ～MEETING SURVIVAL～ Visual Brief

2026-10-04 / Art Director / HYBRID・企業会議室と軽い風刺。

## Design Goal / Mood

プレイヤーの席から見る普通の長い会議。面白さは平凡な真剣さとこっそり仕事する関係で作り、警告の公平性を壊さない。壁#e4e5de、スーツ#48696b、木#77594b、資料#a78386、墨#343f46、真鍮#c3a160。Game007の正面かごやGame009の真上机ではなく、人物を見る目線高さの空間。

## Composition / UI

Desktopは広い会議テーブル、奥に上司、脇に参加者、手前に自分の仕事机。上に小さい会議時間/score、下に一つのLISTEN↔SIDE WORK切替。Mobileでも上司の顔と予兆文字を十分に大きく、手前の仕事と44px以上toggleを残す。宣伝左列、丸い情報カード、上司を隠す巨大操作UIを使わない。社内議事録のセリフ見出し、本文は人間的なサンセリフ、数字は等幅。色だけでなく、聞く/打つ形と文字を併用する。

## Character / Object Design

同じ上司の通常talk・こちらを見るglance・前のめりquestionの3状態。体格・座席・anchorを同一にして、差は読み取れる視線/姿勢。同僚3人は落ち着いたスーツ女性、眼鏡の年長社員、ノートを持つ社員。現実の人/企業/民族を揶揄せず、顔へ過剰な奇形を足さない。

## Background

コードの会議テーブル遠近線、壁/窓/ブラインド、手前のノート/PC。低コントラストで顔を主役にする。役員会では少し真鍮の表示や参加者が増える程度とし、赤い恐怖照明へ変えない。

## Code / Generated / Hybrid

Generatedは上司3poseと同僚3portrait。Codeは会議室、プレイヤーの紙/PC/手、score・virtualtime・mode、全吹き出し・予兆文字・選択・toggle。Hybridはコード室内へ人物を置き、モデル状態にだけ対応するpose/typingを加える。上司の画像が重要な時計・文字を持たない。

## ImageGen Plan / Asset Contract

2行×3列の透過シート。上段は同一上司のtalk/glance/question、同じ正面〜少し斜めの座った上半身構図、完全同じscale/baseline。下段は別々の同僚3人。同じ細い墨線、灰青/木/藤/teal、成人の落ち着いた顔、背景・机・吹き出し・文字・ロゴなし。

`boss-talk.webp`、`boss-glance.webp`、`boss-question.webp`は共通256×320canvasとseatanchor。`colleague-one.webp`、`colleague-two.webp`、`colleague-three.webp`は192×256。実bboxを検査する。Mobileの上司顔は60〜80px程度以上を目安にし、微小な目だけで予兆を伝えない。目標6枚140KB以下、記録した上限200KB。原本`assets/game010/`、採用分`public/assets/game010/`。

## 実素材の確認

生成原本とstaging最適化のglance/questionをArt Directorが実際に見て承認した。顔・手・姿勢の差が明確で、同じcanvasと座席anchorに収まる。6枚合計92,040bytes。初回素材承認時はMainの長時間ブラウザ確認を妨げないよう`assets/game010/staging/`で待機した。その後Mainが開いた書込みwindowで同じ採用画像をpublicへ配置した。素材承認は実際の予兆時間/完成Visual Gateではない。

## Animation / Error Clarity

通常の小さなtalk、安定したglance、質問の前傾は実モデル状態にだけ対応する。コードの「ところで……」等の予兆が微小な目を補助し、規定反応時間の間に読める。独立したランダム表情を危険に見せない。SIDE WORKは静かなtyping/書込みと加点、LISTENで即止まる。feintを実装した場合はその意味に合った表示とし、全glanceが即終了だと偽らない。

失敗は質問時の実modeを残し「すみません、聞いてませんでした。」と高速Retry。5分相当はゲーム内の会議時間として明示し、実wallclock5分と勝手に同一視しない。安全終了/役員会の利益と危険を読める選択にし、受諾modeを常時小さく表示。Reduced Motionでも予兆・状態文字を消さない。

## Avoid List / Quality Gate

ランダム即死、目の数pixelだけの合図、ネオン監視dashboard、外部stockphoto、実会社ロゴ、民族/政治の戯画、予兆と混同する冗談顔、上司を隠すtoggle、開始時に全称号を公開することを避ける。実Desktop1920×1080/Mobile390×844で聞く/内職/予兆/feint実装時/質問/失敗/安全終了/役員会を確認。独立80以上、F12以上、H12以上、最大3回。その後HUMAN ART REVIEW REQUIRED。反応時間と人間のrisk体験は別GameFeelレビューで評価する。
