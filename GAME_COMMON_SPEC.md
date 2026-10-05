# GAME_COMMON_SPEC — 現行の共通境界

2026-10-05、019統合候補のコードと記録から整理。最新の公開結果は統合報告を優先する。完成した100ゲーム用SDKではなく、現在使っている小さな境界を記述する。現状と例外は [CURRENT_STATUS](docs/CURRENT_STATUS.md)、工程は [GAME_DEVELOPMENT_RULES](docs/GAME_DEVELOPMENT_RULES.md)。以前の10本DRAFTは [archive](docs/archive/GAME_COMMON_SPEC_2026-10-04.md)、11本の練習候補は[履歴草案](docs/eleven-game/COMMON_SPEC_NEXT_DRAFT.md)に保持する。

## 適用範囲と固有モデル

001〜011・015〜019のnative gameが保存・音・Telemetry等の共通サービスを使う。019は無料でCREDIT未接続。CREDIT接続は001〜010・015〜018にあり、011のmainは財布未接続で無料専用。012〜014の旧Godot exportは既存UI・保存・音・操作を保つ。旧exportを共通サービスへ無断接続しない。

固有モデル、描画、入力の採否、難度、得点、結果配置を保つ。Phaser Scene、DOM Board、Canvasを同じ基底classへ変換しない。広告SDK・ランキング・特定サーバーを固有モデルへ入れない。

## 開始・練習・終了

native gameはtitle、RUN、result、retry、pauseを持つ。初回も「すぐ遊ぶ／説明を見る／練習する」を選べる。説明と練習は任意で、本番score／BEST／CREDIT／run eventsを変えない。スキップで完了保存を偽造しない。001〜011・015は[共通onboarding](src/arcade/onboarding.ts)、016〜019は固有の練習。012〜014は帰還shellで3択と隔離した補助練習を提供し、元の説明・練習を保持。013の初回強制helpだけを解除した。[実装境界](docs/start-choices/IMPLEMENTATION_REPORT.md)。

終了一度をUIとモデルで守る。失敗over、成功clear、固有の得点確定退出safe_exit、未確定退出quitを区別する。Best保存、消費、retry先は固有仕様。一般のtitle帰還をsafe_exitへ読み替えない。通常retryはページを再読込しない。

pause／背景化では時計・物理・締切とheld入力を止める。復帰やphase切替で非表示ボタンfocusが残らないようにし、古いgestureを次の問題へ使い回さない。実際の採否と時計方式は固有コードで確認する。

## CREDITと広告境界

[arcadeConfig](src/arcade/config.ts)でprototype制限を切り替える。現在の値はCURRENT_STATUS参照。OFF時は保存0でもPLAY／retry可、残高を変更せず、消費・補充・広告adapterを動かさない。本番広告未接続のまま再有効化しない。

将来ON時は[CreditService](src/core/CreditService.ts)のゲーム別初期3、0で新RUN不可、consume(runId)の重複防止を使う。001〜010・015の終了時消費を維持し、成功CLEAR／safe_exitを失敗消費へ変換しない。016は[runWallet](src/games/game016/runWallet.ts)で開始時1消費、1 RUN＝1 CREDIT。質問・練習・終了で追加消費せず、途中quitで開始済み消費を取り消さない。011はflagをONにするだけでは財布が接続されないため、別途仕様と実装が必要。

requestRewardedCredit(adapter)は0／非pendingのみ受け付け、granted:trueで+3。拒否・例外で増やさず再要求可、多重要求を防ぐ。[RewardService](src/core/RewardService.ts)は約900msの開発用Stubで、本番広告ではない。011の広告UI等、全ゲームのenabled実UIが完成済みとは扱わない。

## 保存と固有スコア

[StorageService](src/core/StorageService.ts)はLocalStorage拒否・破損値に対応し、ページ内メモリで継続する。メモリfallbackをreload後の永続保存としない。001はorbit-shift:v1:、他native gameはweb-mini-arcade:v1:gameNNN:。旧Godotは元の保存仕様。

scoreの単位・補助指標を統一しない。002は旧距離BESTを保ちSCORE用bestScoreを分離、011は旧配点bestを残し新配点best:v2を使う。保存キーを無断削除／改名しない。オンラインランキング、端末間同期、不正対策は未実装。

## 入力・時間・情報

少数キー、native click／tapで固有モデルへ入力する。入力epoch、held／repeat、modifier、pointerの開始対象と画面、releaseを扱う。準備操作を回答へ転用しない。click.isPrimaryだけで正常なnative button clickを拒否しない。

表示可能／回答可能の瞬間と時計開始を一致させる。pauseを除き、遅いフレームやIPCが期限を延ばさない。016の絶対monotonic期限と古い物理simulationのframe処理を一律のframe capへ置換しない。011と016の配置・期限はCURRENT_STATUSと固有仕様を参照し、共通化しない。

主要操作44CSSpx以上。PCとphoneで文字・対象・スコア・失敗理由を読め、色だけで正解が分からないようにする。ラベル、keyboard focus、reduced-motion、viewportと祖先のclipを扱う。全ゲームの非視覚プレイを認証したとは主張しない。

## 音とTelemetry

ユーザー操作でAudioをunlockし、muteを保存。音が使えなくても遊べるようにする。oscillator／gain、RAF、listener等をcleanupする。成功／失敗の意味は固有に設計する。

[TelemetryService](src/core/TelemetryService.ts)のtrackEvent()を通す。name、at（UTC ISO）、data.game_id/session_idを持ち、最大200件のページ内履歴と400件の端末内保存。ポータルからJSON保存でき、ゲーム／タグ／設計難度別に保存窓の実観測だけを集計。欠測はnull、012〜014はshell-only。外部送信・人口統計・Codex使用量の計測は行わない。[データ境界](docs/data/JEV_PREPARATION.md)。

共通eventはgame_open、run_start／run_end、score、retry、quit、pause／resume、run_duration、tutorial_skip/view、practice_start/complete、best_update、death_reason、specific_game_events。全てのeventを旧ゲームで観測しているとは扱わない。CREDIT／Rewardは有効モードの境界。練習はtutorial、一覧はportal_open／game_card_click／game_launch／return_to_portal。固有eventは型とモデル／UIに残し、フレームごとに送らない。

runIdと終了一度を守る。ゲーム内時間、世界速度、会議時計、読書、pause、壁時計を区別し、意味を報告する。全payloadの完全一致や全ゲーム同じduration定義を仮定しない。

## 配信・素材・エラー

[Vite](vite.config.ts)の静的MPA、物理HTML、base:'./'でRepository配下と直接reloadに対応。カタログroute／thumbnail、HTML参照、サムネイル台帳を一致させる。新番号はbuild入力へ加える。

Phaserは001〜003・006だけが必要。他native gameで共有engineを取得しないことを実配信で確認する。旧GodotのWASM／PCKは元exportを保つ。採用optimized画像だけを配信し、生成原本・出典・採用ログはassets／docsへ保存。実画面thumbnail、ローカルfont subsetとライセンスを維持する。

保存・音・Rewardエラーを扱い、必要assetのdecode前に回答時計を走らせない等の固有対策を入れる。一般的な致命エラー復旧UI、本番広告SDKエラー、オフラインqueueは完成済みではない。実機60fpsは目標で、browser viewport検証を実機FPSへ換算しない。

## 証拠の境界

単体、通常入力の到達、表示fixture、実画像Visual、独立Feel、人間プレイ、実配信を別に記録する。過去snapshotの合格を変更後のPASSへ流用しない。独立レビューと検証の実施・未実施は対象報告とCURRENT_STATUSが管理する。

## 017・018の固有境界

017は固有Canvas／経路描画練習、018は固有Canvas／ANGLE・SPIN・POWERと4段階の実練習。既存Storage／Audio／Telemetry／CREDITサービスを使用。016同様に将来ON時は本番開始時1回消費、現在OFF。018は距離を整数decimeterで保存する。練習のscore／BEST／本番イベントは分離する。018のskyイベントの表示停止は物理得点へ影響しない。[017報告](docs/game017/IMPLEMENTATION_REPORT.md)／[018報告](docs/game018/IMPLEMENTATION_REPORT.md)。現在の018改修と019統合の公開結果は[統合報告](docs/integration-2026-10-05/IMPLEMENTATION_REPORT.md)を参照。

## 019・タグと所有確認

019は方向×小中大の精密上昇。転落は同じrunで復帰し、死亡扱いしない。100mの海岸床はrun内だけの足場。再開位置の保存はなく、新runは底から開始。BESTは0.1m単位、練習と本番の計測は隔離する。[仕様](docs/game019/IMPLEMENTATION_SPEC.md)。

[Catalog](src/data/gameCatalog.ts)と[tag definitions](src/data/tagCatalog.ts)に全19本の安定ID／日本語タグを持つ。カードは先頭4件、フィルタUIは未実装。Jev用profile／schema／明示的synthetic sampleを[jev_export](jev_export/)に保存。runtimeからJevを呼ばない。

AdSenseの所有確認scriptは別PRでroot HTML headだけへ追加する。広告枠やRewardServiceへ接続しない。所有確認・審査の成立はコード設置の公開とは別に確認する。
