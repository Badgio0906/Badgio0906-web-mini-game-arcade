# 第2段階 Q01 / Q03 / Q04 独立設計レビュー

2026-10-20。レビュー対象は `/workspace/arcade-catalog-cleanup` の既存実装（HEAD `0b6fa55ec98439d57e33d56d017b1b8b9f47e901`、main `619adc35a4339dc5d6f1ddc4e357d5f7eccde991` と対象製品内容が同じ）と新添付指示。実装者とは別にソース、Godot export、生成経路、同意UIを読み取った。これは設計判断であり、修正後の実ブラウザ合格・実機評価・公開承認ではない。本レビューではブラウザ、外部API、Git変更を実行していない。

## 判定

Q01 は **A：元の 960×540 を固定し、実際の canvas 要素全体を iframe 内へ contain**、Q04 は **B：タイトルだけ非モーダル、help/pause/result は既存モーダル**を推奨する。いずれも以下の境界条件と実装後検証を満たす条件付きで妥当。Q03 は表示文だけに限定できる。WASM/PCK、ゲームルール、旧保存、同意仕様、計測イベントを変える必要はない。

## Q01 Game012

### 原解像度の根拠

`public/games/yokodori-days/index.pck` の PCK directory から `project.binary` を読み、リソース MD5 を照合した。ECFG の Variant 値は viewport 960×540、window override 960×540、stretch mode `canvas_items`、scale mode `integer`。タイトル/HUD patch の 960×540 描画とも一致する。画像の見た目からの推測ではない。

- PCK SHA256: `46a9ae5df324babdea9833427da0aeeb80813cf99fd3b787636032335f21f412`
- WASM SHA256: `6498359ba889796a0d95a2f71113ac184badc0f2d84cf28f4103c7e399d2d547`

既存 `game.html` は `canvasResizePolicy:2`。エンジンの policy 2 は browser viewport と DPR に応じて canvas 属性と CSS 寸法を書き換える。policy 0 はその処理を止め、canvas の属性寸法を使用する。したがって **起動前の width=960 / height=540 と policy 0 の組合せが必要**。policy 0 だけでは HTML の既定 300×150 になり得る。

| 案 | 効果と懸念 | 判断 |
|---|---|---|
| A 全体 contain | 画面比率と全オブジェクトを保ち、端末の縦横を問わず同じ engine lifecycle にできる。縦画面では文字・操作が縮小する。 | 推奨。可読性は画像・実操作で判定する。 |
| B 縦画面だけ scale | desktop を維持できるが policy 2 と CSS の制御競合、向き変更時の分岐、内部整数 stretch の挙動差が残る。 | 今回は A より複雑。CSS の overflow 変更だけでは解消しない。 |
| C 横向き専用 | 横向きでは大きく表示できる。回転案内、入力中断、回転中の進行・タイマーの扱いが必要になる。 | A の実機可読性が不足した場合の再検討案。自動的な公開停止理由にはしない。 |

CSS は actual canvas box 自体を 16:9 にする。幅高さが viewport 全面のまま `object-fit:contain` を付けるだけの方式は避ける。engine の mouse/touch は `(client - canvasRectOrigin) × canvasInternalSize / canvasRectSize` で座標変換しており、要素内部だけの letterbox を補正しない。`s=min(iframeWidth/960, iframeHeight/540)` に相当する canvas の CSS 幅高さ、中央配置ならこの変換と整合する。内部属性はリサイズごとに書き換えず、不要な GL 更新を起こさない。

親 shell は header と result 行を除いた iframe 高さを確定する。safe-area もあるため、トップ画面の高さから固定値を引くのではなく **iframe 自身の viewport** に合わせる。native fullscreen は別に確認する。

### 生成経路と監査

`tools/legacy-records-import.py` は元 export の `index.html` を公開 `game.html` として取り込み、bridge を挿入する。公開 HTML だけの手修正では再 import で失われる。012 だけに適用する決定的な adapter を importer と監査から同じ意味で使用し、managed shell の対応ファイルも同期する。元 `sourceSha256` は据え置き、公開 HTML の bytes/SHA と合計 runtime bytes のみ実値へ更新する。他作品の manifest row は変えない。

正確な既存監査箇所は `tests/fourteen-game/audit-legacy-migration.mjs` の `authorizedSourceRebuild()`（元対象行81以降）、`record.sourceName==='index.html'` 内の厳密比較（元行87–94）。現状の許可変更はタイトル/PCK size/bridge だけなので、012 adapter を明示的に適用する必要がある。単純な比較緩和、全 Godot HTML への許可拡大は避け、013/014 とバイナリの保護は維持する。

実装後は 390×844 / 320×568 / 844×390 / 1440×900 でタイトル、native 本番、結果、リトライ、shell 練習、一覧帰還を確認する。canvas 属性960×540・要素比16:9・HUD/ボタンの clip・iframe/safe-area・実際の touch 座標・keyboard・縦横変更・fullscreen を観測する。縦画面の全体表示だけで文字の読みやすさを合格にしない。元の固定 UI を縮小するため、44CSSpx を満たさない操作の有無と実際の判読性を明記する。WASM/PCK/index.js/record bridge と Game013/014 の bytes、旧保存は維持する。

## Q04 Game033

既存 `showDialog()` は title/help/pause/result 全てを `showModal()` で表示する。同意 UI は別の shadow host、z-index 10000 の fixed panel。通常 DOM の z-index を上げても dialog top layer と inert を越えられず、初回同意を操作できない原因になる。

| 案 | 効果と懸念 | 判断 |
|---|---|---|
| A 同意操作後にタイトル modal | タイトル表示が consent state に依存する。later は unknown のまま、保存拒否・再訪・cross-tab 等の分岐も必要。 | 同意を遊ぶための gate に見せる危険と共有API依存が増える。 |
| B タイトルのみ非モーダル | 初期同意・設定・privacy が通常通り操作でき、プレイ中と他 modal の構造を維持できる。 | 最小案として推奨。 |
| C 同意/ゲーム modal 構造変更 | top layer 内への移設等で解消できるが、共有 shadow UI、focus、CMP、他ゲームに影響する。 | 今回には広すぎる。 |

B では各遷移時に **open なら一度 close、その後 title は show()、他は showModal()** とする。既存の `if(!menu.open)` を残すと title→help が modeless のままになる。開いた modeless dialog に showModal を直接呼ぶと InvalidStateError になるため close が必要。

modeless title には explicit な fixed 中央配置・viewport 内 max-height/overflow と z-index（例100）を設け、同意 host 10000 より低くする。UA の通常 modeless 配置へ任せると main の下にずれる可能性がある。modeless に `aria-modal=true` を追加しない。画面全面の独自 overlay で同意ボタンを再び遮らない。

既存 cancelInput、state、menu.open による射出禁止、launch disabled、pointer/keyup cleanup と fresh gesture を保つ。consent shadow は input event 伝播を止めているため、同意操作で本番を開始しないことを確認する。タイトルで mute/help/navigation が操作可能になること自体はこの案の自然な差分。help/pause/result 中の外側設定のアクセス制約は従来通りであり、全 modal の同意アクセスを解決したとは記載しない。

実装後は fresh unknown で grant/deny/later/privacy を開始前に操作、既存 granted/denied、設定再表示/revoke、保存拒否、keyboard Tab/Enter/Esc と touch を確認する。title は `:modal=false`、help/pause/result は true、title↔help の往復、practice、本番、pause/resume、結果/retry、一覧帰還を検査する。同意操作時に run_start/shot が発生しないこと、同意サービス/GA4/Telemetry/CMP/AdSense のコードとイベント仕様、ゲーム model/timing/score/save が不変であることを差分で確認する。

## Q03 表示文

- Game002: 現行 `creditsEnabled:false` と整合する help 文にする。CREDIT/Reward の dormant 分岐やサービス設定、広告/課金/イベントは変更しない。
- Game003: 位置・回転・重心を扱う現在の積み上げルールに lede/操作文を合わせる。物理・得点・保存を触らない。
- Game035: 途中終了が可能なのに結果の定型文が常に「9投」。例えば「3エンドの、小さな駆け引き。」なら既存ルールのまま成立し、実投数算出や履歴変更も不要。単なる文言のために model を変更しない。

新しい日本語は既存 font subset coverage と表示 fallback を確認する。文言変更を操作仕様変更や追加広告の承認に読み替えない。

## 次のレビュー境界

独立した3 branch は main619 基点に限定し、PR11、main/deploy は変更しない。最終判定は各固定候補の差分・対象検証・build・browser 証拠を読んだ後に行う。本書は新実装のテスト成功、人間の遊びやすさ評価、公開完了を主張しない。
