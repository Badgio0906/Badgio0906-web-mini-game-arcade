> 履歴資料：2026-10-04の10本時点のDRAFTを保持。現在の指示ではない。現行契約は[GAME_COMMON_SPEC](../../GAME_COMMON_SPEC.md)、現状は[CURRENT_STATUS](../CURRENT_STATUS.md)。出典は整理前コミットc793e35。移動に伴いMarkdownの相対リンクだけを調整した。

# GAME_COMMON_SPEC — DRAFT v0.1 ＋ v0.2 候補

更新：2026-10-04。Game001〜010の実装と独立レビューから抽出した **DRAFT**。v0.1の5本で得た基準を保ち、§11に今回の10本から得たv0.2候補を追加した。Game001の過去の人間A〜Jは合格、今回の人間A〜Nは未実施。人間の結果を受けて改訂する。完成済みの 100 ゲーム用 SDK や全ジャンルへの固定契約ではない。

根拠：[最新10ゲーム比較](../../docs/TEN_GAME_REVIEW.md)、[歴史的5ゲーム比較](../../docs/FIVE_GAME_REVIEW.md)、[設計データ](../../docs/GAME_DESIGN_DATASET.md)、各 `docs/GAME00N_LESSONS.md` と独立 QA / Feel 報告。

## 1. モデルと外部境界

ゲーム固有モデルを描画から分離し、通常入力と時間更新で検証できるようにする。保存・CREDIT・音・Telemetry・広告結果だけを小さな境界へ集める。広告 SDK、ランキング API、特定サーバーをモデルに持ち込まない。

現行 `src/core/` の StorageService / CreditService / RewardAdapter / AudioService / TelemetryService は全10本で使用し、CREDIT/保存/補充と一回性を個別に確認した。Phaser Scene、DOM Board、入力の採否、難度、得点、結果配置はゲーム固有に残す。共通 UI の抽出には「4 ゲーム以上で完全に同じ」という実績が必要。今回その抽出は行わない。

## 2. 開始・終了・再開

基本は TITLE → RUN → RESULT → RETRY。PAUSED と REWARD_PENDING を持ち、START は残 CREDIT がある場合だけ。失敗や CLEAR が確定した時点で RUN を一度だけ終了させ、演出はその後でもよい。通常の retry でページを再読込みしない。

途中 title / terminal pagehide は quit として終了一度。Best と CREDIT を更新する失敗・CLEAR と区別する。visibility hidden / blur / cached pagehide は pause し、quit や消費にしない。復帰は明示操作。ポーズはモデルの時計・点灯・落下・締切を保持する。

結果の主要情報は、そのゲームの主スコア・単位、Best、CREDIT、失敗理由、retry / 補充。演出のために長く待たせない。現行新作の操作保護は 300ms、001 は約 420ms の死亡演出後。004 の正解 replay を強制的に待たずに retry できることは固有仕様。

## 3. CREDIT

- 初期 **3 CREDIT**、現行はゲーム別の財布。0 では開始できない。
- **Game Over の確定時に −1**。同じ runId の重複消費を拒否。CREDIT 0 到達も一度だけ計測。
- START、pause、途中退出は消費しない。
- Game002 の 1000m CLEAR は成功終了として消費しない。すべての RUN 終了を失敗として課金する共通化をしない。
- 死亡演出中にページを離れても、確定済みの消費・Best を取り消さない。

基本のプレイ時間目安は企画の 1 CREDIT 1〜3 分。短いジャンルの例外は設計データに残し、人間の実測で調整する。広告機会のためにプレイを引き延ばさない。

## 4. Rewarded Ad の境界

```ts
type RewardAdapter = () => Promise<{ granted: boolean }>;
// CreditService.requestRewardedCredit(adapter): Promise<boolean>
```

残 0 かつ要求中でない時だけ受け付ける。成功は `granted:true` の場合だけ +3。拒否・例外では増やさず、再要求可能に戻す。サービスと UI の両方で多重要求を防ぐ。要求中は補充・title・brand 等の関連操作を止める。

現行 adapter は約 900ms 後に成功する **開発用 Stub**。結果や補充画面に Stub を明示し、本番広告を表示しない。将来は広告を完了した SDK 結果だけで granted を返す実装へ交換する。

補充後のフローは固有に選ぶ。001 は新 RUN を自動開始、002〜010 は TITLE → 明示 PLAY。どちらが自然かは人間評価待ち。

## 5. 保存とスコア

CREDIT、Best、mute は LocalStorage。001 は互換性のため `orbit-shift:v1:`、新作は `web-mini-arcade:v1:game00N:`。ゲーム間で残数・Best・mute を混ぜない。破損値・非有限値・非整数・範囲外値を既定値へ戻す。保存拒否・書込み失敗時はページ内メモリを優先し、継続を可能にする。削除後の古い保存値の復活を防ぐ。

Best はそのゲームの主スコアで比較し、確定した失敗 / CLEAR 時に保存する。quit による未確定の Best 保存は行わない。points、m、accepted FLOORS、reached LEVEL、SORTED を同一の抽象ポイントに置換しない。補助指標・CLEAR 記録・Perfect は固有。002は距離×NICE段階倍率のSCOREを主とし、旧`best`の距離を保持して`bestScore`を分離する。003の称号・004のジョークはスコアを変えない。

オンラインの今日 / 今週 / 全期間ランキングは未実装。保存の端末間同期、データ移行、ランキングの不正対策は将来の境界で扱う。

## 6. Telemetry

全て `trackEvent()` を通す。console と最大 200 件のメモリ履歴は Stub で、永続 Analytics や実ユーザー指標の集計ではない。イベントの共通 envelope：

```ts
{ name, at: string /* UTC ISO timestamp */, data: { game_id, ... } }
```

`game_id` はサービスが付ける authoritative な ID。既存の `data.game` は互換性のため残す。開始・終了・duration は runId を持ち、終了一度を UI 側でも守る。

| 共通イベント | 現行の意味 |
|---|---|
| game_open | ページを開いた時 |
| run_start | 新 RUN を開始、runId と CREDIT |
| run_end | 確定した over / clear / quit、score と time |
| score | 失敗 / CLEAR 時の主スコア、Best と更新有無 |
| run_duration | `seconds` は pause を除くゲーム内時間、`reason` は over / clear / quit |
| credit_used / credit_zero | 消費と 0 到達。開始や pause には送らない |
| reward_offer_shown | 実際に補充ボタンが見える機会。クリック回数で増やさない |
| reward_requested / reward_granted / reward_failed | 要求と成功 / 拒否・例外 |
| retry | 明示 retry、001 の補充後自動再挑戦も含む |
| quit | 生存中の title / terminal pagehide。cached pause は含めない |
| pause / resume | 停止と明示再開 |

run_end の共通 outcome を使う。001 は歴史的な collision / quit の `reason` も保持。ゲーム時間は長いフレームを制限したシミュレーション時間で、壁時計とは別。002〜005 は新 runId で retry を送り、001 は previousRunId を使う違いが残る。将来 sourceRunId / targetRunId の統一を検討し、現行 payload が完全一致したと主張しない。

終了時に固有の distance_reached / office_clear、tower_height / perfect_count、memory_level / sequence_length、sorted_count / rule_change_count を送る。フレームごとのスコア送信をしない。平均時間・retry 率・3 CREDIT 消費率・Reward 選択率・Best 更新率・翌日再訪等は、将来の分析基盤と人間データが必要。

## 7. PC・スマートフォン入力

説明を短くし、盤面とフィードバックで操作を伝える。005ではPLAY後の説明・任意練習を本編から分離し、時計・CREDIT・best・RUNイベントを進めない。RETRYは本編へ直接戻す。少数キー、クリック・タップを同じモデル操作に渡し、二重発火を防ぐ。primary pointer、押しっぱなしの repeat、modifier、phase、古い入力の持ち越しを扱う。

**click.isPrimary だけで native button を拒否しない。** Chromium の正常な mouse click でも false になる実例があった。004 / 005 は primary pointerdown でセル / LEVEL または荷物 ID を承認し、click と照合する。005 の native Enter / Space は押し始めた荷物 ID を保持する。004 の native キーは repeat を抑制し、pointer のセル / LEVEL 承認とは別の経路で扱う。2 本指ジェスチャーで native click 自体が出ない場合もあるため、テストで必ず 1 click を強制しない。

001 / 003 の切替・着地待ち、004 の WATCH、005 の発送・rule-change の採否は固有。002 の移動予約を全ゲームへ広げない。ゲーム入力と title / pause / reward の操作を混ぜない。スマホでは盤面の touch-action、選択抑制、native button を使い、スクロール・ズーム・誤ダブル入力を抑える。

## 8. 音・画面・アクセシビリティ

ユーザー操作で音を有効化し、mute を保存。音が使えなくてもプレイを継続。生成音の oscillator / gain を終了時に切断する。ピッチや成功・失敗・変更音はゲームごとに設計する。

1920×1080 / 1440×900 / 1366×900 / 1280×720 / 1024×768 / 390×844 / 320×568 / 844×390 / 568×320 を今回の確認点とした。高さも使ってレイアウトし、主要操作は最低 44px。TITLE、RESULT、NEW BEST + CREDIT 0、PAUSED、補充要求中、長い説明を確認する。結果が盤面を覆うかはジャンルで決める。004 の固定パネル位置と replay は隠さない。

フォーカス表示、意味のあるラベル、native keyboard、形・記号・文字の手掛かり、reduced-motion を扱う。色だけに依存しない。全ゲームの非視覚プレイやスクリーンリーダーによる点灯順の理解まで認証済みという主張はしない。実機の視認性・音・入力感は人間 I / J に残す。

## 9. ロード・性能・エラー

静的 MPA ビルドで各ゲームを直接起動。画像はゲームの必要性に応じて同梱した最適化 WebP を使い、精密な操作・重要な文字・判定表示はコードで描く。生成原本や未使用コンセプトは配信しない。音は生成 SE。Phaserを使う001〜003/006は共有engine chunk、004/005/007〜010はengineを要求しない。実際の取得 script body も検証する。

一般スマホ 60fps を目標とするが、今回実機測定は未実施。003 の重心判定は着地時 O(n)、高さは O(1) 更新、描画は付近の箱だけ。固定 Graphics / DOM を再利用し、短命演出・RAF・listener・音を cleanup できる構造にする。長いフレームを制限し、非表示・pause でモデルを進めない。

保存・音・Reward の失敗でゲームを止めず、補充失敗には再要求表示を出す。一般的な致命エラー専用の復旧 UI、サーバー通信・オフラインキュー・SDK の本番エラーは未実装。現行の境界と将来の要求を区別する。

## 10. 完了・レビュー・人間評価

実装 → モデル検証 / build → 独立 Game Feel Review → 独立 QA → 必要な修正 → 対象再検証 → 非公開 Preview → 人間 A〜J → 合格時のみ公開候補。

実装担当自身だけで「問題なし」として終えない。ブラウザが使えない場合は Human Playtest Required を残す。使える場合も自動正解 planner を人間の楽しさの証拠にしない。レビュー中の修正はブラウザを止めた修正時間を設け、HMR を跨いだ RUN を成功証拠にしない。

各ゲームに LESSONS と manifest。今回の manifest は id / title / genre / core_mechanic / primary_input / skill_axes / expected_run_seconds を持ち、期待秒数を利用者実測と区別する。

本 Draft の採否・初期難度・retry / Reward フロー・CREDIT が自然かは、新作の人間結果を反映して決める。オンラインランキング、本番広告、アカウント、ポータル、自律 Concept 生成、自動公開へは今回進めない。


## 11. 次期 DRAFT v0.2 候補 — 10ゲームから得た知見

以下は今回の実装・モデル・独立Feel/Visual・実ブラウザQAから得た候補。全10本の人間プレイテストが済んだ契約ではない。最終結果と根拠は [TEN_GAME_REVIEW](../../docs/TEN_GAME_REVIEW.md) と [今回の独立QA](../../docs/ten-game/QA/README.md)へ記録する。

### 任意分岐と終わり方

通常RUNに `milestone` の停止状態を加える必要が生じた。表示だけでなくモデル時計・物理・敵・液体・締切を止める。選択成立はRUN内で一度、選択画面の表示前に始まったキー/タップを引き継がない。再開時の猶予はゲームの予告と操作時間から決め、全ゲーム共通の無敵時間を足さない。

`over`（失敗）/ `clear`（成功）/ `safe_exit`（途中で得点を確定する安全終了）/ `quit`（未確定退出）を区別する。前3者はBestを確定し、CREDITは`over`だけ消費する。`safe_exit`を一般のTITLE退出へ転用しない。Game002の1000m出社はCLEAR、2000m帰還はsafe_exit。Game010の会議を予定時間で終える選択もsafe_exitとして実装する。

ゲームごとの分岐を共通モードへ変換しない。C国の高速揺れ、バイクの世界速度、エレベーターの判断期限、カップ数、探索の倍率と散らかり、役員会の注意負荷は別々の状態とする。通常モードを断った後に再度同じオファーを出さない。009の定期的な片付けのように繰り返す分岐は、round等の一意な地点で識別する。

### 分岐の計測

| イベント | 次期候補の意味 |
|---|---|
|milestone_reached|通常進行で分岐地点に達した時に一度、runId・milestone・距離/階/round等|
|escalation_offered|選択肢を実際に表示した時に一度、runId・milestone|
|escalation_accepted|危険な展開を承認した時に一度、runId・milestone・choice|
|safe_exit|安全終了が確定した時に一度、runId・milestone・score等|

`run_duration.seconds` はポーズと選択画面を除く実時間単位のシミュレーション時計を使う。世界の200%速度や5倍速の会議時計で実プレイ時間を水増ししない。会議の `meetingMinutes` や通勤の `worldTime` が必要なら別の固有指標とする。途中までの点数を後から全て増倍するか、選択後だけ増倍するかはゲーム固有に明記する。003は未来のPerfect BONUSのみ300%、既得点は変えない。

### 新たな共通化候補と残す固有要素

分岐中の入力epoch、結果確定時の無料終了、通常時間と演出時計の分離は再利用候補。今回はゲーム固有の実装で検証し、新しいライフサイクルSDKや統一画面を抽出しない。車体の駐車幾何、荷重と下車、液体の遅れ、探索の配置/実64×72px以上の物体判定、人物の質問前兆は共通化しない。

英語設定はプレゼンテーションの設定として保存し、005の分類IDや締切を変えない。言語切替時にモデルや練習を再起動しない。重要な規則・失敗理由・チュートリアルが同じ言語になることを確認する。今回全10ゲームの多言語化を契約にしない。

### レビューと根拠

新作の美術は Art Directorの仕様→実画像生成→最適化実素材確認→実装→独立Game Feel→独立Visual→QAの順。画像が存在するだけで採点しない。Visualは合計80/100以上、可読性Fと完成感Hは各12/15以上。各ゲームの構図・意味のある動作・読める実入力を根拠とする。

ブラウザの長いRUNは固定ソースのDEVスナップショット、または完全な編集停止で検証する。別ゲームのHTMLやpublicの変更でもVite再読込が発生し得る。スナップショットと最終runtimeをハッシュ照合し、モデルを強制変更する検証と通常キー/タップの実行を混同しない。

人間の評価はA–Jに加えてK「先を見たい」、L「分岐を迷う楽しさ」、M「特殊モードでより面白い」、N「笑いが妨げにならない」を加える。広告を見て再挑戦したいかは自動plannerでは測れない。K–Mの分岐を持たない既存ゲームに新機能を強制しない。


### 実際の入力先と途中画面のQA

透明なUIでもpointerを遮り得る。006の実portrait QAはprimary pointerが盤面外のASIDEへ届くことを記録し、playing状態の情報panelだけをpass-throughにした。今後はボタン入力と盤面入力を別々に試し、canvasなどstage内の子要素への入力を認め、overlayの誤配信やsecondaryによる二重操作を識別する。CSSやhandlerの存在だけをタッチ成功の根拠にしない。

titleだけでなく、実進行中・pause・到達時choice・earned result・CREDIT0・reward pendingを各viewportで検証する。006の10台後のchoiceは通常画面と異なる高さでoverflowした。短い横画面では説明と未来倍率を消さず、44px操作を保って配置する。描画だけの明示fixtureは高速な配置調査に使用できるが、到達・分岐・得点・CREDITの最終証拠は通常の入力で獲得する。

900msのStub待機は一回のreadonly DOM取得でbounds・可視性・disabledを集める。複数のIPC読み取りが完了前に画面遷移したテストを、ゲームが遅い/壊れたという所見へ置き換えない。一方、実イベントが正しく届いていない場合はハーネス不備へ読み替えず、実原因と限定修正を残す。


006ではCREDIT0/0点の結果が収まっても、特殊モード＋NEW BEST＋高得点の結果が568×320で8px余分に高くなった。次の制作ではnormal/escalated × NEW BEST有無 × CREDIT0/残数あり × 最長の理由/称号という表示組合せを明示fixtureで先に確認し、その後に実到達の証拠を取る。修正がCSSだけなら、既に取得した実得点・消費・終了の証拠を保持し、同じ結果内容の限定geometry再検証とnative result/retryを合わせる。元の失敗したPlaywright実行をPASSへ書き換えず、scenario coverageと実行結果を別々に報告する。


primary score/weightをouter cardだけで検証しない。006の4桁SCOREは33px×4桁に対して70px列、007の3桁重量＋kgは26pxに対して73px列が足りず、数字の改行/カード外への表示が起きた。親をminmax(0,1fr)へするだけでは数値列は救えない。必要な数字と単位を一行で読める幅にし、captionや他のmetricsと重ならないことを実Range/実画像で確認する。フォントをむやみに小さくする前に列構成を見直す。normal/short-landscapeの別media ruleが同じ固定幅を再導入していないかも確認する。

表示更新を間引くsignatureには、描画する意味の境界も含める。008では残量を小数1桁に丸めたキーが微小な正量と0を同一視し、実終了後も杯メーターが1%のまま残った。残量の物理モデルを変えず、空かどうかと表示整数％の変化をkeyへ含める。キャッシュの文字列一致だけでなく、実終了時の0表示・空の色・他の杯の保持をブラウザで確認する。

結果のgeometry診断は、同じ実earned内容の全viewportを収集してから修正する。008では192点/1杯/CREDIT0/NEWBESTと1810点/3杯/CREDIT2/NEWBESTを全8サイズ、計16通りで検証した。primary数字の一行/列内包、SCORE caption、TIME/CREDITの改行、杯の個別残量、長い称号、navigation44px、caption/footerの画面内包と相互の重なりを確認する。診断は最初の失敗で残りを省かず、全ケースの失敗を集める。終了後に操作不能の補正ボタンを省く場合は、その状態だけに限定し、再挑戦/補充/TITLEを残す。表示fixtureのidle Canvasを実終了証拠に数えず、自然終了・消費・分岐は実入力の別証拠を保持する。

区間倍率のscoreは、フレームごとの小数増分を延々足して整数境界を取り逃さないよう検証する。008の実1000mは2杯で1250のはずが1249になり、可変フレームの公開stepでも再現した。距離500/1000の区間基準から算出し、物理・時間・RNGは変更せず、期待値を緩めず修正した。厳密なmilestone境界と、表示だけ切り下げた通常進行の端数を別に検証する。固定60Hzだけのモデルテストに加え、実RAFに近い異なるdt列を使う。これはゲーム固有の得点式の検証候補で、全ジャンルへ距離式を共有しない。

### 静的配信での最終裏付け

今回の全10ページbuild後、production10件とfresh first-load10件がPASS。Phaser001/002/003/006の初回JS bodyは2MB以内、native004/005/007/008/009/010は300KB以内で実Phaser bodyを取得しない。日本語fontは002〜010で同じ148,684bytesを取得する。画像の実ロードを測る際はresourceTypeだけでなくHTTP MIME/URLも使い、PhaserのXHR→blob decodeを二重計上しない。[実測](../../docs/ten-game/QA/PRODUCTION_FIRST_LOAD_AUDIT.json)でbody/encoded/decodedを確認した。これらは今回の技術的基準で、実機FPS/人間の開始率・リトライ率・広告意欲の評価は未実施。
