# Game019 改訂02 — 溜めて、離して、祈る

正本：今回のユーザー「Game019全面ゲーム性改修」指示。baseline `fcc4156a53988fc24aa70967534c5669e279fb38`。旧初版仕様は歴史資料。対象は019のruntime／HTML／素材／試験／プロフィールのみ。他18本の物理・表示・保存・共通Telemetry・広告・CREDIT・portal構造は変更しない。

## 実装前の関門

1. [Web調査](../../GAME019_JUMP_DESIGN_RESEARCH.md)を先に完了。
2. [現行実操作](../../GAME019_BEFORE_REDESIGN.md)を先に完了し、browserを閉じる。
3. flat prototypeで連続チャージ入力だけを完成し、空中補正0／弱補正を比較。
4. 約20mの手作り地形で独立Feelレビュー。溜め量・立ち位置・落下結果の差と操作上の重大な問題を確認。
5. その判定後だけ100m井戸・100m上空を作る。本人以外のworkerへFeel／Visual／QAを委任し、source hashを固定。

人間の「楽しい」「もう一回」と実機の親指／音／FPSは自動入力から合格にしない。独立workerは観察できる成立条件と体験上の懸念を示す。人間評価がない状態でも、技術的に検証した改修を今回の既存公開承認範囲で公開し、その限界を残す。

## 操作とCore loop

PC：←/A、→/Dを押しながらSpaceを溜め、Spaceを離して跳ぶ。方向入力なしは真上。方向は離した時に確定する。押し始めでは跳ばず、最大まで溜めても離すまで跳ばない。サイズ別ボタンとZ/X/Cの別サイズ操作は撤去。

mobile：大きな左右方向ホールドと、中央のJUMPホールド。多指pointerをID別に保持。方向のfingerを離すと真上へ戻る。左右同時は真上。pointerが領域を跨いでもcaptureし、pointercancel・blur・非表示・pause・遷移・RESTARTでチャージを取消す。keydown repeat・header Space・touchから合成clickによる二重launchは禁止。

固定120Hz model。最大溜め約0.7秒、短押し約0.5〜1mで足場上の20〜40px調整、中程度約4〜6m、大約7〜9m。実際の値はprototypeで調整し採用値を報告へ残す。3区分は姿勢・音と分析用分類に用い、3段階に丸めた物理にはしない。

跳躍の向きと速度をlaunchで固定。風／衝突以外の空中制御は0を第一候補にする。本番のPOWER数値、正解の軌道とlanding markerは撤去。練習だけ視覚的なゲージを許す。モデル用readonly forecastはDEV限定QAで残し、時刻・位置・イベントへ副作用を持たせない。

## ステージと失敗

井戸0〜100mを12の手作りsection。区間に1〜3種類の要求、異なる高度差／横距離／幅とランドマークを持つ。intro、低い梁、根の長い横跳び、割れた狭い石、苔、左右切替、50m安全棚、リスク、動くバケツ1種類、分岐、複合、日光の出口。等間隔の主経路やseed違いの配置は使わない。

catchは25m前後、50m、75m前後の実地形。横に外すと通過するので万能なcheckpointではない。失敗は同じRUNで着地し、その地点から再開。小さな戻り／数足場／10〜20m以上の大転落を地形で実現する。強制teleport・即Game Over・制限時間は使わない。危険ルートの下が分かるよう、grounded時の下を見る操作または縮小した断面案内を設ける。出発点から次の足場が見える上寄りsmooth camera、描画はpixel単位。

海100mを短く祝う→海鳥のlift→「井の外の蛙、宇宙を目指す」。空100〜200mも12の手作りsection。固定・可視の横風／上昇／下降、弱・中・強を導入して組合せる。ジャンプの途中に予告なしの時間乱数で風を変えない。境界は環境とindicatorで先に分かる。宇宙200mでCLEAR。

## UI・練習・保存

高さとBESTを主要HUDにし、総落下距離はResult／pause等へ置く。RESTARTはpause内から明示確認を挟む。初回の「すぐ遊ぶ／説明を見る／練習する」は維持。

独立7段練習：短押し、中程度、最大、左、右、空中入力で修正できない、短い位置合わせ→本命ジャンプ。実際の跳躍／着地が達成条件。本番score・BEST・章・run記録と隔離。スキップで新practice versionの完了を偽造しない。

既存 `web-mini-arcade:v1:game019:` と `bestHeightDm`／muteの互換を保つ。run position saveなし。new statsは019だけに保存し、欠損・拒否・破損でも遊べる。旧practiceCompletedを新チャージ練習完了と解釈しない。

## 絵・音

既存オリジナル蛙を使い、Idle、Charge1/2/Max、JumpLeft/Up/Right、Fall、Land、Slip、WindLeft/Right、Clearを少数pixel poseで明確にする。しゃがみ／脚／小さな音程差で溜め具合を分かるようにする。井戸の光・苔・レンガ・水・根・設備をsectionへ結びつける。静かな019固有合成BGM／SE、pause・mute対応、他ゲームのAudioServiceは変えない。

## 計測とJev

既存 `specific_game_events` のprimitive payloadで、charge_ms、power_normalized、direction、start/end height、landing_success、section、fall start/end/distance、catch、wind direction/strength、chapter、well_clear／space_clearを記録。跳躍attempt IDとRUN内counterを用い、400件windowの欠測を推測しない。

019固有のschema、profile／design notes、実QA例と明示synthetic例、集計helperを追加。平均溜め時間、使用区分、落下height対、50/100/sky/200到達を保持windowの分母とともに出す。外部Jev API・global analyticsは追加しない。他ゲームprofileはbyte単位で保持。

## 検証／完成条件

Charge→releaseだけでlaunch、時間と飛距離の連続差、最大連打の拒否、空中左右無効、全route物理到達、壁／天井／滑り／crumble／bucket／catch／分岐、落下量の幅、50/100/200、可視の風4方向と3強度を対象unitと通常入力で確認。手作り全sectionの出発点・着地点・跳躍方針をlevel設計表へ記録。

PC1440×900・phone390×844・narrow320×568・landscape844×390で長押し／複数touch、cancel、menu、practice、pause、BEST／mute、retryと帰還を確認。44CSSpx、viewport／clip／hit-test、console、root/subpath、production診断不在を確認。全unitとbuild、他ゲームruntimeのbaseline hashesを監査。公開はCI成功と実URLのruntime hashes一致を確認して完了する。
