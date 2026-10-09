# Portal discovery — タグ・お気に入り・試遊版／完成版

対象はポータルのみ。ゲーム本体、保存形式、広告、解析schema、Worker/D1、ランキング計算を変更しない。

## データと作者の完成判断

`src/data/gameCatalog.ts`がID、route、releaseOrder、掲載状態、開発状態の正本。`developmentStatus`はtrial（試遊版）／complete（完成版）、既存statusはactive／retiredのまま。active30作品と退役010にtrialを初期設定した。公開、CI、QA、本人の好評価を完成宣言へ読み替えない。[作者判断の独立調査](portal-discovery/INDEPENDENT_REVIEW.md)に根拠と除外理由を保持する。

新規作品はtrialへdefaultする。作者の実試遊後の明示宣言を確認した場合のみ、`developmentStatusByGame`へ対象のstable IDとcompleteを追加し、本人判断の資料を文書へ記録する。[共通運用ルール](../GAME_COMMON_SPEC.md#試遊版完成版の作者判断)。complete後も改修可能。退役は開発状態とは別に掲載を制御し、退役IDを再利用しない。

## タグ条件と状態条件

通常タグのID／日本語名は`src/data/tagCatalog.ts`を再利用。activeカタログ全タグから候補とゲーム数を計算する（現在39種類）。カードには従来の最大4通常タグを残すが、フィルターは5件目以降も扱う。退役専用のmeetingや未使用のタグは候補に出さない。タグ数表示は全activeカタログに対する静的件数で、現在選択後の件数ではない。

UI初期OR、タグ未選択なら全active。ORは選択のどれか、ANDはすべてを満たす。`filterCatalog(tags)`は互換性のため既存ANDを維持し、UIがmodeを明示する。pure `filterGames`で別カタログfixtureも検証できる。

状態未選択／両方選択は両状態、一方のみならその状態。状態内の選択は常にORで、通常タグのAND／ORとは独立。最終条件は掲載active AND 状態条件 AND 通常タグ条件。完成版0件でも状態を選べ、0件説明が表示される。

件数は表示対象 / active総数 GAMES。0件時は状態・タグを減らす／すべて解除を案内。すべて解除はタグ・状態を解除し、modeをORへ戻す。お気に入りは解除しない。絞り込み欄全体は同じ位置で初期折畳み。閉じても件数と選択タグ名・OR／AND・状態が見える。開くと選択済みの解除chipと、別に開閉できるタグ候補を表示する。操作はbuttonのaria-pressed、選択チェック、文字で区別し、44px以上の高さを確保する。

## お気に入り保存と表示順

キーは`game100garage:favorites:v1`、値は`["game003","game019"]`等のJSON配列。activeのstable IDだけを復元し、未知・退役・非文字列・重複を無視する。壊れたJSON、Storageへのアクセス拒否、容量不足でページを壊さない。保存失敗時はページ内で変更を保持し、再読込では保持できないことをUIに表示する。通常は再読込・ブラウザ終了後も同じブラウザで保持する。別タブのstorage変更も☆／★へ反映するが、そのページの並び順は維持する。

絞り込まれた対象内で、お気に入り→非お気に入りの順。両グループ内はreleaseOrder昇順。登録／解除は☆／★と保存だけ即時反映し、表示順は次の再読み込みで更新する。ページ読込時のお気に入りを並び用snapshotとして保持し、後続filter／clearでも未反映の変更を並び順に混ぜない。非お気に入りや新作を消さない。お気に入りだけを表示する機能、アカウント、サーバー同期は実装しない。

カード先頭の独立metadata領域に開発状態badgeと☆／★buttonを置く。badgeは通常タグ4件枠と別DOM、trialはcoral系・completeはyellow系で文字でも区別。favoriteはaria-pressedとゲーム名を含む追加／解除aria-labelを持ち、リンク内部へネストしない。既存黄色PLAYと補助TOP10の順序・優先度を保持する。

## DOM・Records・Telemetry

カードを初回1回だけ生成してID→node Mapで保持。タグ・状態変更ではhidden、並び替えでは必要な既存nodeだけを移動し、移動で失われたbuttonフォーカスをスクロールせず復元する。Records、共有設定、TOP10 listenerを再接続／再生成しない。galleryのinnerHTMLを更新しない。

表示nodeの順にdata-card-positionを1から設定し、hiddenからは属性を削除する。filter/sort後は既存observeCardImpressionsをdisposeして表示nodeだけで再構築し、1秒の連続露出判定を再開する。seenImpression／markImpressionによるvisit内重複防止を維持する。favorite clickはstopPropagation＋既存cardのbutton除外で、game_card_click／game_launchを起こさない。新Telemetry eventやschemaは追加しない。

開発用`jev_export/game_profiles/catalog.json`も新metadataに同期した。個別profile、Jev helper、判定schema、自動Gate設定は変更しない。

## 検証と再開

- `npm test`、`npm run check`、`npm run build`。新規pure unitは`tests/unit/portal-discovery.test.ts`。混在trial/completeは合成fixtureであり、実ゲームの完成宣言ではない。
- `tests/portal-discovery/browser.mjs`は固定production buildを模擬HTTPS root／repository subpathで、または実公開URLで検証する。必須viewport1440×900・390×844・320×720。ローカルBEST／TOP10はempty API fixture、liveは匿名public GET。広告sourceを変更せずQAのみ第三者script実行を省略し、analytics POSTはQA内で204応答して本番へ転送しない。records等のPOSTは遮断し、attemptがあれば失敗とする。
- 初回機能の結果は[実装報告](portal-discovery/IMPLEMENTATION_REPORT.md)、折畳み／再読込時並替えの結果は[revision-01](portal-discovery/revision-01/IMPLEMENTATION_REPORT.md)に集約。自動viewport確認は物理スマホ、人間の探しやすさ／面白さ／完成判断の実測ではない。

再現には新規環境で`npm ci`とChromiumを準備し、`/tmp`や稼働中serverに依存しない。公開ビルドは既存Actions Variablesの設定を使う。現在の公開frontendで確認した非秘密configはGA4空、telemetry `https://analytics.game100garage.com/v1/events`、records `https://analytics.game100garage.com`。設定変更を意味しない。

```sh
VITE_GA4_MEASUREMENT_ID='' VITE_TELEMETRY_ENDPOINT=https://analytics.game100garage.com/v1/events VITE_RECORDS_ENDPOINT=https://analytics.game100garage.com npm run build
DISCOVERY_QA_OUT=/absolute/new/qa-directory node tests/portal-discovery/browser.mjs
DISCOVERY_LIVE=1 DISCOVERY_COMMIT=<published-sha> DISCOVERY_QA_OUT=/absolute/new/live-qa-directory node tests/portal-discovery/browser.mjs
```

出力先は新しいディレクトリを指定し、過去の失敗／合格記録を上書きしない。
