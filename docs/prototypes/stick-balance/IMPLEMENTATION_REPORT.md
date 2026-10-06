# 棒バランス独立試作の引き継ぎ

**本番未変更・未統合。ユーザー試遊後に本体担当へ返す候補。** 既存Game008を置換していない。mainへのpush/merge、本番deployなし。他タスクの変更の取り込みなし。

分岐元は `c0c294120bc5a5a6e228819dc9b5120eeff64d84`。作業開始時にorigin/mainとローカルHEADの一致を確認。ブランチ `codex/stick-balance-prototype`。実装・検証固定コミットは `bee6240`。この後の引き継ぎ追記は文書のみ。ソースhashは下記の固定記録参照。

## 試遊

```sh
git switch codex/stick-balance-prototype
npm ci
npm run dev -- --port 5173
```

`http://localhost:5173/prototype-stick.html` を開く。PCは←→ / A・D、スマホは下の左右ボタン。音は任意でON。風やアイテムはなく、倒れたらもう一回。タブを離れたりリサイズした場合は「つづける」で再開する。

専用配布ビルド（公開用 `npm run build` には試作を追加していない）:

```sh
npm run check
npx vite build --config vite.stick.config.ts
node tests/prototypes/stick-package.mjs
npx vite preview --config vite.stick.config.ts --host 0.0.0.0 --port 5174
```

`http://localhost:5174/prototype-stick.html` または `/play-standalone.html`。`artifacts/stick-balance/play-standalone.html` はCSS/JSを内包する約19KBの持ち出し用成果物。配信時の外部素材要求なし。環境の管理ポリシーがfile://を拒否したためダブルクリック起動は未確認、HTTPで検証。必要なら `python3 -m http.server 8000 --directory artifacts/stick-balance` でも再生できる。稼働中サーバーを引き継ぎの前提にしない。

## 採用した内容

[採用仕様と素材出典](IMPLEMENTATION_SPEC.md)。120Hz固定刻みの倒立棒、手の加速と離した時の制動、12秒ごとの5段階短縮、2秒予告・2.4秒の連続伸縮。長さが角加速度に反映される。スコアは生存秒数。手・指・前腕・接触影・太さの異なる伸縮筒はオリジナルSVG。ゲーム共通機能への接続なし。

レビューで手の表示が累積移動により飽和する問題を修正し、追従カメラへ変更した。320pxとPC低画面のはみ出しを修正。危険からの立て直しが最高速度に阻まれたため、加速度を維持して最高速度を2.8→6.4m/sへ調整。最初の細かな操作は変えず、長く追いかける余地を増やした。この値は人間試遊後の調整候補。

## 検証と限界

- TypeScript `npm run check` PASS。lint script/configは存在しないため別lint未実施。
- 公開側 `npm run build` PASS。既存CSSの `and(` 構文警告2件とPhaser chunk警告あり（対象外、変更なし）。専用build PASS。compiledにはread-only dev診断が含まれない。
- 新規モデル7件（時間刻み、左右、全短縮境界、難度、押しっぱなし、初期放置、回復、リセット）と既存008の5件を確認。全単体は42ファイル352件PASS（`npx vitest run --maxWorkers=1`、`QA/UNIT_FINAL.txt`）。初回はブラウザ並行実行下で既存5件timeout、`QA/UNIT_INITIAL.txt`を保存し、worker1で独立再実行した。テスト期待値や既存ゲームは変更していない。
- `QA/BROWSER.json`：PC/phoneで開始、通常キーによる全5段階、ポーズ、blur、resize、失敗、各3回リトライ、CDP touchの移動/離し/cancelとスクロール0。100ms周期のモデル予測controller＋仮想時間であり、人間の操作能力の証明ではない。読み取りだけでstate注入なし。
- `QA/RECOVERY.json`：通常A/D入力で左右それぞれ約±.56rad以上から回復。`QA/PHYSICS.txt`：無操作の落下時間は長さ順に3.642/3.275/2.883/2.500/2.117秒。すべて初期条件共通、段階固定の測定。短い棒ほど応答が速い。長短の本人難度評価とは別。
- `QA/COMPILED.json`：専用buildと単独HTMLをHTTPで開始/入力/落下/リトライ、diagnostics不在、pageerror0。
- `QA/LAYOUT.txt`：1366×900/1366×768/390×844/320×568/844×390の操作下端がviewport内。各画面の画像、全段階、予告/短縮途中、危険/回復/ポーズ/落下を保存。
- 独立レビューは [INDEPENDENT_REVIEW.md](INDEPENDENT_REVIEW.md)。最終81/100、F13/H12でVisual PASS。初回HOLDや失敗の経緯を保持。描画画像での確認を、すべての実機合格とはしない。
- Jev4findingはShadow記録のみ（`QA/JEV_SHADOW.jsonl`、`QA/JEV_SUMMARY.json`）。自動公開判定なし。独立判断とNEXT_EVIDENCE等に不一致あり。Jev結果で人間の面白さを判定していない。
- [人間試遊待ち](HUMAN_PLAYTEST.md)：iOS/Android実機の親指感覚、音、FPS、実際のタブ切替復帰とブラウザUI伸縮は未確認。2タブの実操作を試したがheadless Chromiumは背景タブもvisibleのままで、実タブ非表示の再現はできなかった（`QA/TAB.json`）。非表示ハンドラーは実装済み、ブラウザQAのblur/resizeは技術的なイベント確認。本人の面白さ評価は未実施。

## 変更ファイルと統合の注意

- `prototype-stick.html`、`vite.stick.config.ts`：独立エントリー/専用ビルド。
- `src/prototypes/stick-balance/{model.ts,main.ts,style.css}`：物理・描画・入力・UI。
- `tests/unit/stick-balance.test.ts`、`tests/prototypes/stick-*.mjs`：モデルとブラウザ・配布検証/再現用実験。
- `docs/prototypes/stick-balance/`：仕様、レビュー、QA、素材出典、試遊項目、引き継ぎ。
- `docs/CURRENT_STATUS.md`：未統合試作へのリンクのみ。本番反映済みの更新ではない。

本体へ統合する際は当時のmainを本体担当が再確認し、Game008旧データとスコア意味の非互換、練習導線、計測イベント、保存key、カタログ/manifest、公開build、画像を別途設計・回帰確認する。本試作の単独HTMLや診断をそのまま本体へ載せない。既存広告、CREDIT、計測、ランキングをこのブランチから変更する理由はない。本人の採用判断なしに本体へ置換しない。

ソース固定hashは [QA/SOURCE.json](QA/SOURCE.json)。実行記録は [WORK_LOG.jsonl](WORK_LOG.jsonl)。
