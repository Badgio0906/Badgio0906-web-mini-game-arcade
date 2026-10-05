# CURRENT_STATUS — 現行状態と再開地点

確認日：2026-10-05（日本時間）。コード／Gitの調査基準は `c793e35f16ea752cc3493558ea6d2a0b7ae38578`、配信runtimeは `c58079cd7cfd0b54f89b6b3710ac73ddb3a4a897`。この継承文書の整理はruntime・設定・保存データを変更しない。以下の検証成績は過去の実行記録であり、この文書編集で再実行した結果ではない。

## 公開版とカタログ

16本を含む公開試作版。技術的な公開成功と人間の面白さの合格を区別する。

- Repository：[Badgio0906/Badgio0906-web-mini-game-arcade](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade)
- Portal：[WEBミニゲーセン](https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/)
- 配信：GitHub Pages、[Actions workflow](../.github/workflows/pages.yml)、`main`へのpushでCI／deploy。文書だけの保存とゲーム公開は別工程。
- 登録の正本：[gameCatalog.ts](../src/data/gameCatalog.ts)。native gameのmanifestは001が`src/game/`、他は`src/games/gameNNN/`。移行3本は[export-manifest](../public/games/export-manifest.json)。

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

番号017以降は未登録。この記録を固定の予約番号とせず、新タスクでカタログを再確認する。

## 変更時に守る現行例外

| 項目 | 現状／根拠 |
|---|---|
| CREDIT | [config.ts](../src/arcade/config.ts)の`creditsEnabled:false`。保存0でもPLAY／retry可。残高・消費イベント・Reward Stubを動かさない |
| CREDIT再有効化 | 001〜010・015は終了時消費を保持。016のみ[runWallet.ts](../src/games/game016/runWallet.ts)で開始時1消費。011のmainはCreditService未接続の無料専用で、flagだけで有効にならない。本番広告未接続のままフラグをONへしない |
| 練習 | 001〜011・015は共通onboarding／PracticeSession、016は固有の固定3問。012〜014は元UI。全ゲームへ同じ練習を強制しない |
| 011期限／配点 | 通算1〜20問2秒・100点、21〜50問1.5秒・200点、51以後0.5秒・500点。読書とFINAL選択は無制限。左右は毎問独立ランダム。旧BESTを保持し新配点は`best:v2` |
| 015改訂01 | キャラ24×36、当たり判定18×33（初版の1.5倍）。全幅安全床なし、早期トゲ床・予兆付き壁針・揺れる鳥。ジャンプなし |
| 016 | 左グー／中央チョキ／右パーを最後まで固定。1ミス終了。画像→ひらがな→文章→31問以後常時800ms。初期30問2000ms、文章は解放後に時計開始 |
| 配信 | 物理HTMLと`base:'./'`。現在のVite入力regexは001〜011・015・016のみ。017追加時は[Vite設定](../vite.config.ts)の入力対象も更新が必要 |
| 旧ゲーム | 012〜014の固定exportを編集／再ビルドしない。川俣さんのゲームは本Repositoryに統合されておらず、今回の対象外 |

## 確認済みの技術結果

| 対象 | 記録された結果 | 証拠 |
|---|---|---|
| 最新016 | Vitest23ファイル196件、TypeScript／build成功。独立Feel PC／phone各35問、Visual86点、native QA7件、本番build QA4件 | [実装報告](game016/IMPLEMENTATION_REPORT.md)／[検証摘要](game016/QA/VALIDATION_SUMMARY.json) |
| 最新共通配信 | root／subpath28経路、公開URL14ページ成功。配信15ファイルがローカルbuildと一致 | [公開監査](game016/QA/PUBLIC_AUDIT.json)／[file照合](game016/QA/PUBLIC_FILE_MATCH.json) |
| 最新CI | runtime `c58079c`の196件・build・deploy成功、run37255472509 | [ジョブ記録](game016/QA/PUBLIC_ACTIONS_RUN.json) |
| 015改訂01 | 181単体、native8件、本番build4件、独立Feel、公開13ページ成功 | [最新報告](game015/revision-01/IMPLEMENTATION_REPORT.md) |
| 012〜014移行 | 14本版で旧3作品の実入力・配信6件成功。最新016工程でGodot3本を再プレイした記録ではない | [移行報告](migration/IMPLEMENTATION_REPORT.md)／[移行QA](fourteen-game/QA/README.md) |

既存ゲーム固有253ファイル・旧画像・最初の15サムネイルを保持。[保持監査](game016/QA/EXISTING_GAME_PRESERVATION.json)。専用016はPhaserなし。旧Phaser共有chunkの500kB警告は残る。ローカルfontは1020文字／159448 bytes、旧8装飾記号はfallback。[font index](../assets/fonts/font-index.json)。

これらはsnapshotの確認結果であり、今後の変更後に自動継承されるPASSではない。影響した範囲を再検証する。

## 残課題と再開条件

- **人間評価**：過去のGame001 A〜J合格記録は[初期LESSONS](GAME001_LESSONS.md)にある。現行全16本の一括人間評価、015改訂01、016の認知的混乱／800ms難度、実機FPS・音・親指操作は未確認。[015フォーム](game015/HUMAN_PLAYTEST.md)／[016フォーム](game016/HUMAN_PLAYTEST.md)。自動正解入力を人間の反応時間・楽しさとしない。
- **旧Pages停止**：移行は完了。旧3サイト停止はAPI／Actionsの403で未完了、元Repositoryは保持。最新の確認記録は[停止監査](migration/PAGES_RETIREMENT_AUDIT.json)。権限が変わったときのみ再確認し、Repository削除へ読み替えない。
- **将来機能**：本番広告、オンラインランキング／人気指標、永続Analytics、共通仕様の人間検証、自律Concept生成は未実装／未安定。現在の共通境界を完成SDKと呼ばない。
- **Jev**：ユーザーからOpenRouter経由Jev1.13の疎通成功の申告あり。現在のタスクで3既知ケースのDecisions API呼出は0回。認証情報と確認済みrequest形式が引き継がれず、確率・tokens・cost・latencyは未取得。[ルールと再開条件](JEV_REVIEW_RULES.md)、[準備済み入力](jev/SHADOW_CASES.json)。ゲームやCIへの自動接続はない。
- **Codex比較baseline**：[保存済み集計](development-baseline/BASELINE_2026-10-05.json)／[CSV](development-baseline/BASELINE_2026-10-05.csv)。016／015／011の採用コードコミット1／2／3、確認テスト9／14／14、対象失敗2／3／1。全開発時間・全修正・worker呼出・model／reasoning・料金／tokensは取得不可。定義と証拠を保持し、役割数・コミット数から使用量を推測しない。

## 次のタスクへ渡すもの

対象ID・今回の指示・変更範囲・最後の検証済みcommit／hash・未完了の検証・人間評価・必要な外部接続を更新する。CURRENT_STATUSは現在の一覧と再開地点だけを持ち、詳細な実行ログは対象ゲームの報告へリンクする。会話だけに新しい例外や合格を残さない。

この継承構造の変更範囲と照合結果は[整理記録](CONTEXT_REORGANIZATION_REPORT.md)を参照。
