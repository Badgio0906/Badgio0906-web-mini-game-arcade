<!-- Current release evidence is linked first; older sections below retain historical QA. -->
# WEBミニゲーセン — WEB MINI GAME ARCADE

次のタスクは[CURRENT_STATUS](docs/CURRENT_STATUS.md)と[統合改修報告](docs/integration-2026-10-05/IMPLEMENTATION_REPORT.md)から再開してください。正式URLはhttps://game100garage.com/。019の追加、落下キングの距離選択／連続降下、靴とばその少年と回転、全ゲーム開始3択、タグと端末内記録を公開済みです（2026-10-06日本時間）。AdSense所有確認scriptは独立PRで追加済み、Google側の確認／審査は未確認です。

短時間で遊べる異なる体験を集めた静的Webゲームセンターです。nativeゲームと元UIを保持した旧Godot3本を収録。公開済み19本の検証範囲は、上記の報告を参照してください。

**[ゲームセンターを遊ぶ](https://game100garage.com/)** ／ [負けじゃんけん](https://game100garage.com/game016.html) ／ [落下キング](https://game100garage.com/game015.html) ／ [蛙ゲーム](https://game100garage.com/game019.html)

## Codex Cloudで新しいタスクを始める

[AGENTS.md](AGENTS.md)を入口に、[PROJECT_CONTEXT](docs/PROJECT_CONTEXT.md)→[CURRENT_STATUS](docs/CURRENT_STATUS.md)→対象ゲームの最新仕様／改修報告を読んでください。会話や前タスクの一時ファイルは必要ありません。

| 参照先 | 内容 |
|---|---|
| [PROJECT_CONTEXT](docs/PROJECT_CONTEXT.md) | 目的、コード構造、必要な文書を選ぶ地図 |
| [CURRENT_STATUS](docs/CURRENT_STATUS.md) | 全ゲーム、route、現行例外、公開・検証済み版、残課題 |
| [GAME_DEVELOPMENT_RULES](docs/GAME_DEVELOPMENT_RULES.md) | 企画、実装、素材、レビュー、QA、作業ログと引継ぎ |
| [GAME_COMMON_SPEC](GAME_COMMON_SPEC.md) | 保存、CREDIT、練習、入力、計測、配信の現行境界 |
| [JEV_REVIEW_RULES](docs/JEV_REVIEW_RULES.md) | JevのShadow評価、実測、用途と再開条件 |

## 起動・ビルド

Viteの必要Node.jsは20.19以上または22.12以上。CIはNode.js 24です。

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
npm run preview
```

`dist/`にnativeゲームの物理HTML、画像／ローカルfont、旧Godotの静的exportを出力します。ログイン・ゲーム用サーバー・本番広告は不要です。現在CREDITは無効で、保存残高0でも何度でも遊べます。

検証コマンドは[開発手順](docs/GAME_DEVELOPMENT_RULES.md#検証の選択と証拠)から対象を選びます。古いe2eの期待値やreportの上書き先に注意してください。最新の248単体・公開検証の成績と人間評価の未実施範囲はCURRENT_STATUSへ集約しています。

GitHub Pagesは[workflow](.github/workflows/pages.yml)で`main`へのpush時にnpm ci→test→build→deployします。公開先、最新run、旧3サイト停止の403と再開条件は[現状](docs/CURRENT_STATUS.md)を参照してください。

## 仕様と履歴

原始企画は[PROJECT_BRIEF](docs/PROJECT_BRIEF.md)、10本時点の共通DRAFTは[archive](docs/archive/GAME_COMMON_SPEC_2026-10-04.md)、11本時点の練習候補は[履歴草案](docs/eleven-game/COMMON_SPEC_NEXT_DRAFT.md)。生成・採用原本、独立レビュー、初回失敗、公開証拠は元の場所に保持しています。履歴の本数・配点・CREDIT設定を現行仕様と混同しないでください。
