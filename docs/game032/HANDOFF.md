# Game032 — 再開

対象：川辺で、ひとやすみ。 ～RIVER SIDE FISHING～。仕様[IMPLEMENTATION_SPEC](IMPLEMENTATION_SPEC.md)、純粋モデル[MODEL_SPEC](MODEL_SPEC.md)、統合[INTEGRATION](INTEGRATION.md)、素材[ART_DIRECTION](ART_DIRECTION.md)、公開状況[IMPLEMENTATION_REPORT](IMPLEMENTATION_REPORT.md)。作者の実試遊は[HUMAN_PLAYTEST](HUMAN_PLAYTEST.md)で未実施として扱う。

## 再現

```sh
npm ci
npm run check
npm test
npm run build
npm exec vite preview -- --host 127.0.0.1 --port 4432
# 別terminal、新規の一意な出力先を指定する
GAME032_QA_URL=http://127.0.0.1:4432 GAME032_QA_OUT=docs/game032/QA/new-candidate/browser-01 node tests/game032/browser.mjs
npm exec vitest run --config tests/game032/independent.vitest.config.ts
python3 -m unittest discover -s tests/jev -p 'test_*.py' -v
cd analytics-worker
npm ci
npm run check
npm test
```

Browser runnerは/usr/bin/chromiumとPlaywrightを使う。4画面・普通のkeyboard/CDP touch・実DOMに従う釣り操作、virtual clockで5分結果、別の明示的scripted-RNG同種魚表示fixtureを含む。人間の300秒釣行や物理指操作とは区別。POSTをabortし、同意は拒否する。公開版を試す場合はproxy/networkと環境が利用可能か先に確認し、拒否を回避しない。サーバー／/workspace外一時ログを成果の根拠にせず、各QAのsource hash／保存画像／REPORTを見る。

## 登録待ち

本番D1/Workerに032がまだ登録されていない。既存20boardは保持し、032だけ`src/records/remoteRegistration.ts`と`src/analytics/remoteRegistration.ts`で停止。Cloudflare認証と許可先が用意された環境で最新mainを読み、既存登録と衝突しないことを確認してWorkerコードを公開→032と認証集計を確認→032 gate解除。Secret・新しい認証を勝手に作らない。D1schema/migration追加は不要。実RUNを捏造して登録確認しない。コード対応・本番登録・外部送信ON・実プレイヤー観測を別状態で報告する。

## 保全

元Game018 revision03の182未commitファイルと既存worktreeは隔離したまま。032公開へ混ぜない。既存001–031のルール／source／save互換、広告・CREDIT・GA4設定は今回変更しない。active31／historical32・退役010、次の未使用ID033だが、今回は033へ着手しない。

## 残る評価

本人／物理iPhone・Androidの触感、環境音の聴取、長時間熱・memory、釣りの楽しさを未評価。川の主はニジマス絵の拡大共用。大きなオープンワールド、季節／天候、追加図鑑はMVP外で、先に実試遊の問題を直す。
