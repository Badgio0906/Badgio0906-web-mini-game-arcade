# 012–014 記録連携の再開

入口: [実装報告](IMPLEMENTATION_REPORT.md)、[仕様](IMPLEMENTATION_SPEC.md)、[原文](REQUEST.md)、[現行対応表](../records/GAME_RECORD_MATRIX.md)。active30/historical31、010退役、次032は未着手。ゲームの原本は3pinと既存sourceoverlayを維持。

正規再exportは [GODOT_EXPORT](GODOT_EXPORT.md) に従い、immutable source archives / official4.5.1 editor+singlethreadtemplatesを使う。全3本のexport-metadata.json/runtime_files/source_overlay hashesを追跡済みguarded importerへ渡す。`tools/import_legacy_games.py --exports /path/to/full-exports --validate-only`→同コマンドからvalidate-onlyを外す。管理wrapper/CSSは `tools/legacy-record-shells` が正本。旧title-only binary writerや古い原本webexportで公開PCKを上書きしない。

検証: `npm run check`、`npm test`、`npm run build`、offline Jev tests、Worker check/records-local-d1/original local-d1（ローカルだけ）。resource auditorは歴史QAを上書きしないよう必ず `LEGACY_BINARY_REPORT=/new/QA/RESOURCE.json node tests/fourteen-game/audit-legacy-migration.mjs [--dist]` とする。

ブラウザscriptは `LEGACY_QA_OUT=/new/QA` 指定、before/after/failureを新しい一意dirへ保存する。012/013/014 prototype・safety・protocol-harness各testは実native入力と合成fixtureを区別。public-native.mjs / tests/records/public-browser.mjsの公開確認は公開commit/workflow/served hashesを先に確認し、同意拒否・webdriver・全POST抑止の隔離contextで行う。架空production API値を送らない。

個人BESTはnative ConfigFile正本→確認済み小型IDB mirror。旧012比較可能、旧013条件不明、OJT別、014successes0..25。初回Portal訪問だけでは旧native保存を読めず、最初のゲーム起動時に引き継ぐ。本番みんなのBEST準備中・sharingOFF、Cloudflare権限を新設しない。別途有効化時は3通常boardと既存17boardの整合、公開API/permission/送信停止/重複・撤回を実際に検証する。

未実施: 作者本人、実機、音の聴覚・人間Feel、設定済み本番共有。012の元phone切れ・横14の元UI小文字は維持範囲の制約。今後ゲームUI改修を別依頼で行う場合はbeforeを保存して限定scopeを定める。

公開確認済みruntimeは48d8003/公式37878543797、164bytefile照合、publicnative6RUN36＋Portal4view36。完了証跡はPUBLICATION/IMPLEMENTATION_REPORT、public-native.mjsは実iframe canvas可視待ちを行い、012fresh0のnativecfg欠存とconfirmed mirror0を分離して検証する。第三者Ads拒否はpublic-network.mjsでquery/header/IDを保存せず確認する。

同じ既存tree環境の保全再確認は `python3 tests/legacy-records/check-preservation.py --output /new/QA/PRESERVATION.json`。BASELINEとのHEAD/branch/status/dirtyhashと対象差分、保護source/configを別に比較し、既存receiptを上書きしない。別環境では当時の21treeを再現したと称さず、新環境開始時baselineを新規取得してユーザー作業を保護する。
