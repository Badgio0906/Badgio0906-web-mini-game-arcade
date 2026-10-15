# Game034 要求照合

2026-10-15 JST、Game003/034実装workerによる再点検。独立コードレビューとは区別。runtimeは固定検証中のため変更しない。

| 指示書 | 実装 | 確認済み | 残る実確認 |
|---|---|---|---|
| 48–49 少ない操作の物理解体 | DemolitionRun toggle/execute、最大3部品実除去 | 選択上限・解除・実行後固定のunit | 4画面通常操作 |
| 49 支柱/重心/重さ/方向/小屋が違う | SITES8種、部品幅/配置/密度/target/hutの差 | 104 simulation＋全合法組合せ独立列挙、各面clean実解 | 4画面全8現場完了 |
| 50 範囲・保護・少数・崩れ方採点 | 実boundsのmass containment、実落下量、小屋SAT contact、economy | 値境界・接触有無・選択差・決定性 | 表示と実結果の読める一致 |
| 50 slow任意 | 0.35倍、物理8秒を保持 | 源コード照合 | 通常button切替 |
| 51 8–12建物/表示と当たり判定一致 | 8固有玩具、各描画矩形＝実body寸法/pose | 初期全8の姿勢・衝突なし・finite/bounded | 実画像の輪郭/重なり |
| 56 素材制作 | ImageGen背景/3面材atlasを実path参照 | 4画像実view、素材担当の出典台帳 | 実ゲームVisual/thumbnail |
| 57 練習・結果・リトライ・BEST | 独立練習world、各面結果、8面総合、再挑戦 | unitモデル＋源コード照合 | 全4幅通常動線/BEST reload |
| 58 帰還/44px/mute/pause/誤長押し | 左上header帰還、DOM候補44px、長押しguard、AudioService、blur/hidden pause | source照合 | 同collector geometry/通常帰還/mute reload |
| 59 記録独立 | 新namespace/best-rules-v1、完了8面のみrecord.complete | 旧記録無変更、主score定義 | Portal個人BEST/オンライン準備中のroot統合 |
| 60 Analytics | local最小event、remoteCollectionEnabled false | source照合 | browser外部write0 |
| 61 HTML/catalog/Vite/記録/asset | game034.htmlと固有manifest/root共通登録 | root統合担当 | 固定dist/公開asset/hash照合 |

途中世界resumeは初版に含まない。BEST/mute保存を対象にする。本人/実機/聴感・面白さは未実施。ブラウザcollectorは`tests/game034/browser.mjs`、固定sourceディレクトリ/commitとPOST遮断を記録する。

完了追補: `QA/stage4-43deb-four-widths-clean/report.json`で4画面×全8現場、通常説明/練習/選択/実崩壊/slow/pause/全結果/retry/BEST・mute reload/帰還、44px/overflow、write0を完了。表の「残る実確認」の該当ローカル通常操作はこの追補で充足。独立Visual/人間/最終公開は各担当の証拠へ。
