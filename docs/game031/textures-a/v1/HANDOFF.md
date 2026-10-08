# Game031 textures-a-v1 の再現と引継ぎ

現行改修は[報告](IMPLEMENTATION_REPORT.md)、ユーザー要件は[REQUEST](REQUEST.md)、対応は[SOURCE_ASSETS](SOURCE_ASSETS.md)。AGENTS→PROJECT_CONTEXT/CURRENT_STATUS→GAME_DEVELOPMENT_RULES→JEV_REVIEW_RULESから対象資料へ進む。初版の仕様/保存方式は../../IMPLEMENTATION_SPEC.md、今回変更は表示だけ。

1. HEAD/branch/status/全worktree/remote mainを確認。他タスクの未commitを破壊せず、必要なら最新mainから専用worktree。
2. Node24、npm ci（依存準備済みなら不要）。npm run check、npm test、npm run build。対象15新テストはtests/unit/game031-textures.test.ts。Jev offlineは`python3 -m unittest discover -s tests/jev -p 'test_*.py' -v`。通常CIはユーザーPCもPillowも原本も不要。
3. 原本と加工はassets/game031/textures-a/v1/source-index.json。再変換はPython3/Pillow12.3.0の`python3 scripts/game031/prepare-textures.py --input assets/game031/textures-a/v1/sources`。新しい外部画像へ無断置換しない。publicにはstandard/light8枚ずつとmanifestだけ。
4. beforeを再撮影する場合は基準2d745110e1a7a24660da16dd6529d8ca2d08a2bfの別checkoutを4313、現行を4314で起動する。captureへ`GAME031_TEXTURE_QA_OUT`（必ず新規）、`GAME031_TEXTURE_QA_URL`、`GAME031_TEXTURE_QA_SOURCE`（対象checkout絶対パス）を渡す。固定fixtureのworld/pose/viewportはREPORTを照合する。performanceのbefore/aftercheckoutとURLは実行前にscriptへ与える環境変数を確認。
5. `tests/game031/textures-a-regression.mjs`は通常キー/マウス＋readonlyvoxelplannerで104mines/50placesを確認。`GAME031_QA_OUT`を新規先、`GAME031_TEXTURE_QA_URL`を4314 originへ（GAME031_MINES=100 / GAME031_PLACES=50）渡す。テストの身体support座標はPhysicsのBODY_WIDTHとepsilonに一致させ、製品の物理を試験都合で変更しない。
6. lifecycle/overlay/motionには新規`GAME031_TEXTURE_QA_OUT`を渡す。fixtureは隔離し、ユーザー本物の世界へ書き込まない。8imageの成功はsurfaceStatus=supplied/Count8、各layerpixel、描画画像で確認する。fallbackでも遊べることと新素材成功は別。
7. `tests/game031/textures-a-public.mjs`は本番相当または公開版を通常操作して16WebP成功/両quality/10mines以上5places以上/保存reload/Portal30を確認。環境は`GAME031_QA_OUT`、`GAME031_PUBLIC_URL`（game031.htmlまで）、`GAME031_DEVICE=desktop|phone`、`GAME031_EXPECTED_COMMIT`。旧保存継続は`GAME031_OLD_SAVE=docs/game031/textures-a/v1/QA/before/old-save-01/old-save.synthetic.json`で公式import UIを使う。元のプレイヤー世界ではなく、独立browser contextの合成保存であることを報告する。
8. 解析同意拒否＋ingest遮断、production架空RUNを送らない。公開ネットワークで既存proxyが必要ならNode24へNODE_USE_ENV_PROXY=1、PlaywrightへGAME031_USE_PROXY=1。秘密値・URLを記録しない。
9. 対象diffだけcommit/main push→既存Build and deploy arcade期待SHAのbuild/deploy成功→verify-publicのJS/CSS/HTML/thumbnail比較＋textures-a-verify-assetsの17fileSHA/decode→公開PC/phone/旧保存→公開記録を追記。Worker/GA4/広告/CREDIT/認証は今回変更しない。

世界X128/Y64/Z128、BlockID/seed/gen/save版1、全地形/所持/移動/採掘/配置の互換性を保持。presentationのみtextures-a-v1。原本8imageを読んだだけ、白紙/旧fallback、またはHTTP200だけを導入成功にしない。本人試遊/物理端末/音/酔いは未実施のまま引継ぐ。

証拠はQA/before、after、comparison-final03、publicationへ分離。過去の失敗01/02や負荷測定を消さず、新しい実行先を作る。Jevは当時の実finding4問のみで、HTTP/bytes/buildの検査に呼ばない。利用の監査はJEV_EXECUTION_AUDIT/ JEV_SUMMARY。以前の8画像未受領記録は当時の状態として保持する。

公開runtimeは`b891ceae429a9df0bd87b43c04a520ae214114ff`、公式CI37729093975成功。公開通常操作/旧保存/全素材/配信照合は[PUBLICATION](QA/PUBLICATION.json)。8表面の公開確認を再現する場合は`tests/game031/textures-a-public-gallery.mjs`へ`GAME031_EXPECTED_COMMIT`/proxy環境と新規`GAME031_QA_OUT`を渡す（公開URLはscript内で固定）。公式UIから隔離browser contextへ合成backupを取り込む表示試験で、実ユーザー保存/通常採掘実績/Portal thumbnailへ転用しない。文書追補のみのcommitでも公式CIを確認し、runtimeが変わらなければ同じ通常QAを重複実行しない。
