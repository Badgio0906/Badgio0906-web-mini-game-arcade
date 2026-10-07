# Game027 統合引継ぎ

基準main `7c3d089d69da1ff076c63acb7c3ba96449728a1d`。作者worktreeの共有 `src/core/TelemetryService.ts` はrootがcompile用に反映した所有ファイルで、自分のコピー対象に入れない。自分の範囲は `game027.html`、`src/games/game027/`、`tests/unit/game027*.test.ts`、`tests/game027/`、`docs/game027/`。node_modulesのsymlinkも除外。

rootが最小統合するもの：catalog/id027・classicタグ・Portal・Vite entry・実画面のサムネイル・Worker game/event registry・共通イベント安全primitive。ゲームの既存Telemetryは remoteCollectionEnabled:false として開始、rootがユーザーの許可に基づきWorker登録/本番反映を確認する。広告/CREDIT/GA4/権限やGame018などの未commitは混ぜない。

再現：

```sh
npm run check
npx vitest run tests/unit/game027*.test.ts
npx vite build --config tests/game027/vite.config.mjs
python3 -m http.server 4927 --directory /tmp/game027-compiled
# 単独browser所有権を確保してから別terminalで順次実行
node tests/game027/native.mjs
node tests/game027/normal-terminal.mjs
GAME027_VIEWPORT=phone node tests/game027/normal-terminal.mjs
```

collectorは実compiledコードにnative入力を送り、Analytics/広告/GA要求を遮断し、同意を拒否する。world/save/shot/outcomeの書換えは行わず、Geometryによる補助照準のため保存状態を読み取る。phoneはtrusted CDP touchから通常pointerへ変換、sliderはnative tap。selectOptionは通常のmode選択コントロール操作。これは物理実機や作者本人の遊び感想ではない。

各runはsource/hash/timeの一意フォルダを使い、既存dirを上書きしない。新しい未知の不一致でSTOP、catchでfull state/DOM/table/trace/画像を保存してbrowserをfinally閉じる。最初の60shot失敗は原collector/progress/sourceを保持し、全文world/DOMを保存しなかった制限を明記。collector-onlyのcluster-contact修正は新しい純粋モデル23shot合法8勝利で先に検証した。

技術根拠は [実装報告](IMPLEMENTATION_REPORT.md)、[判定表](SHOT_RULE_TABLE.md)、[QA](QA/)、[Jev実記録のメタデータ](QA/JEV_AUTHOR_METADATA_AUDIT.json)。独立reviewは統合rootの `docs/game027/QA/independent/`、Visual81/F12/H12。最後のPC終局は別レビューの `terminal-final-01`。自分が親のreviewをコピー/書き換えて作者レビューに見せない。

人間試遊は [HUMAN_PLAYTEST](HUMAN_PLAYTEST.md) の通り未実施。ユーザーは作者未試遊公開を明示承認済み。作者のcommit/push/deployは未実施、期待commitのCI/本番URL/Portal/PC/phone表示確認はrootで行う。

Rootrelease 2026-10-07T19:37:36.343720+00:00:40targettests,617/62 allroot tests, check/build, actualWorkerlocalD1 29events9RUN PASS. Root native4 touchcoverage realoptionalphone menus PASS at QA/root-touch-coverage-20261007T1934; original authorcollector is held in QA/collector-touch-coverage-before.mjs. Fullnormaldesktop22 andphone23shots both reachlegal8 result, retry/reload/restart once, no state/physics injection. IndependentVisual81/F12/H12 and terminal-phone-final-01 supplement; humanfun/physicalphone unperformed. OfficialCI/public URL/SheetA47 pending, no claimfromHTTP alone.
