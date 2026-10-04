#!/bin/bash
set -euo pipefail
# Works with existing production.env files: no new secret must exist before Compose validation.
install -d -m 0755 /credentials
for credential in password owner-password; do
if [ ! -s "/credentials/$credential" ]; then
  temporary="/credentials/.$credential-$$"
  umask 077
  od -An -N32 -tx1 /dev/urandom | tr -d ' \n' > "$temporary"
  chown postgres:1000 "$temporary"
  if [ "$credential" = owner-password ]; then chmod 0400 "$temporary"; else chmod 0640 "$temporary"; fi
  mv "$temporary" "/credentials/$credential"
fi
done
umask 022
export POSTGRES_PASSWORD_FILE=/credentials/owner-password
exec docker-entrypoint.sh postgres
