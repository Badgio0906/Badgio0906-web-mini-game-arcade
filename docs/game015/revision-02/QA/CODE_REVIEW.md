# Game015 revision-02 — Independent code / model review

2026-10-05（日本時間）。実装を担当していない QA worker による独立レビュー。対象 HEAD は `482e45825c74ead0d0469b342fe824b82a47ab70` に対する未コミット revision-02。レビュー中の runtime source は変更していない。

## 判定と指摘

**P1 / P2 の実装障害は確認されなかった。** 現行生成、追跡スクロール、通常の DROP / 左右 / ブレーキによる到達、練習の隔離は以下の範囲で確認できた。これを人間の面白さ合格や実機 QA 合格には読み替えない。

- **P3・旧検証スクリプトの更新が必要** — `tests/game015/review-practice.mjs:9` は step 2 に左入力を与えず、同ファイル 23 行はゴーストの `fallDistance >= 9` を期待する。現行 step 2 は中央のトゲを避けて左へ降りる練習で、ゴーストは落下距離 0 のままスクロールに置いていかれる。旧 script は現行 revision の検証に使用できない。revision-02 の unit test と `probe-scroll.mjs` は現在の左練習 / scroll cause を検証している。旧記録を消す必要はないが、旧 script / 旧合格を現行の証拠に流用しないこと。
- **Visual follow-up（非ブロッカー）** — `FallRun.ts:142` の上端死亡は足元基準で、`FallBoard.ts` は同じ位置に天井トゲを描く。24×36 の頭・王冠は足元より早く天井へ重なり、HUD の背後へ隠れる猶予がある。これは見切れ死亡として仕様内だが、見えるトゲの接触と死亡時刻の理解が自然かは近い上端の画像 / 人間操作で確認するとよい。コードだけから Visual 点を付けていない。

### P3 解消追記

同日、main worker が旧 practice review script を改修し `node tests/game015/review-practice.mjs` の PASS を報告した。独立 reviewer は diff と新しい [PRACTICE_PUBLIC_INPUT_REVIEW.json](PRACTICE_PUBLIC_INPUT_REVIEW.json) を読み、step 2 の左入力 / release 後の左方向 drift、ゴーストの `cause === 'scroll'` / 落下距離 0 / camera 進行 / 完了 step 4 を確認した。出力先は revision-02 配下になり、歴史的 QA ファイルを上書きしない。上記 P3 は **解消済み**。元の指摘を経緯として保持する。runtime の再変更はないため、この追記に伴う全テスト再実行はしていない。

## 独立して読んだ範囲

入口 `AGENTS.md`、PROJECT_CONTEXT / CURRENT_STATUS / GAME_DEVELOPMENT_RULES を読んだ後、`FallRun.ts`、`generation.ts`、`types.ts`、`FallBoard.ts`、`main.ts`、`art.ts`、`kingPixels.ts`、`FallPractice.ts`、`PracticeSession.ts`、`onboarding.ts`、対象 unit test と game015 browser probe を読んだ。

確認内容:

- 六つの lane pattern により左 / 中央 / 右へ安全 bay が曲がる。危険な代替足場は同じ row の route 足場と重ならない。中央を含む spike bank は常時有効で、王様の幅 18px を含む sweep collision が働く。移動足場の全振幅 + 5px を spike 配置から保護する。
- 各 row 間隔は安全落下距離内で、横方向の遷移は 66px に制限される。到達可能性の幾何検証だけでなく、実際の通常入力モデルを通した検証が存在する。
- camera は王様が停止していても時間に従って進み、待ち続けると `scroll` で終了する。速度は 18 → 最大 36px/s へ滑らかに増え、1000m は milestone であって終点ではない。
- DROP は今の support だけを無視し、空中連打で次の着地を飛ばせない。全体 delta は最大 50ms、内部は 120Hz の substep。死亡後の追加 step / DROP は結果や end event を増やさない。
- pause / blur / title / end は hold map を消して入力を解放する。復帰時に時計をリセットし、画面を切り替えた pointer gesture の click は epoch guard で防ぐ。これらは今回 reviewer の source read であり、browser native event 実測は main worker の担当。
- 練習は本番 FallRun / Storage / score / CREDIT を保持せず、独立した FallPractice を使う。最初の実着地、右・左の中央トゲ回避、停止ゴーストの追跡死亡の順で進む。step 更新で hold を消し、本番へは独立した成功 button を通る。
- 王冠、白ひげ、紫服、赤マント、金装飾を持つ original pixel source を読むと、要求された idle / drop / falling / left / right / landing / death に hard を加えた八状態が存在する。全16 frame の 24×36、palette token と row 幅を独立検査した。タイトルと本番 / 練習は同じ drawKing を使う。

## 実行した検証

`npm test -- --run tests/unit/game015.test.ts tests/unit/game015-practice.test.ts tests/unit/arcade-practice.test.ts` : **54 / 54 PASS**（22 + 8 + 24）。既存の64 seed × 350m、5000m継続、落下・トゲ・壁針・スクロール境界、練習の左右 / 隔離 / 完了後入力を含む。

追加で reviewer 自身の public input policy を **20Hz outer step、seed 101–132、各500m** で実行し **32 / 32 生存到達**。内部 field / score / time 書換えは使用していない。[記録](INDEPENDENT_CODE_MODEL_CHECK.json) に結果と16 pixel frame の寸法を保持した。

最初の追加 policy は着地時 `|vx| < 7` を待った結果、20Hz の操舵が約 ±9px/s で振動し、seed 101 / 71m で立ち止まって正しくスクロール死亡した。地形の詰みではなく reviewer の厳しすぎる制御条件だった。DROP 条件を `|vx| < 14` に変更して上記32 seedを通した。source は変更せず、この初回失敗を記録から除いていない。

この reviewer はブラウザを起動していない。画像採点、スマートフォン実機、音、親指操作、FPS、長期の人間の面白さは未評価。

## 対象 runtime SHA-256

| File | SHA-256 |
|---|---|
| `FallRun.ts` | `f38683b8c8c5c18eb742d8733496e4bd4d3d4ec1d41baa08ff9764feb3d4c44b` |
| `generation.ts` | `0f06860f5a93f0a92ebbdb81e4c99a4904e8bf0832015664e277b8ebf5a544a6` |
| `FallBoard.ts` | `ccf93b3e56a4854dfb22cca42c4cbc1fe352bd340a0909fb610f70cdcf3815dc` |
| `main.ts` | `d65acdde2babf0e88a977b02974272ebde516a9001e0d3aaba52ef0a3b1b5856` |
| `types.ts` | `924aa7ec0c86a8ecd92d6df0e23eb4ab8b4f5bf1e8b8550dadb007d1855ee6e1` |
| `art.ts` | `77cad45da97049b8ccc5f593fd6a759f9b6cdefe62b4b08fb778ce6a28248fd4` |
| `kingPixels.ts` | `f037c0dc850e8fed3c2747d7207196704224b3bb1c75d1faf0a54aaeb21938e7` |
| `FallPractice.ts` | `cad6341069e27d6bc55681c931a80896db50ec5e276487c5811dc2e071bd6820` |
| `onboarding.ts` | `59479686ee2923de7fdf106d203ed959629bfabdda2f4fbe663dcbb381b06109` |
