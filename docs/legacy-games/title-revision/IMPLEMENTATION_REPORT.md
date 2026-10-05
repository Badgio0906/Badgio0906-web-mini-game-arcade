# Game012–014 表示名改訂（2026-10-05）

今回のユーザー依頼により、Game012を「お前の仕事は俺の仕事」、013を「タスク天国」、014を「指ハートチャレンジ」に統一する。ID／routeは維持。

Godot canvas内部の表示も対象。012のタイトルとHUD、013のタイトル、014の通常画面とResultの見出しを、元の固定commitのGDScriptへ最小patchで変更した。012の旧英語ラベルもOFFICE SCORE ATTACKへ変更。人名はキャラクターの会話／役名として存在する場合は維持する。

Godot 4.5.1公式editorで、対象scriptとproject.binaryが元PCKのresourceをbyte単位で再現することを先に検証し、変更後は対象4script／3project.binaryだけを元PCKへ移植する。全3ゲームのエンジンJS／WASM／worklet／音源／画像／font／他のscript／scene／save pathは元のbyteを保持する。PCKのdirectoryとresource MD5を再構築し、再読込した全resourceを確認。監査は [PACKED_RESOURCE_AUDIT](QA/PACKED_RESOURCE_AUDIT.json)。新しいproject nameはGodot Webの固定user:// root `/userfs`を変えず、保存script／ファイル名はそのまま。

HTML document title／iframe label／description、ポータルCatalog、export-manifestのtitle／配信hashも更新。manifestは元source hashと変更後hashを両方保持し、`byteIdentical:false`と変更理由を明記する。

再現手順（元repositoryのpinは[import tool](../../../tools/import_legacy_games.py)参照）:

```sh
python3 tools/import_legacy_games.py --sources /workspace/legacy-games
python3 tools/rename_legacy_titles.py --sources /workspace/legacy-games --godot /path/to/Godot_v4.5.1-stable_linux.x86_64
```

Godot export templatesは不要。4.6等の別compilerを使わない。旧3repository自身は変更しない。改訂scriptは [reviewable patches](../../../tools/legacy-title-patches/)、再現toolは [rename_legacy_titles.py](../../../tools/rename_legacy_titles.py)。従来の完全byte一致監査はこのユーザー承認済み改訂により例外となるため、現在はmanifestと変更resourceの限定を監査する。

ブラウザ検証・サムネイルの更新結果はこの報告へ追記する。人間の体験評価は未実施。

## 実行済み検証

- Godot 4.5.1 baseline resource再現→4script／3projectのみ差替え、PCK再読込一致 PASS。
- `node tests/fourteen-game/audit-legacy-migration.mjs`: 3exports／42original files、unexpected difference 0。PCK中232resourcesを保持、7resourcesのみ変更。
- 圧縮GDCを展開した239packed resources／HTML／Catalogの旧名称scan: 0件。[OLD_TITLE_SCAN](QA/OLD_TITLE_SCAN.json)。loading PNG／iconにも旧名称なし。
- Chromium desktop1440×900／mobile landscape844×390、3本各2設定の通常URL title読込、HTMLタイトル一致、自然入力後snapshot、page／console error 0。[TITLE_BROWSER_CHECK](QA/TITLE_BROWSER_CHECK.json)とQA内の実canvas画像。
- Game012／014サムネイルを新名称入りの実canvas screenshotから640×360にresize。012はnative Enterで開始後のplay、014は通常URLで実際に遊べる画面。013は元の実playサムネイルに旧名がないため保持。asset-indexの原本・hashを更新。
- 元のnative keyboard／touch e2e: desktop／mobile landscape各3ゲーム、全6scenario PASS（初回runの5passと012desktop独立再検証1pass）。012は開始→自然な誤入力Game Over→retry→reload、013は実リズム練習score→pause→miss→retry→reload、014は通常URLにhookなし→既存readonly観測でnative成功／失敗→retry→reload。全3ゲームの一覧帰還、error 0を確認。[native evidence](QA/native/)／[012 desktop recheck](QA/native-recheck/)。最初の012 desktopはscenario assertionを通過したが、割り込み後の重複実行によるtrace出力directory collisionでteardownが失敗した。原本は保持し、独立outputでPASSを確認した。

- 統合担当の最新 `npm run build` 後、`node tests/fourteen-game/audit-legacy-migration.mjs --dist` も3exports／42files、unexpected difference 0でPASS。

独立Visual／QA、本番配信と公開検証は統合担当が記録する。改訂部分の人間評価は未実施。
