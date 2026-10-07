# Game021 — 独立Gameplay / Feel review

**Gameplay成立 PASS。** `classic_review`が凍結ソースとcompiled通常入力を独立確認。実操作完了2026-10-07 15:22 UTC。[記録](QA/compiled/reviewer-interaction.json)／[再現script](QA/independent/reviewer-probe.mjs)。主観的な面白さ、作者本人の試遊、実機iPhoneは未確認。作者未試遊での技術QA後の試作公開はユーザー明示承認済み。

## ソースで確認した成立条件

7列6段、重力、座標で縦横斜め4個以上、42手無勝者の引き分け、満列／終局後の無効着手をモデルで表現。保存は合法な手順を再生する。ふつうが初期値で、全CPU段階は即勝利／即敗北阻止を認識し、やさしいはseed選択、ふつう／つよいは深さ・node/time上限付きWorker探索。Worker失敗時は合法な戦術fallbackへ戻り、世代・手数ticketとterminateで古い応答を弾く。

列タップ／左右＋Enter、ghost、任意hint、CPUペア／計算中1手／2人1手undoを用意。任意練習は専用near-win盤面で重力と横4個を教え、normal statsから分離する。reportedフラグと統計は同じJSONで保存し、終局再表示を重複計上しない。再読込は保存run IDを復元し、追加run_startを出さない。

## 独立担当が実施した通常入力

compiled previewをChromiumでクリック／左右キー／Enter操作。モデル注入、DEV hook、隠れた正解の書換えは不使用。保存の読み取りは操作後の整合確認のみ。外部解析同意を拒否し、既存広告／解析URLはcollectorでstubした。

- CPU3段階×先手／後手の6context。後手CPU初手と自分の着手への応答を待ち、手数を確認。hintは候補枠だけで手数を増やさず、undoで自分＋CPU2手が戻る。後手の最初のCPU1手は残った。
- 保存UUIDを記録し、再読込後はタイトルの「続きから」で同じUUID・手数へ再開。保存局がある状態で練習→本番確認→cancel、練習完了→本番確認→cancelを6contextで確認。練習の表示／結果を維持し、保存局の手順を変えなかった。
- 同端末2人で4列目を6回交互に埋め、合法列へfocusが移ることを確認。続くArrowRight＋Enterで7手目が入る。新局確認cancelは盤面を保持し、確認受諾は0手へ戻った。
- 合法7手 `[3,2,3,4,1,2,5]` を実操作して[thumbnail原本](QA/compiled/desktop-thumbnail-source.png)を撮影。fixtureによる勝敗強制ではない。

rootの[4画面collector](QA/compiled/report.json)は別担当の証拠として読んだ。PC／390px／320px／横844pxで練習、通常7手勝利、retry、pause、保存、mute再読込、Portal帰還を確認した記録。独立担当が全6CPU局を終局まで自然に遊んだとはしない。初回の練習confirm、保存対局resetのrun ID、満列keyboardの3findingは[独立判断](QA/independent/)を保持し、今回cancelとfocusの修正後挙動をcompiled操作で確認した。

## 判定と限界

7列とghostから「選んだ列の最下空きへ置く」が明確で、手番とCPU応答を待って次の一手へ進める。任意hint／undo／新局確認は考える時間を邪魔せず、時間制限や自動難度上昇を認めない。低刺激の定番勝負として技術的に成立。

難度・先後を選び、hint／undoで読みを試せることは再挑戦の理由になり得るという設計上の推論で、本人の面白さ・強さの体感測定ではない。実機の親指操作、音量、FPS、作者の「もう一局遊びたい」は未確認。Visualは別文書で実画像から評価する。
