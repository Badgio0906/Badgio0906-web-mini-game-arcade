# Game007 改訂02 実装・担当QA

重量の合否だけで無限上昇する旧版から、**誰をどこへいつまでに送るか**を読む65秒・10F上昇便へ変更。乗車は0点、目的階の降車完了でだけ配達点。候補をひと組ずつ乗せる／見送る、候補を残して出発する3判断。超過乗車はボタン無効・モデルも拒否し、足し算間違いで終了しない。

現在／次階、現在荷重／空き、候補追加後重量、行先・点・期限、最短『あと』到着、乗車名簿、次2階の確定待機を画面内へ表示。同じ行先は降車停車1回。コストは乗車0.7・見送り0.2・扉0.4・1階移動1.0・降車停車0.8秒。判断中も時計は進むが、ポーズ・非表示は全体停止。

3つの手作り便を順送り。モデル即時方策の[比較](QA/POLICY_COMPARISON.json)は、greedy-fit／light-only／lookaheadがそれぞれ 1190/1180/2940、2430/1440/1880、1760/1410/3340。軽い客だけ、必ず満員、単純な先読みのいずれも万能ではない。scenario1の価値ある遠距離コピー機が逆転を作る。これは合成モデル計算で本人の記録ではない。

通常1600点以上で任意の屋上便。終了確定か、引越し320kgを抱えて次階速達に容量を残す追加便へ。特別速達は初期150kg→最終110kg。初期では引越し後にどれほど空けても速達が入らず、同階90kgを断る意味が薄かったため変更。普通便は変更しない。実native phoneは引越し＋90kg見送り＋次階110kg速達で屋上1370点（合計4310）、満員寄りの初回方策は屋上1090点（合計4030）。

タイトル・英題・内部ID・URL・7種既存WebP・エンジンを維持。新scoreはrulesVersion=2、`best:transport:v2`へ別保存。旧`best`は削除せずタイトルに旧ルールとして表示、ミュートkeyも維持。Storage拒否で本番操作可能。CREDIT／広告／Jev APIは接続しない。既存端末内最大400Telemetryへ乗車・見送り・出発空き・配達/期限切れ・選択を記録。練習は同じモデルの安全な短い便、70kg会社員を乗せて空きを残し2F速達を届ける実操作で550練習点。BEST・本番run_start/endへ混ぜない。

## 実行した検証

- `npx vitest run tests/unit/game007.test.ts`：8/8 PASS、最終[ログ](QA/unit-roof-final.log)。重量保存、到着前0点、降車除去、超過防止、期限と最短予測、同階停車、3方策、選択freeze、屋上、練習、timeout、readonly境界。
- [通常入力4画面](QA/native-isolated/report.json)：PC1440×900、phone390×844、320×568、844×390。全て実練習→通常10F→屋上14Fを完走4030、pause完全freeze、BESTv2/mute再読込、練習に本番RUN混入なし。readonly DEV診断で方策を選び、実キー/タップのみ送る。source hash固定。
- [限定4画面再検証](QA/limited-final/report.json)：かご画像の頭足を収めるCSSと相対ETAの後、headerfocus／repeat／pause／resize／全判断44px+viewport、Storage拒否PASS。
- [最終roof phone](QA/roof-final/report.json)：110kgへ調整後、容量を残す通常タップで1370追加点、mute ariaも確認。
- [最終横画面](QA/limited-landscape-final/report.json)：画像のpaddingだけ限定調整後、頭足を収め、操作/layoutとStorage拒否PASS。
- 担当が見た画像：[PC乗車](QA/limited-final/pc-aboard-head.png)、[320期限](QA/limited-final/narrow-deadline.png)、[横画面最終](QA/limited-landscape-final/landscape-aboard-head.png)、[屋上phone](QA/roof-final/phone-roof-11f.png)。独立Feel/Visualは別workerが判定する。
- 全体check初回は007型エラーを修正。中間ログは007エラー0、他担当の編集中エラーがあり全体PASSとしない。統合check/build・配信・profile/font/thumbnailはMain工程。

初回失敗とテスト側の仮定修正は[所見](QA/INITIAL_FINDINGS.md)。最終担当状態は[hash](QA/FINAL_SOURCE.json)。/tmp serverは再開前提にせず、repoから`npm run dev -- --port 5207`等で再生成する。

## 未実施／残課題

独立[Feel/Visual/QA](../independent/game007/GAME_FEEL_REVIEW.md)はseven_coffeeが通常入力4画面・3370点の10F配達を検証し、Visual81/F12/H12 PASS。独立屋上証拠は担当自身の別記録を区別引用している。統合font/build・公開はMain工程待ち。人間の面白さ、実機親指・聴取・FPSは未実施。自動完走を人間合格と呼ばない。320pxの未来票は9px文字となるので実機判読性の試遊項目へ残す。名簿は多い時その欄だけスクロール。旧共通onboardingの007は今回runtimeで呼ばず、旧資料・旧e2e期待値を今回の新操作へ流用しない。
