# Game010 改訂02 — 議事録サバイバル

内職トグル／監視ゲージ／内職時間加点を取り除き、会話を読んで担当・作業・期限を記録するゲームへ変更した。発言カードを記録すると対応欄を更新し、訂正前の記録を置き換える。3議題の後に退室して記録確定か、より複合的な追加議題を選ぶ。旧bestは旧ルールとして保持し、新bestRules2を保存。ID／URL／邦題／英題、音声設定とlocal400件の境界を維持。

## 問題と採点

手作り12構造（9通常、3追加）＋独立練習。発言はspeaker／text／role／patch／stateChange／readSeconds、問題はexpected／difficulty／structure／合計readSecondsを持つ。最終正解はdecision/correctionのstateChangeのみからreduceする。全12の静的expectedと一致を単体で確認。提案・雑談もプレイヤーが誤って記録できるが、canonical decisionは変えない。UIへroleの正誤色は出さず、両話者が決定・訂正・雑談を話す。

正答欄100、3欄完成100、正しい訂正対応30、連続完成20×連続数、未採用案／雑談の記録はunique発言ごと25減。聞き返しは各議題2回、採点上の罰なし。読んでいる間は進行停止、再開後は同じ発言の読解時間を確保。本文表示3.8–7秒は設計仮説、実人間の読解時間は未測定。2欄以上の誤記を大きな失敗とし、2回で終了。1欄誤記では続行。

## 実行した検証

- [最終unit](QA/unit-final.log) 009+010合わせ16/16、0108/8 PASS。12構造の一意expected、stateChange/提案の分離、30seedの意味方策対全押し／最後だけ／無操作／部長だけ、聞き返し停止と2回制限、重複提出、軽い誤記と2大失敗、3議題＋追加、実練習条件、コピーと履歴範囲。
- [型チェック](QA/typecheck-second.log) 全体PASS。最初の未使用type importエラーは[原本](QA/typecheck-first.log)保持後、該当importのみ除去。
- 固定/tmp source snapshot、独立cacheDirとport5250で[通常入力](QA/native-viewport-retest/report.json)。各画面で実練習（決定／訂正／聞き返し）→3議題全3欄正答→記録確定、desktopと横画面では追加訂正議題も実操作。各発言で話者／3欄／提出が同時viewport内にあるassert、pause全停止、resize状態保持、重複submitの抑制、新BESTと旧888fixtureの分離、mute再読込、HTTPとconsoleを確認。最終4画面の判定はreportのresultsを正本とする。

各カードのroleをreadonly DEV診断から読み、普通のキー／クリック／touchscreenで選択する技術テスト。人間の文章理解や楽しさを測ったものではない。実本番のモデルをstepで進めるdebug操作は使っていない。

## 発見と原本

初期データは部長が全て決定、同僚が全て雑談という相関を持っていた。これでは話者だけで解けるため、発言本文の意味を保って両者に決定／訂正／雑談を割り当て、部長だけ方策も30seedで不利と確認。[修正前source](QA/SCENARIO_BEFORE_SPEAKER_DECOUPLING.txt) はSHA c653637426e9e75fd8a4d8dd4248c3f81b1d162ab5c2ecf44c88287691930f2aで再構成一致。現行問題の独立意味レビューは別工程。

最初のnative collectorはNode内でbrowser innerHeightを参照してReferenceErrorになった。製品sourceを変更せずcollectorのviewport変数を直した。[原本](QA/native-first/INTERRUPTED.md)。最初の320画面を実view後、狭い幅だけ議事録を3列にし装飾portraitを省き、聞き返し続行ボタンは同じcontrols位置へ移した。これは情報のviewport確保で、ルールや正解を変更していない。

[Visual Brief](VISUAL_BRIEF.md)、[12構造](SCENARIO_STRUCTURE.md)、[人間試遊未実施](HUMAN_PLAYTEST.md)。build／独立Feel・Visual／Jev／配信統合と公開の最終結果はMain報告に記録する。AI自動入力を人間合格へ読み替えていない。

## 最後の入力・終了・保存境界

[追加native3](QA/boundaries-final/report.json) PASS。PC Enterをrepeatしても記録1回、Spaceを押したまま発言が変わった後に離しても新発言へ記録を持ち越さない。pause全停止からタイトル→実portal19cardへ戻った。320pxで2議題の発言を本当に読み終えるまで待ち、未記入提出で2回の大失敗→終了を確認。2回目の次ボタンは「記録を確認する」と実際の終了に合う文言へ改善（Model不変）。保存拒否getterのfixtureでは本番の実カード記録とmuteが例外なしに動作した。実利用者のstorage障害の観測とは区別する。

[最終check](QA/typecheck-final.log) PASS。全ブラウザを閉鎖し、FINAL_SOURCE_HASHESへ現在のファイルを記録。問題データは28fc7b0a65f197b642b820e6ac96f461f29f023b700beea131c1cb7ea1dcfb48から変えていない。WORK_LOGは直接instrumentしたboundary collectorの実時刻だけを記録。読み時間の納得感、楽しいという判定、実機音・FPS・thumb操作は人間未実施。
