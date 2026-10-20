# 公開作品整理・実装報告（レビュー候補）

基準main: `47c6cfe1ea93f71325fc47ff7031980ef9be9f74`。専用worktree `/workspace/arcade-catalog-cleanup`、branch `codex/adsense-catalog-quality-cleanup`。main統合・本番公開は承認待ち。PR #11のGame015改善は取り込まず、同PRを変更していない。

## 実装前の依存調査と方式選択

実装前に5作品の相対import、HTML、publicDir、カタログ、保存reader、version、記録board、Worker集計、テストを調査した。他ゲームから4作品の専用sourceへのruntime importは0件。独立調査の詳細は[依存レビュー](catalog-quality-20261020/DEPENDENCY_REVIEW.md)。

旧`status`をon-holdへ変更すると、Worker集計が返すstatusまで変わる。そのため旧statusはAPI互換metadataとして保持し、新しい`publicationState`で公開意図を管理した。`published`と旧`active`の両方を満たす作品だけを通常掲載する。hiddenは公開許可にならず、031の旧activeも公開許可ではない。

Vite入力へ5件の禁止リストを追加する案と、カタログから配信対象を導出する案を比較し、後者を採用した。単一の公開判定を一覧・タグ・表示番号・ビルドで使用し、再混入を防ぐ。大規模なビルド基盤変更は行っていない。

## 削除・保留の境界

|対象|変更|保持|
|---|---|---|
|026/028/029/030|root HTML4本、専用code/style25本、manifest4本、専用公開サムネイル4枚、専用unit5本を現行実行treeから削除|Git履歴、過去docs/QA、ID/releaseOrder、保存reader、versions、board/Worker登録。manifest4＋unit5は原文archive|
|031|publicationState=on-hold、掲載・タグ・お気に入り表示・production HTML入力から除外|HTML開発入口、全source13本、textures16＋manifest、portal画像、元画像8本、生成scripts、unit、IndexedDB形式・ルール|
|残26|公開状態・完成認定・game sourceは不変|完成9、試遊17、内部ID、save/BEST、記録、物理・難易度|
|既存retired4|状態・軽量案内を維持|004/007/010/021のHTMLを配信入力へ含める|

公開用HTMLは通常26＋retired4。既存Game017 revision03候補ページは今回の削除対象外として従来どおり保持する（別ゲーム本数には数えない）。Godot012〜014のpublicDir経路は変更なし。

031の非実行素材17ファイルはpublicDirコピーでdistに残る。HTML・専用JS/CSS chunkは出ず、別URLで起動する実行入口は見つからない。素材を削除した、すべての031文字列が消えた、とは報告しない。

歴史35 ID・NEXT_GAME_NUMBER=36を維持し、removed IDの再利用を禁止。表示番号のみ032:024→023、033:025→024、034:026→025、035:027→026。015=表示012は不変。

`jev_export/game_profiles/catalog.json`だけ現行公開26へ整合し、新fieldを追加した。旧exportのretired配列が010だけだったため現行catalogの004/007/010/021へ補完した。既存の作品状態を変更したものではない。他profileの一括再生成はしていない。

## 保存・記録・外部契約

旧端末データの消去・移行を追加していない。削除ゲームの保存readerも残る。特に`game029.score.r1.all`はpublic boardとWorker旧20 board応答との互換性のため残す。Worker・D1・RecordSharing・gameVersions・Telemetry/Analytics契約・AdSense・CMP・ads.txt・privacy・CREDITは変更なし。

[保全台帳](catalog-quality-20261020/PRESERVATION_MANIFEST.json)の110項目はmainと一致。102は実ファイルbytes、031原本PNG8本はsparse checkoutのindex/blobで確認し、作業ツリーへ展開・閲覧したとは扱わない。

## Game031の再公開手順

1. 同じGame031としてローカル開発入口`game031.html`を使い、現行source・素材・既存saveで改善と試遊を行う。
2. 作者が体験品質を承認した後、独立した再公開タスクでカタログの031 on-hold overrideを解除する。内部ID・releaseOrder・save形式は変えない。
3. 新しい公開数・表示番号の期待値を更新し、カタログ、互換性、check/test、クリーンbuildと031 HTML/chunk/素材、全公開リンクを確認する。
4. Draft PRでレビューし、別途本番公開承認を得る。今回自動復帰する処理はない。

## 検証と品質判断

型検査成功、976 tests/101 files成功、通常build成功。500kB超chunkの既存warningは残る。初回testで旧件数期待値・sparse fixture不足、および新helperのretired合成入力に対する不備を検出し、対象を修正して最終一式を実行した。CIの無条件再実行はしていない。

`tests/catalog-quality/serve.py`でdistを静的HTTP配信し、通常26＋retired4は200、対象5旧HTMLは404、017候補は200。Vite SPAフォールバックの200を成功扱いにしていない。Cloudflare/DNS/Pages設定やワークフローは変更していない。

全26件・代表作品のブラウザ監査と、実機未確認の範囲は[品質監査](PUBLIC_GAME_QUALITY_AUDIT_20261020.md)および[独立レビュー](catalog-quality-20261020/INDEPENDENT_REVIEW.md)を参照。自動操作で面白さ・満足度・AdSense合格を認定しない。

## 再現コマンド

```bash
npm run check
npm test
npm run build
python3 tests/catalog-quality/serve.py --directory dist --port 4952
# 別ターミナル。QA_OUTはディレクトリではなくJSON出力先。
QA_OUT=/tmp/catalog-distribution.json node --experimental-strip-types tests/catalog-quality/distribution.mjs
# QA_OUTは証拠用ディレクトリ。外部通信は遮断。
QA_OUT=/tmp/catalog-basic node --experimental-strip-types tests/catalog-quality/basic.mjs
# 同じ製品sourceを本番records endpoint設定でbuildし、公開GETはfixtureに置換。
VITE_RECORDS_ENDPOINT=https://analytics.game100garage.com npm run build
QA_OUT=/tmp/catalog-portal node --experimental-strip-types tests/catalog-quality/portal.mjs
QA_OUT=/tmp/catalog-findings node tests/catalog-quality/findings.mjs
# 別の小型build＋合成transport fixture。製品distは書き換えない。
QA_OUT=/tmp/catalog-sharing node tests/catalog-quality/sharing.mjs
QA_OUT=/tmp/catalog-deep-play node tests/catalog-quality/deep-play.mjs
```

ローカル404は本番404の実測ではない。本番では未公開のため旧5ページが引き続き200であり得る。作者承認後の公開タスクでPages成功と本番5旧URLの404/410、残26・retired・各種導線を再確認する必要がある。

findingは[Shadow記録](catalog-quality-20261020/shadow/README.md)へ分割保存した。今回は有料API禁止を優先し、Jevは7件の`--dry-run`のみ。実判断・確率・料金を創作せず、独立レビューと通常QAを継続した。
