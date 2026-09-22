#!/bin/bash
# ==========================================================================
# CORAVIDA — deploy.   bash tools/deploy.sh "commit message"
# Pull first, so the admin's content commits and the build bot's regenerated
# pages win over a stale clone; then build, commit, push (the GitHub Action
# rebuilds and republishes the site) and mirror to OneDrive if it is there.
# ==========================================================================
set -e
cd "$(dirname "$0")/.."
MSG="${1:-Site update}"
git pull --rebase --autostash origin main
node tools/build.js
# The Vercel build takes its content from the database, not from this repo:
# a content change made here must go up too, or the next build ignores it
# (and fails if it names a picture or clip that no longer exists).
bash tools/content-up.sh
git add -A
if git diff --cached --quiet; then echo "nothing to commit"; else git commit -m "$MSG"; fi
git push origin main
bash tools/mirror.sh
echo "pushed — Vercel builds and publishes it in about two minutes."
