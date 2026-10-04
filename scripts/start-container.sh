#!/bin/sh
set -eu

echo "Running database migrations..."
SPONSORENLAUF_BOOTSTRAP_INTERNAL=1 node scripts/bootstrap-postgres.mjs

echo "Starting Sponsorenlauf Tool on port ${PORT:-3000}..."
exec node scripts/start-postgres-application.mjs

