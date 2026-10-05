# Game016 独立QA — PASS

2026-10-05。最終ソース `6d4a80a454a809537673cd01bf71e8c28f12763b6e5259048c44a547bf9b385a` で通常入力7件、本番ビルド4件が合格。全ブラウザ・コンテキストを閉じた後、[SOURCE_AUDIT.json](SOURCE_AUDIT.json)で280ファイルのSHA256一致・変更0を確認した。ゲームの位置・問題・時計・得点を変更して到達を作っていない。

| 検証 | 実行結果・証拠 |
|---|---|
| 純モデル・データの独立確認 | 全9組合せ、公開APIで33問、30問5000点、Reflex100/400/650msの段階、ポーズ、無制限読書、enabled/off wallet接続。[INDEPENDENT_DATA_REVIEW.json](INDEPENDENT_DATA_REVIEW.json) |
| 全進行4件 | 1440×900 / 390×844 / 320×568 / 844×390で各33問を正解。全4Phase、10/20/30問の1000/2500/5000点、文章10件の重複なし、33問6200点・Reflex3。勝つ／あいこ／Timeoutの3終了を各画面で実際に発生させた。[NATIVE_PROBE.json](NATIVE_PROBE.json) |
| 入力ガード2件 | キー保持・repeat、古いタッチの問題跨ぎ、押したheaderをEscapeで別画面へ切替→解放、fresh header操作、header再開後／mute後の方向キー、focused muteのSpaceは音操作のままで回答しない。実ネイティブ入力・イベント記録。電話相当ガードはCDPタッチと実キーを組合せた検証。 |
| 保存拒否1件 | `localStorage` SecurityError、実3問練習→本番100点→自然終了→同一ページ内BEST100/Retry、再読込後の新規練習。無理に永続化できたとは扱わない。 |
| 本番ビルド4件 | rootと`/repo/`各PC・タッチ。Portal16→実3問練習→本番正解→pause→reload→直接PLAY→Portal戻る・refresh。HTTP/console/pageエラー0、診断hook0、Phaserロード0。[PRODUCTION_PROBE.json](PRODUCTION_PROBE.json) |
| 形式テスト・build | Rootによる196単体テスト／23ファイルPASS、最終check/build成功。ゲーム担当のGame016専用15件と、QA独立レビュー・通常入力の結果は区別する。 |

4進行ケースとも、実反応時間が300ms以下／300ms超500ms以下／500ms超800ms未満の3帯に入り、Reflexの加点は+200/+100/+0だった。各実測値と選択問題は[QA_REPORT.json](QA_REPORT.json)にまとめた。自動入力の速さは人間の反射難度の合格を意味しない。

タイトル・説明・練習固定3択・各Phase固定3択・pause・3終了の操作領域を確認した。固定順は左グー／中央チョキ／右パー、非重複、各44px以上。viewportだけでなくoverflow祖先による切れも検査した。実actionの文字／背景コントラスト4.5以上（結果操作の最小実測7.81）、文書サイズは4画面ともviewport内。勝ち・あいこ・時間切れの理由／相手・実回答・必要な手／Retry・タイトル・Portalを読める。

初回・再練習では誤答とあいこでも継続し、本番へ進む前にRUN時計・得点・BEST・CREDIT・RUNイベントを変更しない。完了保存は「本番へ」だけ。完了後のreloadは即PLAY、再練習も同じ3問が動く。CREDIT保存0でも3回の終了・Retryが続き、消費・広告イベント0、別タブ生成0。BEST6200とmuteはreloadで保持した。将来enabled時の開始1回だけ消費・重複開始拒否・補充後の古いid拒否は実walletを使う純モデル証拠であり、enabled本番ビルドのブラウザ検証とは表記しない。

文章Phaseは相手の画像・ひらがな手名をTVに露出せず、問題文のみ表示。読む間2250ms待っても回答時計は無制限のまま。PCのEnter/Spaceを保持しても始まらず、解放から2秒、読んだ入力による誤回答なし。明示pauseは残り期限を正確に凍結した。非表示時のpause handlerはコードで確認したが、背景タブでの実操作は今回の7件には含めない。

日本語30件を意味でも読み、直接答えを言う初期06/07を実装担当へ指摘した。最終06「紙を切れる手を出すよ。」と07「石に勝てる手だよ。」を含む全文章は一意に相手の手を導ける。meaningデータ自身の整合性だけで自然言語の妥当性を証明したとは扱わない。

## 配信の実測

4本番profileとも、Portal＋最初のGame016ロードでunique URL26件、JS **37,214 B**、画像 **244,108 B**、font **159,448 B**。JS300,000 B以下、3手の画像は実decode後に開始でき、各HTTP200、Phaserなし。画像合計にはPortalサムネイルを含む。Rootの各route first-load collectorとは集計範囲が異なる。[PRODUCTION_PROBE.json](PRODUCTION_PROBE.json)にURL・body byte数・statusを保存。

## 初回失敗と修正の区別

- 通常入力の初回は`performance.now()`の絶対値の引算が`2000.0000000000002`となり、整数との厳密一致で停止した。[初回JSON](INITIAL_NATIVE_TIMESTAMP_ARITHMETIC.json)・[log](INITIAL_NATIVE_TIMESTAMP_ARITHMETIC.log)・失敗PNG/診断を保持。比較を`1e-7ms`未満の浮動小数点誤差だけに修正し、全7件を最初から実行した。runtimeに猶予やタイミング変更は加えていない。
- 本番profile初回はHTTP200のlazy Portalサムネイルのbody読出し中に次画面へ遷移し、CDPが本文を返せず停止した。[初回JSON](INITIAL_PRODUCTION_BODY_NAVIGATION.json)・[log](INITIAL_PRODUCTION_BODY_NAVIGATION.log)・PNGを保持。遷移前に画像jobを完了し、startup集計後は本文収集を止めた。全HTTP/page/consoleエラーの監視・機能・budget assertionは残し、4件を再実行した。
- 独立Visualが見つけたメニューの白文字／クリーム背景はQA開始前にCSSで修正された。QAは最終版の実コントラストを確認した。QA自身の初回runtimeバグとは主張しない。

## 再現コマンド

```sh
node tests/game016/review.mjs
GAME016_URL=http://127.0.0.1:5181/ node tests/game016/probe.mjs
GAME016_STATIC_URLS=http://127.0.0.1:4193/,http://127.0.0.1:4194/repo/ node tests/game016/probe-production.mjs
```

[1440結果](NATIVE_PROBE-1440x900-reflex-result.png)／[390結果](NATIVE_PROBE-390x844-reflex-result.png)／[320結果](NATIVE_PROBE-320x568-reflex-result.png)／[844結果](NATIVE_PROBE-844x390-reflex-result.png)。単体テスト・モデルの長期シミュレーション、通常入力のブラウザ到達、独立Feel/Visual、人間の面白さは別の証拠。実機スマートフォン／FPS／認知的混乱の面白さ・再挑戦意欲は人間プレイテスト待ち。
