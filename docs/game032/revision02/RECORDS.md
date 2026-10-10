# Game032 revision02 — 釣った魚の端末内記録

参照元は `5ecaa9dd4ac39fbd6b83849e1ecd6c7f352d0d6c`。本書は今回追加する記録モジュールの仕様・単体確認で、画面操作や公開確認の報告ではない。

## 記録する内容

`FishingCatchRecordsStore` は標準モードで取り込んだ魚を、5分の釣行終了を待たずその場で記録する。実際の `fish_landed` ごとに Main が `record(snapshot.lastCatch, snapshot.mode)` を1回呼ぶ。練習の魚を渡しても保存しない。

- 魚種ごとの最大サイズ、最大の魚を釣った日時、最後に釣った日時、釣った数。
- 最大の魚の表示用メタ情報。水槽・魚鑑賞にはこの代表魚を使える。
- 直近100匹の種類・サイズ・日時・方法。古い履歴が範囲外になっても魚種ごとの最大と日時は保持する。

同じ最大サイズを再び釣った場合、最大の日時は最初の記録を保持し、最後に釣った日時と数だけ更新する。日時はブラウザの時計による UTC ISO 形式。表示する Main/UI が端末のローカル日時へ整形する。サーバー時刻による保証はなく、端末時計の先進・後退を禁止しない。

## API と保存形式

実装: `src/games/game032/CatchRecords.ts`。

```ts
new FishingCatchRecordsStore(backend?)
store.record(fish: FishCatch, mode: FishingMode, caughtAtISO?): boolean
store.records(): readonly FishSpeciesRecord[]
store.recentCatches(): readonly FishCatchRecord[]
store.galleryCatches(): readonly FishCatch[]
store.storageStatus // 'persistent' | 'memory'
store.storageIssue  // null | 'unavailable' | 'read_failed' | 'write_failed' | 'invalid_data'
```

`FishSpeciesRecord` は `fishId / name / maxSizeCm / caughtAt / latestCaughtAt / count / largestCatch`。`FishCatchRecord` は `{caughtAt, catch, ordinal}`。`ordinal` は同じミリ秒の同種同寸魚を区別するための魚種内通し番号で、外部へ送らない。返却配列と各項目は凍結し、呼び出し側による書換えを防ぐ。

専用 localStorage キーは `web-mini-arcade:v1:game032:fish-records:r1`。保存形式は `{schemaVersion:1,species:[],recent:[]}`。現行7魚種・履歴100匹・生文字列64KiBの上限を持つ。既知 ID、魚種ごとのサイズ範囲と小数1桁、メタ情報、正規の ISO 日時、安全な整数、最大と履歴の整合、未知キーやプロトタイプを検査する。異常な保存は部分採用しない。

既存 `Save.ts`、`web-mini-arcade:v1:game032:best:standard:r1`、得点、記録ルール版は変更しない。以前の版では魚そのものを保存していないため、過去の BEST から架空の釣果を生成しない。新記録は今回の版以降に実際に釣り上げた魚から始まる。

## 保存失敗と複数タブ

保存拒否・容量不足・読み込みエラーでは、検証済みの現在ページの記録を保持し、`storageStatus` と `storageIssue` を UI に渡す。保存成功と偽らない。破損保存を読み込んだだけで消去・上書きしない。次に有効な魚を記録できた場合に限り、正常な新しい記録を書き込む。

読み込みと更新の前に他タブの保存を確認し、最大・日時・数を合流する。順番に実行された複数タブの更新を検証している。localStorage には原子的な比較・更新がないため、全く同時の複数タブの書き込みを完全に保証しない。アカウント・サーバー同期・別端末移行を新設しない。

記録は本人の端末内だけで、Analytics 同意の有無に依存しない。魚種別日時・履歴・このキーを Telemetry やオンライン BEST へ送らない。

## 単体確認

`npx vitest run tests/unit/game032-catch-records.test.ts` で31項目。即時保存・リロード、練習除外、大小／同寸更新、同時刻の別釣果、7種、履歴上限と長期最大、旧 BEST 不変、時計後退、順次複数タブ、保存失敗／復帰、拒否／消去／破損／過大文字列、不正サイズ／日時／未知ID／未知キー／プロトタイプ、整合しない履歴、安全整数限界を確認する。

単体確認は実ブラウザの標準釣行・練習・閲覧モード・全画面・公開の確認とは区別する。モジュール作成時点の対象31項目は成功し、finding を伴う失敗は観測していないため、単純 PASS のための Jev 呼び出しは行っていない。
