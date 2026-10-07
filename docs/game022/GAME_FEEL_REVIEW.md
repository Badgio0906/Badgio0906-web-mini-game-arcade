# Game022 — 独立Gameplay / Feel review

**Gameplay成立 PASS。** `classic_review`がrootのcompiled4173で通常の今日の配札と製品内の専用練習を実操作した技術判定。本人の面白さ・自然な難易度・実機の快適さを採点したものではない。

最終実施UTC `2026-10-07T16:04:34.667Z`。PC1365×900、phone390×844、small320×740、landscape844×390。sourceはROOT_SOURCE_FREEZE_TOUCH_FIX＋ROOT_SOURCE_FREEZE_PAN_FIXに一致。[実操作report](QA/compiled/reviewer-report.json)、[実行script](QA/compiled/reviewer-probe.mjs)、[最終SHA照合](QA/compiled/source-freeze-final-check.json)を保存。

- 4画面で製品の6枚練習を3合法手で完了。赤5→黒6、K→空列、A→同スート組札。練習undoで初期へ戻り、練習だけでは通常saveが作られない。
- 通常の今日の配札は52枚（場札28＋山札24）。1枚／3枚めくりとundoで位置・札の表裏を復元。hintは位置を変えず、表示された合法手を実際に移した。「組札へ1枚」も実際に1枚だけ移動。未証明の「残りを整理」は無効。
- PCの実マウスdragと盤外releaseによるcancel、390pxのカード中央からのtouch dragとpointerCancelを確認。旧touch capture transferは修正後に成功。実合法stackの露出間隔44px、補助8ボタンは全幅で44px以上をDOM実測。
- OFFのcomputed touch-actionはpan-x pan-y、ONはnone。390／320のnative CDP swipeで横scroll端（82／152px）に到達。wheelと7列目へのtapでも到達。844pxは盤面の内部縦scrollで下部へ到達。横のpage overflowは4画面とも無し。物理iPhoneの指pan成功とはしない。
- pause中の時計停止、配り直しcancelによる位置保持、muteのreload保持、保存位置・RUN UUIDのreload継続を確認。titleから説明→Portal→pagehideでも実RUNをpreviewで上書きしない。別のconsented local観測ではrun_startがidle／reload・明示resume前後で1件のまま。同UUID。外部analytics hostはinterceptした。
- compiledのDEV hookは存在せず、fixture=solvable queryでも同日の通常配札は変わらない。pageerror無し。

実際の操作結果は通常daily midrunであり、自然に52枚clearした証拠ではない。別担当のmodel検証と既知の52枚DEV専用fixture clearは合法性・成立性の補助証拠として区別する。今日／ランダム配札が必ず解ける保証をしない説明は製品にある。

根本findingは保存済み。touch captureとOFF CSS cascadeは修正前のsource／stateを保持し、rootは各修正前にhidden-answer Shadowを記録したと報告。この担当はJev回答・logを読んでいない。最初のstale hint selectorとtouch後のEscapeでpauseしたcollector不備も元reportを保持し、製品バグへ読み替えていない。

**本人の楽しさ、実機iPhone、音量聴感、FPSは未確認。** 作者未試遊の試作公開はREQUESTで明示承認されている。公開URL／CI／Workerの成功はrootの別観測で確認する。
