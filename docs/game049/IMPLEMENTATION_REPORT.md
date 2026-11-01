# Game049 実装報告
音声時計＋80譜面＋6単体テスト、型検査/個別build成功。ImageGen10点（5姿勢/2ドラム/2スピーカー/背景）、オリジナル120BPM伴奏を同chartからローカル生成、装飾16voice cap、音量・mute・補正保存、pause時source/voice停止。
通常入力: QA/browser-1793374065301のPCは80PERFECT/320000/50.6秒/SPECIAL。最初のtouchは75PERFECTで試験の「全打PERFECT」条件に失敗。試験のpad座標を事前取得し、実入力時刻をread-onlyログで保存する方式へ修正した。QA/browser-1793374233875では390touch79PERFECT/1GOOD/0MISS/0空打ち/318000。実timestampを採点モデルへ再生して全得点一致。ゲームの判定窓は変更していない。
320/844は4ノーツすべてPERFECT・本番UI/操作/休憩/帰還。pageerror/404/外部通信0。2拍再開で譜面凍結、ミュートでも時計継続。QA/fallback-1793374311489は音声拒否を意図的に注入した無音monotonic継続であり、音声同期PASSとは別。
通常50.6秒のheadless update+draw p95 PC0.5/390px0.6ms、3470以上frames。実端末の音ズレ/聴感/楽しさは未確認。Visual後、人物の縦横比を原本に近づけ、combo段階の照明・合成歓声を追加、時計/判定は不変。最終production確認QA/production-*。
起動: node tests/batches/dopa-nine-20261030-a/run-batch.mjs game049 → node tests/batches/dopa-nine-20261030-a/preview.mjs → /games/encore_beat/。main/catalog/広告/解析/本番非変更。
