# WEBミニゲーセン — WEB MINI GAME ARCADE

公開工程の最新状態：[Game018公開記録](docs/game018/PUBLICATION.md)。新環境で248単体・check・buildと017／018のPC／phone導線を再検証済み。Pagesの転送先 `game100garage.com`は意図したURLですが、転送先へのCloud通信許可待ちで018はまだmainへ反映していません。

短時間で遊べる異なる体験のゲームを集めた、静的Webゲームセンターです。017までmain反映・Pagesデプロイ済み、018を含む18本の公開前候補の技術検証を完了しました（[RAINSHIFT公開記録](docs/game017/PUBLICATION.md)／[018引き継ぎ](docs/game018/PUBLICATION_HANDOFF.md)）。公開URLへの通信制限が残り、実表示の最終確認は次環境へ引き継ぎます。nativeゲームと、元のUIを維持して移行した旧Godot3本を収録しています。

**[ゲームセンターを遊ぶ](https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/)** ／ [負けじゃんけん](https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/game016.html) ／ [落下キング](https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/game015.html)

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
