# FIREWORK MAKER 再開地点

モデル／描画／HTML／入力／保存／音と単体5件は実装済み。共通登録と固定production buildはroot統合済み、固定43debで通常入力QAまで完了した。collectorは `tests/game033/native.mjs`、手順は[QA](QA.md)。DEVだけのreadonly診断は `window.__fireworkInspection()`。productionには出さない。

確認対象：通常入力で練習3成功、100秒本番終了、BEST保存、pause／blur／pointercancelで溜め解放、320pxと844pxの操作可視、4連続八重咲きとCHAINの可読性。高品質背景実素材は導入済み。サムネイルは実ゲーム画像から生成し、架空の完成画面を作らない。

本番record boardとAnalytics登録の確認前は準備中／外部OFF。広告、CREDIT、他作品の記録を変更しない。本人の面白さ・実機の親指操作・音の実聴は未実施。

2026-10-15固定production43debの初回native QA実行済み。desktop1440とphone390の通常遷移／練習／BEST除外／pause再開入力／mute／保存／帰還PASS。phoneは自然100秒→65560点、86/86花、最大連鎖7→結果4幅→retryまでPASS。初回全体は320×568の説明modal全button同時表示assertionでFAILを保持。製品source無変更、hash一致。原本 [report](QA/43deb-native-01/report.json)、[hash](QA/43deb-native-01/source-verification.json)。

不足320/844は [追補](QA/43deb-native-02/report.json) で完了。modal内actionを通常scroll後に測り、viewport／dialog内枠のclipなし、各8check群PASS。実装sourceは2runを通じ不変。全browser/context closeしrootへ枠返却済み。[最終技術集約](QA/FINAL_NATIVE_QA.json) は4幅37check群と自然100秒結果を対応し、初回FAILを保持する。今後は独立Visual／Feel／サムネイル／必要なHuman確認とroot正式公開判断へ進む。
