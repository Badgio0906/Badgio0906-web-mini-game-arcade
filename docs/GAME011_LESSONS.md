# Game011 開発メモ — ウンコかウコンかゲーム ～UNKO or UKON～

2026-10-04。実装・独立QA記録。Game011の純粋モデル9/9成功（初回テスト1.310秒/runner1.62秒）、統合153 unitと全体build成功。今回の11ゲーム向け開発ブラウザQAは重複を除く51実行が成功し、Game011の本番各段階・入力・結果も確認済み。ローカルproductionのroot/subpath再検証24件は成功。独立Feel/Visualは最終合格。リモートGitHub Pagesの公開と12ページ実確認も成功。人間プレイテストは未実施。今回の試作版は無制限、広告なし。

## 三段階を明確に分ける

画像を見てウンコ/ウコンを答える10問、文章を読んで答える10問、最後に選んだ言葉を押し続ける0.5秒の連続挑戦。一つの画像や色の曖昧さで難しくせず、読む・認識する・反応する時間の変化が中心。画像正解は100点、文章150点、最後250点。反応速度の隠れた追加点は作らない。

画像1問目は5秒。正解後は明示的に「正解です。ここから先は1秒です。考えている暇はありません。」を表示し、続ける入力を離すまで次の1秒を始めない。2〜10問目は各1秒。画像20枚をshuffleして10枚だけ使い、一つのRUN内で同じIDを再使用しない。プールはウンコ10/ウコン10だが、抽出した10問へカテゴリ比率を強制しない。

10画像正解後に「画像では余裕でしたね。では、文章でいきます。」。仕様のQ01〜Q20を文言・正解の対応ごと保持し、shuffleした重複なしの10問を使用する。文章はまず読むだけ、選択肢も回答時計も出さない。「準備OK」の操作を離した瞬間に選択肢と0.8秒を一緒に開始する。読む時間や切替メッセージ、最後のモード選択は無制限。

20問正解で「もうウンコとウコンを見間違えることはないでしょう。たぶん。」。ウンコMODE/ウコンMODEを無制限で選び、操作を離してから0.5秒の回答を開始する。選んだカテゴリが常に正解、左右だけは毎問独立random。正解後は遅延や追加猶予なしで直ちに次の問題。1ミス・期限到達で一度だけ終了する。

主BESTは得点、BEST FINAL STREAKは独立した保存キー。画像/文章の正解数、選んだFINAL MODE、連続数を結果に残す。将来ランキングはFINAL STREAKを重視するmetadataを持つが、現在サーバーや架空順位はない。初心者25秒/経験者80秒は設計仮説で、人間の自然失敗時間ではない。

## ランダムと時計

画像/文章の抽出はFisher–Yates。左のラベルは毎問新しいRNG値だけで50:50に決め、右は反対のラベル。直前の側やカテゴリと照合して交互にしたり、同じ側の連続を禁止しない。モデルはemit/RNGを注入できるが、製品のwindowには書込みや進行を強制する機能を出さない。DEV診断はsnapshot/inspection/state/telemetryのコピーだけ。

このゲームは物理積分ではないため、stepは有限正の経過秒をすべて消費する。50msの上限で0.5秒の期限を伸ばさない。読む/選ぶ状態では回答期限だけを止め、timeは実際の非ポーズ経過時間として増える。ポーズはstepそのものを止める。従ってrun_durationは読む時間も含み、練習やポーズ時間を含まない。

BoardはRAFだけでなく、すべての回答/準備/次へ/モード選択/ポーズの直前にperformance.nowの差分をモデルへ同期する。RAF間に来た遅い答えを、まだ古いモデル時刻だから受け付けるという抜け道を作らない。時間切れは実際の残り期限まで進めて結果を確定し、終了後の追加経過や入力で書き換えない。

## 入力のrelease境界

回答はprimary pointerdown、←→/A Dのkeydown、選択ボタンのEnter/Space keydownで即座に受ける。pointer後のclickやネイティブkeyの既定clickは二重に受けない。補助技術のdetail0 clickは専用経路を持つ。key repeat/物理キー保持は一回だけ。回答ボタンをクリックした後にそこへフォーカスが残っても、←→/A Dを使える。ヘッダー・メニュー・フォーム上のキーをゲーム回答へ流用しない。

準備/続ける/最後のモード選択は別のrelease-latched経路。pointerdownでprimary ID・その時のphase/roundIdを記録し、clickのreleaseで一致を確かめる。Chromiumのclick.isPrimaryは信用せず、pointerdownの承認を使う。キーはkeydownで承認だけを記録し、keyupで期限を開始する。長押し中は文章を読む状態のまま。期限開始後に長い入力禁止期間を足して0.8秒を奪わない。同じreleaseイベントが回答へ流れないDOM経路を使う。

ラウンドには一意なIDがあり、古い承認・古いIDは無効。ポーズ、blur、visibility、タイトル、再開始で承認/保持を破棄する。期限直後のポーズ/タイトルも先に時計を同期するので、起きた終了をquitへ変更しない。省略しがちなこの境界と、ネイティブ回答へ残ったフォーカスが今回の難所だった。

## 素材・UI・Onboarding

Native DOMでPhaser依存を追加しない。Gameplay EngineerがGame011の全固有ソース/main/style/HTML/metadataを担当し、Mainが統合Portal/共通Onboarding/機能フラグ、Asset Producerが素材、Art Directorが素材方向/採用、QA/Feel/Visualが独立確認を担当した。

実image_genで作りArt Directorが原本全20体と最適化sampleを実見して採用した、20枚256×256 RGBA、中心128/最大208pxのcontent、総224,332bytes。清潔な茶色の巻きと、植物として明確な黄色/橙の節付き根茎。実contact sheetも実装担当が確認した。画像の印象をボタン色へ対応させず、ウンコ/ウコンの回答は同じ色・形・寸法・font・focus/press仕様。コードの静かなクリーム舞台、台詞・時計・段階・進行・結果と統合する。

20画像を初期に読み込みdecodeし、cold-startでは画像準備表示の間、モデル時計と入力を止める。読み込み後に完全な5秒を開始する。遅い完了がタイトル/破棄後に本番を起動しないようepochを確認する。画像エラー時はその問題だけカテゴリ文字による代替を表示し、見えない対象でタイムアウトさせない。実ブラウザで生成アイコンを使って画像10問からFINALまで進めた。ローカルproductionのroot/subpath配信は最終24件の再検証で成功した。実際のcold-startで利用できる回答時間と認識品質は独立レビューの観察と区別する。

本番開始前にMain所有のcreateOnboarding.interceptを呼ぶ。初回は共通説明→実生成アイコンの時間制限なし二択→成功→本番。練習中は本番モデル、得点/BEST、本番run_startに触れない。tutorialCompletedはGame011のStorage名前空間。2回目は直行でき、共通の再練習ボタンも使える。練習では後半の文章/FINALの秘密を先に説明しない。

画像・font・PortalリンクはVite BASE_URLに従う。CSSの短横画面は対象左/回答右、縦画面は対象/文章の下に左右回答。画像は切り取らず、回答領域は44px以上。状態ごとの主画面幅と結果cardを調整し、独立QAが実際の結果を8サイズで確認した。キーとprimaryタッチの準備releaseも実ブラウザで検証済み。素材採用や技術的なgeometry成功を完成Visual Gateとは扱わない。

## 検証と次の工程

独立QA9件は、5/1/0.8/0.5秒の期限、全経過を消費する時計、正確な画像/文章プールと重複なし抽出、無制限状態の問題/得点/位置保持、各100/150/250点、両FINAL MODEの120連続、古いroundId拒否、deep copy/reset、1ミス/期限の一回性を確認した。各段階5100配置の左率は47〜53%内、LLLL/RRRRも存在し、固定交互パターンではない。

実装担当の別の公開操作seed77チェックでは、画像10/文章10/FINAL5000正解、得点1,252,500、ウンコ左2430/右2570（48.6/51.4%）、同じ側の最長連続12。その後0.5秒のtimeoutを確認した。正解を診断から読む自動オラクルなので、人間が5000連続できる・楽しめるという証拠ではない。

独立QAの実ブラウザ記録では、ウンコ/ウコン両FINAL MODEへ通常入力で到達し、それぞれ得点5500・FINAL STREAK 12を確認した。これは読み取り専用診断で正解を選ぶ到達性の検証で、人間の認識速度や楽しさの証明ではない。実際の結果表示をデスクトップChromiumのresizeで8サイズ確認し、Space保持とnative primaryタッチによるREADYはreleaseまで文章を読む状態を保ち、同じ操作が回答へ流れないことを確認した。1秒の期限は壁時計でも検証され、遅い回答は拒否、得点100を維持したままtimeoutが確定し、run_endは一度だけだった。

遅い回答のテストでは、終了後のsnapshot.remainingを数値として扱うハーネスの仮定を修正した。モデル契約は終了時remaining:nullであり、実装や期限を変更して期待に合わせていない。以前保存したCREDIT 0からも本番・再挑戦を妨げる制限や広告ゲートがないことを、試作版のQAで確認した。

統合153 unit・全体buildは成功し、既存の19保護対象ファイル（10 Runモデルと9得点・結果・翻訳helper）のbytesは変更前と同一。開発ブラウザQAは初回47 distinct、overlayフォーカス修正後49 distinct、FINAL MODE修正後の最終51 distinctへ更新された。11ゲーム向け統合確認全体の実行数で、Game011だけの件数ではない。凍結候補の複数sliceと影響ケースの再検証を、ソースの差分証拠でつないだ集計であり、一回の連続実行とは表現しない。production初回ではネットワーク収集器を閉じる順序のraceを保存し、修正したハーネスで再収集した。最終ローカルroot/subpath24件は2026-10-04 12:39:57 UTCまでに全contextを閉じて成功し、[最終production監査](eleven-game/QA/PRODUCTION_ROOT_SUBPATH_AUDIT.json)の24記録すべてでerrors 0・開発hooks 0、native script 300KB/Phaser 2MBのresource上限も成功した。独立Feel/Visualは後述の最終修正を含め合格した。リモート公開先は確認済み。物理端末のFPS、人間による認識・操作の楽しさは未評価で、人間A〜Nもすべて未実施。

独立実画面レビューで、RESUMEを押した直後も非表示のresume-buttonにフォーカスが残り、最初のArrowがゲーム側の「メニュー操作を回答に使わない」判定に入って無視される不具合が見つかった。初回記録は得点3500・FINAL 4で保存した。修正はmain.tsのscreen(next)でoverlay.hiddenを設定した直後、非表示overlay内にactiveElementがある場合だけ同期blurする1行。回答期限・得点・モデル・入力release判定や、見えているヘッダー操作を除外する規則は変更しない。

修正後の独立QAは影響ケースと新しいnativeケース6件が44.7秒で成功。PCの最初のArrowは8.6ms、phoneは3.1msで対象BODYとなり、100点を一度だけ加算した。集計49 distinctへ更新し、productionは影響4件を再実行して成功、保持した20件と合わせて24 distinctを維持した。errors/hooksは0。[フォーカス修正のソース接続記録](eleven-game/QA/FOCUS_REPAIR_SOURCE_BRIDGE.json)と[production再確認](eleven-game/QA/PRODUCTION_FOCUS_RETARGET_AUDIT.json)に出典を残す。

独立レビュー担当の修正後PC再プレイは得点3750・FINAL 5、RESUME後7.4msの最初のArrowがBODYを対象にround34→35へ進み、errors 0だった。[初回失敗の記録](eleven-game/screenshots/game011/independent-desktop-TIMING_RECORD-initial-hidden-resume-focus.json)と[修正後の記録](eleven-game/screenshots/game011/independent-desktop-TIMING_RECORD.json)を分けて保存した。これは以前のQA両MODE5500・streak12とは別の実行証拠であり、混ぜて連続数を主張しない。この時点ではFINAL MODE直後の未ポーズ入力をまだ確認しておらず、次の追試で別のフォーカス不具合を検出した。

overlay修正時の[凍結記録](eleven-game/QA/FINAL_FOCUS_RUNTIME_SOURCE_FREEZE.json)は197ファイル、SHA-256 `d227b99da2a06e06baf5c3e2ec199f0bf6298cc7f57e25ceda325edd5dc57d40`。これは次のFINAL MODE修正前の歴史的候補として保持する。

続く独立の未ポーズ追試では、MODEクリック6919.1ms→最初のArrow +9.2msが非表示unko-mode-buttonを対象にして無視され、2500点のままだった。[初回MODE失敗記録](eleven-game/screenshots/game011/independent-desktop-MODE_RELEASE-TIMING_RECORD-initial-hidden-final-choice-focus.json)を保存した。修正はUnkoBoard.draw()のfinalChoices.hidden設定直後、その非表示欄に含まれるactiveElementだけをblurする1行。READYのrelease、0.5秒期限、ラウンドepochやヘッダーの入力除外を緩めていない。

[独立の修正後MODE記録](eleven-game/screenshots/game011/independent-desktop-MODE_RELEASE-TIMING_RECORD.json)では、ポーズを挟まずMODEクリック→最初のArrow +9.4msがBODYを対象にround34→35・+250、5回答後3750点・FINAL 5、自然timeout、errors 0を確認した。QAは新規/影響9ケースを約2分で成功させ、両MODEの最初の回答はPC +12.3/+6.2ms、phone +9.2/+7.0msで各+250を一度だけ加算した。[PC実入力](eleven-game/QA/ACTUAL_QUIZ_MODE_DESKTOP.json)・[phone実入力](eleven-game/QA/ACTUAL_QUIZ_MODE_PHONE.json)・[MODE修正のソース接続](eleven-game/QA/MODE_REPAIR_SOURCE_BRIDGE.json)を残す。最終QA集計は51 distinct。productionは最新影響6件と保持した18件で24 distinct成功し、[最終再確認](eleven-game/QA/PRODUCTION_MODE_RETARGET_AUDIT.json)へ記録した。

同じ最終候補でGame008の広告なし試作結果をTIME表記だけに整理し、自然失敗3回のreceiptで確認した。これは結果コピーの変更で、CoffeeRunや残量・得点・期限を変更していない。[最終197ファイル凍結記録](eleven-game/QA/FINAL_MODE_RUNTIME_SOURCE_FREEZE.json)のSHA-256は `ca8c62219c2840d1b87c99f8f001bebb83ef229f3b6e7a1fc2ec6d7c9d143683`。TypeScript check 1.89秒・build 5.35秒成功、既存19保護ファイルのbytes一致、既存contracts変更0、89配信素材のart監査成功。

最終の[Game011 Feel](eleven-game/reviews/GAME011_FEEL.md)はPASS、[Game011 Visual](eleven-game/reviews/GAME011_VISUAL.md)は86/100、可読性F14/15・production H14/15。全11ゲームの独立FeelもPASS、[全体Visual scorecard](eleven-game/reviews/FINAL_VISUAL_SCORECARD.md)は各ゲーム82〜89点・Portal88点、全F/Hが12/15以上。実画像とnative操作による評価であり、生成素材の原本採用やソース確認だけで合格していない。すべてのレビューcontextを閉じた。[リモートGitHub Pages](eleven-game/QA/GITHUB_PUBLICATION_AUDIT.json)は公開・12ページ実確認が完了。CI153unit/build/deployも成功した。人間A〜N・実機FPS・人間の認識や楽しさは引き続き未実施。

出典は独立QAの[統合実行記録](eleven-game/QA/README.md)・[実行台帳](eleven-game/QA/EXECUTION_LEDGER.json)、[実際の期限と終了イベント](eleven-game/QA/ACTUAL_QUIZ_DEADLINE_AUDIT.json)、[8サイズのPAUSE/結果監査](eleven-game/QA/ACTUAL_PAUSE_RESULT_LAYOUT_AUDIT.json)。production収集の初回raceは[保存した監査](eleven-game/QA/INITIAL_PRODUCTION_COLLECTOR_SHUTDOWN_AUDIT.json)へ分けて残す。

再利用はStorage/Audio/Telemetryと新しい共通Onboarding境界。画像/文章のプール、短い回答時計、release-latched準備、FINALループはゲーム固有。大量共通化を理由にゲーム内容や時計を抽象化しすぎない。

## 人間プレイテスト（すべて未実施）

A 5〜10秒で目的と左右操作を説明できるか。B 最初の自然失敗の段階/時間/原因。C 正しい言葉と失敗理由を説明できるか。D クリック/タッチ/キー・次の問題・音のテンポ。E 1秒/0.8秒/0.5秒の読みやすさと反応機会。F BEST SCORE/FINAL STREAKを改善したいか。G 回数制限なしの試作でも、何度か失敗後にもう一度遊びたいか。H 広告なしの試作として再プレイの理由を聞く（実広告への意向を捏造しない）。I 実PCのフォーカス/キー保持/準備release/ポーズ。J 実スマートフォンの縦横・左右ラベル・実タッチ・scroll・音・滑らかさ。

今回追加のOnboarding K〜N：K 説明で基本ルールを理解できたか。L 実練習で操作を理解できたか。M 練習が長すぎなかったか。N 本番開始時に何をすればよいか分かったか。特殊展開の発見・モード選択の楽しさ・ネタの受け止め方は、これらと混同せず別に質問する。
