#!/bin/bash
set -euo pipefail
# This role owns the application database and can create isolated restore targets.
# It cannot access server files or act as a superuser.
password="$(cat /credentials/password)"
[[ "$password" =~ ^[0-9a-f]{64}$ ]] || exit 1
psql --username "$POSTGRES_USER" --dbname postgres --set ON_ERROR_STOP=1 <<SQL
CREATE ROLE sponsorenlauf LOGIN CREATEDB PASSWORD '$password';
ALTER DATABASE sponsorenlauf OWNER TO sponsorenlauf;
SQL
psql --username "$POSTGRES_USER" --dbname sponsorenlauf --set ON_ERROR_STOP=1 <<'SQL'
ALTER SCHEMA public OWNER TO sponsorenlauf;
SQL
