# Game032 revision02 — 独立技術QA

基準main：`5ecaa9dd4ac39fbd6b83849e1ecd6c7f352d0d6c`。実装担当と別のQA担当がAGENTS／PROJECT_CONTEXT／CURRENT_STATUS／GAME_DEVELOPMENT_RULES、現行Game032のモデル・HTML・入力・水槽・旧revision01 QAを参照した。[読込記録](QA/INDEPENDENT_START.json)。Jev回答・秘密情報は参照していない。

## 最終固定候補の通常操作

2026-10-10 18:45:10〜18:47:37 JST（09:45:10〜09:47:37 UTC）、固定production-reference preview `http://127.0.0.1:4444` に対して [独立runner](../../../tests/game032/revision02/qa.mjs) を実行した。最終 [REPORT](QA/independent-browser-05/REPORT.json) は **390チェック成功**。開始・終了で34ファイル（Game032 runtime・HTML・全22配信WebP・font）のSHAとrunner SHAを照合し、不変だった。context／browserは終了済み。

PC1280×900／スマホ相当390×844／320×740／横844×390の4画面で、通常のマウス・Space・CDPタッチにより、本番で各1匹を取り込んだ。時計・乱数・モデル・正常API回答を注入していない。別途、各画面の練習でルアーを1回ずつ引いて各1匹を取り込んだ。計4本番魚と4練習魚の操作証拠であり、人間の自然な認知・反応・面白さを判定したものではない。

- 本番魚は5分終了前の取り込み時点で専用キーに記録された。種類・最大サイズ・最大の魚のISO日時・最新日時・数と直近履歴の一致、実時刻との差10秒以内を確認。記録UIの魚名／小数1桁サイズ／`time[datetime]`が保存値と一致する。
- 再読込で保存内容が完全に一致し、タイトルから記録・保存魚の水槽を開ける。旧完了BESTキーは途中釣行では作成されない。練習釣果・全画面／Pause／タイトル遷移で本番魚記録のbytesは変わらない。
- 4画面の実際のFullscreenAPIで`document.fullscreenElement === #app`を確認。全画面の川面、釣り方／主操作／記録／水槽／退出／Pauseは44CSSpx以上・center hit・viewportと非root clip祖先内。通常ボタンを実操作して本番魚を取り込める。
- 全画面Pauseのメニューが可視で再開でき、時計は停止する。水槽・記録の観賞中も釣行の時計とphaseが止まり、同じ釣行へ戻る。水槽だけは独立した観賞時計で泳ぎ続ける。
- 「記録の魚」「今回の魚」を実操作し、保存済み代表魚／今回の魚を表示する。練習魚は今回の水槽には表示できるが、保存済み記録へ入らない。単にDOMのopenだけで判断せず、実viewport PNGを読み取って写真調の水槽の青緑画素を確認。見出しがPortal代理リンクに隠れないことをcenter hitと実画像で確認。
- PCのSpace長押し中のEscapeは全画面を終了し、古い押下を投げ入力に持ち越さない。次のEscapeで通常Pauseへ。スマホのtouchcancelは次frame以内にidleへ戻り、続く100msも誤投げがない。縦横リサイズ、退出、再開、実Portal到着を確認。
- 時間を約1.25秒空けた実際の水槽画像を全画面で保存し、canvas hashの変化も確認。`*-gallery-swim-start.png`／`*-gallery-swim-next.png`は通常の描画で、魚の座標を注入した合成画像ではない。

別の **明示的なAPI利用不可fixture** では、`requestFullscreen`だけをNotSupportedErrorで拒否した。全画面CSS fallback・主操作／退出／観賞水槽・見出し・復帰が機能した。これはAPI不足環境の技術fixtureで、4画面の通常入力・実API検証と混ぜていない。

## 失敗と切り分けを保全

[01](QA/independent-browser-01/REPORT.json)〜[04](QA/independent-browser-04/REPORT.json)の失敗・画面・状態を上書きしていない。各findingは実装担当へ報告し、Shadowと独立判断の記録後に限定修正／再検証した。QA担当はJev回答を読んだりAPIを呼び出したりしていない。

1. 実装中のsource観察では、全画面固定stageよりPauseが外にあり、nonmodal menuのz-indexも低かった。[元観察](QA/INDEPENDENT_FULL_PAUSE_SOURCE.json)。実装担当が全画面Pauseを追加しmenu層を修正。最終通常操作でPause／時計／再開を確認。
2. 01のHTML root clip oracleは通常flowのborder boxを固定viewportへ適用し、実際に見えてcenter hitするボタンを失敗扱いした。root HTMLだけviewport判定へ訂正し、非root clip／44px／center hit検査は維持した。
3. ネイティブ全画面でviewer DOMはopen／hit可でも実画像が旧川面・空白だった。 [probe01](QA/independent-viewer-probe-01/REPORT.json)はviewport／fullPage／element、[probe02](QA/independent-viewer-probe-02/REPORT.json)はCDP両surfaceとAPI利用不可を比較。 [probe03](QA/independent-viewer-probe-03/REPORT.json)でnative完了後にmodalを閉じ再びshowModalすると描画が成立した。この手動DOM再開は明示的な因果fixtureで、製品合格証拠ではない。実装担当がtop-layer順序を修正し、最終通常の開く操作で実画像を再確認した。見出しと共通Portal代理リンクの重なりも別に修正した。
4. 02のルアー無反応は、viewerが正しく復元した`aquarium-open`ボタンfocusにrunnerがSpaceを送っていた。[実focus probe](QA/independent-focus-probe-01/REPORT.json)ではSpaceがviewerを開き、riverへfocus後のSpaceでルアー進捗0→0.1。runnerだけ明示的にゲーム領域へfocusするよう修正し、製品のkeyboard button意味／物理は変えていない。
5. 03の390px全画面Pauseは実測34×44CSSpxで、共通44pxの幅要件を満たさなかった。限定CSS最小幅修正後、最終4画面で44px以上を確認。
6. 04のtouchcancel直後のDOM同期判定は失敗したが、保存した失敗状態はidleで誤投げなし。モデル更新後のphase DOM描画が次RAFになるため、runnerだけ1秒以内のidle待ち＋100ms安定検査へ修正した。

## 明示的な仮想時計の締切fixture

[独立deadline runner](../../../tests/game032/revision02/deadline-fixture.mjs) はPlaywrightの仮想時計をnavigationより前に導入した別の技術試験で、 [REPORT](QA/deadline-fixture-01/REPORT.json) の27項目が成功。モデル・乱数・API正常回答は注入していない。通常QA390項目や人間の実時間5分プレイへ加算／読み替えない。

- 実ボタンからnative全画面の本番釣行を開始し、300仮想秒で結果へ進む。
- 魚を一匹も釣らない技術fixtureのscore0が完了BESTの既存形式へ保存され、魚記録キーが変わらない。
- 390×844と844×390の結果メニューで再挑戦・タイトル・Portalがスクロールで実際に44px以上／center hit可となる。結果の層が全画面stageより上に表示される。
- 再挑戦は全画面を保持した新しいidle／5:00／score0へ戻る。次の300仮想秒で再び結果となり、タイトル操作でnative／CSS全画面を終了して通常タイトルへ戻る。その後Portalへ実到着する。
- Source34ファイルとrunner SHAは不変、pageerror0／POST試行0、全context／browser終了済み。各画面／状態のPNGとJSONを専用出力へ保存した。

再実行例（通常runnerとは別）：

```sh
GAME032_QA_URL=http://127.0.0.1:PORT GAME032_QA_OUT=docs/game032/revision02/QA/deadline-fixture-UNIQUE node tests/game032/revision02/deadline-fixture.mjs
```

## 通信と未確認

解析同意を拒否し、全POSTを監視・abort対象とした。最終POST試行0、pageerror0。Portalへ戻るときのAds／Analytics public GETを意図的にabortしたため、対応する`net::ERR_FAILED`が8件ある。console error0とは報告しない。本番広告配信・Analytics受信・管理集計の取得は検証していない。

実機iPhone／AndroidのFullscreenAPI制限・触感・発熱、音の聴感、人間の今回追加機能の使いやすさは未確認。スマホ相当の自動操作を実機／人間試遊へ読み替えない。5分完了は通常QAで実時間を最後まで待っていない。下の仮想時計fixtureでは、魚0匹の既存BEST完了・結果／再挑戦／タイトル遷移を技術確認した。魚を含む5分完了の通常実操作とは別である。履歴100匹・全7魚種・保存拒否／破損／複数タブ等は記録module単体検証と区別する。

## 再実行

```sh
GAME032_QA_URL=http://127.0.0.1:PORT GAME032_QA_OUT=docs/game032/revision02/QA/independent-browser-UNIQUE node tests/game032/revision02/qa.mjs
```

公開確認でもURLを置き換えて同じ通常入力方式を利用できる。既存出力へ上書き不可。本番へ架空RUNを送信しない。公開確認の成否は別の公開receiptで記録する。
