# Game032 — 実装・試作公開報告

最新改修：[revision01 — 少年・2釣法・水槽](revision01/IMPLEMENTATION_REPORT.md)。以下はprototype-1公開時の履歴。

2026-10-10 JST。**実装・技術QA・公式試作公開の照合完了。** https://game100garage.com/game032.html 。runtime commit `44a7608cdd43066dc970b62278ce7f2f7ae97438`、[公式Pages run38034974805](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/38034974805)のbuild／deploy成功。186配信file SHA一致・公開4画面72項目／page error0／POST0。[公開証拠](QA/PUBLICATION.json)／[配信版](QA/public-version-02/VERSION.json)／[公開操作](QA/public-browser-01/REPORT.json)。開始時base `a6ee162c3988214e1556719f3802ebc14b57efd0`、専用branch `codex/game032-river-fishing`。

## 実装

「川辺で、ひとやすみ。 ～RIVER SIDE FISHING～」：4地点、距離チャージ、前／本アタリ、合わせ、強い引きで緩めて弱い引きで巻く、6魚種＋希少な主、得点・最大魚・釣果内訳・称号、活動時間5分本番、別の時間無制限練習。本番完了だけ個人BEST保存。説明／練習スキップ、Pause・非表示の入力／時計解除、PC keyboard・mouse、スマホtouch、共通帰還とPLAY優先Portalに接続。[仕様](IMPLEMENTATION_SPEC.md)／[モデル](MODEL_SPEC.md)。

既存TypeScript/Viteと軽量Canvasを採用、新規依存なし。実OpenAI ImageGen3回で背景、自然な釣り人8ポーズ、魚6画像を制作。追加指示後の監査では原本C2PA metadataにGPT Image系統の`gpt-image`表記を確認したが、正確なモデル版は公開されておらずGPT Image 2.5とは断定しない。生成前tool検索と後のSkill／metadata監査を区別し、Art Directorが実ゲーム7画像と原本を比較した。配信15WebP合計1,180,616bytes＋実ゲームcanvasからの640×360サムネイル77,656bytes。生成prompt・原本・最適化・18画像SHA・出典・権利確認範囲は[Art](ART_DIRECTION.md)／[RIGHTS_NOTE](../../assets/game032/RIGHTS_NOTE.md)。川の主は大きなニジマスの絵を共用。既存OFLフォントのsubsetを旧文字保持で拡張。水音／鳥声／SEは独自コード合成、音量・muteを保持。

Catalogはactive31／historical32、010退役維持、次033。この032だけの新作追加で、候補表は編集していない。既存001–031のsource／保存形式／物理／得点は不変。Game018 revision03の182未commit成果、21既存worktree、別STEP2未commit資料も保全。[277既存source比較・21tree証跡](QA/PRESERVATION_01.json)。追加STEP2の証跡は開始時でなく現時点のsnapshotと明示している。

## 実行した検証

|検証|実際の結果と範囲|
|---|---|
|`npm run check`|成功|
|`npm test`|**962/84ファイル成功**、最終ソース。[ログ](QA/root-tests-release.txt)|
|`npm run build`|成功、6.63秒（今回環境のビルド時間、プレイFPSではない）。既存大型chunk警告は残る。[ログ](QA/build-release.txt)|
|独立モデル／保存|12成功。7魚種のcalm/always/never巻き比較、300秒直前後、Pause全phase、練習／保存拒否分離|
|Worker型検査・対象単体|型成功、当初対象66成功＋後続mode集計回帰1成功|
|実ローカルworkerd+D1|Analytics40項目／48synthetic events／14RUN、Records30項目／21定義。fixtureのみ、本番投稿なし。[統合証跡](QA/integration-01/SOURCE_AND_RESULTS.json)|
|独立browser candidate02|**93/93成功**。1280/390/320/844、ordinary keyboard/CDP touch、5分virtual active clock結果→BEST→retry→reload。scripted-RNG同魚種／異サイズ更新を別fixtureとして明示|
|横画面修正後の独立追加|**33/33成功**。canvas170px=枠、全操作初期画面内、4地点移動、phone全touch取り込み、4画面のpause/help/result。0匹結果は300秒virtual clockのlayout fixture|
|最終候補の独立帰還|4画面の説明下部Practice・Portalを実click/tap。PC下部link底辺774.28<900、全center hit一致|
|最終候補の通常browser|**72項目成功**、virtual clock／RNG注入なし、4画面の実投げ→合わせ→取り込み・練習除外・Portal31／準備中032・Ads script保持。page error0、POST0。[ログ](QA/release-candidate/ordinary-browser-01/REPORT.json)|
|独立Visual|**85/100、F13/H13 PASS**。実画像49と実動画22抽出frameをview。人間の面白さ合格ではない。[報告](VISUAL_REVIEW.md)|
|Offline Jev helper|25成功、API呼出なし。[ログ](QA/jev-offline-final.txt)|

実録[9秒動画](QA/candidate-03/motion-02/movement-cast-reel-9s.webm)は普通の実時間ブラウザ入力でmovement→cast→nibble→hook→fight→reel。25fps録画等のencoder設定を実際のゲームFPSへ読み替えていない。定数画像・単一環境AudioContext・bounded event保持・非表示停止をsource確認し、場面中の明らかな停止やエラーはなかった。長時間memory／発熱／実スマホFPSは測定していない。[Feel](GAME_FEEL_REVIEW.md)／[独立QA](INDEPENDENT_QA.md)。

## 公開確認

期待runtime commitの公式build／deployと、同じ公開設定で再現したビルドの186fileが公開URLのHTTP200／SHA256に一致。公式artifact ZIPそのものは未取得であり、照合手法をVERSIONへ記載。PC1280×900、phone390×844、320×740、横844×390で普通の入力による投げ→合わせ→巻き／緩め→取り込み、練習BEST除外、新しい本番score0、Portal31／032PLAY／640px thumb／準備中TOP10、Ads scriptを72項目確認。公開試験はvirtual clock／model／RNG注入なし。解析同意を拒否し、実POST0。環境で許可されないAnalytics／広告GETはabortし、サーバー集計や広告配信成功の証拠へ読み替えていない。

初回byte照合は親Nodeのproxy flagが子へ継承されずEAI_AGAINで停止。失敗を`public-version-01/FAILURE.json`へ保全し、`NODE_USE_ENV_PROXY=1`で既存proxyを子へ継承して新規証拠先02で成功。ゲーム変更は不要。最終保全runner初回のuntracked表示縮約／detached branch形式の差も原本を残し、baselineと同じall／nullで比較して21tree＋STEP2／018全182hash不変を確認。[保全](QA/PRESERVATION_PUBLIC.json)。

## Finding・修正・Jev

8件の実findingでschema v2の4問を送信。**api_attempted=true8／HTTP2008／resolved model確認8／有効回答32／独立判定8**。[原ログ](QA/JEV_SHADOW.jsonl)／[監査](QA/JEV_AUDIT.json)／[集計](QA/JEV_SUMMARY.json)。AVAILABLE／invocationsだけでAPI成功と判断していない。PRIMARY_CAUSE一致7/8、NEXT_EVIDENCE5/8、action必要性8/8、独立比較false pass0/risk miss0。この少数の対象選別済み標本から普遍的精度・時間節約・面白さを断定しない。

扱った問題は既存20boardと新21定義の整合、5分完了資格、同種魚釣果の更新、resume直後DOM観測、岸へ見えたウキ、横画面のgrid伸長、完了集計mode欠落、PC説明下部リンク。各生観測→JeV→独立判断・採否を保存し、Visual／QA／公開許可をJeVへ委ねていない。修正は描画射影／短横画面とdesktop dialogの高さ／魚更新predicate／イベントmode、単純算術の4:60はmechanical修正。

初期モデル期限テストはhook手順／待ち時間が不足し、担当がShadow呼出前にfixtureを修正した。事後に当時実施済みと見せず、順序の不備とfixture原因をMODEL_SPECに残した。browser初回resumeフレームassert、初回本番cast timeout、親指示の中断、録画binary不足も原本保全。過去のtimeout時の魚失敗理由は未捕捉で**unknown**、現在の成功から過去理由を断定しない。

## 本番の別状態・残課題

**032 Analytics／みんなのBEST・TOP10登録は未反映。** Cloudflare credential不足かつAnalytics host許可外のため、Worker本番deploy・D1操作・Secret追加・架空RUN送信はしていない。Worker／Codex匿名集計・export・profileはコードとlocal D1まで対応。032だけ未知GET・記録共有identity/post・Portal選択送信を止め、準備中。既存20boardのvalidator・sharing契約は回帰確認し維持。この環境から本番20APIを再取得したとは報告しない。[登録再開](HANDOFF.md)。

作者・第三者の人間試遊、物理iPhone/Android、音の聴感、長時間熱／memory、実プレイヤー受信・共有は未確認。スマホ結果の下部個別buttonすべてのactivationは未試行（画像／layoutとPCretryは確認）。静止背景の草の個別風変形、季節・天候・別背景、追加図鑑はMVP後の検討。広告／GA4／CREDIT OFF／D1schema／認証設定を今回変更しない。[Human](HUMAN_PLAYTEST.md)に今後の実試遊項目を残す。
