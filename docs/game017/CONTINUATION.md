# Game017 continuation

仕様・実装・検証はIMPLEMENTATION_REPORT.mdから参照。再開はnpm ci（依存がなければ）、npm run dev、game017.htmlを開く。過去のサーバーportや会話に依存しない。チェックはnpm run check、npm test、npm run build。Chromium probeはtests/game017の各script先頭のURL・出力変数を読み、旧QAを上書きしない出力先を指定。

旧16本は保持。CREDIT／本番広告はOFF。Jevはtools/jev-shadow.pyの開発CLIのみ、既存checkpointを再送せずdocs/game017/QA/JEV_SHADOW.jsonlを確認。現在の安全な環境でキー存在とネットワーク許可を再確認し、値は表示・保存しない。

次の人間確認はHUMAN_PLAYTEST.md。公開は別工程、現行Pages16本とローカル17本候補を区別。Game018は続く別作業であり、017ソースを不用意に再編集しない。
