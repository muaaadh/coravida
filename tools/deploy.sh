#!/bin/bash
# ==========================================================================
# CORAVIDA — deploy.   bash tools/deploy.sh "commit message"
# Pull first, so the admin's content commits and the build bot's regenerated
# pages win over a stale clone; then build, commit, push (the GitHub Action
# rebuilds and republishes Pages) and mirror to OneDrive.
# ==========================================================================
set -e
cd "$(dirname "$0")/.."
MSG="${1:-Site update}"
git pull --rebase --autostash origin main
node tools/build.js
git add -A
if git diff --cached --quiet; then echo "nothing to commit"; else git commit -m "$MSG"; fi
git push origin main
bash tools/mirror.sh
echo "pushed — the Action publishes it in about a minute: https://github.com/muaaadh/coravida/actions"
