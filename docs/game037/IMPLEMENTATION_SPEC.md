# Game037 お弁当つめつめ！ ～BENTO BOX～ — 実装仕様

## Rules v2（2026-10-18 作者の直接指示・現行）

> 作者（ユーザー）がClaude Codeへ直接指示：「6面まで進んだら4×4を5×5にして、それも6面クリアしたら6×6…と難易度が上がる形態に」「8×8までで終わり」「4マスの弁当の具にこだわらず5マスとか8マスとか、それに合わせて幅を広げて」「claudeにて実装」。ASSIGNMENTの「6面固定・面の追加禁止・0〜6000点」はこの指示で置き換わる。ASSIGNMENT本文の改訂はCodexの担当のため、HANDOFFの `integration_requests` に記載した。以下が現行仕様で、後続の「v1」節は4×4部分の元仕様として残す。

- 箱：**4×4 → 5×5 → 6×6 → 7×7 → 8×8**、各6弁当・全30弁当。各弁当の後は従来どおり「次の弁当へ」で確定移行し、箱が変わる時はボタンが「5×5の箱へ」等になる。
- 4×4の6面はv1の固定テトロミノ面（`IIOO`…`JTTS`、ID・食材の割当も同じ）。
- 5×5〜8×8の24面：固定seed（`size*1000 + j*37 + 11`）の乱数で箱を**ランダムなタイル分割**して作る（`generateStage`）。だから必ず解がある。分割の条件：
  - おかずのマス数 5×5:4〜6、6×6:4〜7、7×7:5〜8、8×8:6〜8。
  - 1つのおかずは4×4の枠に収まる形（トレイで読める大きさ）、穴なし、1弁当あたり最大10個。
  - 出題時の向きはseedでランダム回転、トレイ順と食材もseedでシャッフル（Fisher–Yatesで全ブラウザ同一）。
  - 30面すべてを単体テストで「保存した解がexact cover」かつ「solverが鏡映なしで解を見つける」と再検証。
- 食材10種：卵焼き・おにぎり・海老フライ・ウインナー・からあげ・ブロッコリー・プチトマト・焼き鮭・枝豆・ハンバーグ。同じ食材が2つ出る時はトレイ番号付きの名前。
- 得点（1弁当）：`max(0, 1000 - round(48*floor(秒)/マス数 + 80*回転/おかず数 + 200*取外し/おかず数))`。4×4・4個ではv1と完全に同じ（1秒−3・回転−20・取外し−50）。大きい箱は手数が増える分だけ減点が薄まる。無効な置き方は減点なし。合計0〜30000。
- BEST：本番で**弁当を1つ完成させるごと**に、その時点の合計がBESTを超えれば更新（`{best, cleared}`）。途中でやめても、そこまでの記録が残る。
- つづき：箱を1つ終えると「次の箱の1弁当目」から続けられるcheckpointを保存。タイトルの「つづきから（N×Nの箱）」で、それまでの成績を持ったまま再開する。全30弁当を終えるとcheckpointを消す。「すぐ遊ぶ」は常に4×4から。
- 保存キー（rules2）：`web-mini-arcade:v1:game037:best:rules2`、`web-mini-arcade:v1:game037:checkpoint:rules2`、`web-mini-arcade:v1:game037:mute`。v1の `best:rules1` は読み書きしない（そのまま残す）。保存拒否時はページ内メモリで継続し「保存できません」を表示。
- 練習：4×4の`IIOO`のまま。記録・BEST・checkpointに一切影響しない。
- 操作：数字キーは `1`〜`9` と `0`（10個目）。盤面は任意のn×n、当たり判定・吸着・プレビューはモデルのマス占有で判定。
- 結果画面：箱ごとの小計（5行）と合計・BEST。
- 表示：上部の情報（箱と面・時間・この弁当・合計）は2×2の固定配置。数字の桁が増えても折り返さず、プレイ中に盤面が動かない。

## Rules v1（4×4・6面。上記v2で置換済みの部分あり）

v1の正本要件は [ASSIGNMENT](../agent-tasks/game037-claude-full-build-20261018/ASSIGNMENT.md)（Codex確定）。この文書はClaude Codeが実装した固有ルールと範囲を記録する。game037は暫定予約で、Catalog/Vite/Portal/記録/公開への登録は行っていない。

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
