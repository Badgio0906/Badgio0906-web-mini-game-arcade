# 公開整理・独立依存レビュー（実装前）

2026-10-20 UTC。基準 `/workspace/arcade-catalog-cleanup`、main `47c6cfe`、branch `codex/adsense-catalog-quality-cleanup`。独立reviewerによるread-only調査。製品/テスト/Git/PR/外部サービスへ変更せず、この監査ファイルだけを作成した。PR #11とそのdbdf915は操作・統合していない。

## 削除安全範囲

| ID | 専用HTML | 削除可能な専用code/style | 保護対象 |
|---|---|---|---|
|026|game026.html|src/games/game026/{model.ts,main.ts,save.ts,flow.ts,style.css}（5）|game.manifest.json原文、docs/game026、旧snapshot、records/version |
|028|game028.html|src/games/game028/{input.ts,view.ts,clock.ts,model.ts,main.ts,save.ts,style.css}（7）|game.manifest.json原文、docs/game028、旧state、records/version |
|029|game029.html|src/games/game029/{input.ts,Fishing.ts,main.ts,Save.ts,practiceEvents.ts,draw.ts,style.css}（7）|manifest、docs/game029、旧save、public score board |
|030|game030.html|src/games/game030/{Levels.ts,Route.ts,Geometry.ts,main.ts,Save.ts,style.css}（6）|manifest、docs/game030、旧snapshot、records/version |
|031|game031.htmlはソース保持しproduction入力だけ除外|削除なし。全13source fileを保持|全素材・原本台帳・scripts/game031・全tests・IndexedDB/保存互換 |

全srcの相対importをresolveして調査し、5作品のフォルダを外側からimportする他ゲーム/共有runtime依存は0件。records/localRecordsは031本体をimportせずIndexedDB metadataをreadonlyで読む。削除4作の盤面/家具/水面等はcode内SVG/Canvas描画で、public/assets/game026/028/029/030の専用画像directoryは存在しない。専用公開画像はpublic/assets/portal/gameNNN.webp各1枚。これらはhistorical catalogとthumbnail台帳が参照するので、配信から削除する場合も元WebP・採用entry・source screenshotを非配信archive/資料へ保全する。共通font、arcade-navigation、gameTouchGuards、Audio/Storage/Telemetryは削除しない。

031のpublic/assets/game031/textures-a/v1は16WebP＋manifestの17ファイル。publicDirコピーによりHTML除外後も画像がdistへ残ることは別途確認/報告が必要。画像だけではゲームを起動できないが、全て非配信とするならrepoの素材を消さずbuild出力側だけ除外する。three/@types/threeは031開発・unitに必要なので依存packageを削除しない。

## 状態設計の独立判断

`publicationState: published | removed | on-hold | retired`を配信/掲載の新正本とし、旧`status: active | hidden | retired`をAPI互換metadataとして保持する最小案を推奨する。026/028/029/030はremoved、031はon-hold、既存退役4作はretired。historical35件、ID/releaseOrder、NEXT_GAME_NUMBER36、完成9件の認定は保持する。

理由：analytics-worker/src/aggregate.tsはhistoricalGameCatalog.statusを応答statusへ出し、retired判定でsummary対象を決める。statusをdeleted/on-holdへ直接拡張すると外部応答/集計範囲が変わる。今回はWorker/Analytics契約維持の指示があるためadapter変更より新publicationStateを公開frontとViteに限定する方が安全。

必須の単一判定箇所：gameCatalog（published26）、hiddenGameCatalog（空）、filterGames、displayNumbersFor、visibleTagCounts、favorite表示対象、Vite input。historicalGameCatalogをfilterGames/displayNumbersForへ直接渡してもremoved/on-holdを表示しないことを回帰条件にする。031のhistorical.status=activeは互換値であり公開許可ではないと型comment/docsに明記する。公開状態に新しいhidden playableを混ぜない。

Viteはpublished通常HTMLに加え、既存retired4の軽量案内を引き続き出す必要がある。全てgameCatalog26からだけ作るとretired案内も落ちる。現行game017-revision03.htmlは同じ017の別候補URLで今回の対象外なので明示保持。Godot012–014はpublicコピー経路を維持。031HTMLはソースを残すため現在のreaddir正規表現だけでは出力される。明示公開gateで5HTMLと該当runtime chunkがdistにないことを検証する。

## 過去記録・API契約

recordDefinitions/gameVersionsは5IDとも保持。特に029はpublicEnabled=true、game029.score.r1.allがanalytics-worker/src/records.tsの旧20board no-query契約にも含まれるため削除禁止。026/028/030/031はlocal-only定義を保持。src/records/localRecords.tsのsnapshot/state/save/進捗と031 metadata reader、旧saveキー、RecordSharing/remoteRegistration、Worker登録/D1/migrationsを変更する必要はない。

Analytics envelopeは固定35IDから旧retired4を除く許可集合で、公開状態とは別の既存契約。今回このID集合・gameVersions・Worker statusを変えない。通常ブラウザ訪問時に旧saveやfavoriteの保存済みIDを勝手に消去しない。

## テストと資料への影響

- コード直接importの専用unit5本：game026.test.ts、game028-model.test.ts、game028-save-input.test.ts、game029.test.ts、game030.test.ts。コード削除後そのままVitestへ残すとimport失敗。元テキストをdocs側*.txt等へarchiveし削除前commitと対応付ける案を推奨。全体Vitest configの除外で隠すより、現行テストと履歴を明示分離する。
- browser collectors tests/game026/028/029/030とdocs内raw QAは歴史証拠として保持し、削除後の現行treeでは動かないことを記録。031のmodel/input/save/texture5unit、その他tools/collectorsは保持。
- catalog-reorganization.test.ts：hidden4、hidden HTML存在、031込みの最初24件/表示番号を変更。game010-retirement.test.tsのhistorical.length−8も−9へ。game031/032-integration.test.tsのactive27→26、new-three-integration.test.tsの件数と033–035の表示番号025–027→024–026を更新。
- record-definitions/record-local/records-client/leaderboards/analyticsWorkerの5ID互換assertは維持。record-definitionsの全historical対応もそのまま成立させる。
- game010/020/031/032 integrationはjev_export/game_profiles/catalog.jsonの現行配列一致を検査する。publicationStateと26件を反映するが、旧profile/manifestは保持。
- tools/export-jev-data.mjsはactive全profileを再生成し、032の旧humanEvaluation文言を出す式がある。単純な一括再生成で既存AdSense Phase1修正文や履歴を上書きせず、今回必要なcatalog JSONだけを限定更新するのが安全。

このレビューではブラウザ・テスト・build・有料API/Jev・外部API・push/PR/CI/main/deployを実行していない。削除後のdist実測、残26件のブラウザ基本監査/10件深掘り、公開HTTP結果はcoordinatorの別工程。
