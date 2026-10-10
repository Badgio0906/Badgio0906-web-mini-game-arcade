# revision02再開

専用branch `codex/game032-records-fullscreen`、base `5ecaa9dd4ac39fbd6b83849e1ecd6c7f352d0d6c`。旧worktree・Game018の未commitは保全。

`npm ci` → `npm run check` → `npm test` → `npm run build` → `npm run preview -- --port 4444 --strictPort`。独立QAは `GAME032_QA_URL=http://127.0.0.1:4444 GAME032_QA_OUT=docs/game032/revision02/QA/<新規一意の出力> node tests/game032/revision02/qa.mjs`。普通のマウス/キー/CDPタッチ、実時間。unsupported fullscreenは別に明示した技術fixture。解析同意は拒否、送信POSTなし。時間加速/RNG操作なし。証跡を上書きしない。

実装詳細はIMPLEMENTATION_SPEC、RECORDS、独立QA/Visual報告。魚記録は新規標準釣果のみ、旧BEST互換。元の5分期限/BESTは既存モデル/Saveの不変SHAと全体unitで保護。032の外部送信はOFF/登録待ち、Workerや認証を勝手に変更しない。

Jevは実findingだけ4質問Shadow、QA/JEV_SHADOW.jsonlにstatus/実送信/model/有効回答を保持。独立判断の後にannotateし、単純PASS/面白さ/公開許可を代行させない。過去findingは消さない。

次033や他作品へ着手しない。公開証拠はIMPLEMENTATION_REPORT/QA/PUBLICATIONへ追記。実機とrevision02の本人評価はHUMAN_PLAYTESTに未実施として残す。

全画面から結果への遷移は `GAME032_QA_URL=http://127.0.0.1:4444 GAME032_QA_OUT=docs/game032/revision02/QA/<一意> node tests/game032/revision02/deadline-fixture.mjs`。明示した仮想時計で600秒を進める技術fixture、通常操作/人間試遊と区別する。
