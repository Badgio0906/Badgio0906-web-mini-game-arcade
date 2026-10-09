# 全activeゲーム 戻り導線調査表

基準main `cf06ae936b97fec591123bbf51bb6ff4817e349a`。旧表示・配置は基準ソースの調査、PC／スマホ列は今回の実ブラウザ測定（開始画面）。ゲーム内タイトル操作は別操作として維持。全30作品・4viewportの座標は [layout-final/REPORT.json](QA/layout-final/REPORT.json)。説明・練習・開始後・ポーズの実到達範囲は最終操作報告に分けて記録する。

| gameId | 旧表示文言 | 旧リンク先 | 旧配置 | ポータル／ゲーム内タイトル | PC表示 | スマホ表示 | 変更後・方針 |
|---|---|---|---|---|---|---|---|
| game001 | ← ゲームセンターへ（実行時生成） | `./index.html（BASE_URL解決）` | 左上ヘッダー（onboarding追加）＋ブランドはゲーム内タイトル | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game002 | ORBIT SHIFT → | `/` | 左上ヘッダー＋フッターの旧リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game003 | ← ゲームセンターへ（実行時生成） | `./index.html（BASE_URL解決）` | 左上ヘッダー（TowerTraining追加） | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game004 | ← ゲームセンターへ（実行時生成） | `./index.html（BASE_URL解決）` | 左上ヘッダー（onboarding追加） | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game005 | ← ゲームセンターへ（実行時生成） | `./index.html（BASE_URL解決）` | 左上ヘッダー（onboarding追加） | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game006 | ← ゲームセンターへ | `./index.html` | 左上ヘッダー | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game007 | 一覧 | `./index.html` | ヘッダー右側top-actions | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS・既存anchorを先頭へ移動 → `./index.html` |
| game008 | 一覧へ | `./index.html` | ヘッダー右側nav | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS・既存anchorを先頭へ移動 → `./index.html` |
| game009 | ゲームセンターへ戻る | `./index.html` | フッターのみ | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS・footerからheaderへ移動 → `./index.html` |
| game011 | ← ゲームセンターへ | `./` | ヘッダー右側nav | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS・既存anchorを先頭へ移動 → `./index.html` |
| game012 | ← ゲームセンターへ | `../../index.html` | 左上ヘッダー | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS・wrapper＋生成template（export不変） → `../../index.html` |
| game013 | ← ゲームセンターへ | `../../index.html` | 左上ヘッダー | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS・wrapper＋生成template（export不変） → `../../index.html` |
| game014 | ← ゲームセンターへ | `../../index.html` | 左上ヘッダー | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS・wrapper＋生成template（export不変） → `../../index.html` |
| game015 | ← ゲームセンターへ | `./index.html` | 左上ヘッダー | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game016 | ← ゲームセンターへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game017 | ← ゲームセンターへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game018 | ← ゲームセンターへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game019 | ← ゲームセンターへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game020 | ← 100ガレへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game021 | ← 100ガレへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game022 | ← 100ガレへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game023 | ← 100ガレへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game024 | ← 100ガレへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game025 | ← 100ガレへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game026 | ← 100ガレへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game027 | ← 100ガレへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game028 | ← 100ガレへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game029 | ← 100ガレへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game030 | ← 100ガレへ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS → `./index.html` |
| game031 | ← 100ガレ | `./index.html` | 左上ヘッダー＋必要な結果／メニュー補助リンク | 戻りanchorはポータル。タイトルbuttonはゲーム内 | 1300px：高さ44px・hit確認 | 390／320／844px：44px・hit確認 | ← ゲーム一覧へ／左上／共通CSS・既存leave()で保存待ち → `./index.html` |

補助リンクは元の終了・保存フックと状態別メニューの操作性を保つため維持し、共通文言・URL・クラスを付けた。Game002フッターの `/` は相対一覧URLへ修正。Game001ブランドはゲーム内タイトルbuttonとして意味を明示し、一覧へのanchorと区別。Game031保存失敗時の「保存せずゲーム一覧へ」は従来の明示的破棄操作として残す。
