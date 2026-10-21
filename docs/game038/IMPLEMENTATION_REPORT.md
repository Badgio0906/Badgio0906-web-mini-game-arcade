# Game038 6万分の1 — 実装報告（Claude Code、2026-10-21）

状態：**ゲーム固有実装は完了・未統合**。Catalog / Vite / Portal / 記録 / サムネイル / CURRENT_STATUS は未変更（Codex統合担当の所有）。本番未公開。人間試遊は未実施。

- branch：`claude/game038-one-in-60000`（base main `ac5304fa81361f592942c472c7fa04f668d3b4bc`）
- 仕様：[IMPLEMENTATION_SPEC](IMPLEMENTATION_SPEC.md)　引き継ぎ：[HANDOFF](../agent-tasks/game038-one-in-60000/HANDOFF.md)

## 追加ファイル

| path | 内容 |
|---|---|
| `game038.html` | 物理HTML（設定画面・活動画面・記録カード、共通ヘッダー） |
| `src/games/game038/model.ts` | 純粋モデル：生成（seed付き乱数）、月次の成長・状態・重点・隠れた適性と視聴者の反響、28種の決断＋引退判断、問いかけ、終わり方、同期、6万人中の順位、要約 |
| `src/games/game038/save.ts` | 保存の検証（進行中の活動・履歴10件）とメモリfallback |
| `src/games/game038/main.ts` | DOM UI・速度制御・おまかせ・決断ダイアログ・記録カード・音・Telemetry |
| `src/games/game038/style.css` | PC／縦スマホ／320px／横向き短辺 |
| `src/games/game038/game.manifest.json` | Genre・Core Mechanic・着想元・モデル・保存 |
| `tests/unit/game038-model.test.ts` | 単体テスト13件 |
| `tests/game038/vite.config.mjs`・`browser.mjs` | 単独ビルド設定と通常入力のブラウザ検証 |

## 実行した検証（Windows 11 / Node v24.19.0）

| コマンド | 結果 |
|---|---|
| `npm run check` | 成功 |
| `npx vitest run tests/unit/game038-model.test.ts` | **13/13 PASS** |
| `npm test`（全体） | game038以外で既知の失敗のみ。`catalog-publication`・`legacy-shell-delivery`（Windows作業ツリーのCRLF化によるハッシュ差。`git ls-files --eol` が `i/lf w/crlf`）と、並列実行時だけ落ちる `analytics-codex-fetch` の1件（単体実行では16/16 PASS）。いずれも本変更と無関係。Linux CIで要確認 |
| `npm run build` | 成功（game038は未登録のため出力に含まれない＝想定どおり） |
| `npx vite build --config tests/game038/vite.config.mjs` | 成功（JS 99.37kB / gzip 37.22kB） |
| `node tests/game038/browser.mjs` | **4/4 PASS**（desktop 1365×900、phone 390×844、small 320×640、landscape 844×390）。[results.json](QA/browser-20261021/results.json) |

ブラウザ検証で通常入力によって確認した内容：タイトル→練習（半年）→本番の設定画面→名前を自由入力（`<i>ひかり</i>&amp;` を入力し、タグとして解釈されないこと）→ジャンル選択→デビューカード→速度・停止・重点ボタン→再読込で同じ月から休憩画面→決断と問いかけ（ひとこと入力）を最後まで→最後のひと声→活動の記録カード（名前・6万人中◯位・ひと声）→1回だけ記録→ボタン44px以上・横スクロールなし→もう一度デビューで前回の名前が入る、page error 0。4画面の結果は 契約終了／12年目／転生 などに分かれ、2画面で目指したジャンルと最終的な方向性が違った。

## バランス確認（おまかせ2000人分、開発中のvitest集計。一時ファイルはcommitしていない）

最初の版は全員が12年続いて10万人を超え、方向性もほぼ変わらなかった。成長の頭打ち・自然な登録解除・楽しさの平均回帰・暮らしの変化による引退・ジャンルごとの隠れた適性を入れて再調整した。最終：活動期間の中央値64ヶ月、最高登録者の中央値769人、1,000人以上44%、1万人以上9.8%、10万人以上0.7%、方向性が変わる割合約25%。人間が狙って遊ぶと、これより伸びる想定。

## 検証で見つけて直した問題

1. **IDの重複**：タイトルの「デビューする」ボタンと活動画面のセクションがどちらも `id="play"` で、活動画面のどこを押しても設定画面へ戻っていた（`elementFromPoint` とイベント追跡で特定）。セクションを `stage` に変更。
2. 1ヶ月目の問いかけが初配信イベントと、12ヶ月目の問いかけが周年イベントと重なっていた → 問いかけを2・13・37・61ヶ月目へずらした。
3. 方向性が目指すジャンルからほぼ動かない／全員が大成功する → 上記のバランス再調整。

## 未実施・制約（PASS扱いしない）

- 独立したFeel／Visualレビュー：未実施（実装者がスクリーンショットを確認しただけ）。
- 実機・音・長時間の面白さ・「6万分の1」らしさの評価：未実施。
- 登録者分布は実データではなくゲーム上の仮定（遊び方に明記）。
- 画像生成：未使用（CSSとemoji）。正式サムネイル：未作成。
- Jev Shadow：未実行。Codexの `ASSIGNMENT.md` なし。
