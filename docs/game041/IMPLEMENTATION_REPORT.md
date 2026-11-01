# Game041 実装報告
基準main 6211019f64a6946d632a9b3620de24a03505410d。独立採掘ゲーム、個別ビルド、保存キー100gare:game041:rules1。広告/Analytics/CREDIT/記録共有は接続しない。
モデル6テスト成功（20seed経路含む）。tsc成功。個別Vite QA/production build成功。
固定QA: QA/2026-10-30T12-33-40.438Z/report.json。4画面、練習/本番/休憩/結果/再挑戦/帰還。PCと390の本番は32,830点・13金脈・最大8・HP3・52秒。実入力で位置を変更、state書換えなし。残り2幅は12段練習完走と休憩まで。
headless Linux Chromium、update+drawを各frame performance.nowで計測。80段走破中3682/3676samplesのp95約0.6ms。実スマホFPSではない。
失敗原本はQA初回とbatch QAリスク試作REDを保護。Jevは有料API禁止のためUNAVAILABLE、手作業で原因分類。
検証済み製品ソース: 831ebff6（CSS修正）。full走破モデル/入力は26b7e981時点、CSS以外同一。production再確認はui-*報告を参照。
起動: node tests/batches/dopa-nine-20261030-a/run-batch.mjs game041 → node tests/batches/dopa-nine-20261030-a/preview.mjs。URL /games/vein_rush/。
main/公開/remote操作なし。人間・実機・聴感・公開認定は未実施。
