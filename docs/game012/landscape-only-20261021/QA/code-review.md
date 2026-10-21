# Game012 横向き専用候補：独立コードレビュー

2026-10-21 UTC。`/workspace/arcade-game012-visibility`、HEAD `60e8b28164cad38556a645fa2cbe940023229185` にある未commit製品差分を読み取った。比較対象mainは `ac5304fa81361f592942c472c7fa04f668d3b4bc`。設計レビューは同ディレクトリの `design-review.md`。製品・Gitの書込み、ブラウザ、API、公開は行っていない。API禁止に従いJev Shadow APIは呼ばず、以下は独立コード判断である。

**最新判定：生成/配信・停止/記録境界は妥当。R012-LAND-01は後述の追補で修正を確認し、今回のコードレビューに未解決の修正要求はない。** 初回findingとhashは以下に保全する。通常ブラウザmatrixと実機評価の合格をこのコード判断から推定しない。

## Finding R012-LAND-01：回転時のgesture情報破棄で古いclickが起動する

対象は `public/games/yokodori-days/index.html:93` のpointerdown、`:96` のclick検査、`:110` の `gestureEpoch.clear()`、`:115` の説明画面更新。managed shellにも同じ実装がある。

clickは `origin!==undefined && origin!==epoch` のときだけ拒否する。しかしsyncOrientationはepochを進めた直後にMapをclearするため、回転前のpointerのoriginがundefinedになり、検査を通過する。説明画面では回転時に同じplayボタンを残してdisabledだけを切り替えるため、次の経路が成立する。

1. 横向きの説明画面でplayボタンにpointerdown。
2. 縦回転してボタンdisabled、epoch更新とMap破棄。
3. 横回転して同じボタンenabled、epoch更新とMap破棄。
4. 旧pointerの遅延clickが同じボタンへ届くと、originがundefinedなのでplayが実行される。

独立のread-only Node `vm` プローブで、実際のshell inline JS全体をmock DOM上で動かし、この順序を送った。`game_launch=1`、新 `game.html?...records_session=...` が設定された。これは実listenerの受理条件を確認した合成DOM証拠であり、Chrome/Safariが現実の回転で同じclickを必ず配送するという実機再現ではない。

**独立判断：PRODUCT_BUG / CODEX_ACTION_REQUIRED=true / NEXT_EVIDENCE=AUTOMATED_TEST。** 回転をまたいだ古いgestureを新しい明示操作として扱わないようにする。既知pointerdownのepochを不一致のまま保持してrejectするか、pointer clickには現在epochのdownを必須にしkeyboard起動は別に扱う等、限定修正を推奨する。説明画面の横→縦→横、pointercancel/blur、keyboardによる明示起動を回帰確認する。回転に伴う意図しない起動のため、このfindingが残る状態でfresh gesture要件を合格としない。ゲームルール/保存/bridgeの変更は不要。

## 対象範囲と保護

mainとの共有/配信範囲diffは、export-manifestと012 index.html / portal-return.css / game.html の4件だけ。`src`、Worker、`.github`、Vite、Game013/014、他Godot runtime、native bridgeに差分はない。専用helper、012managed shell2件、監査ラベル、対象collectorの更新は本変更の範囲内。PR14/15の製品を再変更する差分は確認されない。PR11を操作していない。

phone判定はprimary coarseかつhover none、screen短辺 `<600`。600以上のtablet、fine/hoverあり狭いdesktopは制限しない。screen寸法が無い場合だけinner寸法へfallback。向きはscreen.orientation.type→旧window.orientation→mediaを使用し、orientationchange/resize/primary入力mediaの変更で更新する。`play()`と`practice()`直前にも再確認する。small tablet/外付けpointer等はheuristicの境界であり、端末種別を完全に識別すると説明しない。

縦初期は元タイトルを回転guideに置換し、開始・練習の導線を出さず説明/一覧へ移動できる。説明側もplay/practiceをdisabledとし、runtime guardを併用する。screen orientation優先なので物理方向とsplit viewportの方向が異なる場合は物理方向を採用する点は仕様として残す。browser chromeやkeyboard高さだけで誤中断しにくい利点がある。

## 中断、再起動、記録

- native起動時からshell phaseはplayingとなるため、engineロード中の縦回転も停止分岐の対象。
- 縦回転では `hidden=true → 同じframe.remove() → removeAttribute(src)`。最初のhiddenで記録受理gateが閉じ、detachで子browsing contextを破棄する。初期frameは残してmoduleに捕捉させ、再挑戦では同じ要素を再appendする設計が共有listenerと整合する。
- stop/menuでshell RAFも止める。中断文は今回を終了したと説明し、pause/resumeとは呼ばない。横戻りはmenuを更新するだけでsrc/game_launchを生成しない。明示playは新UUIDを作り、interruptedを解除する。
- LegacyGameRecordsのsource/hidden/URLnonce/start-result ID検査は不変。中断中の旧resultはhidden/null contentWindow/空srcで拒否、新context起動後は旧WindowProxyと旧nonceを拒否する。hidden属性監視は既存sharing候補/結果欄をclearする。回転をresult/score/completeとして合成しない。
- 前に正当に完了したBESTや共有設定・既存投稿は消さない。未flushの中断中進行の永続化は保証しない。既存確定BESTと保存拒否はbrowser fixtureで別に検証する。
- 初回iframeを維持する判断、同要素の再利用、新UUIDは妥当。ただし前述のpointer gesture検査は、このcontext安全性とは別の未解決項目。

## top-level迂回と生成経路

`game.html` のbootstrap IIFE先頭にtop-level時 `location.replace('./index.html'); return` を追加し、直接訪問はcanonical shellへ戻す。`new Engine(config)` の後だが、通常のengine.startGame等へ進む前にreturnする。親iframe内の通常起動には適用しない。WASM/PCK/index.js/bridgeを変更しない限定HTML変換である。

同じ012専用fit helperを既存importerと厳密監査から呼ぶ。既存配信HTMLへのhelper適用が現行6245-byte HTMLを完全再現し、再適用も同一であることを独立照合した。managed index/cssと配信index/cssも各完全一致。

manifestのruntime42行＋shell6行、計48行について実bytes/SHA一致、3作品各runtime sumとtotal sum一致を確認した。今回のruntime変更は012 HTML6138→6245（+107）で、そのruntime/total集計も+107。shellはindex13918、css2242 bytes。元sourceSha256と013/014 rowを保持する。元export実物が無いため、完全なpinned source/export再import監査の成功は主張しない。

## 検証状況

rootからcheck・976unit成功、DEV新matrix13実行開始の報告を受けた。本レビューはそのテストの独自実行や最終browser合格確認をしていない。独立実行したのは上記のMap/epoch合成DOMプローブ、HTML再現/冪等性、managed copy、manifest実値照合のみ。

残る受入証拠はR012-LAND-01の限定修正/回帰、指定7幅＋desktop/tablet境界、縦初期未起動、直リンクredirect、実人物/HUD/touch/keyboard、ロード中/実プレイ中の回転、旧source/session遅延result拒否、横戻り未起動→明示再挑戦新context/nonce、通常結果/retry/一覧帰還、BEST/拒否保存、同意/privacy、compiled build。Safari実機・聴感・人間可読性未実施を自動検証で置き換えない。

## 読み取った初回候補SHA256

| file | SHA256 |
|---|---|
| public/games/yokodori-days/index.html | `b398953edf7405d73f6a50e7e36c98f53e3f099d431afc32e451febe82b3085c` |
| public/games/yokodori-days/portal-return.css | `08e25d6083054227aa8fbe6bce99903e6cd6d69f40f89b64d0f9b65187c48c53` |
| public/games/yokodori-days/game.html | `ff936c77bed2898a848dc36552c9f565116023f8c2f4c0c216f629c1e2849994` |
| public/games/export-manifest.json | `b0e5febde6c54de79172efee18099cc4575391d6cd07e6579007a3250f017c0b` |
| tools/game012_canvas_fit.py | `0510a33aa8be95c1a736518a784c86d4dcc7047694f13c7f1ca805f8866d4907` |
| tests/fourteen-game/audit-legacy-migration.mjs | `05c607350777074ebb344794821b5f2cac0e00d70e275283cfba1fa3ee3f98af` |
| public/games/yokodori-days/index.pck | `46a9ae5df324babdea9833427da0aeeb80813cf99fd3b787636032335f21f412` |
| public/games/yokodori-days/index.wasm | `6498359ba889796a0d95a2f71113ac184badc0f2d84cf28f4103c7e399d2d547` |
| public/games/native-record-bridge.js | `abc097e373fc619aa6b9235c0ab865f5737f5d50919fb2a916d5306f9b859ce1` |

## 追補：R012-LAND-01 限定修正の再レビュー

2026-10-21 UTC。rootの固定後候補を再読した。`play()` と `syncOrientation()` の `gestureEpoch.clear()` だけを取り除く変更により、pointerdown時のepochがclickまで保持される。回転でepochが進んだ旧pointerは既存click guardでpreventDefault/returnされ、新しいpointerdownは新epochで上書きされる。shared input/records/engineを変更する必要はない。managed/public shellは再び完全一致、manifest全48 runtime/shell行の実bytes/SHAも一致した。game.htmlとCSSのhashは初回候補から不変。

前回と同じ、実shell inline JSをNode vmとmock DOMで動かすread-onlyプローブを再実行した。同じ説明→play pointerdown→portrait→landscape→旧clickで **preventDefault=true / game_launch=0 / frame.src未設定**。続けて新pointerdown/clickを送り、game_launch=1を確認した。旧gestureを拒否し、新しい明示操作を妨げないことを独立確認した。これは独自browser実行ではない。

rootが実行した `tests/game012/rotation-gesture.mjs` のコードと、以下の生JSONも実際に読んだ。

- `gesture-red-verified/REPORT.json`：旧候補でpointerとtouchは各 staleRequests=1 / src設定となりFAIL。Space/Enterは旧候補でもstaleRequests=0、fresh activation成功。初回の独立ソース所見が実ブラウザでも再現された。
- `gesture-green/REPORT.json`：修正後4/4 PASS。pointer/touch/Space/EnterともstaleRequests=0 / src=nullの後、freshActivation=true。各行のrequests=1は後続の新しい明示起動分であり、古いgestureからの起動ではない。pageerrorは全行0。

生結果SHA256：RED `412eeec286803b47305d926350bb92fb3442a13d341749e0b283143590423666`、GREEN `e63425d8489c89d532799fb93517bea506d970e4166834c90f56f1e9f9ac5bab`。

このcollectorはengine URLを小さいHTMLへrouteして起動境界を測るテストであり、実WASMゲームのscore/保存/音/通常完走を検証したものではない。実入力はPlaywright mouse/keyboardとCDP touchを用い、score/time/game stateやclick dispatchを注入していない。orientation変更はviewport設定による合成条件であり、物理端末の回転と区別する。初回RED結果を改変・上書きせず保持している。

**独立再判定：R012-LAND-01は修正済み。** 未解決のコード修正要求はない。通常native matrix/compiled結果、実BEST互換、013/014回帰、Safari実機/聴感/可読性は各々の証拠として残す。

修正後の候補SHA256（初回表を置換せず追記）：

| file | SHA256 |
|---|---|
| public/games/yokodori-days/index.html | `d4691facb36f1d689981233506a60dd27c3e18e209b5094b5c85de72583a8e8e` |
| public/games/export-manifest.json | `e3c7c06926c33bcb8f8e8fbafede8da208371e12c66f21ecf4f386529510cac7` |
| public/games/yokodori-days/game.html | `ff936c77bed2898a848dc36552c9f565116023f8c2f4c0c216f629c1e2849994` |
| public/games/yokodori-days/portal-return.css | `08e25d6083054227aa8fbe6bce99903e6cd6d69f40f89b64d0f9b65187c48c53` |
