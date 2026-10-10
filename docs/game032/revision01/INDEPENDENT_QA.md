# Game032 revision01 — 独立技術QA

対象base：`e3d7338c8fa0f073e0e3ad7ba419375eed3ad0cd`。実装担当とは別のQA担当が、AGENTS／PROJECT_CONTEXT／CURRENT_STATUS／GAME_DEVELOPMENT_RULES／今回の仕様・HTML・モデル・投影・水槽・入力を参照した。Jev回答は参照していない。

## 固定candidate01・通常操作

固定production-reference preview `http://127.0.0.1:4433`。再実行はビルドと固定previewを準備してから、次のコマンドを使う（既存出力先へ上書き不可）。

```sh
GAME032_QA_URL=http://127.0.0.1:4433 GAME032_QA_OUT=docs/game032/revision01/QA/independent-browser-NEW node tests/game032/revision01/independent-browser.mjs
```

2026-10-10 17:30:29〜17:32:45 JST、1280×900／390×844／320×740／844×390の4画面で、時計・乱数・モデル・API回答を注入しない通常操作を実施。PCはマウス・Space・矢印、スマホ相当はCDPタッチ。各画面で餌＋浮きとルアーを実際に投げ、前アタリを待ち、本アタリで合わせ、強い引きで離し、穏やかな引きで巻いて取り込んだ。4画面合計8匹の通常練習釣果、別PC本番で1匹の通常釣果を確認した。

- 左右×近遠4点を選択でき、少年の固定位置と背景cropが維持される。岸の無効クリックは投げ先を変えない。選択点のマーカー画素と、同じ投げ先へ着水した浮きの画素を比較。PC矢印も照準だけを変更。
- 手法ボタンは投げた後ロック。ルアーは無操作2.1秒では待機・進捗0を維持し、0.31秒間隔の新しい入力で誘引、その後取り込みできる。
- 実際の取り込みに限り水槽総数1→2。通常時間で魚画素が動き、Pause中の水槽画素・時計は不変。再開、縦横リサイズで魚2匹を維持。
- 44CSSpx以上の手法・主操作、横overflowなし、水槽右側表示、説明内末尾Portalの実hit／実帰還を4画面で確認。
- CDP touchCancelでスマホの溜め操作が投げずに解除。PCのpointercancelは明示的なDOM合成fixture。メニュー再開入力がキャストへ持ち越されない。
- 練習BEST未保存、次の本番の得点・水槽リセット、途中終了BEST未保存、通常共通Portal帰還を確認。
- runtime＋HTMLの実行前後hash一致。美術hashは通常RUN途中に取得して実行後比較した23ファイルが一致し、「実行開始前取得」とは称していない。

原本：[REPORT](QA/independent-browser-01/REPORT.json)。画像は同じディレクトリの`pc/phone/small/landscape-aim-*`、`*-bait-waiting/bite/land.png`、`*-lure-bite/land.png`、`*-pause.png`。212チェック中211成功、最後の時間短縮fixture1件失敗のためRUN全体はPASSとしない。JavaScript pageerrorなし、外部POSTなし。ブラウザとcontextは終了済み。

## 時間短縮fixtureの失敗・保全

上記4画面成功後、PCで通常の本番釣果1匹を得てから`page.clock.install()`し`runFor(300000)`した。しかし`playing/landed/4:49/1匹`のままだった。失敗時画面と状態を直ちに`deadline-fixture-failure.png/json`へ保存。観測は「virtual clockをRUN途中で入れた後、既存requestAnimationFrameが300秒進行しない」であり、通常時計が止まったという証拠ではない。

担当独立判断：既存RAFの登録後に偽時計を導入したテスト基盤の疑い。親へ観測を送付しShadow Reviewを依頼。製品変更なしで、ページ登録前に仮想時計を入れる別の明示的deadline fixtureを提案。未確認の完了BEST／result／retryを成功扱いしない。

## コード観察と未確認

コードでは少年`playerX`は固定readonlyで、川面targetと独立。浮きは不当たり時に引き上げず再抽選し、12active秒を上限に前アタリへ進む。ルアーは待つだけでは誘引せず、新しい引き入力とcooldown、最大10回の引きで前アタリ機会へ進む。これはコード観察であり、全乱数状態を通常実プレイで観測したという意味ではない。最大12匹の表示・全釣果保持、保存互換・不当たりの決定的fixtureはroot担当の別単体試験と区別する。

実機iPhone／Android、人体・美術のVisual判定、人間の面白さ、音の聴感、発熱、長時間負荷、本番Analytics受信は未確認。写真調水槽はImageGen生成であり実写撮影済みの証拠ではない。広告・Analyticsの許可先外通信はabortし、偽の正常応答を返していない。

## candidate02 — 影響範囲の再確認とdeadline確認

親が別の観測に基づき、横画面の川面を覆う地点ラベル、ルアー固有の前アタリ／本アタリ文言、スマホ水槽内の魚の最小描画幅を修正した後、再び固定buildを独立検証。`CANDIDATE02.json`と、このRUNのruntime／HTML／manifest／WebP全23枚／font／runner hashを保全した。

```sh
GAME032_QA_URL=http://127.0.0.1:4433 GAME032_QA_OUT=docs/game032/revision01/QA/independent-browser-NEW node tests/game032/revision01/candidate02-browser.mjs
```

**158/158成功**：[candidate02原本](QA/independent-browser-02/REPORT.json)。4画面で各2方式の通常キャスト・合わせ・取り込みを再実施し、8匹の本物のモデル釣果を確認した。乱数／時計／モデルを注入しない通常部分と、後続の仮想時計fixtureを分けている。44px操作・viewport内・実中心hit・overflow祖先内を測定。左右×近遠の実選択、全照準で背景crop不変、固定少年、選択地点への浮きの着水、水槽2匹、実時間の魚画素変化、Pause停止・再開、練習BEST除外、通常Portal帰還も再確認。

時計を`page.goto`より前に導入した別PC技術fixtureでは、普通のSpace入力によるキャスト／合わせ／巻く・緩めるを仮想時間で実行し、300active秒のresult、旧schemaでのBEST保存、4画面result下部Portalのhitと可視、再挑戦、再読込でのBEST、説明末尾Portalの実帰還を確認した。これは「人間が実時間5分プレイした」証拠ではない。仮想300秒は全RAFを実行するため壁時計上も時間を要した。元のmid-session時計導入失敗は原本のまま保持し、再試験結果で上書きしていない。

実行前後の対象source・美術・font hash一致、runner hash一致、JavaScript pageerror0、外部POST0。全context／browser終了。旧candidate01で確認した取消／途中終了／resize等と、改修後に再確認した範囲を混同しない。Visual・ゲームの面白さ・実機の合否はこの数値結果から付けていない。

サムネイル用の実画面は [pc-game-layout-two-fish.png](QA/independent-browser-02/pc-game-layout-two-fish.png)。`.game-layout`の実elementスクリーンショットで、練習の通常釣果2匹。crop rect・原PNG SHA・対象source hash・取得方法は隣の [metadata](QA/independent-browser-02/pc-game-layout-two-fish.json)。背景と水槽を後から合成した画像ではない。各画面の`*-tank-two.png`は同じ通常釣果の水槽element実画像。動画は今回追加していない。

時計fixtureの独立判断と再確認は [JUDGMENT](QA/independent-clock-judgment/JUDGMENT.json)。Jev回答は読んでいない。認証／本番データ／広告配信の動作確認は対象外で、ユーザーの主観試遊・物理端末・音の聴感も未実施のまま。

## candidate03／04 — 水面範囲・端点の追加確認

独立Visual観測後、親は投げ先の岸近くの上限を原画像Y=.58に狭め、低い横画面でも遠近の確認済み水面が見えるcropに変更した。モデル・保存・得点・deadlineはこの変更で変わらず、300秒fixtureは繰り返していない。

純粋な投影テストでpower1の計算結果がfar境界より僅かに小さく、逆写像が自分の端点を拒否する観測があった。独立判断は [endpoint judgment](QA/independent-endpoint-judgment/JUDGMENT.json)。親は端点が一致する補間へ修正し、厳密な端点assertを維持した。

続くcandidate03の通常ブラウザでは、左近端点の実入力がpower`1.80577e-7`となり、次の右遠端点が未選択だった。6チェック時点で停止し [失敗原本](QA/independent-browser-03/REPORT.json)・`pc-failure.png/json`を保存、無記録の再試行なし。純粋な補間修正と別に、実pointerの有限精度／画面座標からCanvas座標への変換を扱う必要があると独立判断した。生pointer値を採取していないため、Float32が実原因と断定していない。[coordinate judgment](QA/independent-browser-coordinate-judgment/JUDGMENT.json)。

親がhit-test境界に0.001CSSpxのみの許容と正規化後clampを導入し、単体では微小な端点差を受け付ける一方、1px岸側の入力を拒否する確認を追加した後、固定candidate04を検証した。runnerで端点を内側に動かしたり、assertを緩めたりしていない。

```sh
GAME032_QA_URL=http://127.0.0.1:4433 GAME032_QA_OUT=docs/game032/revision01/QA/independent-browser-NEW node tests/game032/revision01/candidate03-browser.mjs
```

**candidate04：154/154成功**：[最終原本](QA/independent-browser-04/REPORT.json)。4画面で正規化X=.06/.94、power0/1の4端点と中央を実マウス／タッチ選択し、固定少年・背景crop・着水座標を確認。両釣り方を通常時間で各1匹ずつ、計8匹取り込み、水槽2匹と魚の実時間画素変化、Pause停止／再開、練習BEST除外、44px操作中心hit／viewport／clip祖先内、Portal帰還を再確認した。今回RUNに仮想時計・RNG・モデル注入はない。ソース・HTML・manifest・WebP23枚・font・runnerの実行前後hash不変、pageerror0、外部POST0、browser終了済み。

PC／320pxを含む全画面の`*-charging-bait/lure.png`は押下中、`*-casting-transient-bait/lure.png`は離した直後の実キャスト中に撮影した。単に着水後の画像をキャストと称していない。4端点・中央は`*-aim-*-corner.png`／`*-aim-middle.png`。

最新サムネイル原本は [candidate04実2匹画面](QA/independent-browser-04/pc-game-layout-two-fish.png)、rect・SHA・source・取得方法は [metadata](QA/independent-browser-04/pc-game-layout-two-fish.json)。前candidate02由来の画像と区別する。独立技術QAは最新candidate04、deadline／BESTの技術確認は同一モデル・保存のcandidate02が証拠。本人の面白さ、実機、音の聴感、公開配信の実確認はこのローカルQAの合格へ読み替えない。
