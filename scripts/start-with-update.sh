#!/usr/bin/env bash
set -u

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_BIN="${NODE_BIN:-/usr/bin/node}"
NPM_BIN="${NPM_BIN:-/usr/bin/npm}"

cd "$REPO_DIR" || exit 1

if ! "$NODE_BIN" "$REPO_DIR/scripts/system-maintenance-runner.mjs" startup; then
  printf '[FAIL] Startprüfung oder Datenbankmigration fehlgeschlagen; Anwendung wird nicht mit unbekanntem Schema gestartet.\n' >&2
  exit 1
fi

exec "$NPM_BIN" start
