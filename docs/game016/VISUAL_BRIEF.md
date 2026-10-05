# Game016 — 負けじゃんけん / LOSE TO WIN Visual Brief

2026-10-05。[IMPLEMENTATION_SPEC](IMPLEMENTATION_SPEC.md)全文読了後の確定美術方針。素材生成、素材承認、実画面Visual合格、人間の楽しさは別の記録とする。既存001〜015を変更しない。Catalog taglineは **「勝ったら負け。負ければ勝ち。」** を採用する。

## Design Goal / Mood

**温かいレトロTVのじゃんけん番組。** 大きな対戦相手の手、読むべき現在のルール、同じ位置にある3個の回答を、素早く見分ける。画面の笑いは題名/番組の短い言葉/結果に置き、指の形や入力位置を曖昧にして難しくしない。

015の暗いpixel縦坑、004の記憶計測器、011の紙の二択から区別する。横に広いTV枠、外周speaker/slotted grille、ON AIR風の小さな番組ラベル、押し込む物理回答padを特徴にする。CRT風の輪郭だけを使い、重要な手や文字にscanline、blur、ノイズ、歪みを掛けない。

## Palette / Typography

|役割|色/基準|
|---|---|
|背景・余白|warm cream `#f5eddb`|
|正文/輪郭/TV枠|navy ink `#243349`|
|TV内の静かな舞台|dark teal `#183e47`、手の周囲に十分な明度差|
|番組見出し/短い強調|coral `#e86c59`|
|現在ルール/押下の強調|mustard `#f1c553`、navyの文字|
|回答pad|共通ivory `#fff8e8` / 共通navy輪郭|
|手|同じwarm skin `#f1bb91`、同じnavy cuff、抑えた2段cel shading|

日本語は既存の読める日本語sansを継承し、見出しは太字と短い行、英語番組labelは幅の狭い太字sans、数字はtabular/monospaceを使用。新しいwebfontを美術目的だけで追加しない。Pixel fontは使わず015から分離する。390pxのルール主文は24〜28px、文章の問題は22〜26px、回答ラベル16px以上を目安にし、補助的な英語を日本語より大きくしない。時間は太い感覚的な減少barを主役にして数字の読解を要求しない。残秒を添える場合は24px程度で補助的にする。

## Composition / PC / Mobile

**1440×900 PC**：max幅1040px程度の中央番組stage。上にcompact masthead/戻る/音/pause、その下に現在ルールの横帯、中央の大きなTVと対戦相手、直下に3つの等幅回答pad。読み続けるルールと回答をTV外周の装飾より優先し、巨大な左marketing panelでstageを縮めない。TV内の手は160〜220CSSpx程度、回答の手は48〜64px程度。時間/問題進行/scoreはTV上辺または下辺のまとまったcode HUD。

**390×844 phone**：外余白12〜16px、compact header→現在ルール→TV/opponent→時間/進行→3回答。Opponentは132〜160pxを目安にし、実入力padを常に表示。回答幅は各約100pxを確保し、icon上/日本語下の縦配置で3列を維持。手を横scrollで選ばせない。初回説明/練習/結果を重ねる際も押せるprimary44px以上、タイトル/現在指示を切らない。Short landscapeはTV左/3回答右への組替え等で全回答とルールを残す。

全phaseの位置は **左グー / 中央チョキ / 右パー**。イラスト段階ではicon/日本語、文字段階では大きいひらがな、PCの操作キーは補助として各padに同じ順で表示する。実キーは左←/A、中央↓/S/Space、右→/D、見た目の都合で変更しない。3padの色/大きさ/輪郭/hover/focus/押下は同じで、答えを色で教えない。TVの相手には明確な「相手」、3pad群には「あなた：負ける手を選ぶ」と付け、上の手を自分の回答と誤読させない。

## Character / Object / Asset Contract

**HYBRID**：実生成した3個の手画像＋コードのTV構造/UI/ルール/時間/回答境界/feedback。一枚の架空gameplay画像を舞台として貼らない。

|項目|契約|
|---|---|
|Production|`public/assets/game016/hand-rock.webp` / `hand-scissors.webp` / `hand-paper.webp`|
|Canvas|各256×256 RGBA、中心anchor128/128、最大content約208px、完全な指と手首/cuffを含む|
|Pose|同一肌/袖/視点。手首は下、viewer-facing presentation。グーは畳んだ指/親指のある閉拳、チョキは明確なindex+middleのV、パーは明確な5本指|
|Equal treatment|同じ輪郭密度/影/余白。グーだけ小さい印象にならないよう知覚サイズを揃える。48px/grayscaleでも3silhouetteが区別できる|
|Sources|`assets/game016/`に生成原本、実prompt/出力、手ごとのbbox/scale/anchor/bytes/採否metadata。技術最適化のstagingは`assets/game016/staging/`|
|Budget|3optimized WebP合計≤90KB目標。超える場合は実bytesと輪郭品質の必要理由を残す|
|Generated|手本体のみ。1透明sheetの3独立セルでもよいが、実sourceをviewし、個別bboxで全指/cuffを保って抽出|
|Code|TV枠/背景/speaker/重要text/timer/ルール/3native回答/feedback/score/result/入力境界|
|Reject|指の数/関節の破綻、切れた指、pose混在、微小halo、emoji代替、photoreal/3D、embedded text、正解色、全画面画像|

生成要点：clean warm pop game-show hand illustrations; same navy outlines and cuff, two-level cel shading, complete clear rock/scissors/paper silhouettes, isolated transparent background, no text/UI/glow. この生成要点は実promptログの代替ではない。Asset Producerが実image_genの実行後にsourceと出力IDを記録し、原本/optimized48pxサンプルの採用を判断する。

### 素材採用の実確認

2026-10-05、Asset Producerによる実ImageGen1回の原本をviewし、続いて256²optimized3枚と[48px color](../../assets/game016/48px-color-check.png)/[48px gray](../../assets/game016/48px-gray-check.png)を実viewした。拳/V2本/5本指を小サイズ・grayの両方で区別でき、指先/cuffも欠けないため3枚を採用。実合計29,614B、[asset index](../../assets/game016/asset-index.json)に各bbox/anchor/hash/bytesを記録する。閉拳の親指側は他2枚と反対handに見える小さな解剖学的連続性の制約で、意味/色/輪郭の公平な判断を妨げないため再生成しない。未記録のmirror変換を行わない。素材採用は実UI内のVisual合格ではなく、本番1440/390の評価は実装後の別工程。

## Phase / Feedback / Animation

全段階で「相手に負ける手を選ぶ」が正解。『勝ったら負け』の番組らしさと、実操作の「相手に負ける」を両立させる。Phaseの演出でルールや選択pad位置を変更しない。初回説明では後半をネタバレせず、相手グー→チョキ、相手チョキ→パー、相手パー→グーの無制限3問を同じUIで練習する。誤答は練習継続、本番score/BEST/時間を表示上でも混ぜない。

|段階|TVの相手/回答pad/時間の見せ方|
|---|---|
|1〜10 IMAGE|統一生成手を大きく表示、下3padも同じ3生成手。2.0秒のbarは問題と入力が始まってから減る|
|11〜20 HIRAGANA|相手と3padの手画像を**ひらがな「ぐー／ちょき／ぱー」へ置換**。背景の薄い手やfinger iconを残して答えを画像で補わない。場所/境界は固定、2.0秒|
|21〜30 SENTENCE|TV中央の読みやすい一意な文章が主役。読書状態は「時間制限なし / 読めたら進む」、barは減らさない。読了入力後の回答状態を明確にし、ひらがな3padが使える瞬間から2.0秒。入力guardはGameplayが所有する|
|31〜 REFLEX|30連敗の短い番組transitionで一旦止め、操作による続行後は生成手へ戻す。「REFLEX MODE / 0.8秒」を読める表示。barは毎問同じ0.8秒、視認難度を装飾速度や0.7秒化で上げない|

Transitionは短い番組captionと明確な続行操作で、未開始timerを走らせない。文章の読了ボタンは準備操作と分かる領域/ラベルで、回答padの一つに偽装しない。読書中に回答padを残す場合は全3pad同じdisabled appearance、文字問題/読了指示を最優先する。

入力可能/待機/次問題の状態をコードで区別する。準備/続行の押下を回答へ誤って流用する問題はGameplayで防ぎ、美術は異なるボタン領域で補助する。短い押込み、正解のPositive「負け！ / LOSE!」と小さいscore増分、誤答の選択枠＋相手/実選択/必要な関係の説明を優先。強いカメラ揺れ、長いconfetti、手のshape morphで次の0.8秒判断を遅らせない。Reduced-motionでも答えと理由が残る。正解音は明るい短いSE、勝つ/あいこ/timeoutを別のfeedbackとし、muteの表示状態も保持。Pause/非表示中はbarの減少を停止し、明示再開UIで補助する。

結果はSCORE/BEST→累積連敗/到達phase/REFLEX STREAK→称号/失敗理由/相手・回答・正解→retry/タイトル/portalの順。原因を「勝ってしまいました」「あいこです・負けてください」「考えすぎです」で区別し、称号/短い進行commentは番組の結果plateに置く。相手/回答/必要な手は文章でも明示し、colorだけに依存しない。速さ加点の細かな計算を0.8秒画面に常時並べず、score/streakを主とする。試作CREDIT無料・無制限の状態を正しく示し、架空ランキングや未実装広告をTV番組風に宣伝しない。

## Avoid / Independent Gate / Limits

SaaS cardの縦積み、全部neon、pixel/filtered illustration、emoji、読めないCRT font、handにscanline、ルールと異なる固定『負け』装飾、phaseごとの回答位置shuffleを避ける。

素材承認後の独立VisualはRootのexclusive browser slotで実PC1440×900/phone390×844、title/説明/実練習/本番各phase/feedback/result/portal actual thumbnailを確認する。普通の入力で到達した状態と明示fixture/source診断を区別する。80/100以上、F可読性/H完成感各12/15以上、3silhouetteの区別と現在ルール/時間/固定3padの同時読取を必須とする。QA/Feelとの同時browserは開かない。Phase到達が未確認なら限界を記載し、source閲覧だけでnative PASSを作らない。人間の混乱/反射/笑い/再プレイ・実機FPSは別の未実施項目。

## 実装後の独立評価

[VISUAL_REVIEW](VISUAL_REVIEW.md)は2026-10-05、現行source`6d4a80…`の実PC1440×900/phone390×844画像を独立viewして **PASS86/F13/H13**。初回menu labelのcontrast findingは、限定文字色修正と実画像再確認で閉鎖。初回原本を保存し、art追加生成0/正式数値採点1回目とする。Visual自身のbrowserを開かず、通常入力で獲得した画像の実行者は独立Feel担当と明記した。全サイズQA/production/人間/実機/公開は別gate。
