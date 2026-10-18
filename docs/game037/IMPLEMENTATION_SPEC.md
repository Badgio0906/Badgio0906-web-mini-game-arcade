# Game037 お弁当つめつめ！ ～BENTO BOX～ — 実装仕様

正本の要件は [ASSIGNMENT](../agent-tasks/game037-claude-full-build-20261018/ASSIGNMENT.md)（Codex確定）。この文書はClaude Codeが実装した固有ルールと範囲を記録する。game037は暫定予約で、Catalog/Vite/Portal/記録/公開への登録は行っていない。

## 体験
- 4×4の赤漆の弁当箱へ、4マス形のおかず4つを**回転のみ（鏡映なし）**で隙間なく詰める有限空間パッキング。
- タイトル → 任意の「遊び方」/「練習」 → 本番6面 → 結果（合計・BEST・面別内訳） → もう一度/タイトル。
- 面クリアは自動で進まない。「次の弁当へ」（最終面は「結果を見る」）で確定移行。
- 制限時間・ゲームオーバー無し。1プレイ90〜180秒は**設計仮説**（人間の実測なし）。

## ピースと面（model.ts）
- 形状はASSIGNMENTの`[x,y]`を正規化して使用。回転は画面座標（y下向き）の時計回り90°: `(x,y)→(-y,x)` → 正規化。
- 食材：I=卵焼き、O=おにぎり、L=海老フライ、J=ウインナー、T=からあげ、S=ブロッコリー、Z=プチトマト。同形は個体ID（`I1`,`I2`…）とラベル番号で区別。
- 本番：`IIOO → OOLL → IOLL → ILTT → ILJZ → JTTS` 固定。練習は`IIOO`の独立RUN。
- exact-cover solver（先頭空きマス被覆の深さ優先、同形の交換対称を除外）で全6面の解の存在を単体テストで再検証。参考：同形を同一視した解の数 IIOO 6 / OOLL 4 / IOLL 8 / ILTT 8 / ILJZ 8 / JTTS 4。

## 規則（すべて`act()`経由）
- `select` 未配置のみ、`rotate` 選択中の未配置ピースのみ（受理時だけ回転数+1）、`place` は盤外=`out`、重なり=`overlap`、配置済み=`placed`を拒否（罰点なし）、`placeCovering`（タップ）は「タップしたマスを、そのおかずの読み順で最初の具が覆う」原点を優先し、合わなければ次の具で合わせる。`remove`は取外し数+1で、そのおかずを選択状態で戻す。
- 時計：プレイ画面が操作可能（pause・dialog・blur・hidden・クリア後でない）間だけ進む。`suspend`は選択も解除。非アクティブ中の操作は`inactive`で全拒否。
- 面スコア `max(0, 1000 - 3*floor(activeMs/1000) - 20*rotates - 50*undos)`。全マス充填の瞬間に時計を止め1回だけ確定。合計0〜6000。
- 練習は`results`を一切持たず、「もう一回練習」で空の練習盤を再生成。

## 入力（main.ts）
- Pointer（mouse/touch/pen共通）：トレイ/盤上の pointerdown → 8px超の移動でdrag開始。ghostはマス吸着（合法時のみ）、プレビューは緑（可）/赤×（不可）。pointerupで`place`。pointercancel/lostpointercaptureは確定しない。
- 盤上の当たり判定はDOMの矩形ではなく**モデルのマス占有**で決定（L/T/S等のbbox空き角は盤面扱い）。
- タップ：トレイ→選択（同じものを再タップで解除）、盤のマス→`placeCovering`、配置済みの具→`remove`。
- キーボード：`1`〜`4`またはTab+Enterで選択（盤にfocus移動）、矢印で位置、`R`回転、Enter/Spaceで配置、Esc＝drag取消→選択解除→休憩。`e.repeat`は全て無視。
- Pointer後に合成されるclick（タッチではdetail 0になる実測あり）は700ms無視し、キーボード起点のclickだけを受理。dragのpointerup後の二重配置はない。
- 画面切替/新面/retryでepochを進め、古いpointerは破棄。pause/blur/hidden/dialogでdragを解除。

## 保存・音・境界
- `web-mini-arcade:v1:game037:best:rules1`（`{"best":n}`, 0..6000の整数のみ有効）と`web-mini-arcade:v1:game037:mute`のみ。読込拒否・書込拒否・破損はメモリfallback、`persistent=false`の時はタイトルに「保存できません」を表示。BESTは6面完走時だけ更新。
- 効果音はWebAudio oscillator（pick/rotate/drop/bad/undo/clear/complete/tap）。初回pointerdown/keydownでunlock、mute=master gain 0、pagehideでclose。
- CREDIT/Ads/Rewards/Analytics/Telemetry/Cloudflare/D1/ランキング/外部POST無し。共有src（core/arcade等）をimportしない。共有navbarの`arcade-navigation.css/.js`はHTMLから読み込むのみ。

## ファイル
- `game037.html`、`src/games/game037/{model,save,audio,pieceView,main}.ts`、`style.css`、`game.manifest.json`
- `tests/unit/game037-model.test.ts`、`tests/unit/game037-save.test.ts`
- `tests/game037/{vite.config.mjs,chrome.mjs,browser.mjs}`
- 素材：`assets/game037/source/*.svg`（原本）→ `assets/game037/tools/build-assets.mjs` → `public/assets/game037/*.svg`（配信）。[ASSET_INDEX](ASSET_INDEX.md)
