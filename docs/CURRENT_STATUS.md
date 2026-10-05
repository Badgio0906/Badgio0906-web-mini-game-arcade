# CURRENT_STATUS — 現行状態と再開地点

2026-10-05 UTC。mainはGame017を含む17本、commit `1ab4fcf5a35637b15554d7942d944763e79920c9`。Pages Actions run37283475701はbuild／deployとも成功。公開URLは現環境のHTTP CONNECT403で実表示未確認。018を含む18本候補は公開前の技術検証完了で、最終結果は[018報告](game018/IMPLEMENTATION_REPORT.md)と[RELEASE_GATE](game018/QA/RELEASE_GATE.json)が正本。

Repository：[Badgio0906/Badgio0906-web-mini-game-arcade](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade)。公開Portal：[WEBミニゲーセン](https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/index.html)。mainへのpushで[Pages workflow](../.github/workflows/pages.yml)が起動する。ユーザーの最新指示に従い、018は公開前成果をremote候補ブランチへ保存し、許可が適用された新環境で掲載・起動確認を引き継ぐ。[引き継ぎ書](game018/PUBLICATION_HANDOFF.md)。

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
| 012 | 澤野さんの横取りデイズ | `games/yokodori-days/index.html` | [移行構造](legacy-games/MIGRATION.md)／[移行報告](migration/IMPLEMENTATION_REPORT.md) |
| 013 | 立花さんのタスク天国 | `games/tachibana-task-heaven/index.html` | 同じ移行資料。元UIの横向き案内を維持 |
| 014 | 畑島さんの指ハートチャレンジ | `games/finger-heart-challenge/index.html` | 同じ移行資料。元の25回チャレンジを維持 |
| 015 | 落下キング ～FALL KING～ | `game015.html` | [初版仕様](game015/IMPLEMENTATION_SPEC.md)／[改訂01依頼](game015/revision-01/REQUEST.md)／[最新報告](game015/revision-01/IMPLEMENTATION_REPORT.md) |
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
