# Handoff

基準main: `7209da2f92a61c1137466192f0a5ecd9238005e8`。
branch: `fix/revert-pixel-art-four-20261101`。
検証済みソース: [SOURCE_HASHES](SOURCE_HASHES.json)（ソースのSHA256を固定）。
変更・コマンド・成功/未実施・次の3手: [報告](IMPLEMENTATION_REPORT.md)。
未push。以前の他worktree/commit/証拠は保持。node_modulesは共有依存への未追跡symlinkでstageしない。
ブラウザ再現: 4件 `GAME046_OUT=/tmp/unpixel-046 node node_modules/vite/bin/vite.js build --config tests/game046/vite.config.mjs --mode qa`（050/060/061同様）、`node tests/batches/revert-pixel-art-four-20261101/browser.mjs game046,game050,game060,game061`。
本番構成: `npm run build`、`node tests/batches/revert-pixel-art-four-20261101/production.mjs game046,game050,game060,game061`。
main/remote/Pagesの復元は未実施。公開承認/費用不明点の今回範囲を確認してから進む。
