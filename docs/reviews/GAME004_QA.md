# Game004 ECHO GRID — QA

技術 QA PASS。**Unit 47 件、Game004 ブラウザ 12 ケース、静的 production 1 ケース成功**。ブラウザは全体実行 11 成功と必要な対象再実行 1 成功を合わせた結果。9 テストを 3 project に展開した 27 件のうち重複 15 件は意図して skip。TypeScript / `npm run build` 成功。技術ブロッカーなし。Game004 の人間プレイ評価と公開判断は未実施。

## モデル検証

Echo 6 件と既存 41 件が成功。最初の 2 個は約 0.6 秒ずつ点灯、初期 3 LEVEL は隣接する同一マスを避ける。WATCH の入力を無視し、正しい recall 入力だけを加算する。最初に間違えても到達 LEVEL 1 であり、未完了 LEVEL を completed として数えない。

40 LEVEL の公開モデル操作を確認。sequence は 2〜9 個、flash は 0.28 秒以上、off gap は 0.12 秒以上、同じマスは最大 2 回連続。繰り返す同じマスにも明確な消灯がある。120 秒考えても recall に隠れた期限はなく、途中入力を保持する。間違いは即時・一度だけ終了し、正解列・期待マス・入力マスを結果に残す。診断・結果のコピー、無効入力・dt、50ms フレーム制限、reset も確認。

## 実際のブラウザ

通常の native button クリック・タップ・キーでプレイし、診断は sequence を読み取る。状態書換え・強制終了は使わない。繰り返し cue の専用ケースは通常 RNG を固定する fixture を使用する。自動の正解操作は人間の記憶能力の評価ではない。

- PC / 縦 / 横で WATCH 中の早いポインタ操作を無視。native Enter / Space / tap は一度だけ正解入力し、repeat keydown を拒否。
- flash / off gap / partial recall の pause が時間・残り時間・入力位置を保存。マス位置も維持。mute の保存、blur、途中 title、quit / run_end / duration と game_id を確認。
- 実際のクリックで LEVEL 4 まで進め、同じマスの再点灯の間に暗い状態があることを確認。誤入力マス・次の正解マスを表示し、正解列を replay と static pill の両方で示す。結果カードは grid を覆わない。
- 正解列の replay 中、300ms の終了ガードを過ぎた retry で直ちに LEVEL 1 WATCH へ戻り、古い replay を消す。新 RUN に入力や正解数を持ち越さない。
- 自然な 3 ミスで CREDIT 3→2→1→0 を即時・各 1 回消費。retry、多重補充防止、Stub +3、Best・reload・ゲーム別保存、0 offer 一度、memory_level / sequence_length / run_duration を確認。
- cached pagehide の partial recall を pause → resume し、終了一度。保存済み CREDIT 0 のタイトル offer もクリックで重複しない。
- WATCH から RECALL まで押し続けたポインタ、および別の入力で LEVEL が進んだ古いポインタの release を拒否。modifier click を無視し、その後の普通のクリックは受理。
- native の同時 2 本指は副ポインタから余分な解答・誤入力を起こさない。Chromium はこの gesture で click 自体を生成しなかった。続く単独のタップは各 1 回受理し、正解 2 入力で LEVEL 2 に到達した。常に同時 2 本指の最初のタップを受理するという保証は設けない。
- 通常の入力だけで **到達 LEVEL 8 / 正解 35 / sequence 9** に進み、1 CREDIT のミスで **NEW BEST / CREDIT 0** を表示。1366×900、1280×720、1024×768、390×844、320×568、844×390、568×320 の 7 サイズすべてで grid・カード・9 個の正解 pill・Stub・ボタンが画面内。縦横のタッチ補充も成功。

`artifacts/qa-game004-nine-cues-320-568.png`、`artifacts/qa-game004-nine-cues-568-320.png`、`artifacts/qa-game004-mobile-portrait-320-paused.png` を目視確認。操作・保存・高 LEVEL ケースで console error / pageerror なし。

## 静的ビルドと軽量性

Game001〜004 の HTML を静的生成。Game004 JS 15.73 kB / gzip 5.88 kB、共通純粋サービス JS 4.14 kB / gzip 1.67 kB、CSS 20.71 kB / gzip 4.50 kB。Phaser を使う既存ゲーム向けの約 1,208 kB chunk の注意表示は残る。

source import graph は EchoRun / EchoBoard / contracts / main と core 5 サービスだけで、外部 import なし。production Chromium で実際の script 応答を検査し、**19,866 bytes**（RewardService 4,135 + Game004 15,731）だけを取得、engine signature なし、Phaser chunk は要求しなかった。ファイル名だけで判断していない。reload の HTTP 304 は先の 200 応答で検査済みの同じ URL と照合。証拠は `artifacts/qa-game004-production-network.json`。

production では開発診断 hook と Canvas が存在しない。実際の点灯を観察して通常マスを押し、誤入力 → CREDIT 2 / Best 1、retry、pause / resume、title、mute / Best / CREDIT の reload 保存も確認。

## 指摘と修正確認

実際の Chromium は primary mouse pointerdown で `isPrimary:true`、同じ pointerId の click で `isPrimary:false` を報告した。最初の click.isPrimary 判定は普通の正解クリックを拒否した。pointerdown の primary / cell / LEVEL 承認を click で消費し、keyboard の native click は別に受理する修正を回帰テストで確認。WATCH・pause・別 LEVEL に承認を持ち越さず、副ポインタ・modifier・repeat も拒否する。

partial recall を pause して 320×568 にすると TITLE の下端が 613.94 px に達し、約 46 px 切れた。pause の RESUME / TITLE を 44px の横並びにしてカードを短くする修正を確認。grid の位置・サイズを維持して両操作が画面内に収まる。

自動テスト側では、native 同時 2 本指が必ず click を作るという期待を修正した。実イベントでは primary / secondary の pointerdown だけが発生し、click は 0。余分な解答・ミスなしと単独タップの一度受理を検証する。production の初回ネットワーク収集は HTTP 304 に body を要求して失敗し、検査済み 200 と照合する収集へ修正後に成功。

## 人間に残す確認

記憶ゲームの楽しさ、初見の分かりやすさ、音、実機の操作感、想定プレイ時間、再挑戦意欲は人間 A〜J の確認が必要。サーバー・本番広告・全 OS / browser のキャッシュ実動作・実機 FPS は未検証。
