# CURRENT_STATUS — 現行状態と再開地点

2026-10-05（日本時間）。3つの情報源を統合した新タスク向け正本は[統合引き継ぎ書](handoff/WEB_MINI_GAME_ARCADE_HANDOFF_2026-10-05.md)。①開発・Jev、②公開タスクの添付引き継ぎとRepository記録、③ユーザー提供GAME100 GARAGE運営メモを照合済み。今回の変更は文書のみ、code／DNS／AdSense／公開／Jev APIは操作していない。


## 2026-10-05 改名・落下キング改訂02・018公開作業

今回の最新ユーザー依頼を実施。018候補HEAD482e458を採用し、018固有runtimeは変更しない。012「お前の仕事は俺の仕事」／013「タスク天国」／014「指ハートチャレンジ」へ、Catalog・HTML・Godot内部・必要なサムネイルまで統一。[改名報告](legacy-games/title-revision/IMPLEMENTATION_REPORT.md)。

015は中央を含む6種のランダム足場、到達可能な安全なルート、自動縦スクロール18→36px/s、遅れると上端死亡、王冠／白ひげ／紫衣装／赤マントの新nativeドット絵、タイトル・練習・実playサムネイル。[改訂02仕様](game015/revision-02/IMPLEMENTATION_SPEC.md)／[報告](game015/revision-02/IMPLEMENTATION_REPORT.md)。初動約2.85秒、停止しても進む。旧改訂01の待機・練習仕様は現行に適用しない。

check・全単体・build PASS、015モデル22／練習8、native PC／phone／320／横画面4PASS。独立モデル追加32seed各500m PASS。公開／最終productionの結果は改訂02報告へ追記する。正式HTTPS、Pages custom domainとhttps_enforcedを直接確認済み。DNS・AdSense・CREDITは変更しない。

以下は今回作業前の引き継ぎ状態を保存した記録。最新状態は上記改訂02報告を優先する。

正式公開URLは **https://game100garage.com**。Cloudflare Registrar取得、Pages Custom domain、DNS check successful、HTTPS設定完了（運営メモによる）。AdSenseは登録開始済みだが「サイトをAdSenseにリンク」が未完了。次は画面の「開始」で所有確認method／snippetを取得する。CREDIT OFF・Reward開発stubは維持。GitHub所有確認TXTは削除しない。

mainは017までの17本、`1ab4fcf5a35637b15554d7942d944763e79920c9`。017のPages run37283475701はbuild／deploy成功。018は実装・技術検証済みでmain未反映・未公開、`codex/game018-shoe-fly-high`に保存。統合前の最新HEADは`2426659ddea5a3eddcee77ec201476e66eba946a`（mainより5commit先行）、以後の文書commitも最新remoteから取得する。018は作り直さない。

②の公開再検証は248/248単体・check/build、freeze301一致、018／017各4local production PASS。018公開DOM／asset一致／deployは未実施。今回の①Cloud再確認はenforced revision11だがcustom許可はjev-ai.org/openrouter.ai＋package_managersのまま、Pages／domainHTTPSはCONNECT403。DNS／HTTPSの未完了と混同しない。新Cloudでgame100garage.com・www.game100garage.com・badgio0906.github.io・api.github.comの実許可を確認し、正式URLで公開残工程を進める。[個別公開手順](game018/PUBLICATION_HANDOFF.md)。

登録の正本は[gameCatalog](../src/data/gameCatalog.ts)。以下は18本候補の一覧。mainは017まで。

| ID | ゲーム | route | 再開時の固有資料 |
|---|---|---|---|
| 001 | 軌道をズラせ！ ～ORBIT SHIFT～ | `game001.html` | [仕様](GAME001_SPEC.md)／[LESSONS](GAME001_LESSONS.md) |
| 002 | ゆううつな月曜日 ～WORKDAY DODGE～ | `game002.html` | [仕様](GAME002_TO_005_SPEC.md)／[旅・倍率改修](ten-game/IMPLEMENTATION_SPEC.md) |
| 003 | 我が国の建築は世界一ぃ！ ～DROP TOWER～ | `game003.html` | [仕様](GAME002_TO_005_SPEC.md)／[C国改修](ten-game/IMPLEMENTATION_SPEC.md) |
| 004 | あなたの短期記憶、無事ですか？ ～ECHO GRID～ | `game004.html` | [仕様](GAME002_TO_005_SPEC.md)／[タイトル改修](revisions/TITLE_UI_SPEC.md) |
| 005 | 右往左往の仕分け術 ～SORT SHIFT～ | `game005.html` | [仕様](GAME002_TO_005_SPEC.md)／[英語改修](ten-game/IMPLEMENTATION_SPEC.md) |
| 006 | ギリギリ駐車 ～PARK IT!～ | `game006.html` | [仕様](ten-game/IMPLEMENTATION_SPEC.md)／[LESSONS](GAME006_LESSONS.md) |
| 007 | まだ乗れます ～ELEVATOR OVERLOAD～ | `game007.html` | [仕様](ten-game/IMPLEMENTATION_SPEC.md)／[判読改善](eleven-game/IMPLEMENTATION_REPORT.md) |
| 008 | コーヒーこぼすな ～COFFEE WALK～ | `game008.html` | [仕様](ten-game/IMPLEMENTATION_SPEC.md)／[液面・距離改善](eleven-game/IMPLEMENTATION_REPORT.md) |
| 009 | 印鑑どこですか ～STAMP HUNT～ | `game009.html` | [仕様](ten-game/IMPLEMENTATION_SPEC.md)／[LESSONS](GAME009_LESSONS.md) |
| 010 | 会議、聞いてます？ ～MEETING SURVIVAL～ | `game010.html` | [仕様](ten-game/IMPLEMENTATION_SPEC.md)／[前景改善](eleven-game/IMPLEMENTATION_REPORT.md) |
| 011 | ウンコかウコンかゲーム ～UNKO or UKON～ | `game011.html` | [初版仕様](eleven-game/IMPLEMENTATION_SPEC.md)／[最新時間・配点改修](migration/IMPLEMENTATION_REPORT.md) |
| 012 | お前の仕事は俺の仕事 | `games/yokodori-days/index.html` | [移行構造](legacy-games/MIGRATION.md)／[移行報告](migration/IMPLEMENTATION_REPORT.md) |
| 013 | タスク天国 | `games/tachibana-task-heaven/index.html` | 同じ移行資料。元UIの横向き案内を維持 |
| 014 | 指ハートチャレンジ | `games/finger-heart-challenge/index.html` | 同じ移行資料。元の25回チャレンジを維持 |
| 015 | 落下キング ～FALL KING～ | `game015.html` | [初版仕様](game015/IMPLEMENTATION_SPEC.md)／[改訂01依頼](game015/revision-01/REQUEST.md)／[最新報告](game015/revision-02/IMPLEMENTATION_REPORT.md) |
| 016 | 負けじゃんけん ～LOSE TO WIN～ | `game016.html` | [仕様](game016/IMPLEMENTATION_SPEC.md)／[実装・公開報告](game016/IMPLEMENTATION_REPORT.md) |
| 017 | 雨って避けたら濡れないよね ～RAINSHIFT～ | `game017.html` | [報告](game017/IMPLEMENTATION_REPORT.md)／[公開記録](game017/PUBLICATION.md) |
| 018 | 靴とばそ ～SHOE FLY HIGH!～ | `game018.html` | [報告](game018/IMPLEMENTATION_REPORT.md)／[公開前引き継ぎ](game018/PUBLICATION_HANDOFF.md) |

## 現行境界

CREDITは[config](../src/arcade/config.ts)でOFF。残高0で練習／本番／retry可能。将来ON時は016〜018のみ開始1回消費、001〜010・015は既存終了時消費、011 mainは無料専用。広告は開発stubのみ、本番広告・オンラインランキング・永続Analyticsは未実装。

001〜011・015は共通onboarding、016は固有3問、017は経路描画練習、018はANGLE／SPIN／POWER／連続飛行の4段階。012〜014は元のUI・exportを保持。物理HTMLとViteの相対baseを使用し、入力regexは001〜011・015〜018。固有仕様を全ゲームへ一律適用しない。[共通仕様](../GAME_COMMON_SPEC.md)。

011は20問まで2秒100点、21〜50は1.5秒200点、以後0.5秒500点、配置独立ランダム、旧BEST保持。015改訂01は24×36キャラ、18×33判定、ジャンプなし。016はグー／チョキ／パー固定、1ミス終了、31以後800ms。

## 検証と残工程

017：単体219/219、native4、production4、既存modern28経路PASS。Visual81/F13/H12、PC/phone各6連続CLEAR、独立QA。Jev9 callsの実測は[結果](game017/JEV_SHADOW_REPORT.md)。CI deploy成功と公開DOM確認を区別する。

018：最新統合単体248/248、TypeScript／build成功。ブラウザ・独立Visual／Feel／QA・Jevの最終記録は[報告](game018/IMPLEMENTATION_REPORT.md)。初回失敗や修正前の画像は保持。font1049文字、旧1029全保持、既存385ファイル保持。旧Godot3本は今回再プレイしていない。

人間の面白さ、実機FPS／音／親指操作、酔い、JUST難度の体験評価は未実施。[017フォーム](game017/HUMAN_PLAYTEST.md)／[018フォーム](game018/HUMAN_PLAYTEST.md)。自動入力の成功を人間合格へ変換しない。旧3サイト停止は過去API403で未完了、元Repository保持：[停止監査](migration/PAGES_RETIREMENT_AUDIT.json)。

JevはOpenRouter Decisionsの開発CLIのみ、原因choice＋独立3noul。runtime／CIへの自動判断接続なし。歴史的3ケース・10〜20件ベンチマークを今回の開発checkpointとして完了扱いしない。[ルール](JEV_REVIEW_RULES.md)。Codexのtokens／料金は取得不可、nullで記録する。[過去baseline](development-baseline/BASELINE_2026-10-05.json)。

再開時はbranch／HEAD／git statusとremote mainを確認し、他の未コミット変更を保つ。source hash、検証範囲、公開確認、人間評価を対象報告から読む。起動server／認証情報／distが次タスクにも残ると仮定しない。
