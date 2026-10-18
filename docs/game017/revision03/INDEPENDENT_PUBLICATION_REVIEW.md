# 表示014・雨改良候補のWeb公開準備 独立差分レビュー

2026-10-18 UTC。製品実装から独立したreviewer subagentが読取監査を実施。候補`8d93c79`、基準main`9e96d55`、雨改良の採用元`b8fc067`。詳細SHAと証拠範囲は[JSON](INDEPENDENT_PUBLICATION_REVIEW.json)。

**ローカル公開準備の差分・採用元一致・検証接続はPASS。** Web公開済み、追加費用なし、main push/CI/deploy実行の承認を意味しない。

- mainからの51変更ファイルは雨revision03とその資料/検査、Vite入力、CURRENT_STATUSだけ。既存ファイルの変更は`vite.config.ts`と`docs/CURRENT_STATUS.md`のみ。共有runtime変更は通常build入力へ`game017-revision03.html`を1個加えるだけ。003/037の採用準備、旧017正式HTML/source/rules2、内部014指ハート、Catalog/件数27、records/board、Analytics、workflow/料金設定等は空差分。
- HTML・全runtime・素材/原本/台帳・検査の30移入ファイルを採用元Git blobとSHAで独立再計算し、欠損/不一致0。runtimeを変更せず専用ページを配信対象にする。新記録は`game017:umbrella-r3`、旧BESTと公開boardは既存のまま。素材の追加生成なし。候補commitへnode_modulesは含まれていない。
- [新しい検証原本](QA/web-preview)はmain基準のcheck、1107単体/104files、通常production build、offline Jev helper25件が成功。[新compiled24件](QA/web-preview/compiled/RESULTS.json)も全て成功し、4幅の014識別、DEV hook不在、overflowなし、3秒失敗/retry、HTTP/pageerror/POST/外部requestなしを確認する証拠がある。本担当は原JSON/collectorを読み、[PROVENANCE](QA/web-preview/PROVENANCE.json)に保存された通常root distのSHAも全件再計算して一致を確認した。ブラウザ起動やテスト再実行は本担当では行っていない。
- 採用元のnative89/compiled24はimmutableな過去commitリンクへ分離され、今回の24件と混同していない。今回のroot distで90秒完走を再実行したという主張はしない。最初のローカルcommit2b4e5d4に未追跡runtimeが含まれなかった経緯はprovenanceへ保存し、8d93c79で全移入fileが追跡されていることを確認した。stage前後で検査対象bytesは同一。

予定URLは`https://game100garage.com/game017-revision03.html`。旧正式rainと一覧routeを置き換えず、試遊候補だけを追加する構成。URLの公開200、実配信SHA、GitHub CI/Pages成功、公開後操作は未確認で、公開済みURLとして扱わない。

PUBLIC/標準runnerやcache/artifact容量の情報はcoordinatorの調査記録を参照した。本担当は外部APIを呼ばず、billing/Webhookの403から残る費用不明点を解消したとはしていない。ユーザーの費用条件に従う公開前保留は[PUBLICATION](PUBLICATION.md)へ記録されている。人間/物理端末/Safari/聴感/FPS、正式完成の認定は未実施。push/PR/Actions/deploy/設定操作・有料APIは本担当から実行していない。
