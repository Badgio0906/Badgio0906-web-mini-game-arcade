> **2026-10-19 訂正：新作038という扱いは撤回済み。** 対象は一覧表示014／内部game017の改良。[現行の改良候補](../game017/revision03/HANDOFF.md)を参照。以下は移設前の履歴で、旧pathや未push状態を現状と混同しない。

# 雨を避けて帰ろう — 初期実装報告

今回の指示（2026-10-18 JST）でGame038を予約。feature/game038-rain-umbrella、main9e96d55→Game037/003採用準備cab8befを基点とする。初期製品c8c47d6、独立finding修正7d0287b、表示幅調整963956a。未push/新規PR未作成/main未反映/未公開。正式完成や人間合格とは扱わない。

## 仕様と素材

[仕様](IMPLEMENTATION_SPEC.md)→[画面ラフ](SCREEN_ROUGH.md)→[asset設計](ASSET_PLAN.md)→[実prompt](IMAGEGEN_PROMPTS.md)→実生成→最小実装→調整→QAの順で進めた。既存Game017背景の原本/配信WebPをread-only参照し、元bytes/SHAは維持。元ルート描画ゲームのコードやルールを転用せず、実時間3ライン/動く傘/属性得点に分離した。

OpenAI ImageGen実2回。Image Aとして既存背景を必ず渡し、人物3×3と家/小物2×2の透過atlasを生成。原本2PNGをGit管理し、独立Art Directorのalpha/セル境界確認を受けて14WebP計501092bytesへ技術的crop/trim/縮小。等分rowでは傘が切れるためy420/y834、家右柵はx810まで保持。[採用indexとSHA](../../assets/game038/ASSET_INDEX.json)。ImageGenモデル版・token/費用はツールから取得できずUNKNOWN/null。使用済みの生成を手描きと偽らず、未生成を生成済みとも書かない。新背景は生成していない。

主役の閉じた傘は保護しない。開いた傘は同じlane・足元xの半径0.62mだけを保護し、足元楕円と上/中/下ラベルで示す。累計3秒で失敗、傘で乾かない、90秒/180mで帰宅。相手ごと一回だけ+150/−120等、最近接/同距離IDの順で相手を選ぶ。正確なbalance/人数は初期値で人間試遊待ち。

PC上下/W/S、3ボタン、路面tap/上下swipe、title/help/実練習/play/pause/result/retry。時計はforegroundの差分を捨てず最大1/120秒で処理、pause/blur/hiddenで停止、復帰基準を更新。保存は038だけのbest-r1/mute/learned、拒否時はmemory fallback。練習は点数/BESTに影響しない。帰還先は未登録prototypeのため公式一覧。038を本体Catalog/Viteへ追加していない。

## 修正と証拠の境界

初回unit1件失敗は負点テストが「2番目=tough」と誤認したfixture。実定義の4番目まで通常model進行して負点と一回性を確認し、原logを保持した。独立Gameplay reviewerは初期練習が放置でも成功する問題を発見。新規REDを作成し、別ラインの新しい傘で保護された乗換え1回以上を成功条件に追加した。同じprobeでidle失敗/通常練習成功を再確認し、UIはlesson未達とwet失敗を区別する。

初回実画像ではdesktop操作部が画面下へ出たため高さ予算を調整。独立Art Directorがlaneの見分けにくさを指摘し、線/上中下ラベルを追加。最後にstreetの横幅を親領域に合わせた。元背景ファイルは編集していない。既存の初回画像は別名で保全。

独立model/source/input-handler仮DOMのQAは[INDEPENDENT_QA](INDEPENDENT_QA.md)。仮DOMと純粋simulationを実ブラウザや人間Feelにしない。元生成物と初回画像の独立viewは[ART_REVIEW](ART_REVIEW.md)。実ブラウザ最終結果・最終Visualは以下の追補を参照。

## 費用・公開・残課題

PUBLICを実確認、Pages(main push) build/deployとPR validateのrunnerはすべてubuntu-latest、matrix/reuse/workflow_runなし。今回branch単独pushに既知workflowは反応せず、PR作成/更新ならvalidateが動く。main反映ならPages公開まで連動する。npm cache/Pages artifactがあり、Webhook403で外部GitHub Apps/build/deployや各契約/保存量条件を確認できないため無料とは判断できずpushを止めた。確認に必要なのはWebhook/Apps設定と該当サービスの使用量/上限/契約。料金回避の公開化やworkflow無効化等を行っていない。

新PRの依頼は[原稿](PR_DRAFT.md)で具体化したが、push条件未確定のため未作成。既存PR9/8も変更しない。Actions手動起動/再実行/既存job取消、main merge、Pages/Cloudflare/Railway deployを行っていない。Jev/OpenRouter APIは今回0回で、findingは独立local review/REDと通常QAで扱った。Analytics/Cloudflare/D1/広告/CREDIT/Secretの変更0。

本人の楽しさ/初見難度、物理スマホ、Safari、実音/FPS、GitHub CI、公開環境、正式完成は未実施。[人間試遊](HUMAN_PLAYTEST.md)。今回の実装は背景基準の最小playableであり、NPC密度・得点・難しさ・sprite歩行差分などは試遊後の調整候補。

## 最終ローカル検証

- `npm ci --ignore-scripts`で依存を準備。Node24.19.0/npm11.9.0。`npm run check`、`npm test`は1125件/106files成功（うち038は15件）、通常`npm run build`成功。038は通常buildに入らず、037は入る。最後の製品変更は963956aの表示幅CSSだけで、logicは7d0287bと同一。独立単体再検査も15件成功。
- `npx vite build --config tests/game038/vite.config.mjs`成功。最終配信asset/JS/CSSのSHAはQA/BUILD_HASHES.json。既存の大bundle warningを基準変更で隠さず保持した。
- `RAIN038_REPORT=docs/game038/QA/browser-fixed node tests/game038/browser.mjs`は**77/77成功**。1280×800、390×844、320×568、844×390のtitle/9秒実練習/3秒濡れ失敗/retry/pause/即時Escape復帰/別gesture本番/学習・mute再読込。4幅とも44px以上の操作がviewport内、横overflowなし。
- PCとtouch390は実90秒/180m帰宅、1910点、BEST保存。濡れはPC約0.0102秒/touch0秒、各27回乗換え。練習は各3回乗換え/score0、BEST未保存。320/844は本番約6.64/6.70秒でpauseまでで、90秒完走は未実施。保存拒否UIは390だけ、ほかはモデル確認。帰還は公式URL hrefの確認だけで実到着は未検査。
- ソース8ファイルのbefore/after/current SHA一致、pageerror/外部request/POST0。DEVのsnapshotは読み取りだけで状態・時計を変更せず、キー/タップ/実touch swipeで操作。snapshotから案内傘を選ぶAI自動操作であり、人間の認知/反応/難度ではない。
- 同じ最終assetの**compiled20/20成功**（4幅のtitle/3秒失敗/retry可視/noDEVhook/nooverflow、pageerror/外部/POST/HTTPerror0）。実行内容を`tests/game038/compiled.mjs`へ再現可能なstandaloneとして保存。通常unit/CIに重いbrowser起動は追加しない。
- 最終独立Visualは実29PNGと連続3frameを見て**81/100、F12/15、H12/15**。[VISUAL_REVIEW](VISUAL_REVIEW.md)。サンプル位置の連続性は確認したが、連続FPS/滑らかさ/実音は未評価。[技術的Feelの独立読解](GAME_FEEL_REVIEW.md)も自分のlive操作/人間の楽しさを主張しない。

[保護領域・背景SHA](QA/PROTECTED_SOURCE.json)では他ゲーム本体、既存背景、Analytics/Cloudflare関連Worker/広告/CREDIT/CI等はorigin/main比で空差分。許可された037/003採用の共通差分と新038ファイルを分けて管理する。[push費用監査](QA/PUSH_COST_AUDIT.json)はcostClearance=false/UNKNOWNのまま。GitHub CI・main統合・公開・人間/物理端末は未実施。

長い結果見出しの改行、小さい人物の重なり、単一歩行poseと簡易揺れ、家の一部が終了パネルで隠れる点は初期品質の制約。レア人物の瞬時判別や通行人数/得点/3秒の厳しさは人間試遊後の調整候補として残す。
