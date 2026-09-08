#!/bin/sh
set -eu

current_hash="$(sha256sum package-lock.json | cut -d ' ' -f 1)-source-v1"
stored_hash="$(cat node_modules/.sponsorenlauf-lock-hash 2>/dev/null || true)"

if [ "$current_hash" != "$stored_hash" ]; then
  echo 'package-lock.json changed; synchronizing development dependencies...'
  npm_config_build_from_source=true npm ci
  printf '%s\n' "$current_hash" > node_modules/.sponsorenlauf-lock-hash
fi

exec npm run dev
