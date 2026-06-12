#!/usr/bin/env bash
set -u

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_BIN="${NODE_BIN:-/usr/bin/node}"
NPM_BIN="${NPM_BIN:-/usr/bin/npm}"

cd "$REPO_DIR" || exit 1

"$NODE_BIN" "$REPO_DIR/scripts/system-maintenance-runner.mjs" startup || true

exec "$NPM_BIN" start
