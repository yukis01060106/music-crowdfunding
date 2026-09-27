#!/usr/bin/env bash
# デモを GitHub Pages に公開する。out/ をビルドして gh-pages ブランチに強制プッシュする。
set -euo pipefail
cd "$(dirname "$0")/.."

GITHUB_PAGES=1 npm run build
touch out/.nojekyll # _next/ ディレクトリを Jekyll に無視させない

remote=$(git remote get-url origin)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cp -R out/. "$tmp"
cd "$tmp"
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(date '+%Y-%m-%d %H:%M')"
git push -q -f "$remote" gh-pages
echo "Deployed to gh-pages"
