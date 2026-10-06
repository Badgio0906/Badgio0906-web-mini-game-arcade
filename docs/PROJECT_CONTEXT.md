# PROJECT_CONTEXT — 新しいタスクの入口

正式名称は **100ガレ ～GAME100 GARAGE～**、略称は **100ガレ**、英字表記は **GAME100 GARAGE**。ドメインは`game100garage.com`。新しい表示・説明に旧称を再使用しない。

この文書はプロジェクトの目的・構造・参照先を管理する。ゲーム本数、公開版、未完了事項は [CURRENT_STATUS](CURRENT_STATUS.md)、技術上の共通境界は [GAME_COMMON_SPEC](../GAME_COMMON_SPEC.md) が管理する。

## 目的と優先順位

無料で短時間遊べる、異なる体験のWebゲームを継続追加する。100本以上は長期目標であり、本数より面白さ・操作理解・テンポ・再挑戦・PC／スマートフォン・ロードの速さを優先する。広告を見るために遊びを引き延ばさない。人間が遊んで評価できる状態を作ることが開発の目的。

原始企画は [PROJECT_BRIEF](PROJECT_BRIEF.md) に保持する。そこにある「当面Godotを使わない」「失敗時CREDIT消費」等は、後日の移行・Feature Flag・ゲーム固有指示で例外が増えている。現在の仕様を原始企画だけから決めない。

ユーザーの今回の指示は既存文書より優先する。仕様は意図、コードは現状、テスト・レビューは確認した範囲を示す。三者が違う場合は差分を特定し、今回の指示に沿って修正または残課題を記録する。バグのあるコードを仕様の正解とみなさない。

## 読む順番と文書の責任

| 文書 | 所有する情報 | 読むタイミング |
|---|---|---|
| [AGENTS](../AGENTS.md) | 毎回必要な最小の指示 | タスク開始 |
| この文書 | 目的・構造・参照地図 | タスク開始 |
| [CURRENT_STATUS](CURRENT_STATUS.md) | 現行カタログ・例外・検証済み版・残課題 | タスク開始／終了時更新 |
| [GAME_DEVELOPMENT_RULES](GAME_DEVELOPMENT_RULES.md) | 実装・分担・素材・QA・継承手順 | 実装／改修 |
| [GAME_COMMON_SPEC](../GAME_COMMON_SPEC.md) | 保存・CREDIT・入力・計測・配信の共通境界 | 共通部分を扱う時 |
| [JEV_REVIEW_RULES](JEV_REVIEW_RULES.md) | Shadow評価・API実測・判定の用途と限界 | findingが発生した時 |
| ゲーム別仕様／改修報告 | 固有ルール・直近変更・検証・人間評価 | 対象ゲームのみ |

既存報告・初回失敗・生成原本・草案は証拠として保持する。全履歴を開始時の必読資料にしない。過去の共通仕様は [archive](archive/GAME_COMMON_SPEC_2026-10-04.md)、11本時点の練習候補は [草案](eleven-game/COMMON_SPEC_NEXT_DRAFT.md) にある。過去の本数・配点・CREDIT状態を現行へ適用しない。

## 技術とコード地図

TypeScript、Viteの静的MPA、HTML／CSSが基盤。Phaserは必要なゲームだけが使い、DOM／Canvasゲームに追加しない。CIはNode.js 24、依存関係は `package-lock.json` と `npm ci` で再現する。

| 場所 | 責任 |
|---|---|
| [src/core](../src/core/) | StorageService、CreditService、RewardService、AudioService、TelemetryService |
| [src/arcade](../src/arcade/) | Feature Flag、初回導線、独立練習、一覧への帰還 |
| [src/data/gameCatalog.ts](../src/data/gameCatalog.ts) | ポータルの登録データ。表示名・route・thumbnailの実装上の正本 |
| [src/portal](../src/portal/) | 一覧の表示・入力 |
| [src/game](../src/game/)／[src/main.ts](../src/main.ts) | Game001。既存フォルダを改名しない |
| [src/games](../src/games/) | 002〜011・015〜019の固有モデル・描画・UI・manifest |
| [public/games](../public/games/) | 012〜014の固定Godot Web出力と帰還shell |
| [public/assets](../public/assets/) | 採用した配信画像・実画面サムネイル |
| [assets](../assets/) | 生成原本・採用記録・font／画像の出典とライセンス |
| [tests](../tests/) | Vitest、Playwright、ゲーム別検証・配信監査 |
| `docs/gameNNN/`など | 固有仕様・実装報告・レビュー・QA・人間評価 |

001〜003・006はPhaser。004・005・007〜011・015〜019はPhaserを要求しない。012〜014は新規のGodot開発ではなく既存exportの移行であり、UI・操作・保存・音を維持する。[移行構造](legacy-games/MIGRATION.md)。

アカウント、本番広告、オンラインランキングはゲームロジックに接続されていない。端末内の最大400イベントとJSON出力に加え、同意連動の外部解析コードは導入済みだが、GA4／Worker／D1の本番設定は未完了でproduction inactive。Telemetryはゲーム内イベントであり、Codexの料金・使用量を取得する仕組みではない。

Jev integration：OpenRouter Decisions、`typesafe/jev-1.13`、Shadow Mode。1 findingずつ4質問で次の証拠へroutingする開発toolで、自動Gateではない。詳細の正本は[JEV_REVIEW_RULES](JEV_REVIEW_RULES.md)。

## 新しいゲームタスクの開始

1. `git status --short`、現在のbranchとHEADを確認し、既存の未コミット変更を保つ。
2. CURRENT_STATUSでID・最新報告・残課題を確認する。新規番号を会話から推測しない。
3. 対象仕様、最新改修、manifest、実装、対象テストだけを読む。重複企画は各manifestと過去の[10本比較](TEN_GAME_REVIEW.md)を参考に現行カタログ全体と照合する。
4. 今回の完了条件、変更範囲、検証、レビュー担当を決める。Jevの疎通成功をレビュー合格へ読み替えない。
5. 新タスクではdev server、Chromium、認証情報、一時ログ、`dist/`が存在すると仮定しない。必要なものだけ再準備する。

公開先はCURRENT_STATUSで確認する。ゲーム追加は番号のフォルダ作成だけで完了しない。カタログ・物理HTML・Vite入力・練習・素材・検証・継承記録までを [開発手順](GAME_DEVELOPMENT_RULES.md) に沿って揃える。
