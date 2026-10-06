# Game008 配達改修 — 実装者報告

両手で支える木のトレー、白い陶器、取っ手・内側・独立液面を描くオリジナルCanvasへ改修した。180m配達の慎重／急ぐ切替、固定予告された段差／曲がり／継ぎ目、32秒締切、成功後の任意2カップ追加配達を実装。ID・英題・液体の慣性・左右長押し・mute保存・無料プレイを維持。旧 `best` は読取のみ、新scoreは別 `best-delivery-v2`。古い3杯／無限距離／旧称号システムは現行から除いた。素材原本・旧背景は保持。

5単体テスト PASS。共通 `npm run check` は実行時成功。モデル同一balance policy比較：慎重のみ128m/32.004秒/0点、急ぎのみ180m/22.504秒/残40.832%/1788点、混合180m/29.25秒/残100%/2110点。急ぎのみも成功し得るが残量と得点が下がる。予告は16m、急ぎでも最低2秒。2カップ、非配達0点、choice時間停止、終端一度、練習、コピー／不正dtも確認。

固定snapshot5238の通常キー／native CDPtouchで、PC1440×900は2104点/1杯、390×844は6224点/追加2杯・計3杯配達、320×740は2129点/1杯、844×390は2106点/1杯。全HTTP/console0、pause中snapshot exact不変、旧BEST777不変、新BESTとmute OFF再読込一致。[4画面原本](QA/native-isolated/report.json)。選択はreadonly state feedbackの自動policyで、人間の認知や反応ではない。

[PC/phone実練習と境界](QA/boundaries/report.json) PASS：左右の実傾き・速度切替・段差を慎重に越える成功、練習に本番run_start/endなし、キーとpointerの相殺、pointer解除／native touchCancel、Space repeat、headerfocus、blur後時計freeze、resize保持、retry初期化、保存拒否。blurは合成のブラウザ境界イベントであり、実OS評価ではない。

初回一覧リンクphone42/320幅37pxを見つけmin44に限定修正。段差を厚い縁、継ぎ目を破線、曲がりを矢印に描き分ける限定art修正も加えた。[全4画面title/play/pause](QA/layout-final/report.json) は主要操作44px以上・viewport内・asset/console0。配達モデル・入力・main・HTMLはnative RUN以後不変。[ソース一致](QA/FINAL_SOURCE.json)。

最初の共有server試行はHMRを避けるため中断。次のsnapshot5218は競合して5219へfallbackしたのにcollectorが5218を使いconnection refused。どちらも原本保持、正式PASSへ流用しない。[分類](QA/FAILURE_CLASSIFICATION.md)。snapshot全src buildは他018途中ソースのunused reducedで失敗し、008型失敗と混同しない。対象だけのsnapshot型check／単一HTML Vite buildは別ログ [build-targeted](QA/build-targeted.log)。最終横CSS修正後の対象buildは [build-targeted-final](QA/build-targeted-final.log)。最終全7build/公開はroot統合証拠で確定する。

[Visual Brief](VISUAL_BRIEF.md)、[素材](ASSET_REPORT.md)、[仕様](IMPLEMENTATION_SPEC.md)、[人間確認](HUMAN_PLAYTEST.md)。ImageGenは実行していない。rootが4状態の方向を実viewし採用可とした。実装者以外のelevator reviewerへ固定sourceを渡し、正式Feel/Visualを依頼済み。独立 [Visual](VISUAL_REVIEW.md) は84/100、F13/H12でPASS、[Feel](GAME_FEEL_REVIEW.md) は技術成立PASS。initial横stretchは81/F11/H11で不合格原本を保持、器/腕のaspect維持とbalanceをleftletterboxへ移す限定CSS修正後、掌を覆わない横を別実viewした。[最終全4layout](QA/layout-palms-clear/report.json) も44px/viewport/HTTPconsole PASS。23実view画像を独立台帳へ保存した。workerからJev APIを実行していない、rootが文章観測のShadow整理を担当。人間の楽しさ・実スマホ親指・音／FPSの体験評価は未実施。

rootの対象7専用追加fontはまだ未統合。既存正しい /fonts/arcade-rounded-jp.woff2 配信で上記を検証し、新fontの限定字形/layout確認と全7統合build/公開はrootの残工程。

再実行はrepoの対象sourceからViteを起動して `GAME008_URL=http://127.0.0.1:選んだ空きport node docs/seven-games-2026-10-06/game008/probe-native.mjs` とする。probe-boundaries／probe-layoutも同じGAME008_URLを使う。長RUNはsrc/public/HTML/configを別snapshotへコピーし、node_modules symlinkと固有cacheDir、--strictPortで対象を固定する。QAの既定出力へ上書きしないためGAME008_QA_OUT / GAME008_BOUNDARY_OUT / GAME008_LAYOUT_OUTを新pathへ指定する。一時serverや/tmpが存在することは再開の前提ではない。
