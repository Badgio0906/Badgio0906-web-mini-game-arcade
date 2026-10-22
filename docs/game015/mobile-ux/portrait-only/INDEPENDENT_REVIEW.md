# Game015／表示012 スマホ縦専用化 — 独立レビュー

2026-10-20 UTC、担当 `/root/game015_ui_review`。**固定候補のコードと以下のブラウザ操作では未解決の技術的blockerなし。物理iPhone Safari・人間の快適性・公開承認は別途確認が必要。**

対象は「落下キング」内部Game015／表示012。Game016／表示013と混同しない。基準PR候補は `62ac47215e4ae137184f51484b47405078d795b0`。製品・テスト・Git・設定・外部APIをレビュー担当は編集せず、この報告書だけを作成した。

## 固定ソース

| ファイル | SHA256 |
|---|---|
| `src/games/game015/main.ts` | `78afb58528716bd981105f594b960f852c262a2220ae23d1bd464ee064ae08fa` |
| `src/games/game015/style.css` | `2a6b280d001eef2f8616a21b5580eb2a81704430f2acd8fc2342cdc28a8007d1` |
| `src/games/game015/portrait.ts` | `ef01dd29598fa3073ed91aa66f767ae60ac0d604aa36f7ef4a92e2dc95345ffe` |
| `src/arcade/onboarding.ts` | `fcc6b2cc82c756c3fc8160d13b66e26e66797e62114174ca18dc0e035c4d0478` |

実行後にも照合した。FallBoardは直前候補 `e939d212…` のままで、今回物理・入力adapter・保存・得点を再変更していない。

## コード確認

- gateは `(pointer:coarse) and (hover:none)`、横向き、幅1000px以下・高さ600px以下の組合せ。UAや物理iPhoneの確定検出ではなく、入力特性とviewportによるヒューリスティックである。fine-pointer PCと大きいtabletは除外される。
- 横向きへ入る際は既存のpauseを使って本番入力・時計・音を止め、その後appをinert／非表示へ切り替える。横向き案内へfocusを移し、縦へ戻っても本番を自動再開しない。メディア条件が変化しない単なるresizeでpauseを繰り返す構成ではない。
- endingは400ms待機タイマーの残時間を保存し、controllerの終了演出時計も止める。縦へ戻った時に残時間だけを再設定する。run_endやBEST確定を再実行しない。
- 共有onboardingのsetSuspendedは、既存closeラッパーを呼ばずnative dialog.closeで一時非表示にし、active・DOM・session・callback・phaseを保持する。練習の縦復帰は「続きから」の明示操作が必要で、再開時にperformance基準を更新してcatch-upを避ける。
- Game015の練習pointer captureは所有mapを先に消してから解除し、lostcapture再入でも入力を復活させない。説明／成功の復帰でsessionを作り直さず、新しいtutorial開始／完了イベントも送らない。
- Game015のgesture epoch判定が訓練dialogにも適用され、回転前の接点を再開ボタンへ持ち越さない。app.inertだけに依存せず、controllerと訓練のイベントguardでも横向き入力を止める。
- setSuspended未使用時はsuspended／practicePausedがfalseで、他ゲームの既存経路を保つ。capture所有管理の実使用もGame015に限定される。他ゲームのコードを縦専用化していない。
- 横向き専用の操作Gridと解析設定固定CSSは除去され、解析・プライバシーは通常のfooterに戻る。PC短画面は右側説明欄を独立scrollできる構成。新しい案内と練習停止文の日本語は、既存woff2のcmapですべてcoverageを確認した。

## 自身の独立ブラウザ確認

固定DEV4941でphone390×844→844×390を往復、固定compiled4942でfine844×390、coarse1024×768、coarse844×390を実行。Chromiumのtouch／inputエミュレーションであり、実機Safariではない。ブラウザ内のconsent denied・tutorialCompleted・muteは明示的な初期fixture。モデル・位置・時計・得点は書き換えず、外部通信は遮断した。

DEVの21項目とcompiled3条件が成功した。

- 説明を開いたまま横へ回転すると訓練modalが閉じ、案内へfocusが移る。縦へ戻ると説明全文とphaseを保持し、練習用の再開ボタンは不要な状態で復帰した。
- 練習中の回転でelapsedが停止。縦へ戻った直後も停止し、「続きから」にfocusがある。再開前のArrowDownでは進まない。
- **EnterとSpaceを別々の回転往復で検証**し、両方ともnativeのボタン操作で練習を再開できた。再開80ms後にelapsedが増え、増分は300ms未満で、横向き待機時間を追いつき再生しなかった。
- 実際の本番を開始して横へ回転し、待機中のsnapshot.timeが不変であることを確認。縦へ戻るとpausedのままで、再開ボタンへfocusが移った。
- 横向き案内のまま解析設定を開いて拒否でき、案内の戻るリンクを実際にtapして27カードのポータルへ到着した。JavaScript例外0。
- compiled fine844×390では案内に遮られずplaying／pauseへ到達。coarse1024×768でも同様に通常プレイ可能。compiled coarse844×390では案内表示とapp.inertを確認した。

実行後に全context／browserを閉じ、親担当へブラウザ枠を返却した。

## 実画像と証拠

以下の自分の実行画像を実際に閲覧した。案内は中央に理由・縦へ戻す操作・帰還リンクがあり、解析footerも読める。縦の練習／pauseと、除外対象のPC／tabletのプレイを区別できる。PC短画面の補助説明は独立scrollするため、最初の画像だけで全文が常時見えるとは扱わない。

- [横向き案内](QA/independent/844-landscape-notice.png)
- [縦で再開した同じ練習](QA/independent/390-practice-resumed.png)
- [本番から回転して戻ったpause](QA/independent/390-returned-paused.png)
- [fine844 PCの通常プレイ](QA/independent/fine844-playing.png)
- [coarse1024 tabletの通常プレイ](QA/independent/coarse1024-tablet-playing.png)
- [compiled phone横案内](QA/independent/compiled-phone844-notice.png)
- [実行script](QA/independent/run.mjs)／[実行結果JSON](QA/independent/review.json)

原本は `/workspace/audits/game015-portrait-20261020/independent/`。親担当が上記QAへ同名で保全する。独立実行にはcollector失敗や製品再修正はなかった。

## 限定Visual評価

対象は実viewした**横向き案内・縦の練習再開・縦のpauseの3状態だけ**。ゲーム全体や未実施のsuccess画面を再採点しない。

| 項目 | 配点 | 得点 | 今回の実画像・操作の根拠／限界 |
|---|---:|---:|---|
| A identity |15|13|navy／cream／goldの既存色を案内・練習・pauseで維持。|
| B character/object |15|13|練習とpauseで既存の王冠・顔・縦坑を識別。新しい素材の採用評価ではない。|
| C background |10|7|既存坑道とmodal背後の分離を保持。後半biomeは今回未評価。|
| D UI integration |10|9|縦へ戻す説明、帰還、明示再開、解析footerが同じサイト内で理解できる。|
| E composition |10|9|横向きは案内に整理し、縦の練習とpauseは操作を確認できる。|
| F readability |15|12|主要日本語・再開・帰還は明瞭。練習Canvas内の補助文字は小さく、実機判断速度は未確認。|
| G motion/effects |10|6|横案内→元の説明／練習→pauseという状態切替を実ブラウザで確認。連続ゲームアニメーション・音・FPSは今回は加点しない。|
| H production value |15|13|保持した練習・時計停止・focus・再開操作と画像の表示が一致。実機の完成判断は含めない。|
| **合計** |**100**|**82**|**今回3状態に限る技術的Visual gate80以上、F/H各12以上。作者の実機評価・面白さや公開承認の代行ではない。**|

## 未確認・受入上の留意点

endingの残時間・safe-area／動的高さ・Game005の共有練習とGame016起動は親担当の固定QA結果であり、上記の自身の実行数に加算しない。本レビュアーはendingの保存コードを読んだが、独自の実ending回転RUNは行っていない。練習成功画面の回転復帰は両担当ともブラウザ実行未確認（コード上はDOM／phaseを保持する設計）。全ゲームのブラウザ回帰を実施したとは呼ばない。

物理iPhone Safariの回転通知、切り欠き、ブラウザバー、Bluetoothマウス接続時など入力特性の変化は未確認。分類はviewport／primary pointerの境界に依存するため、小型tabletや分割表示を厳密に機種区別するものではない。旧Safariの実互換性も未証明。縦での長押し解除と面白さ・親指の快適性は本人実機で確認する。

作者の「スマホを縦専用にする」という方針への技術的な整合性を確認した。過去の横向きUIの採点を持ち込まず、公開やmain統合の自動判断には使わない。
